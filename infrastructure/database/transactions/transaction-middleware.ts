/**
 * @fileoverview AIOT 事務中介軟體
 * 提供 Express 路由級事務管理和自動回滾機制
 */

import { Request, Response, NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import { transactionManager, TransactionContext, TransactionMiddlewareOptions } from './transaction-manager';
import { cacheManager } from '../caching/redis-cache-manager';

// 擴展 Express Request 介面
declare global {
  namespace Express {
    interface Request {
      transaction?: TransactionContext;
      txManager?: typeof transactionManager;
      rollbackReasons?: string[];
    }
  }
}

export interface RouteTransactionOptions extends TransactionMiddlewareOptions {
  required?: boolean;
  rollbackOnError?: boolean;
  clearCacheOnCommit?: string[];
  clearCacheOnRollback?: string[];
  skipRoutes?: string[];
  includeRoutes?: string[];
}

/**
 * 事務中介軟體工廠
 */
export function createTransactionMiddleware(
  sequelize: Sequelize,
  options: RouteTransactionOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  
  const defaultOptions: RouteTransactionOptions = {
    required: false,
    rollbackOnError: true,
    autocommit: false,
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    timeout: 30000,
    retryOnDeadlock: true,
    maxRetryAttempts: 3,
    clearCacheOnCommit: [],
    clearCacheOnRollback: [],
    skipRoutes: [],
    includeRoutes: [],
    ...options
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 檢查是否應該跳過此路由
    if (shouldSkipRoute(req, defaultOptions)) {
      return next();
    }

    // 檢查是否只處理特定路由
    if (defaultOptions.includeRoutes!.length > 0 && !shouldIncludeRoute(req, defaultOptions)) {
      return next();
    }

    try {
      // 創建事務上下文
      const transactionContext = await transactionManager.createTransaction(
        sequelize,
        defaultOptions
      );

      // 附加到請求對象
      req.transaction = transactionContext;
      req.txManager = transactionManager;
      req.rollbackReasons = [];

      // 設置響應攔截器
      setupResponseInterceptor(req, res, transactionContext, defaultOptions);

      // 設置錯誤處理
      setupErrorHandler(req, res, next, transactionContext, defaultOptions);

      next();

    } catch (error) {
      console.error('Failed to create transaction:', error);
      
      if (defaultOptions.required) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize database transaction',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      next();
    }
  };
}

/**
 * 手動事務控制中介軟體
 */
export function manualTransactionMiddleware(
  options: { required?: boolean } = {}
): (req: Request, res: Response, next: NextFunction) => void {
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // 提供手動事務控制方法
    req.txManager = transactionManager;

    // 提供便利方法
    (req as any).startTransaction = async (sequelize: Sequelize, txOptions?: TransactionMiddlewareOptions) => {
      if (req.transaction) {
        throw new Error('Transaction already exists for this request');
      }
      
      req.transaction = await transactionManager.createTransaction(sequelize, txOptions);
      return req.transaction;
    };

    (req as any).commitTransaction = async () => {
      if (!req.transaction) {
        throw new Error('No transaction found for this request');
      }
      
      await transactionManager.commitTransaction(req.transaction.id);
      req.transaction = undefined;
    };

    (req as any).rollbackTransaction = async (reason?: string) => {
      if (!req.transaction) {
        throw new Error('No transaction found for this request');
      }
      
      if (reason) {
        req.rollbackReasons = req.rollbackReasons || [];
        req.rollbackReasons.push(reason);
      }
      
      await transactionManager.rollbackTransaction(
        req.transaction.id, 
        new Error(reason || 'Manual rollback')
      );
      req.transaction = undefined;
    };

    next();
  };
}

/**
 * 分佈式事務中介軟體
 */
export function distributedTransactionMiddleware(
  services: Array<{ name: string; sequelize: Sequelize; priority?: number }>,
  options: RouteTransactionOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const transactionId = `dist_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 創建分佈式事務
      const contexts = await transactionManager.beginDistributedTransaction(transactionId, {
        services: services.map(s => ({
          name: s.name,
          sequelize: s.sequelize,
          priority: s.priority || 1
        })),
        timeout: options.timeout || 30000,
        retryAttempts: options.maxRetryAttempts || 3,
        compensationEnabled: true
      });

      // 附加到請求對象
      (req as any).distributedTransaction = {
        id: transactionId,
        contexts,
        commit: async () => {
          await transactionManager.commitDistributedTransaction(transactionId, contexts);
        },
        rollback: async () => {
          await transactionManager.rollbackDistributedTransaction(transactionId, contexts);
        }
      };

      // 設置響應完成時的清理
      res.on('finish', async () => {
        try {
          if ((req as any).distributedTransaction) {
            await (req as any).distributedTransaction.rollback();
          }
        } catch (error) {
          console.error('Failed to cleanup distributed transaction:', error);
        }
      });

      next();

    } catch (error) {
      console.error('Failed to create distributed transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize distributed transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * 事務重試中介軟體
 */
export function retryTransactionMiddleware(
  maxAttempts: number = 3,
  retryCondition?: (error: Error) => boolean
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let attempt = 1;
    let lastError: Error;

    while (attempt <= maxAttempts) {
      try {
        // 執行請求處理
        await new Promise<void>((resolve, reject) => {
          const originalNext = next;
          const wrappedNext = (error?: any) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          };

          // 如果不是第一次嘗試，重新創建事務
          if (attempt > 1 && req.transaction) {
            req.transaction = undefined;
          }

          originalNext();
        });

        return; // 成功，退出重試循環

      } catch (error) {
        lastError = error as Error;

        // 檢查是否應該重試
        const shouldRetry = retryCondition 
          ? retryCondition(lastError)
          : isRetryableError(lastError);

        if (!shouldRetry || attempt === maxAttempts) {
          throw lastError;
        }

        console.warn(`Transaction attempt ${attempt} failed, retrying:`, lastError.message);

        // 清理當前事務
        if (req.transaction) {
          try {
            await transactionManager.rollbackTransaction(req.transaction.id, lastError);
          } catch (rollbackError) {
            console.error('Failed to rollback transaction during retry:', rollbackError);
          }
          req.transaction = undefined;
        }

        attempt++;

        // 指數退避
        const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000);
        await sleep(delay);
      }
    }

    throw lastError!;
  };
}

/**
 * 事務性能監控中介軟體
 */
export function transactionMonitoringMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const originalUrl = req.originalUrl;
    const method = req.method;

    // 監控事務開始
    req.on('transaction:created', (context: TransactionContext) => {
      console.log(`Transaction started for ${method} ${originalUrl}: ${context.id}`);
    });

    // 監控響應完成
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      const logData = {
        method,
        url: originalUrl,
        statusCode,
        duration,
        transactionId: req.transaction?.id,
        hasTransaction: !!req.transaction,
        rollbackReasons: req.rollbackReasons
      };

      if (duration > 5000) { // 慢請求警告
        console.warn('Slow transaction detected:', logData);
      }

      // 記錄到性能監控系統
      setImmediate(() => {
        recordTransactionMetrics(logData);
      });
    });

    next();
  };
}

// 輔助函數

function shouldSkipRoute(req: Request, options: RouteTransactionOptions): boolean {
  const { skipRoutes = [] } = options;
  const route = req.route?.path || req.path;
  
  return skipRoutes.some(pattern => {
    if (typeof pattern === 'string') {
      return route === pattern || route.startsWith(pattern);
    }
    return pattern.test(route);
  });
}

function shouldIncludeRoute(req: Request, options: RouteTransactionOptions): boolean {
  const { includeRoutes = [] } = options;
  const route = req.route?.path || req.path;
  
  return includeRoutes.some(pattern => {
    if (typeof pattern === 'string') {
      return route === pattern || route.startsWith(pattern);
    }
    return pattern.test(route);
  });
}

function setupResponseInterceptor(
  req: Request,
  res: Response,
  transactionContext: TransactionContext,
  options: RouteTransactionOptions
): void {
  const originalSend = res.send;
  const originalJson = res.json;
  let responseSent = false;

  // 攔截 res.send
  res.send = function(body?: any) {
    if (!responseSent) {
      responseSent = true;
      setImmediate(async () => {
        await handleResponse(req, res, transactionContext, options);
      });
    }
    return originalSend.call(this, body);
  };

  // 攔截 res.json
  res.json = function(body?: any) {
    if (!responseSent) {
      responseSent = true;
      setImmediate(async () => {
        await handleResponse(req, res, transactionContext, options);
      });
    }
    return originalJson.call(this, body);
  };

  // 監聽響應完成事件
  res.on('finish', async () => {
    if (!responseSent) {
      responseSent = true;
      await handleResponse(req, res, transactionContext, options);
    }
  });
}

function setupErrorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
  transactionContext: TransactionContext,
  options: RouteTransactionOptions
): void {
  const originalNext = next;
  
  req.next = (error?: any) => {
    if (error && options.rollbackOnError) {
      setImmediate(async () => {
        try {
          await transactionManager.rollbackTransaction(
            transactionContext.id,
            error
          );
          
          // 清理快取
          if (options.clearCacheOnRollback && options.clearCacheOnRollback.length > 0) {
            await cacheManager.invalidateByTags(options.clearCacheOnRollback);
          }
        } catch (rollbackError) {
          console.error('Failed to rollback transaction on error:', rollbackError);
        }
      });
    }
    
    originalNext(error);
  };
}

async function handleResponse(
  req: Request,
  res: Response,
  transactionContext: TransactionContext,
  options: RouteTransactionOptions
): Promise<void> {
  try {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // 成功響應，提交事務
      await transactionManager.commitTransaction(transactionContext.id);
      
      // 清理成功時的快取
      if (options.clearCacheOnCommit && options.clearCacheOnCommit.length > 0) {
        await cacheManager.invalidateByTags(options.clearCacheOnCommit);
      }
    } else if (options.rollbackOnError) {
      // 錯誤響應，回滾事務
      await transactionManager.rollbackTransaction(
        transactionContext.id,
        new Error(`HTTP ${res.statusCode} response`)
      );
      
      // 清理失敗時的快取
      if (options.clearCacheOnRollback && options.clearCacheOnRollback.length > 0) {
        await cacheManager.invalidateByTags(options.clearCacheOnRollback);
      }
    }
  } catch (error) {
    console.error('Failed to handle transaction response:', error);
  }
}

function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /deadlock detected/i,
    /lock wait timeout/i,
    /connection.*reset/i,
    /connection.*timeout/i,
    /serialization failure/i,
    /could not serialize access/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
}

async function recordTransactionMetrics(data: any): Promise<void> {
  try {
    // 記錄到監控系統
    // 這裡可以集成 Prometheus、DataDog 等監控工具
    console.log('Transaction metrics:', data);
  } catch (error) {
    console.error('Failed to record transaction metrics:', error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {
  shouldSkipRoute,
  shouldIncludeRoute,
  setupResponseInterceptor,
  setupErrorHandler,
  handleResponse,
  isRetryableError,
  recordTransactionMetrics
};
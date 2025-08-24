/**
 * @fileoverview AIOT 事務裝飾器
 * 提供方法級事務管理、自動回滾和重試機制
 */

import { transactionManager, TransactionContext, TransactionMiddlewareOptions } from './transaction-manager';
import { Sequelize } from 'sequelize';

export interface TransactionalOptions extends TransactionMiddlewareOptions {
  propagation?: 'REQUIRED' | 'REQUIRES_NEW' | 'SUPPORTS' | 'NOT_SUPPORTED' | 'NEVER' | 'MANDATORY';
  rollbackFor?: Array<new (...args: any[]) => Error>;
  noRollbackFor?: Array<new (...args: any[]) => Error>;
  retryAttempts?: number;
  retryDelay?: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onCommit?: (context: TransactionContext) => Promise<void> | void;
  onRollback?: (context: TransactionContext, error: Error) => Promise<void> | void;
}

/**
 * 事務性方法裝飾器
 */
export function Transactional(
  sequelizeGetter: () => Sequelize,
  options: TransactionalOptions = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const sequelize = sequelizeGetter();
      const propagation = options.propagation || 'REQUIRED';
      
      // 檢查當前上下文是否已有事務
      const existingTransaction = getContextTransaction();
      
      // 根據傳播行為決定如何處理事務
      switch (propagation) {
        case 'REQUIRED':
          return existingTransaction 
            ? await executeInExistingTransaction(existingTransaction, originalMethod, this, args, options)
            : await executeInNewTransaction(sequelize, originalMethod, this, args, options);
            
        case 'REQUIRES_NEW':
          return await executeInNewTransaction(sequelize, originalMethod, this, args, options);
          
        case 'SUPPORTS':
          return existingTransaction
            ? await executeInExistingTransaction(existingTransaction, originalMethod, this, args, options)
            : await originalMethod.apply(this, args);
            
        case 'NOT_SUPPORTED':
          return existingTransaction
            ? await suspendTransaction(existingTransaction, originalMethod, this, args)
            : await originalMethod.apply(this, args);
            
        case 'NEVER':
          if (existingTransaction) {
            throw new Error(`Method ${className}.${methodName} must not be called within a transaction`);
          }
          return await originalMethod.apply(this, args);
          
        case 'MANDATORY':
          if (!existingTransaction) {
            throw new Error(`Method ${className}.${methodName} requires an active transaction`);
          }
          return await executeInExistingTransaction(existingTransaction, originalMethod, this, args, options);
          
        default:
          throw new Error(`Unknown transaction propagation: ${propagation}`);
      }
    };

    return descriptor;
  };
}

/**
 * 只讀事務裝飾器
 */
export function ReadOnly(
  sequelizeGetter: () => Sequelize,
  options: Omit<TransactionalOptions, 'readOnly'> = {}
) {
  return Transactional(sequelizeGetter, {
    ...options,
    readOnly: true,
    rollbackOnError: false
  });
}

/**
 * 重試事務裝飾器
 */
export function RetryableTransaction(
  sequelizeGetter: () => Sequelize,
  options: TransactionalOptions & {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const maxAttempts = options.maxAttempts || 3;
      const baseDelay = options.baseDelay || 1000;
      const maxDelay = options.maxDelay || 10000;
      const backoffMultiplier = options.backoffMultiplier || 2;
      
      let attempt = 1;
      let lastError: Error;

      while (attempt <= maxAttempts) {
        try {
          return await executeTransactionalMethod(
            sequelizeGetter(),
            originalMethod,
            this,
            args,
            options
          );
          
        } catch (error) {
          lastError = error as Error;
          
          const shouldRetry = options.retryCondition 
            ? options.retryCondition(lastError, attempt)
            : isRetryableError(lastError);
          
          if (!shouldRetry || attempt === maxAttempts) {
            throw lastError;
          }
          
          console.warn(`${className}.${methodName} attempt ${attempt} failed, retrying:`, lastError.message);
          
          // 計算延遲時間（指數退避）
          const delay = Math.min(
            baseDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );
          
          await sleep(delay);
          attempt++;
        }
      }
      
      throw lastError!;
    };

    return descriptor;
  };
}

/**
 * 分佈式事務裝飾器
 */
export function DistributedTransactional(
  servicesGetter: () => Array<{ name: string; sequelize: Sequelize; priority?: number }>,
  options: TransactionalOptions & {
    compensationEnabled?: boolean;
    coordinatorTimeout?: number;
  } = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const services = servicesGetter();
      const transactionId = `dist_${className}_${methodName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const contexts = await transactionManager.beginDistributedTransaction(transactionId, {
          services,
          timeout: options.coordinatorTimeout || 30000,
          retryAttempts: options.retryAttempts || 3,
          compensationEnabled: options.compensationEnabled || true
        });

        // 將分佈式事務上下文設置到當前執行環境
        setDistributedTransactionContext(contexts);
        
        try {
          const result = await originalMethod.apply(this, args);
          
          // 執行成功回調
          if (options.onCommit) {
            for (const [serviceName, context] of contexts) {
              await options.onCommit(context);
            }
          }
          
          // 提交分佈式事務
          await transactionManager.commitDistributedTransaction(transactionId, contexts);
          
          return result;
          
        } catch (error) {
          // 檢查是否應該回滾
          const shouldRollback = shouldRollbackForError(error as Error, options);
          
          if (shouldRollback) {
            // 執行回滾回調
            if (options.onRollback) {
              for (const [serviceName, context] of contexts) {
                try {
                  await options.onRollback(context, error as Error);
                } catch (callbackError) {
                  console.error(`Rollback callback failed for service ${serviceName}:`, callbackError);
                }
              }
            }
            
            await transactionManager.rollbackDistributedTransaction(transactionId, contexts);
          }
          
          throw error;
        } finally {
          clearDistributedTransactionContext();
        }
        
      } catch (error) {
        console.error(`Distributed transaction failed for ${className}.${methodName}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 事務監控裝飾器
 */
export function TransactionMetrics(options: {
  trackExecution?: boolean;
  trackRollbacks?: boolean;
  slowThreshold?: number;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;
    const trackExecution = options.trackExecution !== false;
    const trackRollbacks = options.trackRollbacks !== false;
    const slowThreshold = options.slowThreshold || 5000;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const metrics = {
        className,
        methodName,
        startTime: new Date(),
        transactionId: null as string | null,
        success: false,
        duration: 0,
        rollbackReason: null as string | null
      };

      try {
        const result = await originalMethod.apply(this, args);
        
        metrics.success = true;
        metrics.duration = Date.now() - startTime;
        
        if (trackExecution) {
          await recordTransactionMetrics(metrics);
        }
        
        if (metrics.duration > slowThreshold) {
          console.warn(`Slow transaction detected: ${className}.${methodName} took ${metrics.duration}ms`);
        }
        
        return result;
        
      } catch (error) {
        metrics.success = false;
        metrics.duration = Date.now() - startTime;
        metrics.rollbackReason = error instanceof Error ? error.message : 'Unknown error';
        
        if (trackRollbacks) {
          await recordTransactionMetrics(metrics);
        }
        
        throw error;
      }
    };

    return descriptor;
  };
}

// 輔助函數

async function executeInNewTransaction(
  sequelize: Sequelize,
  method: Function,
  context: any,
  args: any[],
  options: TransactionalOptions
): Promise<any> {
  return await transactionManager.withTransaction(
    sequelize,
    async (txContext) => {
      setContextTransaction(txContext);
      
      try {
        const result = await method.apply(context, args);
        
        if (options.onCommit) {
          await options.onCommit(txContext);
        }
        
        return result;
      } catch (error) {
        if (options.onRollback) {
          await options.onRollback(txContext, error as Error);
        }
        
        const shouldRollback = shouldRollbackForError(error as Error, options);
        if (shouldRollback) {
          throw error;
        }
        
        return undefined; // 不回滾但返回空結果
      } finally {
        clearContextTransaction();
      }
    },
    options
  );
}

async function executeInExistingTransaction(
  txContext: TransactionContext,
  method: Function,
  context: any,
  args: any[],
  options: TransactionalOptions
): Promise<any> {
  return await transactionManager.executeInTransaction(
    txContext.id,
    async () => {
      try {
        return await method.apply(context, args);
      } catch (error) {
        const shouldRollback = shouldRollbackForError(error as Error, options);
        if (!shouldRollback) {
          console.log('Exception occurred but not rolling back due to configuration');
        }
        throw error;
      }
    }
  );
}

async function suspendTransaction(
  txContext: TransactionContext,
  method: Function,
  context: any,
  args: any[]
): Promise<any> {
  // 暫停當前事務執行方法
  clearContextTransaction();
  
  try {
    return await method.apply(context, args);
  } finally {
    setContextTransaction(txContext);
  }
}

async function executeTransactionalMethod(
  sequelize: Sequelize,
  method: Function,
  context: any,
  args: any[],
  options: TransactionalOptions
): Promise<any> {
  return await transactionManager.withTransaction(
    sequelize,
    async (txContext) => {
      return await method.apply(context, args);
    },
    options
  );
}

function shouldRollbackForError(error: Error, options: TransactionalOptions): boolean {
  // 檢查是否在不回滾列表中
  if (options.noRollbackFor && options.noRollbackFor.length > 0) {
    const isNoRollback = options.noRollbackFor.some(ErrorClass => error instanceof ErrorClass);
    if (isNoRollback) {
      return false;
    }
  }
  
  // 檢查是否在回滾列表中
  if (options.rollbackFor && options.rollbackFor.length > 0) {
    return options.rollbackFor.some(ErrorClass => error instanceof ErrorClass);
  }
  
  // 預設行為：所有錯誤都回滾
  return true;
}

function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /deadlock detected/i,
    /lock wait timeout/i,
    /connection.*reset/i,
    /connection.*timeout/i,
    /serialization failure/i,
    /could not serialize access/i,
    /connection pool exhausted/i
  ];
  
  return retryablePatterns.some(pattern => pattern.test(error.message));
}

// 上下文管理（使用 AsyncLocalStorage 或類似機制）
let currentTransactionContext: TransactionContext | null = null;
let currentDistributedTransactionContext: Map<string, TransactionContext> | null = null;

function getContextTransaction(): TransactionContext | null {
  return currentTransactionContext;
}

function setContextTransaction(context: TransactionContext): void {
  currentTransactionContext = context;
}

function clearContextTransaction(): void {
  currentTransactionContext = null;
}

function setDistributedTransactionContext(contexts: Map<string, TransactionContext>): void {
  currentDistributedTransactionContext = contexts;
}

function clearDistributedTransactionContext(): void {
  currentDistributedTransactionContext = null;
}

async function recordTransactionMetrics(metrics: any): Promise<void> {
  try {
    // 記錄事務指標到監控系統
    console.log('Transaction metrics:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });
    
    // 這裡可以整合實際的監控系統，如：
    // - Prometheus
    // - DataDog
    // - New Relic
    // - 自定義監控服務
    
  } catch (error) {
    console.error('Failed to record transaction metrics:', error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {
  executeInNewTransaction,
  executeInExistingTransaction,
  suspendTransaction,
  shouldRollbackForError,
  isRetryableError,
  getContextTransaction,
  setContextTransaction,
  clearContextTransaction,
  recordTransactionMetrics
};
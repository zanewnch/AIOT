/**
 * @fileoverview AIOT 事務管理器
 * 提供自動事務管理、分佈式事務協調和回滾機制
 */

import { Sequelize, Transaction, TransactionOptions } from 'sequelize';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface TransactionContext {
  id: string;
  sequelize: Sequelize;
  transaction: Transaction;
  operations: TransactionOperation[];
  startTime: Date;
  status: 'PENDING' | 'COMMITTED' | 'ROLLED_BACK' | 'FAILED';
  metadata?: Record<string, any>;
}

export interface TransactionOperation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  table: string;
  data?: any;
  where?: any;
  timestamp: Date;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  error?: Error;
  result?: any;
}

export interface DistributedTransactionConfig {
  services: {
    name: string;
    sequelize: Sequelize;
    priority: number;
  }[];
  timeout: number;
  retryAttempts: number;
  compensationEnabled: boolean;
}

export interface TransactionMiddlewareOptions {
  isolationLevel?: Transaction.ISOLATION_LEVELS;
  autocommit?: boolean;
  readOnly?: boolean;
  deferrable?: boolean;
  timeout?: number;
  retryOnDeadlock?: boolean;
  maxRetryAttempts?: number;
}

/**
 * 事務管理器主類
 */
export class TransactionManager extends EventEmitter {
  private activeTransactions: Map<string, TransactionContext> = new Map();
  private distributedTransactions: Map<string, DistributedTransactionConfig> = new Map();
  private defaultOptions: TransactionMiddlewareOptions;
  
  constructor(defaultOptions: TransactionMiddlewareOptions = {}) {
    super();
    this.defaultOptions = {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      autocommit: false,
      readOnly: false,
      timeout: 30000, // 30秒
      retryOnDeadlock: true,
      maxRetryAttempts: 3,
      ...defaultOptions
    };

    this.startHealthCheck();
  }

  /**
   * 創建事務上下文
   */
  async createTransaction(
    sequelize: Sequelize, 
    options?: TransactionMiddlewareOptions
  ): Promise<TransactionContext> {
    const transactionId = uuidv4();
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      const transactionOptions: TransactionOptions = {
        isolationLevel: mergedOptions.isolationLevel,
        autocommit: mergedOptions.autocommit,
        readOnly: mergedOptions.readOnly,
        deferrable: mergedOptions.deferrable
      };

      const transaction = await sequelize.transaction(transactionOptions);
      
      const context: TransactionContext = {
        id: transactionId,
        sequelize,
        transaction,
        operations: [],
        startTime: new Date(),
        status: 'PENDING',
        metadata: {}
      };

      this.activeTransactions.set(transactionId, context);
      
      // 設置超時
      if (mergedOptions.timeout) {
        setTimeout(async () => {
          const ctx = this.activeTransactions.get(transactionId);
          if (ctx && ctx.status === 'PENDING') {
            await this.rollbackTransaction(transactionId, new Error('Transaction timeout'));
          }
        }, mergedOptions.timeout);
      }

      this.emit('transaction:created', context);
      return context;
      
    } catch (error) {
      this.emit('transaction:error', { transactionId, error });
      throw error;
    }
  }

  /**
   * 在事務中執行操作
   */
  async executeInTransaction<T>(
    transactionId: string,
    operation: () => Promise<T>,
    operationInfo?: Partial<TransactionOperation>
  ): Promise<T> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (context.status !== 'PENDING') {
      throw new Error(`Transaction ${transactionId} is not in PENDING state`);
    }

    const operationId = uuidv4();
    const transactionOperation: TransactionOperation = {
      id: operationId,
      type: operationInfo?.type || 'SELECT',
      table: operationInfo?.table || 'unknown',
      data: operationInfo?.data,
      where: operationInfo?.where,
      timestamp: new Date(),
      status: 'PENDING'
    };

    context.operations.push(transactionOperation);

    try {
      transactionOperation.status = 'EXECUTED';
      const result = await operation();
      transactionOperation.result = result;
      
      this.emit('operation:executed', { transactionId, operation: transactionOperation });
      return result;
      
    } catch (error) {
      transactionOperation.status = 'FAILED';
      transactionOperation.error = error as Error;
      
      this.emit('operation:failed', { transactionId, operation: transactionOperation, error });
      throw error;
    }
  }

  /**
   * 提交事務
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      await context.transaction.commit();
      context.status = 'COMMITTED';
      
      this.emit('transaction:committed', context);
      this.activeTransactions.delete(transactionId);
      
    } catch (error) {
      context.status = 'FAILED';
      this.emit('transaction:commit_failed', { context, error });
      
      // 嘗試回滾
      await this.rollbackTransaction(transactionId, error as Error);
      throw error;
    }
  }

  /**
   * 回滾事務
   */
  async rollbackTransaction(transactionId: string, reason?: Error): Promise<void> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      await context.transaction.rollback();
      context.status = 'ROLLED_BACK';
      
      this.emit('transaction:rolled_back', { context, reason });
      this.activeTransactions.delete(transactionId);
      
    } catch (error) {
      context.status = 'FAILED';
      this.emit('transaction:rollback_failed', { context, error });
      throw error;
    }
  }

  /**
   * 自動事務包裝器
   */
  async withTransaction<T>(
    sequelize: Sequelize,
    operation: (context: TransactionContext) => Promise<T>,
    options?: TransactionMiddlewareOptions
  ): Promise<T> {
    const context = await this.createTransaction(sequelize, options);
    
    try {
      const result = await operation(context);
      await this.commitTransaction(context.id);
      return result;
      
    } catch (error) {
      await this.rollbackTransaction(context.id, error as Error);
      throw error;
    }
  }

  /**
   * 重試機制包裝器
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.defaultOptions.maxRetryAttempts || 3,
    retryCondition?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // 檢查是否應該重試
        const shouldRetry = retryCondition 
          ? retryCondition(lastError)
          : this.isRetryableError(lastError);
        
        if (!shouldRetry || attempt === maxAttempts) {
          throw lastError;
        }
        
        // 指數退避
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
        
        this.emit('transaction:retry', { attempt, error: lastError, nextDelay: delay });
      }
    }
    
    throw lastError!;
  }

  /**
   * 分佈式事務開始
   */
  async beginDistributedTransaction(
    transactionId: string,
    config: DistributedTransactionConfig
  ): Promise<Map<string, TransactionContext>> {
    const contexts = new Map<string, TransactionContext>();
    
    try {
      // 按優先級排序服務
      const sortedServices = config.services.sort((a, b) => b.priority - a.priority);
      
      // 為每個服務創建事務上下文
      for (const service of sortedServices) {
        const context = await this.createTransaction(service.sequelize, {
          timeout: config.timeout
        });
        
        contexts.set(service.name, context);
      }
      
      this.distributedTransactions.set(transactionId, config);
      this.emit('distributed_transaction:started', { transactionId, services: config.services });
      
      return contexts;
      
    } catch (error) {
      // 如果任何服務事務創建失敗，回滾所有已創建的事務
      for (const [serviceName, context] of contexts) {
        try {
          await this.rollbackTransaction(context.id);
        } catch (rollbackError) {
          this.emit('distributed_transaction:rollback_failed', { 
            serviceName, 
            transactionId: context.id, 
            error: rollbackError 
          });
        }
      }
      
      throw error;
    }
  }

  /**
   * 分佈式事務提交
   */
  async commitDistributedTransaction(
    transactionId: string,
    contexts: Map<string, TransactionContext>
  ): Promise<void> {
    const config = this.distributedTransactions.get(transactionId);
    if (!config) {
      throw new Error(`Distributed transaction ${transactionId} not found`);
    }

    const commitResults = new Map<string, { success: boolean; error?: Error }>();
    
    try {
      // Two-Phase Commit 協議
      
      // Phase 1: Prepare (所有事務都必須準備好提交)
      for (const [serviceName, context] of contexts) {
        try {
          // 在實際實現中，這裡會調用 PREPARE 命令
          // 目前簡化為檢查事務狀態
          if (context.status !== 'PENDING') {
            throw new Error(`Service ${serviceName} is not ready to commit`);
          }
          commitResults.set(serviceName, { success: true });
        } catch (error) {
          commitResults.set(serviceName, { success: false, error: error as Error });
        }
      }
      
      // 檢查是否所有服務都準備好
      const allPrepared = Array.from(commitResults.values()).every(result => result.success);
      
      if (!allPrepared) {
        throw new Error('Not all services are prepared for commit');
      }
      
      // Phase 2: Commit (提交所有事務)
      const commitPromises = Array.from(contexts.entries()).map(async ([serviceName, context]) => {
        try {
          await this.commitTransaction(context.id);
          return { serviceName, success: true };
        } catch (error) {
          return { serviceName, success: false, error };
        }
      });
      
      const commitResults2 = await Promise.all(commitPromises);
      const failedCommits = commitResults2.filter(result => !result.success);
      
      if (failedCommits.length > 0) {
        this.emit('distributed_transaction:partial_failure', { 
          transactionId, 
          failedCommits 
        });
        
        // 如果啟用補償，執行補償邏輯
        if (config.compensationEnabled) {
          await this.executeCompensation(transactionId, contexts, failedCommits);
        }
      }
      
      this.distributedTransactions.delete(transactionId);
      this.emit('distributed_transaction:committed', { transactionId, results: commitResults2 });
      
    } catch (error) {
      // 回滾所有事務
      await this.rollbackDistributedTransaction(transactionId, contexts);
      throw error;
    }
  }

  /**
   * 分佈式事務回滾
   */
  async rollbackDistributedTransaction(
    transactionId: string,
    contexts: Map<string, TransactionContext>
  ): Promise<void> {
    const rollbackPromises = Array.from(contexts.entries()).map(async ([serviceName, context]) => {
      try {
        await this.rollbackTransaction(context.id);
        return { serviceName, success: true };
      } catch (error) {
        return { serviceName, success: false, error };
      }
    });
    
    const rollbackResults = await Promise.all(rollbackPromises);
    const failedRollbacks = rollbackResults.filter(result => !result.success);
    
    this.distributedTransactions.delete(transactionId);
    
    this.emit('distributed_transaction:rolled_back', { 
      transactionId, 
      results: rollbackResults,
      failedRollbacks 
    });
    
    if (failedRollbacks.length > 0) {
      console.error(`Failed to rollback some services in distributed transaction ${transactionId}:`, failedRollbacks);
    }
  }

  /**
   * 執行補償邏輯
   */
  private async executeCompensation(
    transactionId: string,
    contexts: Map<string, TransactionContext>,
    failedCommits: any[]
  ): Promise<void> {
    console.log(`Executing compensation for distributed transaction ${transactionId}`);
    
    // 補償邏輯的實現取決於具體業務需求
    // 這裡提供一個框架
    
    for (const [serviceName, context] of contexts) {
      const operations = context.operations.filter(op => op.status === 'EXECUTED');
      
      for (const operation of operations.reverse()) { // 反向執行補償
        try {
          await this.executeCompensationOperation(operation);
        } catch (error) {
          this.emit('compensation:failed', { serviceName, operation, error });
        }
      }
    }
  }

  /**
   * 執行單個操作的補償
   */
  private async executeCompensationOperation(operation: TransactionOperation): Promise<void> {
    // 根據操作類型執行對應的補償操作
    switch (operation.type) {
      case 'INSERT':
        // 補償：刪除插入的記錄
        console.log(`Compensating INSERT operation: ${operation.id}`);
        break;
      case 'UPDATE':
        // 補償：恢復原始值
        console.log(`Compensating UPDATE operation: ${operation.id}`);
        break;
      case 'DELETE':
        // 補償：重新插入刪除的記錄
        console.log(`Compensating DELETE operation: ${operation.id}`);
        break;
      default:
        console.log(`No compensation needed for operation type: ${operation.type}`);
    }
  }

  /**
   * 檢查錯誤是否可重試
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'deadlock detected',
      'connection timeout',
      'connection reset',
      'lock wait timeout',
      'serialization failure'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * 獲取事務統計
   */
  getTransactionStats(): {
    active: number;
    committed: number;
    rolledBack: number;
    failed: number;
    distributed: number;
  } {
    const stats = {
      active: this.activeTransactions.size,
      committed: 0,
      rolledBack: 0,
      failed: 0,
      distributed: this.distributedTransactions.size
    };

    // 在實際實現中，這些統計數據應該從持久化存儲中獲取
    return stats;
  }

  /**
   * 清理過期事務
   */
  private async cleanupExpiredTransactions(): Promise<void> {
    const expiredThreshold = Date.now() - (this.defaultOptions.timeout || 30000);
    
    for (const [transactionId, context] of this.activeTransactions) {
      if (context.startTime.getTime() < expiredThreshold && context.status === 'PENDING') {
        try {
          await this.rollbackTransaction(transactionId, new Error('Transaction expired'));
        } catch (error) {
          console.error(`Failed to rollback expired transaction ${transactionId}:`, error);
        }
      }
    }
  }

  /**
   * 啟動健康檢查
   */
  private startHealthCheck(): void {
    // 每分鐘清理過期事務
    setInterval(() => {
      this.cleanupExpiredTransactions();
    }, 60000);

    // 每5分鐘發送統計報告
    setInterval(() => {
      const stats = this.getTransactionStats();
      this.emit('health_check', stats);
    }, 300000);
  }

  /**
   * 關閉事務管理器
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down transaction manager...');
    
    // 回滾所有活躍事務
    const rollbackPromises = Array.from(this.activeTransactions.keys()).map(
      transactionId => this.rollbackTransaction(transactionId, new Error('System shutdown'))
    );
    
    await Promise.allSettled(rollbackPromises);
    
    this.activeTransactions.clear();
    this.distributedTransactions.clear();
    
    console.log('Transaction manager shutdown complete');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 單例實例
export const transactionManager = new TransactionManager();
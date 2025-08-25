/**
 * @fileoverview 歸檔系統協調者 - 統一管理多個專門的排程器和處理器
 * 
 * ============================================================================
 * 🏗️ 重構後的協調者模式設計 (Coordinator Pattern)
 * ============================================================================
 * 
 * 【ArchiveScheduler】= 系統協調者 (System Coordinator) ← 本文件 (重構後)
 * 新職責：
 * • 統一管理和協調四個專門組件的生命週期
 * • 提供統一的啟動/停止介面給外部系統
 * • 彙總各組件狀態，提供整體系統狀態查詢
 * • ⚠️ 協調者原則：不直接處理業務邏輯，只負責組件協調
 * 
 * 管理的專門組件：
 * 1. 【DroneArchiveScheduler】= Drone 歸檔調度引擎
 *    • 專門負責 Drone 數據的定時歸檔任務
 *    • 處理 positions, commands, status 三種數據類型
 * 
 * 2. 【DataCleanupScheduler】= 數據清理調度引擎  
 *    • 專門負責過期數據的清理排程
 *    • 管理資料生命週期，維護系統效能
 * 
 * 3. 【TaskMonitorScheduler】= 任務監控調度引擎
 *    • 專門負責任務狀態監控和重試機制
 *    • 超時檢測、失敗重試、狀態維護
 * 
 * 4. 【TaskResultHandler】= 任務結果處理器
 *    • 專門負責 Consumer 結果回調處理
 *    • 監聽 RabbitMQ 並同步任務狀態到資料庫
 * 
 * 🔄 協調者管理流程：
 * ArchiveScheduler (協調者) 
 *  ├── start() → 啟動所有專門組件
 *  ├── stop() → 安全停止所有組件  
 *  └── getStatus() → 彙總所有組件狀態
 * 
 * 傳統架構對比：
 * • 【重構前】：單一巨型類別，混合多種職責
 * • 【重構後】：協調者 + 四個專門組件，單一職責原則
 * 
 * ============================================================================
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { DroneArchiveScheduler } from './DroneArchiveScheduler';
import { DataCleanupScheduler } from './DataCleanupScheduler';
import { TaskMonitorScheduler } from './TaskMonitorScheduler';
import { TaskResultHandler } from '../handlers/TaskResultHandler';

@injectable()
export class ArchiveScheduler {
  constructor(
    @inject(TYPES.DroneArchiveScheduler) private droneArchiveScheduler: DroneArchiveScheduler,
    @inject(TYPES.DataCleanupScheduler) private dataCleanupScheduler: DataCleanupScheduler,
    @inject(TYPES.TaskMonitorScheduler) private taskMonitorScheduler: TaskMonitorScheduler,
    @inject(TYPES.TaskResultHandler) private taskResultHandler: TaskResultHandler,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 🚀 啟動所有歸檔系統組件 - 協調者啟動邏輯
   * 
   * 功能說明：
   * - 作為協調者，依序啟動所有專門組件
   * - 提供統一的系統啟動入口
   * - 確保所有組件正確初始化
   * 
   * 協調者啟動流程：
   * 1. 啟動 TaskResultHandler (結果處理器) - 優先啟動，準備接收結果
   * 2. 啟動 DroneArchiveScheduler (Drone 歸檔排程器)
   * 3. 啟動 DataCleanupScheduler (數據清理排程器)  
   * 4. 啟動 TaskMonitorScheduler (任務監控排程器)
   * 5. 記錄整體啟動狀態
   * 
   * 啟動順序設計原則：
   * - 結果處理器優先啟動：確保能接收任務完成回調
   * - 業務排程器次之：開始產生各種任務
   * - 監控排程器最後：監控已創建的任務
   * 
   * 注意事項：
   * - 任一組件啟動失敗會拋出異常，確保系統狀態明確
   * - 每個組件都有獨立的啟動邏輯和錯誤處理
   * - 協調者不直接處理業務邏輯，只負責組件生命週期管理
   */
  start = async (): Promise<void> => {
    const startTime = Date.now();
    this.logger.info('Starting archive system coordinator...');

    try {
      // 1. 優先啟動結果處理器 - 準備接收任務完成回調
      this.logger.debug('Starting task result handler...');
      await this.taskResultHandler.start();

      // 2. 啟動 Drone 歸檔排程器
      this.logger.debug('Starting drone archive scheduler...');
      await this.droneArchiveScheduler.start();

      // 3. 啟動數據清理排程器  
      this.logger.debug('Starting data cleanup scheduler...');
      await this.dataCleanupScheduler.start();

      // 4. 啟動任務監控排程器
      this.logger.debug('Starting task monitor scheduler...');
      await this.taskMonitorScheduler.start();

      const executionTime = Date.now() - startTime;
      this.logger.info('Archive system coordinator started successfully', {
        components: [
          'TaskResultHandler',
          'DroneArchiveScheduler', 
          'DataCleanupScheduler',
          'TaskMonitorScheduler'
        ],
        startupTime: executionTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Failed to start archive system coordinator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        failedAfter: executionTime
      });
      
      // 啟動失敗時嘗試清理已啟動的組件
      await this.stop();
      throw error;
    }
  }

  /**
   * 🛑 停止所有歸檔系統組件 - 協調者關閉邏輯
   * 
   * 功能說明：
   * - 作為協調者，安全停止所有專門組件
   * - 提供統一的系統關閉入口
   * - 確保所有組件優雅關閉
   * 
   * 協調者停止流程：
   * 1. 停止 TaskMonitorScheduler (任務監控排程器) - 優先停止監控
   * 2. 停止 DataCleanupScheduler (數據清理排程器)
   * 3. 停止 DroneArchiveScheduler (Drone 歸檔排程器)
   * 4. 停止 TaskResultHandler (結果處理器) - 最後停止，確保處理完剩餘回調
   * 5. 記錄整體停止狀態
   * 
   * 停止順序設計原則：
   * - 監控排程器優先停止：停止產生新的重試任務
   * - 業務排程器次之：停止產生新的業務任務  
   * - 結果處理器最後停止：確保處理完所有回調訊息
   * 
   * 容錯設計：
   * - 單一組件停止失敗不阻止其他組件停止
   * - 記錄所有停止過程中的錯誤
   * - 確保系統能夠盡可能完整地關閉
   */
  stop = async (): Promise<void> => {
    const startTime = Date.now();
    this.logger.info('Stopping archive system coordinator...');

    const errors: Array<{component: string, error: any}> = [];

    // 1. 停止任務監控排程器 - 優先停止，避免產生新的重試任務
    try {
      this.logger.debug('Stopping task monitor scheduler...');
      await this.taskMonitorScheduler.stop();
    } catch (error) {
      errors.push({ component: 'TaskMonitorScheduler', error });
      this.logger.error('Failed to stop task monitor scheduler', error);
    }

    // 2. 停止數據清理排程器
    try {
      this.logger.debug('Stopping data cleanup scheduler...');
      await this.dataCleanupScheduler.stop();
    } catch (error) {
      errors.push({ component: 'DataCleanupScheduler', error });
      this.logger.error('Failed to stop data cleanup scheduler', error);
    }

    // 3. 停止 Drone 歸檔排程器
    try {
      this.logger.debug('Stopping drone archive scheduler...');
      await this.droneArchiveScheduler.stop();
    } catch (error) {
      errors.push({ component: 'DroneArchiveScheduler', error });
      this.logger.error('Failed to stop drone archive scheduler', error);
    }

    // 4. 最後停止結果處理器 - 確保處理完剩餘的回調訊息
    try {
      this.logger.debug('Stopping task result handler...');
      await this.taskResultHandler.stop();
    } catch (error) {
      errors.push({ component: 'TaskResultHandler', error });
      this.logger.error('Failed to stop task result handler', error);
    }

    const executionTime = Date.now() - startTime;

    if (errors.length > 0) {
      this.logger.warn('Archive system coordinator stopped with errors', {
        componentsWithErrors: errors.length,
        errors: errors.map(e => ({ 
          component: e.component, 
          error: e.error instanceof Error ? e.error.message : String(e.error) 
        })),
        shutdownTime: executionTime
      });
    } else {
      this.logger.info('Archive system coordinator stopped successfully', {
        components: [
          'TaskMonitorScheduler',
          'DataCleanupScheduler', 
          'DroneArchiveScheduler',
          'TaskResultHandler'
        ],
        shutdownTime: executionTime
      });
    }
  }

  /**
   * 🎯 手動觸發 Drone 歸檔任務 - 協調者手動控制介面
   * 
   * 功能說明：
   * - 提供統一的手動觸發介面給外部系統
   * - 委託給專門的 DroneArchiveScheduler 處理
   * - 保持協調者的統一介面設計
   * 
   * 使用場景：
   * - 緊急 Drone 數據歸檔需求
   * - 定時任務失敗後的手動補償
   * - 測試驗證 Drone 歸檔功能
   * 
   * @param jobType 可選的特定 Drone 歸檔類型
   */
  triggerArchive = async (jobType?: 'positions' | 'commands' | 'status'): Promise<void> => {
    this.logger.info('Manual archive trigger requested via coordinator', { jobType });
    
    try {
      await this.droneArchiveScheduler.triggerDroneArchive(jobType);
      
      this.logger.info('Manual archive trigger completed successfully', { jobType });
    } catch (error) {
      this.logger.error('Manual archive trigger failed', {
        jobType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 🎯 手動觸發數據清理任務 - 協調者清理控制介面
   * 
   * 功能說明：
   * - 提供統一的手動清理介面給外部系統
   * - 委託給專門的 DataCleanupScheduler 處理
   * - 保持協調者的統一介面設計
   * 
   * 使用場景：
   * - 緊急清理過期數據需求
   * - 定時清理失敗後的手動補償
   * - 測試驗證清理功能
   * 
   * @param tableName 可選的特定資料表名稱
   * @param daysThreshold 可選的清理天數閾值，預設7天
   */
  triggerCleanup = async (tableName?: string, daysThreshold?: number): Promise<void> => {
    this.logger.info('Manual cleanup trigger requested via coordinator', { tableName, daysThreshold });
    
    try {
      await this.dataCleanupScheduler.triggerCleanup(tableName, daysThreshold);
      
      this.logger.info('Manual cleanup trigger completed successfully', { tableName, daysThreshold });
    } catch (error) {
      this.logger.error('Manual cleanup trigger failed', {
        tableName,
        daysThreshold,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 🎯 手動觸發任務監控檢查 - 協調者監控控制介面
   * 
   * 功能說明：
   * - 提供統一的手動監控檢查介面給外部系統
   * - 委託給專門的 TaskMonitorScheduler 處理
   * - 保持協調者的統一介面設計
   * 
   * @param checkType 檢查類型 ('timeout', 'retry', 'both')
   */
  triggerMonitorCheck = async (checkType: 'timeout' | 'retry' | 'both' = 'both'): Promise<void> => {
    this.logger.info('Manual monitor check trigger requested via coordinator', { checkType });
    
    try {
      await this.taskMonitorScheduler.triggerMonitorCheck(checkType);
      
      this.logger.info('Manual monitor check trigger completed successfully', { checkType });
    } catch (error) {
      this.logger.error('Manual monitor check trigger failed', {
        checkType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 📊 獲取歸檔系統整體狀態 - 協調者狀態彙總介面
   * 
   * 功能說明：
   * - 彙總所有專門組件的狀態資訊
   * - 提供統一的系統狀態查詢介面
   * - 便於外部系統監控整體架構健康狀況
   * 
   * 狀態彙總包含：
   * 1. DroneArchiveScheduler 狀態 (Drone 歸檔排程)
   * 2. DataCleanupScheduler 狀態 (數據清理排程)
   * 3. TaskMonitorScheduler 狀態 (任務監控排程)
   * 4. TaskResultHandler 狀態 (結果處理器)
   * 5. 整體系統狀態摘要
   * 
   * @returns 完整的系統狀態資訊
   */
  getStatus = (): {
    overall: {
      systemName: string;
      componentsCount: number;
      healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    };
    components: {
      droneArchive: any;
      dataCleanup: any;
      taskMonitor: any;
      taskResult: any;
    };
  } => {
    // 收集所有組件狀態
    const droneArchiveStatus = this.droneArchiveScheduler.getStatus();
    const dataCleanupStatus = this.dataCleanupScheduler.getStatus();
    const taskMonitorStatus = this.taskMonitorScheduler.getStatus();
    const taskResultStatus = this.taskResultHandler.getStatus();

    // 判斷整體健康狀況
    const healthChecks = [
      droneArchiveStatus.hasScheduledJob,
      dataCleanupStatus.hasScheduledJob,
      taskMonitorStatus.monitoringEnabled,
      taskResultStatus.isRunning
    ];

    const healthyCount = healthChecks.filter(check => check).length;
    const totalChecks = healthChecks.length;

    let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) {
      healthStatus = 'healthy';
    } else if (healthyCount >= totalChecks / 2) {
      healthStatus = 'degraded';
    } else {
      healthStatus = 'unhealthy';
    }

    return {
      overall: {
        systemName: 'Archive System Coordinator',
        componentsCount: 4,
        healthStatus
      },
      components: {
        droneArchive: {
          name: 'DroneArchiveScheduler',
          status: droneArchiveStatus
        },
        dataCleanup: {
          name: 'DataCleanupScheduler',
          status: dataCleanupStatus
        },
        taskMonitor: {
          name: 'TaskMonitorScheduler',
          status: taskMonitorStatus
        },
        taskResult: {
          name: 'TaskResultHandler',
          status: taskResultStatus
        }
      }
    };
  }
}
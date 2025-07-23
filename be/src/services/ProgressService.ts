/**
 * ProgressService - 進度追蹤服務
 * ===============================
 * 負責管理長時間執行任務的進度追蹤，包含狀態儲存、事件發送和 SSE 連線管理。
 * 
 * 主要功能：
 * - 建立和管理任務進度狀態
 * - 提供 SSE (Server-Sent Events) 即時推送
 * - 計算加權進度和預估完成時間
 * - 管理多個並發任務
 * 
 * 使用情境：
 * - 大量資料初始化進度追蹤
 * - 檔案上傳/下載進度顯示
 * - 批次處理作業監控
 */

import { Response } from 'express';
import { 
  ProgressInfo, 
  ProgressEvent, 
  TaskStatus, 
  TaskStage, 
  StageWeights, 
  DEFAULT_STAGE_WEIGHTS,
  ProgressCallback 
} from '../types/ProgressTypes.js';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('ProgressService');

/**
 * SSE 連線管理介面
 */
interface SSEConnection {
  /** Express Response 物件 */
  response: Response;
  /** 連線建立時間 */
  connectedAt: Date;
  /** 連線是否仍然活躍 */
  isActive: boolean;
}

/**
 * 進度追蹤服務類別
 * 提供完整的任務進度管理和即時推送功能
 */
export class ProgressService {
  /** 任務進度儲存 (Memory-based，適合單伺服器環境) */
  private tasks: Map<string, ProgressInfo> = new Map();
  
  /** SSE 連線管理 */
  private sseConnections: Map<string, SSEConnection[]> = new Map();
  
  /** 階段權重配置 */
  private stageWeights: StageWeights;

  /**
   * 建構函式
   * @param customWeights 自訂階段權重（可選）
   */
  constructor(customWeights?: Partial<StageWeights>) {
    this.stageWeights = { ...DEFAULT_STAGE_WEIGHTS, ...customWeights };
    
    // 定期清理過期的任務和連線（每 5 分鐘執行一次）
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    logger.info('ProgressService initialized with periodic cleanup every 5 minutes');
  }

  /**
   * 建立新任務並開始追蹤
   * @param taskId 任務唯一識別碼
   * @param total 總工作量
   * @param message 初始訊息
   * @returns 初始化的進度資訊
   */
  createTask(taskId: string, total: number, message: string = '任務已啟動'): ProgressInfo {
    const now = new Date();
    const progressInfo: ProgressInfo = {
      taskId,
      status: TaskStatus.STARTED,
      stage: TaskStage.INITIALIZING,
      percentage: 0,
      current: 0,
      total,
      message,
      startTime: now,
      lastUpdated: now
    };

    this.tasks.set(taskId, progressInfo);
    this.broadcastProgress(taskId, progressInfo);
    
    logger.info(`Task created: ${taskId} with total work of ${total}`);
    
    return progressInfo;
  }

  /**
   * 更新任務進度
   * @param taskId 任務識別碼
   * @param updates 進度更新資料
   */
  updateProgress(
    taskId: string, 
    updates: Partial<Pick<ProgressInfo, 'current' | 'stage' | 'message' | 'status'>>
  ): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.warn(`Task ${taskId} not found for progress update`);
      return;
    }

    // 更新任務資訊
    const updatedTask: ProgressInfo = {
      ...task,
      ...updates,
      lastUpdated: new Date()
    };

    // 重新計算進度百分比
    if (updates.current !== undefined || updates.stage !== undefined) {
      updatedTask.percentage = this.calculateOverallProgress(
        updates.stage || task.stage,
        updates.current || task.current,
        task.total
      );
    }

    // 更新預估完成時間
    if (updatedTask.percentage > 0 && updatedTask.status === TaskStatus.RUNNING) {
      updatedTask.estimatedCompletion = this.calculateEstimatedCompletion(updatedTask);
    }

    this.tasks.set(taskId, updatedTask);
    this.broadcastProgress(taskId, updatedTask);
    
    logger.debug(`Task progress updated: ${taskId} - ${updatedTask.percentage}% complete`);
  }

  /**
   * 標記任務完成
   * @param taskId 任務識別碼
   * @param result 任務結果
   * @param message 完成訊息
   */
  completeTask(taskId: string, result?: any, message: string = '任務已完成'): void {
    this.updateProgress(taskId, {
      status: TaskStatus.COMPLETED,
      stage: TaskStage.FINALIZING,
      current: this.tasks.get(taskId)?.total || 0,
      message
    });

    const task = this.tasks.get(taskId);
    if (task) {
      task.result = result;
      task.percentage = 100;
      this.tasks.set(taskId, task);
      this.broadcastProgress(taskId, task);
      logger.info(`Task completed successfully: ${taskId}`);
    } else {
      logger.warn(`Attempted to complete non-existent task: ${taskId}`);
    }

    // 延遲關閉 SSE 連線，確保客戶端收到完成事件
    setTimeout(() => {
      this.closeSSEConnections(taskId);
    }, 1000);
  }

  /**
   * 標記任務失敗
   * @param taskId 任務識別碼
   * @param error 錯誤訊息
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      const failedTask: ProgressInfo = {
        ...task,
        status: TaskStatus.FAILED,
        error,
        message: `任務失敗: ${error}`,
        lastUpdated: new Date()
      };
      
      this.tasks.set(taskId, failedTask);
      this.broadcastProgress(taskId, failedTask);
      logger.error(`Task failed: ${taskId} - ${error}`);
    }

    // 延遲關閉 SSE 連線
    setTimeout(() => {
      this.closeSSEConnections(taskId);
    }, 1000);
  }

  /**
   * 取得任務進度資訊
   * @param taskId 任務識別碼
   * @returns 進度資訊或 undefined
   */
  getProgress(taskId: string): ProgressInfo | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 建立 SSE 連線
   * @param taskId 任務識別碼
   * @param response Express Response 物件
   * @returns 是否成功建立連線
   */
  createSSEConnection(taskId: string, response: Response): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 設定 SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 建立連線記錄
    const connection: SSEConnection = {
      response,
      connectedAt: new Date(),
      isActive: true
    };

    // 儲存連線
    const connections = this.sseConnections.get(taskId) || [];
    connections.push(connection);
    this.sseConnections.set(taskId, connections);

    // 立即發送當前狀態
    this.sendSSEEvent(response, 'progress', task);

    // 處理客戶端斷線
    response.on('close', () => {
      connection.isActive = false;
      this.removeInactiveConnections(taskId);
    });

    return true;
  }

  /**
   * 建立進度回調函數
   * @param taskId 任務識別碼
   * @returns 進度回調函數
   */
  createProgressCallback(taskId: string): ProgressCallback {
    return (progress: ProgressInfo) => {
      this.updateProgress(taskId, {
        current: progress.current,
        stage: progress.stage,
        message: progress.message,
        status: progress.status
      });
    };
  }

  /**
   * 計算整體進度百分比
   * @param currentStage 當前階段
   * @param current 當前階段已完成工作量
   * @param total 總工作量
   * @returns 整體進度百分比 (0-100)
   */
  private calculateOverallProgress(currentStage: TaskStage, current: number, total: number): number {
    // 計算當前階段之前的所有階段權重總和
    const stages = Object.values(TaskStage);
    const currentStageIndex = stages.indexOf(currentStage);
    
    let completedStagesWeight = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      completedStagesWeight += this.stageWeights[stages[i]] || 0;
    }

    // 計算當前階段的進度
    const currentStageWeight = this.stageWeights[currentStage] || 0;
    const currentStageProgress = total > 0 ? (current / total) * currentStageWeight : 0;

    // 總進度 = 已完成階段權重 + 當前階段進度
    const overallProgress = (completedStagesWeight + currentStageProgress) * 100;
    
    return Math.min(Math.max(overallProgress, 0), 100);
  }

  /**
   * 計算預估完成時間
   * @param task 任務資訊
   * @returns 預估完成時間
   */
  private calculateEstimatedCompletion(task: ProgressInfo): Date {
    const elapsed = Date.now() - task.startTime.getTime();
    const remainingPercentage = 100 - task.percentage;
    const estimatedRemaining = (elapsed / task.percentage) * remainingPercentage;
    
    return new Date(Date.now() + estimatedRemaining);
  }

  /**
   * 廣播進度更新給所有 SSE 連線
   * @param taskId 任務識別碼
   * @param progress 進度資訊
   */
  private broadcastProgress(taskId: string, progress: ProgressInfo): void {
    const connections = this.sseConnections.get(taskId);
    if (!connections) return;

    const eventType = progress.status === TaskStatus.COMPLETED ? 'completed' :
                     progress.status === TaskStatus.FAILED ? 'error' : 'progress';

    connections.forEach(connection => {
      if (connection.isActive) {
        try {
          this.sendSSEEvent(connection.response, eventType, progress);
        } catch (error) {
          logger.error('Error sending SSE event:', error);
          connection.isActive = false;
        }
      }
    });

    // 移除非活躍連線
    this.removeInactiveConnections(taskId);
  }

  /**
   * 發送 SSE 事件
   * @param response Express Response 物件
   * @param type 事件類型
   * @param data 事件資料
   */
  private sendSSEEvent(response: Response, type: string, data: ProgressInfo): void {
    const event: ProgressEvent = {
      type: type as any,
      timestamp: Date.now(),
      data
    };

    response.write(`event: ${type}\n`);
    response.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  /**
   * 關閉指定任務的所有 SSE 連線
   * @param taskId 任務識別碼
   */
  private closeSSEConnections(taskId: string): void {
    const connections = this.sseConnections.get(taskId);
    if (connections) {
      connections.forEach(connection => {
        if (connection.isActive) {
          try {
            connection.response.end();
          } catch (error) {
            logger.error('Error closing SSE connection:', error);
          }
        }
      });
      this.sseConnections.delete(taskId);
    }
  }

  /**
   * 移除非活躍的 SSE 連線
   * @param taskId 任務識別碼
   */
  private removeInactiveConnections(taskId: string): void {
    const connections = this.sseConnections.get(taskId);
    if (connections) {
      const activeConnections = connections.filter(conn => conn.isActive);
      if (activeConnections.length > 0) {
        this.sseConnections.set(taskId, activeConnections);
      } else {
        this.sseConnections.delete(taskId);
      }
    }
  }

  /**
   * 清理過期的任務和連線
   * 移除 1 小時前完成或失敗的任務
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [taskId, task] of this.tasks.entries()) {
      const isExpired = task.lastUpdated.getTime() < oneHourAgo;
      const isFinished = task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED;
      
      if (isExpired && isFinished) {
        this.tasks.delete(taskId);
        this.closeSSEConnections(taskId);
        logger.info(`Cleaned up expired task: ${taskId}`);
      }
    }
  }
}

/**
 * 全域進度服務實例
 * 單例模式確保全應用程式共用同一個進度管理器
 */
export const progressService = new ProgressService();
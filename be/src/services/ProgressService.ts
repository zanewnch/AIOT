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
import { IProgressService } from '../types/services/IProgressService.js';

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
 * 實作 IProgressService 介面，提供完整的任務進度管理和即時推送功能
 */
export class ProgressService implements IProgressService {
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
  constructor(customWeights?: Partial<StageWeights>) { // 建構函式，接受可選的自訂階段權重配置
    this.stageWeights = { ...DEFAULT_STAGE_WEIGHTS, ...customWeights }; // 合併預設權重和自訂權重，自訂值會覆蓋預設值

    // 定期清理過期的任務和連線（每 5 分鐘執行一次）
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // 設定定時器，每 300,000 毫秒（5分鐘）執行一次清理作業
    logger.info('ProgressService initialized with periodic cleanup every 5 minutes'); // 記錄服務初始化完成的資訊日誌
  }

  /**
   * 建立新任務並開始追蹤
   * @param taskId 任務唯一識別碼
   * @param total 總工作量
   * @param message 初始訊息
   * @returns 初始化的進度資訊
   */
  createTask(taskId: string, total: number, message: string = '任務已啟動'): ProgressInfo { // 公開方法：建立新任務並開始追蹤
    const now = new Date(); // 取得當前時間戳，用於記錄任務開始時間
    const progressInfo: ProgressInfo = { // 建立進度資訊物件，包含任務的完整狀態
      taskId, // 任務的唯一識別碼
      status: TaskStatus.STARTED, // 設定任務狀態為已開始
      stage: TaskStage.INITIALIZING, // 設定任務階段為初始化中
      percentage: 0, // 初始進度百分比為 0
      current: 0, // 當前已完成的工作量為 0
      total, // 總工作量，由參數傳入
      message, // 任務狀態訊息，預設為「任務已啟動」
      startTime: now, // 記錄任務開始時間
      lastUpdated: now // 記錄最後更新時間
    };

    this.tasks.set(taskId, progressInfo); // 將進度資訊儲存到記憶體中的 Map 集合
    this.broadcastProgress(taskId, progressInfo); // 廣播進度更新給所有 SSE 連線的客戶端

    logger.info(`Task created: ${taskId} with total work of ${total}`); // 記錄任務建立成功的資訊日誌

    return progressInfo; // 回傳初始化完成的進度資訊物件
  }

  /**
   * 更新任務進度
   * @param taskId 任務識別碼
   * @param updates 進度更新資料
   */
  updateProgress( // 公開方法：更新任務進度
    taskId: string, // 要更新的任務識別碼
    updates: Partial<Pick<ProgressInfo, 'current' | 'stage' | 'message' | 'status'>> // 部分更新資料，只包含需要更新的欄位
  ): void { // 無回傳值的方法
    const task = this.tasks.get(taskId); // 從記憶體中的 Map 集合取得指定任務的進度資訊
    if (!task) { // 如果找不到對應的任務
      logger.warn(`Task ${taskId} not found for progress update`); // 記錄警告訊息
      return; // 直接結束方法執行
    }

    // 更新任務資訊
    const updatedTask: ProgressInfo = { // 建立更新後的任務物件
      ...task, // 複製原有任務的所有屬性
      ...updates, // 套用更新的屬性，會覆蓋原有的對應屬性
      lastUpdated: new Date() // 更新最後修改時間為當前時間
    };

    // 重新計算進度百分比
    if (updates.current !== undefined || updates.stage !== undefined) { // 如果更新了當前進度或階段
      updatedTask.percentage = this.calculateOverallProgress( // 調用私有方法重新計算整體進度百分比
        updates.stage || task.stage, // 使用更新的階段或原有階段
        updates.current || task.current, // 使用更新的當前進度或原有進度
        task.total // 總工作量保持不變
      );
    }

    // 更新預估完成時間
    if (updatedTask.percentage > 0 && updatedTask.status === TaskStatus.RUNNING) { // 如果任務正在運行且有進度
      updatedTask.estimatedCompletion = this.calculateEstimatedCompletion(updatedTask); // 重新計算預估完成時間
    }

    this.tasks.set(taskId, updatedTask); // 將更新後的任務資訊存回 Map 集合
    this.broadcastProgress(taskId, updatedTask); // 廣播進度更新給所有訂閱的 SSE 客戶端

    logger.debug(`Task progress updated: ${taskId} - ${updatedTask.percentage}% complete`); // 記錄除錯日誌，顯示更新後的進度百分比
  }

  /**
   * 標記任務完成
   * @param taskId 任務識別碼
   * @param result 任務結果
   * @param message 完成訊息
   */
  completeTask(taskId: string, result?: any, message: string = '任務已完成'): void { // 公開方法：標記任務完成並設定結果資料
    this.updateProgress(taskId, { // 調用更新進度方法，設定任務完成狀態
      status: TaskStatus.COMPLETED, // 將任務狀態設為已完成
      stage: TaskStage.FINALIZING, // 將任務階段設為最終化階段
      current: this.tasks.get(taskId)?.total || 0, // 將當前進度設為總工作量，表示 100% 完成
      message // 使用傳入的完成訊息
    });

    const task = this.tasks.get(taskId); // 取得更新後的任務資訊
    if (task) { // 如果任務存在
      task.result = result; // 設定任務執行結果
      task.percentage = 100; // 確保進度百分比為 100%
      this.tasks.set(taskId, task); // 將更新後的任務資訊存回集合中
      this.broadcastProgress(taskId, task); // 廣播最終的任務完成狀態給所有 SSE 客戶端
      logger.info(`Task completed successfully: ${taskId}`); // 記錄任務成功完成的資訊日誌
    } else { // 如果任務不存在
      logger.warn(`Attempted to complete non-existent task: ${taskId}`); // 記錄嘗試完成不存在任務的警告日誌
    }

    // 延遲關閉 SSE 連線，確保客戶端收到完成事件
    setTimeout(() => { // 設定延遲執行，確保客戶端有足夠時間接收完成事件
      this.closeSSEConnections(taskId); // 關閉該任務的所有 SSE 連線
    }, 1000); // 延遲 1000 毫秒（1 秒）後執行
  }

  /**
   * 標記任務失敗
   * @param taskId 任務識別碼
   * @param error 錯誤訊息
   */
  failTask(taskId: string, error: string): void { // 公開方法：標記任務失敗並記錄錯誤資訊
    const task = this.tasks.get(taskId); // 從任務集合中取得指定的任務資訊
    if (task) { // 如果任務存在
      const failedTask: ProgressInfo = { // 建立失敗任務的資訊物件
        ...task, // 複製原有任務的所有屬性
        status: TaskStatus.FAILED, // 將任務狀態設為失敗
        error, // 設定錯誤訊息
        message: `任務失敗: ${error}`, // 設定使用者友好的失敗訊息
        lastUpdated: new Date() // 更新最後修改時間為當前時間
      };

      this.tasks.set(taskId, failedTask); // 將失敗的任務資訊存回集合中
      this.broadcastProgress(taskId, failedTask); // 廣播任務失敗狀態給所有 SSE 客戶端
      logger.error(`Task failed: ${taskId} - ${error}`); // 記錄任務失敗的錯誤日誌
    }

    // 延遲關閉 SSE 連線
    setTimeout(() => { // 設定延遲執行，確保客戶端有時間接收失敗事件
      this.closeSSEConnections(taskId); // 關閉該任務的所有 SSE 連線
    }, 1000); // 延遲 1000 毫秒（1 秒）後執行
  }

  /**
   * 取得任務進度資訊
   * @param taskId 任務識別碼
   * @returns 進度資訊或 undefined
   */
  getProgress(taskId: string): ProgressInfo | undefined { // 公開方法：取得指定任務的進度資訊
    return this.tasks.get(taskId); // 從任務集合中取得並回傳指定任務的進度資訊，若不存在則回傳 undefined
  }

  /**
   * 建立 SSE 連線
   * @param taskId 任務識別碼
   * @param response Express Response 物件
   * @returns 是否成功建立連線
   */
  createSSEConnection(taskId: string, response: Response): boolean { // 公開方法：為指定任務建立 SSE 連線
    const task = this.tasks.get(taskId); // 從任務集合中取得指定的任務資訊
    if (!task) { // 如果任務不存在
      return false; // 回傳 false 表示連線建立失敗
    }

    // 設定 SSE headers
    response.writeHead(200, { // 設定 HTTP 回應狀態碼為 200 OK
      'Content-Type': 'text/event-stream', // 設定內容類型為 SSE 事件串流
      'Cache-Control': 'no-cache', // 禁用快取，確保即時資料傳輸
      'Connection': 'keep-alive', // 保持連線開啟，支援長連線
      'Access-Control-Allow-Origin': '*', // 允許所有來源的跨域請求
      'Access-Control-Allow-Headers': 'Cache-Control' // 允許 Cache-Control 標頭的跨域請求
    });

    // 建立連線記錄
    const connection: SSEConnection = { // 建立新的 SSE 連線物件
      response, // 儲存 Express Response 物件的參考
      connectedAt: new Date(), // 記錄連線建立的時間戳
      isActive: true // 設定連線狀態為活躍
    };

    // 儲存連線
    const connections = this.sseConnections.get(taskId) || []; // 取得該任務現有的連線陣列，若無則建立空陣列
    connections.push(connection); // 將新連線加入到連線陣列中
    this.sseConnections.set(taskId, connections); // 將更新後的連線陣列存回 Map 集合

    // 立即發送當前狀態
    this.sendSSEEvent(response, 'progress', task); // 發送當前任務進度給新連線的客戶端

    // 處理客戶端斷線
    response.on('close', () => { // 監聽客戶端關閉連線事件
      connection.isActive = false; // 將連線標記為非活躍狀態
      this.removeInactiveConnections(taskId); // 清理該任務的非活躍連線
    });

    return true; // 回傳 true 表示連線建立成功
  }

  /**
   * 建立進度回調函數
   * @param taskId 任務識別碼
   * @returns 進度回調函數
   */
  createProgressCallback(taskId: string): ProgressCallback { // 公開方法：建立進度回調函數，用於外部服務更新進度
    return (progress: ProgressInfo) => { // 回傳一個接受 ProgressInfo 參數的函數
      this.updateProgress(taskId, { // 調用更新進度方法，將外部進度資訊同步到內部任務狀態
        current: progress.current, // 更新當前已完成的工作量
        stage: progress.stage, // 更新任務執行階段
        message: progress.message, // 更新任務狀態訊息
        status: progress.status // 更新任務執行狀態
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
  private calculateOverallProgress(currentStage: TaskStage, current: number, total: number): number { // 私有方法：計算整體進度百分比
    // 計算當前階段之前的所有階段權重總和
    const stages = Object.values(TaskStage); // 取得所有任務階段的陣列
    const currentStageIndex = stages.indexOf(currentStage); // 找到當前階段在陣列中的索引位置

    let completedStagesWeight = 0; // 已完成階段的權重總和，初始為 0
    for (let i = 0; i < currentStageIndex; i++) { // 遍歷當前階段之前的所有階段
      completedStagesWeight += this.stageWeights[stages[i]] || 0; // 累加已完成階段的權重值，若無權重設定則使用 0
    }

    // 計算當前階段的進度
    const currentStageWeight = this.stageWeights[currentStage] || 0; // 取得當前階段的權重值
    const currentStageProgress = total > 0 ? (current / total) * currentStageWeight : 0; // 計算當前階段的進度：(已完成/總量) × 階段權重

    // 總進度 = 已完成階段權重 + 當前階段進度
    const overallProgress = (completedStagesWeight + currentStageProgress) * 100; // 計算總進度並轉換為百分比

    return Math.min(Math.max(overallProgress, 0), 100); // 確保進度百分比在 0-100 之間
  }

  /**
   * 計算預估完成時間
   * @param task 任務資訊
   * @returns 預估完成時間
   */
  private calculateEstimatedCompletion(task: ProgressInfo): Date { // 私有方法：根據當前進度計算預估完成時間
    const elapsed = Date.now() - task.startTime.getTime(); // 計算任務已執行的時間（毫秒）
    const remainingPercentage = 100 - task.percentage; // 計算剩餘的進度百分比
    const estimatedRemaining = (elapsed / task.percentage) * remainingPercentage; // 根據已執行時間和進度比例估算剩餘時間

    return new Date(Date.now() + estimatedRemaining); // 回傳當前時間加上預估剩餘時間的完成時間
  }

  /**
   * 廣播進度更新給所有 SSE 連線
   * @param taskId 任務識別碼
   * @param progress 進度資訊
   */
  private broadcastProgress(taskId: string, progress: ProgressInfo): void { // 私有方法：廣播進度更新給所有 SSE 連線
    const connections = this.sseConnections.get(taskId); // 取得指定任務的所有 SSE 連線
    if (!connections) return; // 如果沒有連線，直接結束方法執行

    const eventType = progress.status === TaskStatus.COMPLETED ? 'completed' : // 如果任務已完成，事件類型為 'completed'
                     progress.status === TaskStatus.FAILED ? 'error' : 'progress'; // 如果任務失敗，事件類型為 'error'，否則為 'progress'

    connections.forEach(connection => { // 遍歷該任務的所有 SSE 連線
      if (connection.isActive) { // 如果連線仍然活躍
        try { // 嘗試發送 SSE 事件
          this.sendSSEEvent(connection.response, eventType, progress); // 調用發送 SSE 事件的私有方法
        } catch (error) { // 捕獲發送過程中的錯誤
          logger.error('Error sending SSE event:', error); // 記錄錯誤日誌
          connection.isActive = false; // 將連線標記為非活躍
        }
      }
    });

    // 移除非活躍連線
    this.removeInactiveConnections(taskId); // 清理該任務的所有非活躍連線
  }

  /**
   * 發送 SSE 事件
   * @param response Express Response 物件
   * @param type 事件類型
   * @param data 事件資料
   */
  private sendSSEEvent(response: Response, type: string, data: ProgressInfo): void { // 私有方法：發送 SSE 事件到客戶端
    const event: ProgressEvent = { // 建立符合 SSE 格式的事件物件
      type: type as any, // 事件類型（progress、completed、error 等）
      timestamp: Date.now(), // 事件發生的時間戳
      data // 進度資料內容
    };

    response.write(`event: ${type}\n`); // 寫入 SSE 事件類型標頭
    response.write(`data: ${JSON.stringify(event)}\n\n`); // 寫入 JSON 格式的事件資料，並以雙換行結束
  }

  /**
   * 關閉指定任務的所有 SSE 連線
   * @param taskId 任務識別碼
   */
  private closeSSEConnections(taskId: string): void { // 私有方法：關閉指定任務的所有 SSE 連線
    const connections = this.sseConnections.get(taskId); // 取得該任務的所有 SSE 連線
    if (connections) { // 如果有連線存在
      connections.forEach(connection => { // 遍歷所有連線
        if (connection.isActive) { // 如果連線仍然活躍
          try { // 嘗試正常關閉連線
            connection.response.end(); // 結束 HTTP 回應，關閉 SSE 連線
          } catch (error) { // 捕獲關閉過程中的錯誤
            logger.error('Error closing SSE connection:', error); // 記錄關閉連線時的錯誤日誌
          }
        }
      });
      this.sseConnections.delete(taskId); // 從連線集合中刪除該任務的所有連線記錄
    }
  }

  /**
   * 移除非活躍的 SSE 連線
   * @param taskId 任務識別碼
   */
  private removeInactiveConnections(taskId: string): void { // 私有方法：移除指定任務的所有非活躍 SSE 連線
    const connections = this.sseConnections.get(taskId); // 取得該任務的所有 SSE 連線
    if (connections) { // 如果有連線存在
      const activeConnections = connections.filter(conn => conn.isActive); // 篩選出仍然活躍的連線
      if (activeConnections.length > 0) { // 如果還有活躍連線
        this.sseConnections.set(taskId, activeConnections); // 更新連線集合，只保留活躍連線
      } else { // 如果沒有活躍連線
        this.sseConnections.delete(taskId); // 從連線集合中完全移除該任務的連線記錄
      }
    }
  }

  /**
   * 清理過期的任務和連線
   * 移除 1 小時前完成或失敗的任務
   */
  private cleanup(): void { // 私有方法：清理過期的任務和連線
    const oneHourAgo = Date.now() - 60 * 60 * 1000; // 計算一小時前的時間戳（當前時間 - 3,600,000 毫秒）

    for (const [taskId, task] of this.tasks.entries()) { // 遍歷所有儲存的任務
      const isExpired = task.lastUpdated.getTime() < oneHourAgo; // 檢查任務最後更新時間是否超過一小時
      const isFinished = task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED; // 檢查任務是否已完成或失敗

      if (isExpired && isFinished) { // 如果任務既過期又已結束
        this.tasks.delete(taskId); // 從任務集合中刪除該任務
        this.closeSSEConnections(taskId); // 關閉該任務的所有 SSE 連線
        logger.info(`Cleaned up expired task: ${taskId}`); // 記錄清理操作的資訊日誌
      }
    }
  }
}

/**
 * 全域進度服務實例
 * 單例模式確保全應用程式共用同一個進度管理器
 */
export const progressService = new ProgressService();
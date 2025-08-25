/**
 * @fileoverview 排程控制器 - Scheduler Service 任務調度管理模組
 * 
 * 職責說明：
 * - 負責處理排程相關的 API 請求和操作管理
 * - 提供排程器狀態查詢和監控功能
 * - 支援手動觸發歸檔任務的即時操作
 * - 管理不同類型歸檔任務的執行控制
 * - 實現統一的排程回應格式和錯誤處理
 * 
 * 功能定位：
 * - 這是一個 **操作管理型** 控制器，提供排程器的狀態監控和操作控制
 * - **不負責實際的任務執行**，只負責協調和觸發 ArchiveScheduler
 * - 實際的排程邏輯和任務執行由 ArchiveScheduler 負責處理
 * 
 * 使用場景：
 * - 系統管理員需要監控排程器的運行狀態
 * - 運維人員需要手動觸發特定的歸檔任務
 * - 監控系統需要獲取排程器的健康狀態和活動任務數量
 * - 緊急情況下需要立即執行資料歸檔操作
 * - API 自動化工具需要程式化控制排程任務
 * 
 * API 端點：
 * - GET /schedule/status - 獲取排程器當前狀態和統計資訊
 * - POST /schedule/trigger - 手動觸發特定類型的歸檔任務
 * 
 * 支援的歸檔任務類型：
 * - positions: 無人機位置資料歸檔
 * - commands: 無人機指令記錄歸檔
 * - status: 無人機狀態資料歸檔
 * - all: 執行所有類型的歸檔任務（預設）
 * 
 * 依賴服務：
 * - ArchiveScheduler: 提供排程任務的執行和管理功能
 * - Logger: 記錄操作日誌和錯誤追蹤
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../container/types';
import { ArchiveScheduler } from '../schedulers/ArchiveScheduler';

/**
 * ScheduleController - 排程控制器類別
 * 
 * 架構模式：
 * - 使用 InversifyJS 依賴注入實現鬆耦合設計
 * - 遵循控制器-服務層架構模式
 * - 實現統一的錯誤處理和回應格式
 * - 採用輸入驗證確保操作安全性
 * 
 * 設計原則：
 * - 單一職責：專注於排程相關的 HTTP 請求處理
 * - 依賴反轉：透過介面注入依賴服務
 * - 輸入驗證：確保手動觸發操作的參數正確性
 * - 操作審計：記錄所有排程操作和狀態變更
 * - 錯誤隔離：完整的 try-catch 錯誤處理
 */
@injectable()
export class class ScheduleCtrl {Ctrl {
  /**
   * 建構子 - 依賴注入初始化
   * 
   * @param logger - 日誌服務，用於記錄操作和錯誤
   * @param archiveScheduler - 歸檔排程器，提供任務調度和執行功能
   * 
   * 注入說明：
   * - TYPES.Logger: 統一的日誌記錄介面
   * - TYPES.ArchiveScheduler: 歸檔任務排程和管理服務
   */
  constructor(
    @inject(TYPES.Logger) private readonly logger: any,
    @inject(TYPES.ArchiveScheduler) private readonly archiveScheduler: ArchiveScheduler
  ) {}

  /**
   * 獲取排程器狀態 API 端點
   * 
   * HTTP 方法: GET
   * 路由路徑: /schedule/status
   * 回應格式: JSON
   * 
   * 功能描述：
   * 1. 接收前端或監控工具的排程狀態查詢請求
   * 2. 記錄請求資訊（IP、User-Agent）用於審計追蹤
   * 3. 從 ArchiveScheduler 獲取當前運行狀態和統計資訊
   * 4. 統計活動任務數量和最後執行時間
   * 5. 構建標準化的 JSON 回應格式
   * 6. 處理可能的異常情況並返回適當的錯誤訊息
   * 
   * 狀態資訊包含：
   * - isRunning: boolean - 排程器是否正在運行
   * - scheduledJobs: string[] - 已註冊的排程任務名稱列表
   * - nextExecutions: Record<string, string | null> - 各任務的下次執行時間
   * 
   * 實際 ArchiveScheduler.getStatus() 回應結構：
   * {
   *   isRunning: boolean,           // 排程器運行狀態
   *   scheduledJobs: string[],      // 排程任務名稱陣列
   *   nextExecutions: {             // 各任務的下次執行時間
   *     "archive-daily": string | null,      // 每日歸檔任務
   *     "cleanup-expired": string | null,    // 過期清理任務
   *     "timeout-monitor": string | null,    // 超時監控任務
   *     "retry-monitor": string | null       // 重試監控任務
   *   }
   * }
   * 
   * API 回應資料結構：
   * {
   *   isRunning: boolean,           // 排程器運行狀態
   *   scheduledJobs: string[],      // 排程任務名稱陣列
   *   nextExecutions: Record<string, string | null>,  // 下次執行時間對照表
   *   timestamp: string             // 查詢時間戳記 (ISO 格式)
   * }
   * 
   * @param req - Express 請求物件，包含 HTTP 請求資訊
   * @param res - Express 回應物件，用於返回 HTTP 回應
   */
  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // ================================
      // 步驟 1: 請求審計和日誌記錄
      // ================================
      // 記錄每個排程狀態查詢請求的詳細資訊
      // 用於安全審計、系統監控和故障排除
      this.logger.debug('收到排程狀態查詢請求', {
        ip: req.ip,                      // 客戶端 IP 地址
        userAgent: req.get('User-Agent') // 客戶端瀏覽器/應用程式資訊
      });

      // ================================
      // 步驟 2: 獲取排程器狀態資訊
      // ================================
      // 從 ArchiveScheduler 獲取當前的運行狀態和統計資訊
      // 包含排程器是否運行、活動任務數量、執行歷史等
      const schedulerStatus = this.archiveScheduler.getStatus();

      // ================================
      // 步驟 3: 記錄狀態獲取統計資訊
      // ================================
      // 記錄狀態查詢的關鍵資訊，便於監控排程器使用情況
      this.logger.info('排程狀態獲取成功', {
        isRunning: schedulerStatus.isRunning,                          // 排程器運行狀態
        scheduledJobsCount: schedulerStatus.scheduledJobs.length,       // 排程任務數量
        scheduledJobs: schedulerStatus.scheduledJobs                    // 排程任務名稱列表
      });

      // ================================
      // 步驟 4: 構建標準化回應資料
      // ================================
      // 建立統一的 API 回應格式，確保前端能夠一致地處理資料
      // 添加查詢時間戳記以便追蹤資料的時效性
      res.json({
        ...schedulerStatus,                         // 展開排程器狀態資訊
        timestamp: new Date().toISOString()         // 添加 API 回應時間戳記
      });

    } catch (error) {
      // ================================
      // 錯誤處理：系統異常和故障恢復
      // ================================
      
      // 記錄詳細的錯誤資訊用於故障排除
      // 包含錯誤訊息和堆疊追蹤以便開發者調試
      this.logger.error('獲取排程狀態失敗', {
        error: error instanceof Error ? error.message : String(error),     // 錯誤訊息
        stack: error instanceof Error ? error.stack : undefined            // 錯誤堆疊追蹤
      });

      // 返回適當的 HTTP 500 錯誤回應
      // 根據環境變數決定錯誤訊息的詳細程度，保護生產環境安全
      res.status(500).json({
        error: 'Failed to retrieve schedule status',                       // 通用錯誤標識
        message: process.env.NODE_ENV === 'production' 
          ? 'Schedule status temporarily unavailable'                       // 生產環境：簡化錯誤訊息
          : (error instanceof Error ? error.message : String(error)),       // 開發環境：詳細錯誤訊息
        timestamp: new Date().toISOString()                                // 錯誤發生時間
      });
    }
  };

  /**
   * 手動觸發歸檔任務 API 端點
   * 
   * HTTP 方法: POST
   * 路由路徑: /schedule/trigger
   * 回應格式: JSON
   * 
   * 功能描述：
   * 1. 接收手動觸發歸檔任務的請求和參數
   * 2. 驗證任務類型參數的有效性和安全性
   * 3. 記錄觸發請求的詳細資訊用於操作審計
   * 4. 調用 ArchiveScheduler 執行指定的歸檔任務
   * 5. 監控任務觸發的結果和狀態
   * 6. 返回操作結果和執行資訊
   * 
   * 請求體參數：
   * {
   *   jobType?: string               // 可選，指定要執行的歸檔任務類型
   * }
   * 
   * 支援的 jobType 值：
   * - "positions": 僅執行無人機位置資料歸檔
   * - "commands": 僅執行無人機指令記錄歸檔  
   * - "status": 僅執行無人機狀態資料歸檔
   * - 未指定或 null: 執行所有類型的歸檔任務
   * 
   * 參數驗證邏輯：
   * - 如果 jobType 被指定，必須是支援的值之一
   * - 無效的 jobType 會返回 HTTP 400 錯誤
   * - 未指定 jobType 時預設執行所有歸檔任務
   * 
   * 成功回應資料結構：
   * {
   *   message: string,              // 成功訊息
   *   jobType: string,              // 執行的任務類型
   *   triggeredAt: string,          // 觸發時間 (ISO 格式)
   *   status: "success"             // 操作狀態
   * }
   * 
   * 錯誤回應資料結構：
   * {
   *   error: string,                // 錯誤類型
   *   message: string,              // 錯誤描述
   *   validJobTypes?: string[],     // 有效的任務類型 (僅參數錯誤時)
   *   jobType?: string,             // 請求的任務類型
   *   timestamp: string             // 錯誤發生時間
   * }
   * 
   * @param req - Express 請求物件，包含 HTTP 請求資訊和請求體
   * @param res - Express 回應物件，用於返回 HTTP 回應
   */
  triggerArchive = async (req: Request, res: Response): Promise<void> => {
    try {
      // ================================
      // 步驟 1: 提取和解析請求參數
      // ================================
      // 從請求體中提取任務類型參數
      // 支援選擇性執行特定類型的歸檔任務
      const { jobType } = req.body;

      // ================================
      // 步驟 2: 操作審計和日誌記錄
      // ================================
      // 記錄手動觸發請求的詳細資訊
      // 用於操作審計、安全監控和故障排除
      this.logger.info('收到手動觸發歸檔請求', {
        jobType: jobType || 'all',       // 任務類型（預設為 all）
        ip: req.ip,                      // 客戶端 IP 地址
        userAgent: req.get('User-Agent') // 客戶端瀏覽器/應用程式資訊
      });

      // ================================
      // 步驟 3: 輸入驗證和安全檢查
      // ================================
      // 驗證任務類型參數的有效性
      // 防止無效或惡意的參數導致系統異常
      const validJobTypes = ['positions', 'commands', 'status'];
      
      if (jobType && !validJobTypes.includes(jobType)) {
        // 記錄無效參數的警告
        this.logger.warn('無效的工作類型', { 
          jobType,
          validTypes: validJobTypes,
          ip: req.ip
        });
        
        // 返回 HTTP 400 Bad Request 錯誤
        res.status(400).json({
          error: 'Invalid job type',                                       // 錯誤類型
          message: 'Job type must be one of: positions, commands, status', // 錯誤描述
          validJobTypes: validJobTypes,                                    // 有效的任務類型清單
          timestamp: new Date().toISOString()                              // 錯誤發生時間
        });
        return;
      }

      // ================================
      // 步驟 4: 執行歸檔任務觸發
      // ================================
      // 調用 ArchiveScheduler 執行指定的歸檔任務
      // 這是一個異步操作，會等待任務觸發完成
      await this.archiveScheduler.triggerArchive(jobType);

      // ================================
      // 步驟 5: 記錄成功結果和統計
      // ================================
      // 記錄任務觸發成功的詳細資訊
      this.logger.info('歸檔任務觸發成功', {
        jobType: jobType || 'all',              // 執行的任務類型
        triggeredAt: new Date().toISOString(),  // 觸發時間
        ip: req.ip                              // 觸發來源 IP
      });

      // ================================
      // 步驟 6: 返回成功回應
      // ================================
      // 構建標準化的成功回應資料
      res.json({
        message: 'Archive task triggered successfully',     // 成功訊息
        jobType: jobType || 'all',                         // 執行的任務類型
        triggeredAt: new Date().toISOString(),             // 觸發時間
        status: 'success'                                  // 操作狀態
      });

    } catch (error) {
      // ================================
      // 錯誤處理：任務觸發失敗和異常恢復
      // ================================
      
      // 記錄詳細的錯誤資訊用於故障排除
      // 包含請求參數、錯誤訊息和堆疊追蹤
      this.logger.error('觸發歸檔任務失敗', {
        jobType: req.body?.jobType,                                        // 請求的任務類型
        error: error instanceof Error ? error.message : String(error),     // 錯誤訊息
        stack: error instanceof Error ? error.stack : undefined,           // 錯誤堆疊追蹤
        ip: req.ip                                                         // 請求來源 IP
      });

      // 返回適當的 HTTP 500 錯誤回應
      // 根據環境變數決定錯誤訊息的詳細程度
      res.status(500).json({
        error: 'Failed to trigger archive',                                // 通用錯誤標識
        message: process.env.NODE_ENV === 'production' 
          ? 'Archive trigger temporarily unavailable'                       // 生產環境：簡化錯誤訊息
          : (error instanceof Error ? error.message : String(error)),       // 開發環境：詳細錯誤訊息
        jobType: req.body?.jobType,                                        // 請求的任務類型
        timestamp: new Date().toISOString()                                // 錯誤發生時間
      });
    }
  };
}
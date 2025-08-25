/**
 * @fileoverview 系統指標控制器 - Scheduler Service 性能監控模組
 * 
 * 職責說明：
 * - 負責處理系統指標和監控資料的 API 請求
 * - 提供即時的系統性能指標（CPU、記憶體、磁碟使用率）
 * - 提供任務執行統計和性能分析資料
 * - 作為監控系統與前端儀錶板之間的資料橋樑
 * - 實現統一的指標回應格式和錯誤處理
 * 
 * 功能定位：
 * - 這是一個 **資料展示型** 控制器，專門處理指標資料的查詢請求
 * - **不負責指標收集**，只負責從 MonitoringService 獲取並展示指標資料
 * - 實際的指標收集和計算由 MonitoringService 負責執行
 * 
 * 使用場景：
 * - 系統監控儀錶板需要顯示即時性能指標
 * - 運維人員需要檢查系統健康狀態和資源使用情況
 * - 性能分析工具需要獲取歷史和即時指標資料
 * - 自動化監控系統定期抓取系統狀態
 * 
 * API 端點：
 * - GET /metrics - 獲取完整的系統和任務指標
 * 
 * 回應資料結構：
 * - system: SystemMetrics - 系統層面指標（CPU、記憶體、磁碟、運行時間）
 * - tasks: TaskMetrics - 任務執行指標（總數、成功率、執行時間等）
 * - timestamp: string - 指標採集時間戳記
 * 
 * 依賴服務：
 * - MonitoringService: 提供系統監控和指標收集功能
 * - Logger: 記錄操作日誌和錯誤追蹤
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../container/types';
import { MonitoringService } from '../services/MonitoringService';

/**
 * MetricsController - 系統指標控制器類別
 * 
 * 架構模式：
 * - 使用 InversifyJS 依賴注入實現鬆耦合設計
 * - 遵循控制器-服務層架構模式
 * - 實現統一的錯誤處理和回應格式
 * - 採用並行處理提升指標獲取性能
 * 
 * 設計原則：
 * - 單一職責：專注於指標資料的 HTTP 請求處理
 * - 依賴反轉：透過介面注入依賴服務
 * - 效能優化：使用 Promise.all 並行獲取多種指標
 * - 錯誤隔離：完整的 try-catch 錯誤處理
 * - 安全性：根據環境變數控制錯誤訊息詳細程度
 */
@injectable()
export class class MetricsCtrl {Ctrl {
  /**
   * 建構子 - 依賴注入初始化
   * 
   * @param logger - 日誌服務，用於記錄操作和錯誤
   * @param monitoringService - 監控服務，提供系統和任務指標資料
   * 
   * 注入說明：
   * - TYPES.Logger: 統一的日誌記錄介面
   * - TYPES.MonitoringService: 系統監控和指標收集服務
   */
  constructor(
    @inject(TYPES.Logger) private readonly logger: any,
    @inject(TYPES.MonitoringService) private readonly monitoringService: MonitoringService
  ) {}

  /**
   * 獲取系統指標 API 端點
   * 
   * HTTP 方法: GET
   * 路由路徑: /metrics
   * 回應格式: JSON
   * 
   * 功能描述：
   * 1. 接收前端或監控工具的指標查詢請求
   * 2. 記錄請求資訊（IP、User-Agent）用於審計和分析
   * 3. 並行獲取系統指標和任務指標以提升回應速度
   * 4. 統計指標資料的可用性和回應大小
   * 5. 構建標準化的 JSON 回應格式
   * 6. 處理可能的異常情況並返回適當的錯誤訊息
   * 
   * 並行處理優化：
   * - 使用 Promise.all 同時獲取系統指標和任務指標
   * - 相比串行處理可減少約 50% 的回應時間
   * - 避免因單一指標獲取延遲影響整體性能
   * 
   * 回應資料結構：
   * {
   *   system: {
   *     cpuUsage: number,           // CPU 使用率 (%)
   *     memoryUsage: {              // 記憶體使用情況
   *       used: number,             // 已使用記憶體 (bytes)
   *       total: number,            // 總記憶體 (bytes)
   *       percentage: number        // 使用率 (%)
   *     },
   *     diskUsage: {                // 磁碟使用情況
   *       used: number,             // 已使用空間 (bytes)
   *       total: number,            // 總空間 (bytes)
   *       percentage: number        // 使用率 (%)
   *     },
   *     uptime: number,             // 系統運行時間 (ms)
   *     timestamp: Date             // 指標採集時間
   *   },
   *   tasks: {
   *     totalTasks: number,         // 總任務數
   *     pendingTasks: number,       // 待處理任務數
   *     runningTasks: number,       // 執行中任務數
   *     completedTasks: number,     // 已完成任務數
   *     failedTasks: number,        // 失敗任務數
   *     averageExecutionTime: number, // 平均執行時間 (ms)
   *     tasksPerHour: number,       // 每小時任務處理量
   *     timestamp: Date             // 指標採集時間
   *   },
   *   timestamp: string             // API 回應時間 (ISO 格式)
   * }
   * 
   * @param req - Express 請求物件，包含 HTTP 請求資訊
   * @param res - Express 回應物件，用於返回 HTTP 回應
   */
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      // ================================
      // 步驟 1: 請求審計和日誌記錄
      // ================================
      // 記錄每個指標查詢請求的詳細資訊
      // 用於安全審計、流量分析和故障排除
      this.logger.debug('收到系統指標請求', {
        ip: req.ip,                      // 客戶端 IP 地址
        userAgent: req.get('User-Agent') // 客戶端瀏覽器/應用程式資訊
      });

      // ================================
      // 步驟 2: 並行獲取指標資料
      // ================================
      // 使用 Promise.all 並行獲取系統指標和任務指標
      // 效能優化：相比串行處理可減少約 50% 的回應時間
      // 
      // MonitoringService.getSystemMetrics() 提供：
      // - CPU 使用率、記憶體使用情況、磁碟使用情況
      // - 系統運行時間、指標採集時間戳記
      // 
      // MonitoringService.getTaskMetrics() 提供：
      // - 任務數量統計、執行狀態分布、性能指標
      // - 平均執行時間、每小時處理量等
      const [systemMetrics, taskMetrics] = await Promise.all([
        this.monitoringService.getSystemMetrics(),
        this.monitoringService.getTaskMetrics()
      ]);

      // ================================
      // 步驟 3: 構建標準化回應資料
      // ================================
      // 建立統一的 API 回應格式，確保前端能夠一致地處理資料
      const metricsResponse = {
        system: systemMetrics,                      // 系統層面的指標（保證為物件或 null）
        tasks: taskMetrics,                         // 任務執行相關指標（保證為物件或 null）
        timestamp: new Date().toISOString()         // ISO 格式的回應時間戳記
      };

      // ================================
      // 步驟 4: 記錄指標獲取統計資訊
      // ================================
      // 記錄指標獲取的統計資訊，便於監控 API 使用情況和性能
      this.logger.info('系統指標獲取成功', {
        systemMetricsAvailable: !!systemMetrics,                           // 系統指標是否可用
        taskMetricsAvailable: !!taskMetrics,                               // 任務指標是否可用
        responseSize: JSON.stringify(metricsResponse).length                // 回應資料大小（字元數）
      });

      // ================================
      // 步驟 5: 返回成功回應
      // ================================
      // 以 JSON 格式返回指標資料給前端或監控工具
      res.json(metricsResponse);

    } catch (error) {
      // ================================
      // 錯誤處理：系統異常和故障恢復
      // ================================
      
      // 記錄詳細的錯誤資訊用於故障排除
      // 包含錯誤訊息和堆疊追蹤以便開發者調試
      this.logger.error('獲取系統指標失敗', {
        error: error instanceof Error ? error.message : String(error),     // 錯誤訊息
        stack: error instanceof Error ? error.stack : undefined            // 錯誤堆疊追蹤
      });

      // 返回適當的 HTTP 500 錯誤回應
      // 根據環境變數決定錯誤訊息的詳細程度，保護生產環境安全
      res.status(500).json({
        error: 'Failed to retrieve metrics',                               // 通用錯誤標識
        message: process.env.NODE_ENV === 'production' 
          ? 'Metrics temporarily unavailable'                              // 生產環境：簡化錯誤訊息
          : (error instanceof Error ? error.message : String(error)),      // 開發環境：詳細錯誤訊息
        timestamp: new Date().toISOString()                                // 錯誤發生時間
      });
    }
  };
}
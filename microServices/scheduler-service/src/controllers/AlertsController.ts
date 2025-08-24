/**
 * @fileoverview 警報控制器 - Scheduler Service 警報管理模組
 * 
 * 職責說明：
 * - 負責接收和處理系統警報查詢的 API 請求（不是發送通知）
 * - 提供活躍警報的讀取和展示功能
 * - 作為前端與監控服務之間的查詢橋樑
 * - 實現統一的警報回應格式和錯誤處理
 * 
 * 功能定位：
 * - 這是一個 **讀取型** 控制器，專門處理警報資料的查詢請求
 * - **不負責發送通知**，只負責提供警報資料給前端顯示
 * - 實際的警報生成由 MonitoringService 負責（**已整合 NotificationService 實現完整通知功能**）
 * 
 * 使用場景：
 * - 系統儀錶板需要顯示當前活躍警報
 * - 管理員需要監控系統健康狀態
 * - 自動化警報處理和通知系統
 * 
 * API 端點：
 * - GET /alerts - 獲取所有活躍警報清單
 * 
 * 依賴服務：
 * - MonitoringService: 提供警報監控和管理功能
 * - Logger: 記錄操作日誌和錯誤追蹤
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../container/types';
import { MonitoringService } from '../services/MonitoringService';

/**
 * AlertsController - 警報控制器類別
 * 
 * 架構模式：
 * - 使用 InversifyJS 依賴注入實現鬆耦合設計
 * - 遵循控制器-服務層架構模式
 * - 實現統一的錯誤處理和回應格式
 * 
 * 設計原則：
 * - 單一職責：專注於警報相關的 HTTP 請求處理
 * - 依賴反轉：透過介面注入依賴服務
 * - 錯誤隔離：完整的 try-catch 錯誤處理
 */
@injectable()
export class AlertsController {
  /**
   * 建構子 - 依賴注入初始化
   * 
   * @param logger - 日誌服務，用於記錄操作和錯誤
   * @param monitoringService - 監控服務，提供警報資料和管理功能
   * 
   * 注入說明：
   * - TYPES.Logger: 統一的日誌記錄介面
   * - TYPES.MonitoringService: 警報監控和管理服務
   */
  constructor(
    @inject(TYPES.Logger) private readonly logger: any,
    @inject(TYPES.MonitoringService) private readonly monitoringService: MonitoringService
  ) {}

  /**
   * 獲取活躍警報列表 API 端點
   * 
   * HTTP 方法: GET
   * 路由路徑: /alerts
   * 回應格式: JSON
   * 
   * 功能描述：
   * 1. 接收前端的警報查詢請求
   * 2. 記錄請求資訊（IP、User-Agent）用於審計
   * 3. 調用監控服務獲取當前活躍的警報清單
   * 4. 統計警報數量並判斷系統狀態
   * 5. 構建標準化的 JSON 回應格式
   * 6. 處理可能的異常情況並返回適當的錯誤訊息
   * 
   * 回應資料結構：
   * - alerts: Alert[] - 活躍警報陣列
   * - alertCount: number - 警報總數
   * - timestamp: string - 查詢時間戳記
   * - status: 'alerts_active' | 'no_alerts' - 系統警報狀態
   * 
   * @param req - Express 請求物件，包含 HTTP 請求資訊
   * @param res - Express 回應物件，用於返回 HTTP 回應
   */
  getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      // ================================
      // 步驟 1: 請求審計和日誌記錄
      // ================================
      // 記錄每個警報查詢請求的詳細資訊
      // 用於安全審計、流量監控和故障排除
      this.logger.debug('收到活躍警報查詢請求', {
        ip: req.ip,                      // 客戶端 IP 地址
        userAgent: req.get('User-Agent') // 客戶端瀏覽器/應用程式資訊
      });

      // ================================
      // 步驟 2: 查詢活躍警報資料
      // ================================
      // 調用監控服務獲取當前系統中所有活躍的警報
      // MonitoringService 負責：
      // - 從各種監控源收集警報資料
      // - 過濾和分類不同嚴重程度的警報
      // - 提供統一的警報資料格式
      const activeAlerts = this.monitoringService.getActiveAlerts();

      // ================================
      // 步驟 3: 記錄查詢結果統計
      // ================================
      // 記錄警報查詢的統計資訊，便於監控系統使用情況
      this.logger.info('活躍警報查詢完成', {
        alertCount: activeAlerts ? activeAlerts.length : 0,                    // 警報總數
        hasAlerts: activeAlerts && activeAlerts.length > 0                     // 是否存在警報
      });

      // ================================
      // 步驟 4: 構建標準化回應資料
      // ================================
      // 建立統一的 API 回應格式，確保前端能夠一致地處理資料
      const alertsResponse = {
        alerts: activeAlerts || [],                                            // 警報清單（保證為陣列）
        alertCount: activeAlerts ? activeAlerts.length : 0,                    // 警報計數
        timestamp: new Date().toISOString(),                                   // ISO 格式的時間戳記
        status: activeAlerts && activeAlerts.length > 0 ? 'alerts_active' : 'no_alerts'  // 系統狀態指示
      };

      // ================================
      // 步驟 5: 返回成功回應
      // ================================
      // 以 JSON 格式返回警報資料給前端
      res.json(alertsResponse);

    } catch (error) {
      // ================================
      // 錯誤處理：系統異常和故障恢復
      // ================================
      
      // 記錄詳細的錯誤資訊用於故障排除
      // 包含錯誤訊息和堆疊追蹤以便開發者調試
      this.logger.error('獲取活躍警報失敗', {
        error: error instanceof Error ? error.message : String(error),        // 錯誤訊息
        stack: error instanceof Error ? error.stack : undefined               // 錯誤堆疊追蹤
      });

      // 返回適當的 HTTP 500 錯誤回應
      // 根據環境變數決定錯誤訊息的詳細程度
      res.status(500).json({
        error: 'Failed to retrieve alerts',                                   // 通用錯誤標識
        message: process.env.NODE_ENV === 'production' 
          ? 'Alert system temporarily unavailable'                            // 生產環境：簡化錯誤訊息
          : (error instanceof Error ? error.message : String(error)),         // 開發環境：詳細錯誤訊息
        alerts: [],                                                           // 空警報清單
        alertCount: 0,                                                        // 零警報計數
        timestamp: new Date().toISOString()                                   // 錯誤發生時間
      });
    }
  };
}
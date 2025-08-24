/**
 * @fileoverview 無人機即時狀態查詢控制器介面
 * 
 * 定義無人機即時狀態相關的查詢操作介面，包含所有讀取操作和查詢邏輯
 * 
 * @author AIOT Team  
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Request, Response } from 'express';

/**
 * 無人機即時狀態查詢控制器介面
 * 
 * 提供所有無人機即時狀態相關的查詢端點方法定義
 */
export interface IDroneRealTimeStatusQueries {
    /**
     * 獲取單個無人機即時狀態
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    getDroneRealTimeStatus: (req: Request, res: Response) => Promise<void>;

    /**
     * 獲取所有無人機即時狀態（支持分頁和過濾）
     * 
     * @param req Express 請求對象，支持查詢參數：
     *   - page: 頁碼（預設：1）
     *   - pageSize: 每頁數量（預設：10，最大：100）
     *   - droneId: 無人機 ID 過濾
     *   - status: 狀態過濾
     *   - sortBy: 排序字段（預設：timestamp）
     *   - sortOrder: 排序方向（asc/desc，預設：desc）
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    getAllDroneRealTimeStatuses: (req: Request, res: Response) => Promise<void>;

    /**
     * 根據無人機 ID 獲取即時狀態
     * 
     * @param req Express 請求對象，包含路由參數 droneId
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    getDroneRealTimeStatusByDroneId: (req: Request, res: Response) => Promise<void>;

    /**
     * 獲取多個無人機的即時狀態
     * 
     * @param req Express 請求對象，包含請求體：
     *   - droneIds: 無人機 ID 陣列
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    getBatchDroneRealTimeStatuses: (req: Request, res: Response) => Promise<void>;

    /**
     * 搜索無人機即時狀態
     * 
     * @param req Express 請求對象，支持查詢參數：
     *   - keyword: 搜索關鍵字
     *   - page: 頁碼（預設：1）
     *   - pageSize: 每頁數量（預設：10）
     *   - filters: 過濾條件
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    searchDroneRealTimeStatuses: (req: Request, res: Response) => Promise<void>;

    /**
     * 獲取無人機即時狀態統計資訊
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象，返回統計資訊包含：
     *   - totalCount: 總數量
     *   - statusDistribution: 狀態分佈
     *   - batteryStatistics: 電池統計
     *   - connectionStatistics: 連線統計
     * @returns Promise<void>
     */
    getDroneRealTimeStatusStatistics: (req: Request, res: Response) => Promise<void>;

    /**
     * 獲取儀表板摘要資訊
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象，返回儀表板資訊包含：
     *   - activeCount: 活躍無人機數量
     *   - offlineCount: 離線無人機數量
     *   - lowBatteryCount: 低電量無人機數量
     *   - criticalCount: 嚴重狀況無人機數量
     * @returns Promise<void>
     */
    getDashboardSummary: (req: Request, res: Response) => Promise<void>;

    /**
     * 獲取電池統計資訊
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象，返回電池統計包含：
     *   - averageBatteryLevel: 平均電池電量
     *   - lowBatteryCount: 低電量無人機數量
     *   - criticalBatteryCount: 嚴重低電量無人機數量
     *   - batteryDistribution: 電池電量分佈
     * @returns Promise<void>
     */
    getBatteryStatistics: (req: Request, res: Response) => Promise<void>;

    /**
     * 檢查無人機即時狀態服務健康狀態
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    checkHealth: (req: Request, res: Response) => Promise<void>;

    /**
     * 驗證無人機即時狀態資料完整性
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象
     * @returns Promise<void>
     */
    validateDataIntegrity: (req: Request, res: Response) => Promise<void>;
}
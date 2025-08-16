/**
 * @fileoverview 無人機即時狀態查詢服務介面
 * 
 * 定義 WebSocket 實時通信所需的查詢服務契約
 * 遵循依賴反轉原則，interface 定義契約，class 實現細節
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import type { DroneRealTimeStatusAttributes } from '@/models/DroneRealTimeStatusModel.js';

/**
 * 無人機即時狀態查詢服務介面
 * 
 * 定義 WebSocket 實時通信所需的核心查詢功能契約
 */
export interface IDroneRealTimeStatusQueriesSvc {
    /**
     * 根據無人機 ID 獲取即時狀態
     * @param droneId 無人機 ID
     * @returns 即時狀態或 null
     */
    getRealTimeStatusByDroneId(droneId: number): Promise<DroneRealTimeStatusAttributes | null>;

    /**
     * 獲取所有在線無人機狀態
     * @returns 在線無人機狀態列表
     */
    getOnlineDroneStatuses(): Promise<DroneRealTimeStatusAttributes[]>;

    /**
     * 獲取無人機健康狀態摘要
     * @param droneId 無人機 ID
     * @returns 健康狀態摘要或 null
     */
    getDroneHealthSummary(droneId: number): Promise<{
        droneId: number;
        isOnline: boolean;
        batteryLevel: number;
        signalStrength: number;
        lastUpdate: string;
        healthStatus: 'healthy' | 'warning' | 'critical' | 'offline';
    } | null>;
}
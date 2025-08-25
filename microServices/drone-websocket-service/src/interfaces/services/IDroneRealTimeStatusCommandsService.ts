/**
 * @fileoverview 無人機即時狀態命令服務介面
 * 
 * 定義 WebSocket 實時通信所需的命令服務契約
 * 遵循依賴反轉原則，interface 定義契約，class 實現細節
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import type { 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes 
} from '@/models/DroneRealTimeStatusModel.js';

/**
 * 無人機即時狀態命令服務介面
 * 
 * 定義 WebSocket 實時通信所需的核心命令功能契約
 */
export interface IDroneRealTimeStatusCommandsService {
    /**
     * 根據無人機 ID 更新即時狀態 (WebSocket 專用)
     * @param droneId 無人機 ID
     * @param updates 更新數據
     * @returns 更新後的狀態或 null
     */
    updateRealTimeStatusByDroneId(
        droneId: number, 
        updates: Partial<DroneRealTimeStatusCreationAttributes>
    ): Promise<DroneRealTimeStatusAttributes | null>;
}
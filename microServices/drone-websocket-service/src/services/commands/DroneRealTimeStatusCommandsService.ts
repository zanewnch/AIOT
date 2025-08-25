/**
 * @fileoverview WebSocket 專用無人機即時狀態命令服務
 * 
 * 簡化版服務，只提供 WebSocket 實時通信所需的更新功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { DroneRealTimeStatusCommandsRepositorysitorysitory } from '@/repo';
import { TYPES } from '@/container';
import type { 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes
} from '@/models/DroneRealTimeStatusModel.js';
import type { IDroneRealTimeStatusCommandsService } from '@/interfaces/services';

/**
 * WebSocket 專用無人機即時狀態命令服務類別
 * 
 * 實現 IDroneRealTimeStatusCommandsService 介面
 * 只提供 WebSocket 實時通信所需的核心更新功能
 */
@injectable()
export class DroneRealTimeStatusCommandsService implements IDroneRealTimeStatusCommandsService {
    constructor(
        @inject(TYPES.DroneRealTimeStatusCommandsRepositorysitorysitory) 
        private readonly repository: DroneRealTimeStatusCommandsRepositorysitorysitory
    ) {}

    /**
     * 根據無人機 ID 更新即時狀態 (WebSocket 專用)
     */
    updateRealTimeStatusByDroneId = async (droneId: number, updates: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusAttributes | null> => {
        if (!droneId || droneId <= 0) {
            throw new Error('無效的無人機 ID');
        }

        // 基本資料驗證
        this.validateStatusUpdates(updates);

        const result = await this.repository.updateRealTimeStatusByDroneId(droneId, updates);
        return result;
    }

    /**
     * 驗證狀態更新資料
     */
    private validateStatusUpdates = (updates: Partial<DroneRealTimeStatusCreationAttributes>): void => {
        if (updates.current_battery_level !== undefined) {
            if (updates.current_battery_level < 0 || updates.current_battery_level > 100) {
                throw new Error('電池電量必須在 0-100 之間');
            }
        }

        if (updates.signal_strength !== undefined && updates.signal_strength !== null) {
            if (updates.signal_strength < 0 || updates.signal_strength > 100) {
                throw new Error('信號強度必須在 0-100 之間');
            }
        }

        if (updates.current_altitude !== undefined && updates.current_altitude !== null) {
            if (updates.current_altitude < -1000 || updates.current_altitude > 10000) {
                throw new Error('高度必須在合理範圍內 (-1000 到 10000 公尺)');
            }
        }

        if (updates.current_speed !== undefined && updates.current_speed !== null) {
            if (updates.current_speed < 0 || updates.current_speed > 200) {
                throw new Error('速度必須在 0-200 km/h 之間');
            }
        }
    }
}
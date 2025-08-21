/**
 * @fileoverview WebSocket 專用無人機即時狀態查詢服務
 * 
 * 簡化版服務，只提供 WebSocket 實時通信所需的查詢功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { DroneRealTimeStatusQueriesRepo } from '@/repo';
import { TYPES } from '@/container';
import type { DroneRealTimeStatusAttributes } from '@/models/DroneRealTimeStatusModel.js';
import { DroneRealTimeStatus } from '@/models/DroneRealTimeStatusModel.js';
import type { IDroneRealTimeStatusQueriesSvc } from '@/interfaces/services';

/**
 * WebSocket 專用無人機即時狀態查詢服務類別
 * 
 * 實現 IDroneRealTimeStatusQueriesSvc 介面
 * 只提供 WebSocket 實時通信所需的核心查詢功能
 */
@injectable()
export class DroneRealTimeStatusQueriesSvc implements IDroneRealTimeStatusQueriesSvc {
    constructor(
        @inject(TYPES.DroneRealTimeStatusQueriesRepo) 
        private readonly repository: DroneRealTimeStatusQueriesRepo
    ) {}

    /**
     * 根據無人機 ID 獲取即時狀態
     */
    getRealTimeStatusByDroneId = async (droneId: number): Promise<DroneRealTimeStatusAttributes | null> => {
        if (!droneId || droneId <= 0) {
            throw new Error('無效的無人機 ID');
        }

        return await this.repository.getRealTimeStatusByDroneId(droneId);
    }

    /**
     * 獲取所有在線無人機狀態
     */
    getOnlineDroneStatuses = async (): Promise<DroneRealTimeStatusAttributes[]> => {
        return await this.repository.getOnlineDroneStatuses();
    }

    /**
     * 獲取無人機健康狀態摘要
     */
    getDroneHealthSummary = async (droneId: number): Promise<{
        droneId: number;
        isOnline: boolean;
        batteryLevel: number;
        signalStrength: number;
        lastUpdate: string;
        healthStatus: 'healthy' | 'warning' | 'critical' | 'offline';
    } | null> => {
        if (!droneId || droneId <= 0) {
            throw new Error('無效的無人機 ID');
        }

        const status = await this.repository.getRealTimeStatusByDroneId(droneId);
        
        if (!status) {
            return null;
        }

        let healthStatus: 'healthy' | 'warning' | 'critical' | 'offline';
        
        if (status.current_status === DroneRealTimeStatus.OFFLINE || status.current_status === DroneRealTimeStatus.ERROR) {
            healthStatus = 'offline';
        } else if (status.current_battery_level <= 10) {
            healthStatus = 'critical';
        } else if (status.current_battery_level <= 20 || (status.signal_strength !== null && status.signal_strength < 50)) {
            healthStatus = 'warning';
        } else {
            healthStatus = 'healthy';
        }

        return {
            droneId: status.drone_id,
            isOnline: status.current_status !== DroneRealTimeStatus.OFFLINE,
            batteryLevel: status.current_battery_level,
            signalStrength: status.signal_strength || 0,
            lastUpdate: status.updatedAt.toISOString(),
            healthStatus
        };
    }
}
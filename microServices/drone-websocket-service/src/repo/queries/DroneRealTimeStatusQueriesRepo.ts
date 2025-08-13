/**
 * @fileoverview 無人機即時狀態查詢資料存取層
 * 
 * 處理無人機即時狀態的查詢操作，包含資料庫查詢和快取管理。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneRealTimeStatusModel } from '@/models/DroneRealTimeStatusModel.js';
import type { DroneRealTimeStatusAttributes } from '@/models/DroneRealTimeStatusModel.js';

/**
 * 無人機即時狀態查詢資料存取庫
 * 
 * 提供無人機即時狀態的各種查詢功能
 */
@injectable()
export class DroneRealTimeStatusQueriesRepository {
    
    /**
     * 獲取所有無人機的即時狀態
     */
    getAllRealTimeStatuses = async (limit: number = 100): Promise<DroneRealTimeStatusAttributes[]> => {
        return await DroneRealTimeStatusModel.findAll({
            limit,
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * 根據 ID 獲取無人機即時狀態
     */
    getRealTimeStatusById = async (id: number): Promise<DroneRealTimeStatusAttributes | null> => {
        return await DroneRealTimeStatusModel.findByPk(id);
    }

    /**
     * 根據無人機 ID 獲取即時狀態
     */
    getRealTimeStatusByDroneId = async (droneId: number): Promise<DroneRealTimeStatusAttributes | null> => {
        return await DroneRealTimeStatusModel.findOne({
            where: { drone_id: droneId },
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * 獲取所有在線無人機的即時狀態
     */
    getOnlineDroneStatuses = async (): Promise<DroneRealTimeStatusAttributes[]> => {
        return await DroneRealTimeStatusModel.findAll({
            where: {
                current_status: 'online'
            },
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * 獲取低電量的無人機
     */
    getLowBatteryDrones = async (threshold: number = 20): Promise<DroneRealTimeStatusAttributes[]> => {
        return await DroneRealTimeStatusModel.findAll({
            where: {
                current_battery_level: {
                    [Symbol.for('sequelize.lte')]: threshold
                }
            },
            order: [['current_battery_level', 'ASC']]
        });
    }

    /**
     * 獲取即時狀態統計資料
     */
    getRealTimeStatusStatistics = async (): Promise<any> => {
        const [totalStatuses] = await DroneRealTimeStatusModel.findAll({
            attributes: [
                [DroneRealTimeStatusModel.sequelize!.fn('COUNT', '*'), 'total'],
                [DroneRealTimeStatusModel.sequelize!.fn('AVG', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'avgBattery'],
                [DroneRealTimeStatusModel.sequelize!.fn('AVG', DroneRealTimeStatusModel.sequelize!.col('current_signal_strength')), 'avgSignal']
            ],
            raw: true
        }) as any[];

        return {
            totalStatuses: totalStatuses.total || 0,
            averageBatteryLevel: totalStatuses.avgBattery || 0,
            averageSignalStrength: totalStatuses.avgSignal || 0
        };
    }
}
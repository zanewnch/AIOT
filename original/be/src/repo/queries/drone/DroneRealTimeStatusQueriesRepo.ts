/**
 * @fileoverview 無人機即時狀態查詢 Repository - CQRS 查詢端
 *
 * 專門處理無人機即時狀態資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatusAttributes,
    DroneRealTimeStatus
} from '../../../models/drone/DroneRealTimeStatusModel.js';
import { DroneStatusModel } from '../../../models/drone/DroneStatusModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';

/**
 * 無人機即時狀態查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機即時狀態資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneRealTimeStatusQueriesRepository
 */
@injectable()
export class DroneRealTimeStatusQueriesRepository {
    private readonly logger = createLogger('DroneRealTimeStatusQueriesRepository');

    /**
     * 根據 ID 查詢即時狀態記錄
     * 
     * @param id - 記錄 ID
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async findById(id: number): Promise<DroneRealTimeStatusModel | null> {
        try {
            this.logger.info('Finding real-time status by ID', { id });
            const status = await DroneRealTimeStatusModel.findByPk(id, {
                include: [DroneStatusModel]
            });

            if (status) {
                this.logger.info('Real-time status found', { id });
            } else {
                this.logger.warn('Real-time status not found', { id });
            }

            return status;
        } catch (error) {
            this.logger.error('Error finding real-time status by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢即時狀態記錄
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async findByDroneId(droneId: number): Promise<DroneRealTimeStatusModel | null> {
        try {
            this.logger.info('Finding real-time status by drone ID', { droneId });
            const status = await DroneRealTimeStatusModel.findOne({
                where: { drone_id: droneId },
                include: [DroneStatusModel]
            });

            if (status) {
                this.logger.info('Real-time status found for drone', { droneId });
            } else {
                this.logger.warn('Real-time status not found for drone', { droneId });
            }

            return status;
        } catch (error) {
            this.logger.error('Error finding real-time status by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 查詢所有即時狀態記錄
     * 
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findAll(): Promise<DroneRealTimeStatusModel[]> {
        try {
            this.logger.info('Finding all real-time status records');
            const statuses = await DroneRealTimeStatusModel.findAll({
                include: [DroneStatusModel],
                order: [['updatedAt', 'DESC']]
            });

            this.logger.info(`Found ${statuses.length} real-time status records`);
            return statuses;
        } catch (error) {
            this.logger.error('Error finding all real-time status records', { error });
            throw error;
        }
    }

    /**
     * 根據狀態查詢即時狀態記錄
     * 
     * @param status - 即時狀態
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findByStatus(status: DroneRealTimeStatus): Promise<DroneRealTimeStatusModel[]> {
        try {
            this.logger.info('Finding real-time status records by status', { status });
            const statuses = await DroneRealTimeStatusModel.findAll({
                where: { current_status: status },
                include: [DroneStatusModel],
                order: [['updatedAt', 'DESC']]
            });

            this.logger.info(`Found ${statuses.length} real-time status records with status ${status}`);
            return statuses;
        } catch (error) {
            this.logger.error('Error finding real-time status records by status', { status, error });
            throw error;
        }
    }

    /**
     * 查詢所有在線的無人機
     * 
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findOnlineDrones(): Promise<DroneRealTimeStatusModel[]> {
        try {
            this.logger.info('Finding online drones');
            const statuses = await DroneRealTimeStatusModel.findAll({
                where: { is_connected: true },
                include: [DroneStatusModel],
                order: [['updatedAt', 'DESC']]
            });

            this.logger.info(`Found ${statuses.length} online drones`);
            return statuses;
        } catch (error) {
            this.logger.error('Error finding online drones', { error });
            throw error;
        }
    }

    /**
     * 查詢離線的無人機
     * 
     * @param thresholdMinutes - 離線判定時間閾值（分鐘），預設 5 分鐘
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findOfflineDrones(thresholdMinutes: number = 5): Promise<DroneRealTimeStatusModel[]> {
        try {
            this.logger.info('Finding offline drones', { thresholdMinutes });
            const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);
            
            const statuses = await DroneRealTimeStatusModel.findAll({
                where: {
                    [Op.or]: [
                        { is_connected: false },
                        { last_seen: { [Op.lt]: thresholdTime } }
                    ]
                },
                include: [DroneStatusModel],
                order: [['last_seen', 'DESC']]
            });

            this.logger.info(`Found ${statuses.length} offline drones`);
            return statuses;
        } catch (error) {
            this.logger.error('Error finding offline drones', { thresholdMinutes, error });
            throw error;
        }
    }

    /**
     * 獲取電池統計資訊
     * 
     * @returns Promise<any>
     */
    async getBatteryStatistics(): Promise<any> {
        try {
            this.logger.info('Getting battery statistics');
            const stats = await DroneRealTimeStatusModel.findAll({
                attributes: [
                    [DroneRealTimeStatusModel.sequelize!.fn('AVG', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'avg_battery'],
                    [DroneRealTimeStatusModel.sequelize!.fn('MIN', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'min_battery'],
                    [DroneRealTimeStatusModel.sequelize!.fn('MAX', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'max_battery'],
                    [DroneRealTimeStatusModel.sequelize!.fn('COUNT', DroneRealTimeStatusModel.sequelize!.col('id')), 'total_count']
                ],
                raw: true
            });

            this.logger.info('Battery statistics retrieved');
            return stats[0];
        } catch (error) {
            this.logger.error('Error getting battery statistics', { error });
            throw error;
        }
    }

    /**
     * 獲取狀態統計資訊
     * 
     * @returns Promise<any>
     */
    async getStatusStatistics(): Promise<any> {
        try {
            this.logger.info('Getting status statistics');
            const stats = await DroneRealTimeStatusModel.findAll({
                attributes: [
                    'current_status',
                    [DroneRealTimeStatusModel.sequelize!.fn('COUNT', DroneRealTimeStatusModel.sequelize!.col('id')), 'count']
                ],
                group: ['current_status'],
                raw: true
            });

            this.logger.info(`Status statistics retrieved with ${stats.length} status types`);
            return stats;
        } catch (error) {
            this.logger.error('Error getting status statistics', { error });
            throw error;
        }
    }

    /**
     * 檢查無人機是否在線
     * 
     * @param droneId - 無人機 ID
     * @param thresholdMinutes - 線上判定時間閾值（分鐘），預設 5 分鐘
     * @returns Promise<boolean>
     */
    async isDroneOnline(droneId: number, thresholdMinutes: number = 5): Promise<boolean> {
        try {
            this.logger.debug('Checking if drone is online', { droneId, thresholdMinutes });
            const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);
            
            const status = await DroneRealTimeStatusModel.findOne({
                where: { 
                    drone_id: droneId,
                    is_connected: true,
                    last_seen: { [Op.gte]: thresholdTime }
                }
            });

            const isOnline = status !== null;
            this.logger.debug(`Drone ${droneId} is ${isOnline ? 'online' : 'offline'}`);
            return isOnline;
        } catch (error) {
            this.logger.error('Error checking if drone is online', { droneId, thresholdMinutes, error });
            throw error;
        }
    }

    /**
     * 統計連線的無人機數量
     * 
     * @returns Promise<number>
     */
    async countConnectedDrones(): Promise<number> {
        try {
            this.logger.info('Counting connected drones');
            const count = await DroneRealTimeStatusModel.count({
                where: { is_connected: true }
            });

            this.logger.info(`Connected drones count: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting connected drones', { error });
            throw error;
        }
    }

    /**
     * 統計總的即時狀態記錄數
     * 
     * @returns Promise<number>
     */
    async count(): Promise<number> {
        try {
            this.logger.info('Counting total real-time status records');
            const count = await DroneRealTimeStatusModel.count();

            this.logger.info(`Total real-time status records: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting total real-time status records', { error });
            throw error;
        }
    }
}
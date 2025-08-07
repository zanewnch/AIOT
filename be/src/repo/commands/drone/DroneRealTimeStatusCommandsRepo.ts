/**
 * @fileoverview 無人機即時狀態命令 Repository - CQRS 命令端
 *
 * 專門處理無人機即時狀態資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
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
    DroneRealTimeStatusCreationAttributes
} from '../../../models/drone/DroneRealTimeStatusModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';

/**
 * 無人機即時狀態命令 Repository 實現類別 - CQRS 命令端
 *
 * 專門處理無人機即時狀態資料的寫入操作，遵循 CQRS 模式
 *
 * @class DroneRealTimeStatusCommandsRepository
 */
@injectable()
export class DroneRealTimeStatusCommandsRepository {
    private readonly logger = createLogger('DroneRealTimeStatusCommandsRepository');

    /**
     * 創建新的無人機即時狀態記錄
     * 
     * @param data - 即時狀態資料
     * @returns Promise<DroneRealTimeStatusModel>
     */
    async create(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> {
        try {
            this.logger.info('Creating new real-time status record', { droneId: data.drone_id });
            const status = await DroneRealTimeStatusModel.create(data);

            this.logger.info('Real-time status record created successfully', { id: status.id, droneId: data.drone_id });
            return status;
        } catch (error) {
            this.logger.error('Error creating real-time status record', { data, error });
            throw error;
        }
    }

    /**
     * 根據 ID 更新即時狀態記錄
     * 
     * @param id - 記錄 ID
     * @param data - 更新資料
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async updateById(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel | null> {
        try {
            this.logger.info('Updating real-time status by ID', { id, data });
            
            const [affectedCount] = await DroneRealTimeStatusModel.update(data, {
                where: { id }
            });

            if (affectedCount > 0) {
                const updatedStatus = await DroneRealTimeStatusModel.findByPk(id);
                if (updatedStatus) {
                    this.logger.info('Real-time status updated successfully', { id });
                    return updatedStatus;
                }
            }
            
            this.logger.warn('Real-time status not found for update', { id });
            return null;
        } catch (error) {
            this.logger.error('Error updating real-time status by ID', { id, data, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 更新即時狀態記錄
     * 
     * @param droneId - 無人機 ID
     * @param data - 更新資料
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async updateByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel | null> {
        try {
            this.logger.info('Updating real-time status by drone ID', { droneId, data });
            
            const [affectedCount] = await DroneRealTimeStatusModel.update(data, {
                where: { drone_id: droneId }
            });

            if (affectedCount > 0) {
                const updatedStatus = await DroneRealTimeStatusModel.findOne({
                    where: { drone_id: droneId }
                });
                if (updatedStatus) {
                    this.logger.info('Real-time status updated successfully for drone', { droneId });
                    return updatedStatus;
                }
            }
            
            this.logger.warn('Real-time status not found for drone update', { droneId });
            return null;
        } catch (error) {
            this.logger.error('Error updating real-time status by drone ID', { droneId, data, error });
            throw error;
        }
    }

    /**
     * 根據 ID 刪除即時狀態記錄
     * 
     * @param id - 記錄 ID
     * @returns Promise<boolean>
     */
    async deleteById(id: number): Promise<boolean> {
        try {
            this.logger.info('Deleting real-time status by ID', { id });
            
            const affectedCount = await DroneRealTimeStatusModel.destroy({
                where: { id }
            });

            const success = affectedCount > 0;
            if (success) {
                this.logger.info('Real-time status deleted successfully', { id });
            } else {
                this.logger.warn('Real-time status not found for deletion', { id });
            }

            return success;
        } catch (error) {
            this.logger.error('Error deleting real-time status by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<boolean>
     */
    async deleteByDroneId(droneId: number): Promise<boolean> {
        try {
            this.logger.info('Deleting real-time status by drone ID', { droneId });
            
            const affectedCount = await DroneRealTimeStatusModel.destroy({
                where: { drone_id: droneId }
            });

            const success = affectedCount > 0;
            if (success) {
                this.logger.info('Real-time status deleted successfully for drone', { droneId });
            } else {
                this.logger.warn('Real-time status not found for drone deletion', { droneId });
            }

            return success;
        } catch (error) {
            this.logger.error('Error deleting real-time status by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 進行 Upsert 操作（更新或插入）
     * 
     * @param droneId - 無人機 ID
     * @param data - 即時狀態資料
     * @returns Promise<DroneRealTimeStatusModel>
     */
    async upsertByDroneId(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> {
        try {
            this.logger.info('Upserting real-time status for drone', { droneId });
            
            const existingRecord = await DroneRealTimeStatusModel.findOne({
                where: { drone_id: droneId }
            });
            
            if (existingRecord) {
                // 更新現有記錄
                await DroneRealTimeStatusModel.update(data, {
                    where: { drone_id: droneId }
                });
                const updatedRecord = await DroneRealTimeStatusModel.findOne({
                    where: { drone_id: droneId }
                });
                this.logger.info('Real-time status updated for drone', { droneId });
                return updatedRecord as DroneRealTimeStatusModel;
            } else {
                // 創建新記錄
                const newRecord = await DroneRealTimeStatusModel.create({ ...data, drone_id: droneId });
                this.logger.info('Real-time status created for drone', { droneId });
                return newRecord;
            }
        } catch (error) {
            this.logger.error('Error upserting real-time status for drone', { droneId, data, error });
            throw error;
        }
    }

    /**
     * 更新最後連線時間
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<boolean>
     */
    async updateLastSeen(droneId: number): Promise<boolean> {
        try {
            this.logger.debug('Updating last seen time for drone', { droneId });
            
            const [affectedCount] = await DroneRealTimeStatusModel.update({
                last_seen: new Date(),
                is_connected: true
            }, {
                where: { drone_id: droneId }
            });

            const success = affectedCount > 0;
            if (success) {
                this.logger.debug('Last seen time updated for drone', { droneId });
            } else {
                this.logger.warn('Real-time status not found for last seen update', { droneId });
            }

            return success;
        } catch (error) {
            this.logger.error('Error updating last seen time for drone', { droneId, error });
            throw error;
        }
    }

    /**
     * 標記無人機為離線狀態
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<boolean>
     */
    async markAsOffline(droneId: number): Promise<boolean> {
        try {
            this.logger.info('Marking drone as offline', { droneId });
            
            const [affectedCount] = await DroneRealTimeStatusModel.update({
                is_connected: false,
                last_seen: new Date()
            }, {
                where: { drone_id: droneId }
            });

            const success = affectedCount > 0;
            if (success) {
                this.logger.info('Drone marked as offline', { droneId });
            } else {
                this.logger.warn('Real-time status not found to mark as offline', { droneId });
            }

            return success;
        } catch (error) {
            this.logger.error('Error marking drone as offline', { droneId, error });
            throw error;
        }
    }

    /**
     * 標記無人機為在線狀態
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<boolean>
     */
    async markAsOnline(droneId: number): Promise<boolean> {
        try {
            this.logger.info('Marking drone as online', { droneId });
            
            const [affectedCount] = await DroneRealTimeStatusModel.update({
                is_connected: true,
                last_seen: new Date()
            }, {
                where: { drone_id: droneId }
            });

            const success = affectedCount > 0;
            if (success) {
                this.logger.info('Drone marked as online', { droneId });
            } else {
                this.logger.warn('Real-time status not found to mark as online', { droneId });
            }

            return success;
        } catch (error) {
            this.logger.error('Error marking drone as online', { droneId, error });
            throw error;
        }
    }

    /**
     * 批量標記無人機為離線狀態
     * 
     * @param thresholdMinutes - 離線判定時間閾值（分鐘）
     * @returns Promise<number> 更新的記錄數
     */
    async markOfflineDrones(thresholdMinutes: number = 5): Promise<number> {
        try {
            this.logger.info('Marking offline drones based on threshold', { thresholdMinutes });
            const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);
            
            const [affectedCount] = await DroneRealTimeStatusModel.update({
                is_connected: false
            }, {
                where: {
                    last_seen: { [Op.lt]: thresholdTime },
                    is_connected: true
                }
            });

            this.logger.info(`Marked ${affectedCount} drones as offline`);
            return affectedCount;
        } catch (error) {
            this.logger.error('Error marking offline drones', { thresholdMinutes, error });
            throw error;
        }
    }

    /**
     * 清理舊的即時狀態記錄
     * 
     * @param daysOld - 保留天數
     * @returns Promise<number> 清理的記錄數
     */
    async cleanup(daysOld: number): Promise<number> {
        try {
            this.logger.info('Cleaning up old real-time status records', { daysOld });
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const deletedCount = await DroneRealTimeStatusModel.destroy({
                where: {
                    updatedAt: { [Op.lt]: cutoffDate }
                }
            });

            this.logger.info(`Cleaned up ${deletedCount} old real-time status records`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error cleaning up old real-time status records', { daysOld, error });
            throw error;
        }
    }
}
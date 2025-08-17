/**
 * @fileoverview 無人機狀態歷史命令 Repository - CQRS 命令端
 *
 * 專門處理無人機狀態變更歷史資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusArchiveModel, type DroneStatusArchiveAttributes, type DroneStatusArchiveCreationAttributes } from '../../models/DroneStatusArchiveModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

/**
 * 無人機狀態歷史命令 Repository 實現類別 - CQRS 命令端
 *
 * 專門處理無人機狀態變更歷史資料的寫入操作，遵循 CQRS 模式
 *
 * @class DroneStatusArchiveCommandsRepository
 */
@injectable()
export class DroneStatusArchiveCommandsRepository {
    private readonly logger = createLogger('DroneStatusArchiveCommandsRepository');

    /**
     * 建立新的狀態歷史記錄
     *
     * @param {DroneStatusArchiveCreationAttributes} data - 狀態歷史建立資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態歷史資料
     */
    create = async (data: DroneStatusArchiveCreationAttributes): Promise<DroneStatusArchiveAttributes> => {
        try {
            this.logger.info('Creating new drone status archive', { data });
            const archive = await DroneStatusArchiveModel.create(data);

            this.logger.info('Drone status archive created successfully', { id: archive.id });
            return archive.toJSON() as DroneStatusArchiveAttributes;
        } catch (error) {
            this.logger.error('Error creating drone status archive', { data, error });
            throw error;
        }
    }

    /**
     * 批量建立狀態歷史記錄
     * 
     * @param {DroneStatusArchiveCreationAttributes[]} dataArray - 狀態歷史建立資料陣列
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 建立的狀態歷史資料陣列
     */
    bulkCreate = async (dataArray: DroneStatusArchiveCreationAttributes[]): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Bulk creating drone status archives', { count: dataArray.length });
            const archives = await DroneStatusArchiveModel.bulkCreate(dataArray, {
                returning: true
            });
            
            this.logger.info('Drone status archives bulk created successfully', { count: archives.length });
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            this.logger.error('Error bulk creating drone status archives', { count: dataArray.length, error });
            throw error;
        }
    }

    /**
     * 更新狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @param {Partial<DroneStatusArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 更新後的狀態歷史資料或 null
     */
    update = async (id: number, data: Partial<DroneStatusArchiveCreationAttributes>): Promise<DroneStatusArchiveAttributes | null> => {
        try {
            this.logger.info('Updating drone status archive', { id, data });

            const [updatedRowsCount] = await DroneStatusArchiveModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedArchive = await DroneStatusArchiveModel.findByPk(id);
                if (updatedArchive) {
                    this.logger.info('Drone status archive updated successfully', { id });
                    return updatedArchive.toJSON() as DroneStatusArchiveAttributes;
                }
            }

            this.logger.warn('Drone status archive not found for update', { id });
            return null;
        } catch (error) {
            this.logger.error('Error updating drone status archive', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete = async (id: number): Promise<boolean> => {
        try {
            this.logger.info('Deleting drone status archive', { id });

            const deletedRowsCount = await DroneStatusArchiveModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                this.logger.info('Drone status archive deleted successfully', { id });
            } else {
                this.logger.warn('Drone status archive not found for deletion', { id });
            }

            return success;
        } catch (error) {
            this.logger.error('Error deleting drone status archive', { id, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的狀態歷史記錄
     * 
     * @param {Date} beforeDate - 刪除此時間之前的記錄
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteBeforeDate = async (beforeDate: Date): Promise<number> => {
        try {
            this.logger.info('Deleting drone status archive records before date', { beforeDate });
            const deletedCount = await DroneStatusArchiveModel.destroy({
                where: {
                    timestamp: {
                        [Op.lt]: beforeDate
                    }
                }
            });
            
            this.logger.info(`Deleted ${deletedCount} status archive records before ${beforeDate}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone status archive records before date', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 刪除指定無人機的狀態歷史記錄
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByDroneId = async (droneId: number): Promise<number> => {
        try {
            this.logger.info('Deleting drone status archive records by drone ID', { droneId });
            const deletedCount = await DroneStatusArchiveModel.destroy({
                where: { drone_id: droneId }
            });
            
            this.logger.info(`Deleted ${deletedCount} status archive records for drone ${droneId}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone status archive records by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間範圍的狀態歷史記錄
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByDateRange = async (startDate: Date, endDate: Date): Promise<number> => {
        try {
            this.logger.info('Deleting drone status archive records by date range', { startDate, endDate });
            const deletedCount = await DroneStatusArchiveModel.destroy({
                where: {
                    timestamp: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            
            this.logger.info(`Deleted ${deletedCount} status archive records in date range`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone status archive records by date range', { startDate, endDate, error });
            throw error;
        }
    }

    /**
     * 刪除指定操作者的狀態歷史記錄
     * 
     * @param {number} createdBy - 操作者用戶 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByCreatedBy = async (createdBy: number): Promise<number> => {
        try {
            this.logger.info('Deleting drone status archive records by created by', { createdBy });
            const deletedCount = await DroneStatusArchiveModel.destroy({
                where: { created_by: createdBy }
            });
            
            this.logger.info(`Deleted ${deletedCount} status archive records created by user ${createdBy}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone status archive records by created by', { createdBy, error });
            throw error;
        }
    }

    /**
     * 清理舊的狀態歷史記錄
     * 
     * @param {number} daysOld - 保留天數
     * @returns {Promise<number>} 清理的記錄數
     */
    cleanup = async (daysOld: number): Promise<number> => {
        try {
            this.logger.info('Cleaning up old drone status archive records', { daysOld });
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const deletedCount = await DroneStatusArchiveModel.destroy({
                where: {
                    timestamp: {
                        [Op.lt]: cutoffDate
                    }
                }
            });

            this.logger.info(`Cleaned up ${deletedCount} old status archive records`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error cleaning up old status archive records', { daysOld, error });
            throw error;
        }
    }
}
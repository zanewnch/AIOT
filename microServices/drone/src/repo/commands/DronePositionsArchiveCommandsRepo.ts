/**
 * @fileoverview 無人機位置歷史歸檔命令 Repository - CQRS 命令端
 *
 * 專門處理無人機位置歷史歸檔資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DronePositionsArchiveModel, type DronePositionsArchiveAttributes, type DronePositionsArchiveCreationAttributes } from '../../../models/drone/DronePositionsArchiveModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';
import { Op } from 'sequelize';

/**
 * 無人機位置歷史歸檔命令 Repository 實現類別 - CQRS 命令端
 *
 * 專門處理無人機位置歷史歸檔資料的寫入操作，遵循 CQRS 模式
 *
 * @class DronePositionsArchiveCommandsRepository
 */
@injectable()
export class DronePositionsArchiveCommandsRepository {
    private readonly logger = createLogger('DronePositionsArchiveCommandsRepository');

    /**
     * 建立新的位置歷史歸檔記錄
     * 
     * @param {DronePositionsArchiveCreationAttributes} data - 位置歷史歸檔建立資料
     * @returns {Promise<DronePositionsArchiveAttributes>} 建立的位置歷史歸檔資料
     */
    async create(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveAttributes> {
        try {
            this.logger.info('Creating new drone positions archive', { data });
            const archive = await DronePositionsArchiveModel.create(data);
            
            this.logger.info('Drone positions archive created successfully', { id: archive.id });
            return archive.toJSON() as DronePositionsArchiveAttributes;
        } catch (error) {
            this.logger.error('Error creating drone positions archive', { data, error });
            throw error;
        }
    }

    /**
     * 批量建立位置歷史歸檔記錄
     * 
     * @param {DronePositionsArchiveCreationAttributes[]} dataArray - 位置歷史歸檔建立資料陣列
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 建立的位置歷史歸檔資料陣列
     */
    async bulkCreate(dataArray: DronePositionsArchiveCreationAttributes[]): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Bulk creating drone positions archive', { count: dataArray.length });
            const archives = await DronePositionsArchiveModel.bulkCreate(dataArray, {
                returning: true
            });
            
            this.logger.info('Drone positions archive bulk created successfully', { count: archives.length });
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error bulk creating drone positions archive', { count: dataArray.length, error });
            throw error;
        }
    }

    /**
     * 更新位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @param {Partial<DronePositionsArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 更新後的位置歷史歸檔資料或 null
     */
    async update(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveAttributes | null> {
        try {
            this.logger.info('Updating drone positions archive', { id, data });
            
            const [updatedRowsCount] = await DronePositionsArchiveModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedArchive = await DronePositionsArchiveModel.findByPk(id);
                if (updatedArchive) {
                    this.logger.info('Drone positions archive updated successfully', { id });
                    return updatedArchive.toJSON() as DronePositionsArchiveAttributes;
                }
            }
            
            this.logger.warn('Drone positions archive not found for update', { id });
            return null;
        } catch (error) {
            this.logger.error('Error updating drone positions archive', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async delete(id: number): Promise<boolean> {
        try {
            this.logger.info('Deleting drone positions archive', { id });
            
            const deletedRowsCount = await DronePositionsArchiveModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                this.logger.info('Drone positions archive deleted successfully', { id });
            } else {
                this.logger.warn('Drone positions archive not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            this.logger.error('Error deleting drone positions archive', { id, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的歸檔資料
     * 
     * @param {Date} beforeDate - 刪除此時間之前的資料
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteBeforeDate(beforeDate: Date): Promise<number> {
        try {
            this.logger.info('Deleting drone positions archive records before date', { beforeDate });
            const deletedCount = await DronePositionsArchiveModel.destroy({
                where: {
                    archived_at: {
                        [Op.lt]: beforeDate
                    }
                }
            });
            
            this.logger.info(`Deleted ${deletedCount} positions archive records before ${beforeDate}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone positions archive records before date', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 刪除指定批次的歸檔資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteBatch(batchId: string): Promise<number> {
        try {
            this.logger.info('Deleting drone positions archive records by batch ID', { batchId });
            const deletedCount = await DronePositionsArchiveModel.destroy({
                where: { archive_batch_id: batchId }
            });
            
            this.logger.info(`Deleted ${deletedCount} positions archive records for batch ${batchId}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone positions archive records by batch ID', { batchId, error });
            throw error;
        }
    }

    /**
     * 刪除指定無人機的歸檔資料
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteByDroneId(droneId: number): Promise<number> {
        try {
            this.logger.info('Deleting drone positions archive records by drone ID', { droneId });
            const deletedCount = await DronePositionsArchiveModel.destroy({
                where: { drone_id: droneId }
            });
            
            this.logger.info(`Deleted ${deletedCount} positions archive records for drone ${droneId}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone positions archive records by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間範圍的歸檔資料
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteByTimeRange(startTime: Date, endTime: Date): Promise<number> {
        try {
            this.logger.info('Deleting drone positions archive records by time range', { startTime, endTime });
            const deletedCount = await DronePositionsArchiveModel.destroy({
                where: {
                    timestamp: {
                        [Op.between]: [startTime, endTime]
                    }
                }
            });
            
            this.logger.info(`Deleted ${deletedCount} positions archive records in time range`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone positions archive records by time range', { startTime, endTime, error });
            throw error;
        }
    }
}
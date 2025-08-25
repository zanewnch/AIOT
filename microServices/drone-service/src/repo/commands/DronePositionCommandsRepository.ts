/**
 * @fileoverview 無人機位置命令 Repositorysitorysitory - CQRS 命令端
 *
 * 專門處理無人機位置資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DronePositionModel, type DronePositionAttributes, type DronePositionCreationAttributes } from '../../models/DronePositionModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

/**
 * 無人機位置命令 Repositorysitorysitory 實現類別 - CQRS 命令端
 *
 * 專門處理無人機位置資料的寫入操作，遵循 CQRS 模式
 *
 * @class DronePositionCommandsRepositorysitorysitory
 */
@injectable()
export class DronePositionCommandsRepositorysitorysitorysitory {
    private readonly logger = createLogger('DronePositionCommandsRepositorysitorysitory');

    /**
     * 建立新的無人機位置資料
     *
     * @param {DronePositionCreationAttributes} data - 無人機位置建立資料
     * @returns {Promise<DronePositionAttributes>} 建立的無人機位置資料
     */
    create = async (data: DronePositionCreationAttributes): Promise<DronePositionAttributes> => {
        try {
            this.logger.info('Creating new drone position data', { data });
            const dronePosition = await DronePositionModel.create(data);

            this.logger.info('Drone position data created successfully', { id: dronePosition.id });
            return dronePosition.toJSON() as DronePositionAttributes;
        } catch (error) {
            this.logger.error('Error creating drone position data', { data, error });
            throw error;
        }
    }

    /**
     * 批量建立無人機位置資料
     * 
     * @param {DronePositionCreationAttributes[]} dataArray - 位置資料陣列
     * @returns {Promise<DronePositionAttributes[]>} 建立的位置資料陣列
     */
    bulkCreate = async (dataArray: DronePositionCreationAttributes[]): Promise<DronePositionAttributes[]> => {
        try {
            this.logger.info('Bulk creating drone position data', { count: dataArray.length });
            const dronePositions = await DronePositionModel.bulkCreate(dataArray, {
                returning: true
            });
            
            this.logger.info('Drone position data bulk created successfully', { count: dronePositions.length });
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            this.logger.error('Error bulk creating drone position data', { count: dataArray.length, error });
            throw error;
        }
    }

    /**
     * 更新無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @param {Partial<DronePositionCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionAttributes | null>} 更新後的無人機位置資料或 null
     */
    update = async (id: number, data: Partial<DronePositionCreationAttributes>): Promise<DronePositionAttributes | null> => {
        try {
            this.logger.info('Updating drone position data', { id, data });

            const [updatedRowsCount] = await DronePositionModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedDronePosition = await DronePositionModel.findByPk(id);
                if (updatedDronePosition) {
                    this.logger.info('Drone position data updated successfully', { id });
                    return updatedDronePosition.toJSON() as DronePositionAttributes;
                }
            }

            this.logger.warn('Drone position data not found for update', { id });
            return null;
        } catch (error) {
            this.logger.error('Error updating drone position data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete = async (id: number): Promise<boolean> => {
        try {
            this.logger.info('Deleting drone position data', { id });

            const deletedRowsCount = await DronePositionModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                this.logger.info('Drone position data deleted successfully', { id });
            } else {
                this.logger.warn('Drone position data not found for deletion', { id });
            }

            return success;
        } catch (error) {
            this.logger.error('Error deleting drone position data', { id, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的位置記錄
     * 
     * @param {Date} beforeDate - 刪除此時間之前的記錄
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteBeforeDate = async (beforeDate: Date): Promise<number> => {
        try {
            this.logger.info('Deleting drone position records before date', { beforeDate });
            const deletedCount = await DronePositionModel.destroy({
                where: {
                    timestamp: {
                        [Op.lt]: beforeDate
                    }
                }
            });
            
            this.logger.info(`Deleted ${deletedCount} position records before ${beforeDate}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone position records before date', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 刪除指定無人機的位置記錄
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByDroneId = async (droneId: number): Promise<number> => {
        try {
            this.logger.info('Deleting drone position records by drone ID', { droneId });
            const deletedCount = await DronePositionModel.destroy({
                where: { drone_id: droneId }
            });
            
            this.logger.info(`Deleted ${deletedCount} position records for drone ${droneId}`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Error deleting drone position records by drone ID', { droneId, error });
            throw error;
        }
    }
}
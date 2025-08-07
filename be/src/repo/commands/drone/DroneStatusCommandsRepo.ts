/**
 * @fileoverview 無人機狀態命令 Repository - CQRS 命令端
 * 
 * 專門處理無人機狀態資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { DroneStatusModel, type DroneStatusCreationAttributes } from '../../../models/drone/DroneStatusModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';

const logger = createLogger('DroneStatusCommandsRepository');

/**
 * 無人機狀態命令 Repository 實現類別 - CQRS 命令端
 * 
 * 專門處理無人機狀態資料的寫入操作，遵循 CQRS 模式
 * 
 * @class DroneStatusCommandsRepository
 */
export class DroneStatusCommandsRepository {
    /**
     * 建立新的無人機狀態記錄
     * 
     * @param {DroneStatusCreationAttributes} data 無人機狀態建立資料
     * @returns {Promise<DroneStatusModel>} 成功建立的無人機狀態模型
     * @throws {Error} 當資料格式錯誤或資料庫操作失敗時拋出異常
     */
    async create(data: DroneStatusCreationAttributes): Promise<DroneStatusModel> {
        try {
            logger.info('Creating new drone status', { droneSerial: data.drone_serial });
            const droneStatus = await DroneStatusModel.create(data);
            
            logger.info('Drone status created successfully', { 
                id: droneStatus.id, 
                droneSerial: droneStatus.drone_serial 
            });
            return droneStatus;
        } catch (error) {
            logger.error('Error creating drone status:', error);
            throw error;
        }
    }

    /**
     * 更新無人機狀態資料
     * 
     * @param {number} id 無人機狀態資料 ID
     * @param {Partial<DroneStatusCreationAttributes>} data 更新資料
     * @returns {Promise<DroneStatusModel | null>} 更新後的無人機狀態模型或 null（若找不到）
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    async update(id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusModel | null> {
        try {
            logger.info('Updating drone status', { id, updateFields: Object.keys(data) });
            const [affectedCount] = await DroneStatusModel.update(data, {
                where: { id },
                returning: false
            });
            
            if (affectedCount === 0) {
                logger.warn('Drone status not found for update', { id });
                return null;
            }
            
            const updatedDroneStatus = await DroneStatusModel.findByPk(id);
            if (updatedDroneStatus) {
                logger.info('Drone status updated successfully', { id });
            }
            
            return updatedDroneStatus;
        } catch (error) {
            logger.error('Error updating drone status:', error);
            throw error;
        }
    }

    /**
     * 刪除無人機狀態
     * 
     * @param {number} id 無人機狀態資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone status', { id });
            const affectedCount = await DroneStatusModel.destroy({
                where: { id }
            });
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('Drone status deleted successfully', { id });
            } else {
                logger.warn('Drone status not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deleting drone status:', error);
            throw error;
        }
    }

    /**
     * 根據無人機序號更新狀態
     * 
     * @param {string} droneSerial 無人機序號
     * @param {any} status 新狀態
     * @returns {Promise<boolean>} 是否成功更新
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    async updateStatusBySerial(droneSerial: string, status: any): Promise<boolean> {
        try {
            logger.info('Updating drone status by serial', { droneSerial, status });
            const [affectedCount] = await DroneStatusModel.update(
                { status },
                { where: { drone_serial: droneSerial } }
            );
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('Drone status updated successfully by serial', { droneSerial, status });
            } else {
                logger.warn('Drone not found for status update by serial', { droneSerial });
            }
            
            return success;
        } catch (error) {
            logger.error('Error updating drone status by serial:', error);
            throw error;
        }
    }
}
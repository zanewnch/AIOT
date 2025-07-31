/**
 * @fileoverview 無人機狀態 Repository 實現
 * 
 * 實現無人機狀態資料存取層的具體邏輯，使用 Sequelize ORM 進行資料庫操作。
 * 遵循 Repository Pattern，提供清晰的資料存取介面。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DroneStatusModel, type DroneStatusAttributes, type DroneStatusCreationAttributes, DroneStatus } from '../models/DroneStatusModel.js';
import type { IDroneStatusRepository } from '../types/repositories/IDroneStatusRepository.js';
import type { PaginationParams, PaginatedResponse } from '../types/ApiResponseType.js';
import { createLogger } from '../configs/loggerConfig.js';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DroneStatusRepository');

/**
 * 無人機狀態 Repository 實現類別
 * 
 * 實現 IDroneStatusRepository 介面，提供無人機狀態資料的具體存取方法
 * 
 * @class DroneStatusRepository
 * @implements {IDroneStatusRepository}
 */
export class DroneStatusRepository implements IDroneStatusRepository {
    /**
     * 取得所有無人機狀態資料
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusAttributes[]>} 無人機狀態資料陣列
     */
    async selectAll(limit: number = 100): Promise<DroneStatusAttributes[]> {
        try {
            logger.info('Fetching all drone status data');
            const droneStatuses = await DroneStatusModel.findAll({
                order: [['createdAt', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${droneStatuses.length} drone status records`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching all drone status data', { error });
            throw error;
        }
    }

    /**
     * 取得分頁無人機狀態資料
     * 
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneStatusAttributes>>} 分頁無人機狀態資料
     */
    async selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneStatusAttributes>> {
        try {
            const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;
            
            logger.info('Fetching paginated drone status data', { page, limit, sortBy, sortOrder });
            
            // 統計總數
            const totalItems = await DroneStatusModel.count();
            const totalPages = Math.ceil(totalItems / limit);
            
            // 取得分頁資料
            const droneStatuses = await DroneStatusModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });
            
            const data = droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
            
            const response: PaginatedResponse<DroneStatusAttributes> = {
                data,
                pagination: {
                    currentPage: page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
            
            logger.info(`Successfully fetched paginated drone status data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            logger.error('Error fetching paginated drone status data', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆無人機狀態資料
     * 
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<DroneStatusAttributes | null>} 無人機狀態資料或 null
     */
    async findById(id: number): Promise<DroneStatusAttributes | null> {
        try {
            logger.info('Fetching drone status data by ID', { id });
            const droneStatus = await DroneStatusModel.findByPk(id);
            
            if (droneStatus) {
                logger.info('Drone status data found', { id });
                return droneStatus.toJSON() as DroneStatusAttributes;
            } else {
                logger.warn('Drone status data not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone status data by ID', { id, error });
            throw error;
        }        
    }

    /**
     * 根據無人機序號取得無人機狀態資料
     * 
     * @param {string} droneSerial - 無人機序號
     * @returns {Promise<DroneStatusAttributes | null>} 無人機狀態資料或 null
     */
    async findByDroneSerial(droneSerial: string): Promise<DroneStatusAttributes | null> {
        try {
            logger.info('Fetching drone status data by serial', { droneSerial });
            const droneStatus = await DroneStatusModel.findOne({
                where: { drone_serial: droneSerial }
            });
            
            if (droneStatus) {
                logger.info('Drone status data found by serial', { droneSerial });
                return droneStatus.toJSON() as DroneStatusAttributes;
            } else {
                logger.warn('Drone status data not found by serial', { droneSerial });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone status data by serial', { droneSerial, error });
            throw error;
        }
    }

    /**
     * 建立新的無人機狀態資料
     * 
     * @param {DroneStatusCreationAttributes} data - 無人機狀態建立資料
     * @returns {Promise<DroneStatusAttributes>} 建立的無人機狀態資料
     */
    async create(data: DroneStatusCreationAttributes): Promise<DroneStatusAttributes> {
        try {
            logger.info('Creating new drone status data', { data });
            const droneStatus = await DroneStatusModel.create(data);
            
            logger.info('Drone status data created successfully', { id: droneStatus.id });
            return droneStatus.toJSON() as DroneStatusAttributes;
        } catch (error) {
            logger.error('Error creating drone status data', { data, error });
            throw error;
        }
    }

    /**
     * 更新無人機狀態資料
     * 
     * @param {number} id - 無人機狀態資料 ID
     * @param {Partial<DroneStatusCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusAttributes | null>} 更新後的無人機狀態資料或 null
     */
    async update(id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusAttributes | null> {
        try {
            logger.info('Updating drone status data', { id, data });
            
            const [updatedRowsCount] = await DroneStatusModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedDroneStatus = await DroneStatusModel.findByPk(id);
                if (updatedDroneStatus) {
                    logger.info('Drone status data updated successfully', { id });
                    return updatedDroneStatus.toJSON() as DroneStatusAttributes;
                }
            }
            
            logger.warn('Drone status data not found for update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating drone status data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機狀態資料
     * 
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone status data', { id });
            
            const deletedRowsCount = await DroneStatusModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                logger.info('Drone status data deleted successfully', { id });
            } else {
                logger.warn('Drone status data not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deleting drone status data', { id, error });
            throw error;
        }
    }

    /**
     * 根據狀態查詢無人機
     * 
     * @param {DroneStatus} status - 無人機狀態
     * @returns {Promise<DroneStatusAttributes[]>} 指定狀態的無人機陣列
     */
    async findByStatus(status: DroneStatus): Promise<DroneStatusAttributes[]> {
        try {
            logger.info('Fetching drone status data by status', { status });
            
            const droneStatuses = await DroneStatusModel.findAll({
                where: { status },
                order: [['createdAt', 'DESC']]
            });
            
            logger.info(`Successfully fetched ${droneStatuses.length} drones with status ${status}`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching drone status data by status', { status, error });
            throw error;
        }
    }

    /**
     * 根據擁有者 ID 查詢無人機
     * 
     * @param {number} ownerUserId - 擁有者用戶 ID
     * @returns {Promise<DroneStatusAttributes[]>} 指定擁有者的無人機陣列
     */
    async findByOwner(ownerUserId: number): Promise<DroneStatusAttributes[]> {
        try {
            logger.info('Fetching drone status data by owner', { ownerUserId });
            
            const droneStatuses = await DroneStatusModel.findAll({
                where: { owner_user_id: ownerUserId },
                order: [['createdAt', 'DESC']]
            });
            
            logger.info(`Successfully fetched ${droneStatuses.length} drones for owner ${ownerUserId}`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching drone status data by owner', { ownerUserId, error });
            throw error;
        }
    }

    /**
     * 根據製造商查詢無人機
     * 
     * @param {string} manufacturer - 製造商名稱
     * @returns {Promise<DroneStatusAttributes[]>} 指定製造商的無人機陣列
     */
    async findByManufacturer(manufacturer: string): Promise<DroneStatusAttributes[]> {
        try {
            logger.info('Fetching drone status data by manufacturer', { manufacturer });
            
            const droneStatuses = await DroneStatusModel.findAll({
                where: { manufacturer },
                order: [['createdAt', 'DESC']]
            });
            
            logger.info(`Successfully fetched ${droneStatuses.length} drones from manufacturer ${manufacturer}`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching drone status data by manufacturer', { manufacturer, error });
            throw error;
        }
    }

    /**
     * 更新無人機狀態
     * 
     * @param {number} id - 無人機 ID
     * @param {DroneStatus} status - 新狀態
     * @returns {Promise<DroneStatusAttributes | null>} 更新後的無人機資料或 null
     */
    async updateStatus(id: number, status: DroneStatus): Promise<DroneStatusAttributes | null> {
        try {
            logger.info('Updating drone status', { id, status });
            
            const [updatedRowsCount] = await DroneStatusModel.update(
                { status },
                { where: { id } }
            );

            if (updatedRowsCount > 0) {
                const updatedDroneStatus = await DroneStatusModel.findByPk(id);
                if (updatedDroneStatus) {
                    logger.info('Drone status updated successfully', { id, status });
                    return updatedDroneStatus.toJSON() as DroneStatusAttributes;
                }
            }
            
            logger.warn('Drone not found for status update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating drone status', { id, status, error });
            throw error;
        }
    }
}
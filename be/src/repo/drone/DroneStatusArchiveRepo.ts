/**
 * @fileoverview 無人機狀態歷史 Repository 實現
 * 
 * 實現無人機狀態變更歷史資料存取層的具體邏輯，使用 Sequelize ORM 進行資料庫操作。
 * 遵循 Repository Pattern，提供清晰的資料存取介面。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DroneStatusArchiveModel, type DroneStatusArchiveAttributes, type DroneStatusArchiveCreationAttributes } from '../models/DroneStatusArchiveModel.js';
import type { DroneStatus } from '../models/DroneStatusModel.js';
import type { IDroneStatusArchiveRepository } from '../types/repositories/IDroneStatusArchiveRepository.js';
import type { PaginationParams, PaginatedResponse } from '../types/ApiResponseType.js';
import { createLogger } from '../configs/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DroneStatusArchiveRepository');

/**
 * 無人機狀態歷史 Repository 實現類別
 * 
 * 實現 IDroneStatusArchiveRepository 介面，提供狀態歷史資料的具體存取方法
 * 
 * @class DroneStatusArchiveRepository
 * @implements {IDroneStatusArchiveRepository}
 */
export class DroneStatusArchiveRepository implements IDroneStatusArchiveRepository {
    /**
     * 取得所有無人機狀態歷史資料
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 狀態歷史資料陣列
     */
    async selectAll(limit: number = 100): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching all drone status archive data', { limit });
            const archives = await DroneStatusArchiveModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching all drone status archive data', { error });
            throw error;
        }
    }

    /**
     * 取得分頁無人機狀態歷史資料
     * 
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneStatusArchiveAttributes>>} 分頁狀態歷史資料
     */
    async selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneStatusArchiveAttributes>> {
        try {
            const { page, limit, sortBy = 'timestamp', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;
            
            logger.info('Fetching paginated drone status archive data', { page, limit, sortBy, sortOrder });
            
            // 統計總數
            const totalItems = await DroneStatusArchiveModel.count();
            const totalPages = Math.ceil(totalItems / limit);
            
            // 取得分頁資料
            const archives = await DroneStatusArchiveModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });
            
            const data = archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
            
            const response: PaginatedResponse<DroneStatusArchiveAttributes> = {
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
            
            logger.info(`Successfully fetched paginated drone status archive data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            logger.error('Error fetching paginated drone status archive data', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆狀態歷史資料
     * 
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 狀態歷史資料或 null
     */
    async findById(id: number): Promise<DroneStatusArchiveAttributes | null> {
        try {
            logger.info('Fetching drone status archive by ID', { id });
            const archive = await DroneStatusArchiveModel.findByPk(id);
            
            if (archive) {
                logger.info('Drone status archive found', { id });
                return archive.toJSON() as DroneStatusArchiveAttributes;
            } else {
                logger.warn('Drone status archive not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone status archive by ID', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的狀態歷史記錄
     * 
     * @param {DroneStatusArchiveCreationAttributes} data - 狀態歷史建立資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態歷史資料
     */
    async create(data: DroneStatusArchiveCreationAttributes): Promise<DroneStatusArchiveAttributes> {
        try {
            logger.info('Creating new drone status archive', { data });
            const archive = await DroneStatusArchiveModel.create(data);
            
            logger.info('Drone status archive created successfully', { id: archive.id });
            return archive.toJSON() as DroneStatusArchiveAttributes;
        } catch (error) {
            logger.error('Error creating drone status archive', { data, error });
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
    async update(id: number, data: Partial<DroneStatusArchiveCreationAttributes>): Promise<DroneStatusArchiveAttributes | null> {
        try {
            logger.info('Updating drone status archive', { id, data });
            
            const [updatedRowsCount] = await DroneStatusArchiveModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedArchive = await DroneStatusArchiveModel.findByPk(id);
                if (updatedArchive) {
                    logger.info('Drone status archive updated successfully', { id });
                    return updatedArchive.toJSON() as DroneStatusArchiveAttributes;
                }
            }
            
            logger.warn('Drone status archive not found for update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating drone status archive', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除狀態歷史資料
     * 
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone status archive', { id });
            
            const deletedRowsCount = await DroneStatusArchiveModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                logger.info('Drone status archive deleted successfully', { id });
            } else {
                logger.warn('Drone status archive not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deleting drone status archive', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢狀態歷史
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定無人機的狀態歷史陣列
     */
    async findByDroneId(droneId: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching drone status archive by drone ID', { droneId, limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records for drone ${droneId}`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone status archive by drone ID', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 根據狀態查詢歷史記錄
     * 
     * @param {DroneStatus} status - 無人機狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定狀態的歷史記錄陣列
     */
    async findByStatus(status: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching drone status archive by status', { status, limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                where: { status },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records with status ${status}`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone status archive by status', { status, limit, error });
            throw error;
        }
    }

    /**
     * 根據操作者查詢歷史記錄
     * 
     * @param {number} createdBy - 操作者用戶 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定操作者的歷史記錄陣列
     */
    async findByCreatedBy(createdBy: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching drone status archive by created by', { createdBy, limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                where: { created_by: createdBy },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records created by user ${createdBy}`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone status archive by created by', { createdBy, limit, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢歷史記錄
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定時間範圍的歷史記錄陣列
     */
    async findByDateRange(startDate: Date, endDate: Date, limit: number = 100): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching drone status archive by date range', { startDate, endDate, limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                where: {
                    timestamp: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records in date range`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone status archive by date range', { startDate, endDate, limit, error });
            throw error;
        }
    }

    /**
     * 根據變更原因查詢歷史記錄
     * 
     * @param {string} reason - 變更原因（支援模糊搜尋）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 包含指定原因的歷史記錄陣列
     */
    async findByReason(reason: string, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching drone status archive by reason', { reason, limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                where: {
                    reason: {
                        [Op.like]: `%${reason}%`
                    }
                },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records with reason containing "${reason}"`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone status archive by reason', { reason, limit, error });
            throw error;
        }
    }

    /**
     * 取得最新的狀態變更記錄
     * 
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 最新的狀態變更記錄陣列
     */
    async findLatest(limit: number = 20): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching latest drone status archive records', { limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} latest archive records`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching latest drone status archive records', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新狀態變更
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 最新的狀態變更記錄或 null
     */
    async findLatestByDroneId(droneId: number): Promise<DroneStatusArchiveAttributes | null> {
        try {
            logger.info('Fetching latest drone status archive by drone ID', { droneId });
            
            const archive = await DroneStatusArchiveModel.findOne({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']]
            });
            
            if (archive) {
                logger.info('Latest archive record found for drone', { droneId });
                return archive.toJSON() as DroneStatusArchiveAttributes;
            } else {
                logger.warn('No archive records found for drone', { droneId });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching latest drone status archive by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據狀態轉換查詢歷史記錄
     * 
     * @param {DroneStatus | null} fromStatus - 轉換前狀態
     * @param {DroneStatus} toStatus - 轉換後狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 符合狀態轉換的歷史記錄陣列
     */
    async findByStatusTransition(fromStatus: DroneStatus | null, toStatus: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            logger.info('Fetching drone status archive by status transition', { fromStatus, toStatus, limit });
            
            const archives = await DroneStatusArchiveModel.findAll({
                where: {
                    previous_status: fromStatus,
                    status: toStatus
                },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${archives.length} archive records for transition ${fromStatus} -> ${toStatus}`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone status archive by status transition', { fromStatus, toStatus, limit, error });
            throw error;
        }
    }

    /**
     * 取得狀態變更統計
     * 
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<{[key: string]: number}>} 狀態變更統計資料
     */
    async getStatusChangeStatistics(startDate?: Date, endDate?: Date): Promise<{[key: string]: number}> {
        try {
            logger.info('Getting status change statistics', { startDate, endDate });
            
            const whereClause: any = {};
            if (startDate && endDate) {
                whereClause.timestamp = {
                    [Op.between]: [startDate, endDate]
                };
            }

            const archives = await DroneStatusArchiveModel.findAll({
                where: whereClause,
                attributes: ['status', 'previous_status']
            });

            const statistics: {[key: string]: number} = {};
            
            archives.forEach(archive => {
                const transition = `${archive.previous_status || 'null'} -> ${archive.status}`;
                statistics[transition] = (statistics[transition] || 0) + 1;

                // 也統計每個狀態的總變更次數
                const statusKey = `to_${archive.status}`;
                statistics[statusKey] = (statistics[statusKey] || 0) + 1;
            });
            
            logger.info('Successfully calculated status change statistics', { statisticsCount: Object.keys(statistics).length });
            return statistics;
        } catch (error) {
            logger.error('Error getting status change statistics', { startDate, endDate, error });
            throw error;
        }
    }
}
/**
 * @fileoverview 無人機狀態歷史查詢 Repository - CQRS 查詢端
 *
 * 專門處理無人機狀態變更歷史資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusArchiveModel, type DroneStatusArchiveAttributes } from '../../models/DroneStatusArchiveModel.js';
import type { DroneStatus } from '../../models/DroneStatusModel.js';
import type { PaginationParams, PaginatedResponse } from '../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

/**
 * 無人機狀態歷史查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機狀態變更歷史資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneStatusArchiveQueriesRepo
 */
@injectable()
export class DroneStatusArchiveQueriesRepo {
    private readonly logger = createLogger('DroneStatusArchiveQueriesRepo');

    /**
     * 取得所有無人機狀態歷史資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 狀態歷史資料陣列
     */
    selectAll = async (limit: number = 100): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching all drone status archive data', { limit });
            const archives = await DroneStatusArchiveModel.findAll({
                order: [['archived_at', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${archives.length} archive records`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching all drone status archive data', { error });
            throw error;
        }
    }

    /**
     * 取得分頁無人機狀態歷史資料
     *
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneStatusArchiveAttributes>>} 分頁狀態歷史資料
     */
    selectPagination = async (params: PaginationParams): Promise<PaginatedResponse<DroneStatusArchiveAttributes>> => {
        try {
            const { page = 1, limit = 10, sortBy = 'archived_at', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;

            this.logger.info('Fetching paginated drone status archive data', { page, limit, sortBy, sortOrder });

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
                    page: page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

            this.logger.info(`Successfully fetched paginated drone status archive data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            this.logger.error('Error fetching paginated drone status archive data', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 狀態歷史資料或 null
     */
    findById = async (id: number): Promise<DroneStatusArchiveAttributes | null> => {
        try {
            this.logger.info('Fetching drone status archive by ID', { id });
            const archive = await DroneStatusArchiveModel.findByPk(id);

            if (archive) {
                this.logger.info('Drone status archive found', { id });
                return archive.toJSON() as DroneStatusArchiveAttributes;
            } else {
                this.logger.warn('Drone status archive not found', { id });
                return null;
            }
        } catch (error) {
            this.logger.error('Error fetching drone status archive by ID', { id, error });
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
    findByDroneId = async (droneId: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching drone status archive by drone ID', { droneId, limit });

            const archives = await DroneStatusArchiveModel.findAll({
                where: { drone_id: droneId },
                order: [['archived_at', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${archives.length} archive records for drone ${droneId}`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone status archive by drone ID', { droneId, limit, error });
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
    findByStatus = async (status: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching drone status archive by status', { status, limit });

            const archives = await DroneStatusArchiveModel.findAll({
                where: { current_status: status },
                order: [['archived_at', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${archives.length} archive records with status ${status}`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone status archive by status', { status, limit, error });
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
    findByCreatedBy = async (createdBy: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching drone status archive by created by', { createdBy, limit });

            // 注意：資料庫表中沒有 created_by 欄位，這裡跳過查詢
            this.logger.warn('created_by field not available in archive table, returning empty array');
            return [];
        } catch (error) {
            this.logger.error('Error fetching drone status archive by created by', { createdBy, limit, error });
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
    findByDateRange = async (startDate: Date, endDate: Date, limit: number = 100): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching drone status archive by date range', { startDate, endDate, limit });

            const archives = await DroneStatusArchiveModel.findAll({
                where: {
                    archived_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['archived_at', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${archives.length} archive records in date range`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone status archive by date range', { startDate, endDate, limit, error });
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
    findByReason = async (reason: string, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching drone status archive by reason', { reason, limit });

            // 注意：資料庫表中沒有 reason 欄位，這裡跳過查詢
            this.logger.warn('reason field not available in archive table, returning empty array');
            return [];
        } catch (error) {
            this.logger.error('Error fetching drone status archive by reason', { reason, limit, error });
            throw error;
        }
    }

    /**
     * 取得最新的狀態變更記錄
     *
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 最新的狀態變更記錄陣列
     */
    findLatest = async (limit: number = 20): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching latest drone status archive records', { limit });

            const archives = await DroneStatusArchiveModel.findAll({
                order: [['archived_at', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${archives.length} latest archive records`);
            return archives.map(item => item.toJSON() as DroneStatusArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching latest drone status archive records', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新狀態變更
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 最新的狀態變更記錄或 null
     */
    findLatestByDroneId = async (droneId: number): Promise<DroneStatusArchiveAttributes | null> => {
        try {
            this.logger.info('Fetching latest drone status archive by drone ID', { droneId });

            const archive = await DroneStatusArchiveModel.findOne({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']]
            });

            if (archive) {
                this.logger.info('Latest archive record found for drone', { droneId });
                return archive.toJSON() as DroneStatusArchiveAttributes;
            } else {
                this.logger.warn('No archive records found for drone', { droneId });
                return null;
            }
        } catch (error) {
            this.logger.error('Error fetching latest drone status archive by drone ID', { droneId, error });
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
    findByStatusTransition = async (fromStatus: DroneStatus | null, toStatus: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            this.logger.info('Fetching drone status archive by status transition', { fromStatus, toStatus, limit });

            // 注意：資料庫表中沒有 previous_status 欄位，這裡跳過查詢
            this.logger.warn('previous_status field not available in archive table, returning empty array');
            return [];
        } catch (error) {
            this.logger.error('Error fetching drone status archive by status transition', { fromStatus, toStatus, limit, error });
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
    getStatusChangeStatistics = async (startDate?: Date, endDate?: Date): Promise<{ [key: string]: number }> => {
        try {
            this.logger.info('Getting status change statistics', { startDate, endDate });

            const whereClause: any = {};
            if (startDate && endDate) {
                whereClause.timestamp = {
                    [Op.between]: [startDate, endDate]
                };
            }

            const archives = await DroneStatusArchiveModel.findAll({
                where: whereClause,
                attributes: ['current_status']
            });

            const statistics: { [key: string]: number } = {};

            archives.forEach(archive => {
                // 統計每個狀態的總數量
                const statusKey = `status_${archive.current_status}`;
                statistics[statusKey] = (statistics[statusKey] || 0) + 1;
            });

            this.logger.info('Successfully calculated status change statistics', { statisticsCount: Object.keys(statistics).length });
            return statistics;
        } catch (error) {
            this.logger.error('Error getting status change statistics', { startDate, endDate, error });
            throw error;
        }
    }

    /**
     * 統計總記錄數
     * 
     * @returns {Promise<number>} 總記錄數
     */
    count = async (): Promise<number> => {
        try {
            this.logger.info('Counting total drone status archive records');
            const count = await DroneStatusArchiveModel.count();
            
            this.logger.info(`Total status archive records: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting total drone status archive records', { error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計記錄數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的記錄數
     */
    countByDroneId = async (droneId: number): Promise<number> => {
        try {
            this.logger.info('Counting drone status archive records by drone ID', { droneId });
            const count = await DroneStatusArchiveModel.count({
                where: { drone_id: droneId }
            });
            
            this.logger.info(`Status archive records for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting drone status archive records by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍統計記錄數
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @returns {Promise<number>} 指定時間範圍的記錄數
     */
    countByDateRange = async (startDate: Date, endDate: Date): Promise<number> => {
        try {
            this.logger.info('Counting drone status archive records by date range', { startDate, endDate });
            const count = await DroneStatusArchiveModel.count({
                where: {
                    archived_at: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            
            this.logger.info(`Status archive records in date range: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting drone status archive records by date range', { startDate, endDate, error });
            throw error;
        }
    }
}
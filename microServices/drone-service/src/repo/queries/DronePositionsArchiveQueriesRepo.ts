/**
 * @fileoverview 無人機位置歷史歸檔查詢 Repository - CQRS 查詢端
 *
 * 專門處理無人機位置歷史歸檔資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DronePositionsArchiveModel, type DronePositionsArchiveAttributes } from '../../models/DronePositionsArchiveModel.js';
import type { PaginationParams, PaginatedResponse } from '@aiot/shared-packages/types/ApiResponseType.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Op } from 'sequelize';

/**
 * 無人機位置歷史歸檔查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機位置歷史歸檔資料的查詢操作，遵循 CQRS 模式
 *
 * @class DronePositionsArchiveQueriesRepository
 */
@injectable()
export class DronePositionsArchiveQueriesRepository {
    private readonly logger = createLogger('DronePositionsArchiveQueriesRepository');

    /**
     * 取得所有位置歷史歸檔資料
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 位置歷史歸檔資料陣列
     */
    async selectAll(limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching all drone positions archive data', { limit });
            const archives = await DronePositionsArchiveModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} positions archive records`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching all drone positions archive data', { error });
            throw error;
        }
    }

    /**
     * 取得分頁位置歷史歸檔資料
     * 
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DronePositionsArchiveAttributes>>} 分頁位置歷史歸檔資料
     */
    async selectPagination(params: PaginationParams): Promise<PaginatedResponse<DronePositionsArchiveAttributes>> {
        try {
            const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;
            
            this.logger.info('Fetching paginated drone positions archive data', { page, limit, sortBy, sortOrder });
            
            // 統計總數
            const totalItems = await DronePositionsArchiveModel.count();
            const totalPages = Math.ceil(totalItems / limit);
            
            // 取得分頁資料
            const archives = await DronePositionsArchiveModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });
            
            const data = archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
            
            const response: PaginatedResponse<DronePositionsArchiveAttributes> = {
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
            
            this.logger.info(`Successfully fetched paginated drone positions archive data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            this.logger.error('Error fetching paginated drone positions archive data', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    async findById(id: number): Promise<DronePositionsArchiveAttributes | null> {
        try {
            this.logger.info('Fetching drone positions archive by ID', { id });
            const archive = await DronePositionsArchiveModel.findByPk(id);
            
            if (archive) {
                this.logger.info('Drone positions archive found', { id });
                return archive.toJSON() as DronePositionsArchiveAttributes;
            } else {
                this.logger.warn('Drone positions archive not found', { id });
                return null;
            }
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據原始 ID 取得歸檔資料
     * 
     * @param {number} originalId - 原始資料表的 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    async findByOriginalId(originalId: number): Promise<DronePositionsArchiveAttributes | null> {
        try {
            this.logger.info('Fetching drone positions archive by original ID', { originalId });
            const archive = await DronePositionsArchiveModel.findOne({
                where: { original_id: originalId }
            });
            
            if (archive) {
                this.logger.info('Drone positions archive found by original ID', { originalId });
                return archive.toJSON() as DronePositionsArchiveAttributes;
            } else {
                this.logger.warn('Drone positions archive not found by original ID', { originalId });
                return null;
            }
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by original ID', { originalId, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定無人機的位置歷史歸檔陣列
     */
    async findByDroneId(droneId: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching drone positions archive by drone ID', { droneId, limit });
            
            const archives = await DronePositionsArchiveModel.findAll({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} positions archive records for drone ${droneId}`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by drone ID', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢位置歷史歸檔
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 500
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定時間範圍的位置歷史歸檔陣列
     */
    async findByTimeRange(startTime: Date, endTime: Date, limit: number = 500): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching drone positions archive by time range', { startTime, endTime, limit });
            
            const archives = await DronePositionsArchiveModel.findAll({
                where: {
                    timestamp: {
                        [Op.between]: [startTime, endTime]
                    }
                },
                order: [['timestamp', 'ASC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} positions archive records in time range`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by time range', { startTime, endTime, limit, error });
            throw error;
        }
    }

    /**
     * 根據歸檔批次 ID 查詢資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定批次的位置歷史歸檔陣列
     */
    async findByBatchId(batchId: string): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching drone positions archive by batch ID', { batchId });
            
            const archives = await DronePositionsArchiveModel.findAll({
                where: { archive_batch_id: batchId },
                order: [['timestamp', 'ASC']]
            });
            
            this.logger.info(`Successfully fetched ${archives.length} positions archive records for batch ${batchId}`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by batch ID', { batchId, error });
            throw error;
        }
    }

    /**
     * 根據歸檔時間範圍查詢資料
     * 
     * @param {Date} startDate - 開始歸檔時間
     * @param {Date} endDate - 結束歸檔時間
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定歸檔時間範圍的資料陣列
     */
    async findByArchivedDateRange(startDate: Date, endDate: Date, limit: number = 200): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching drone positions archive by archived date range', { startDate, endDate, limit });
            
            const archives = await DronePositionsArchiveModel.findAll({
                where: {
                    archived_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['archived_at', 'DESC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} positions archive records in archived date range`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by archived date range', { startDate, endDate, limit, error });
            throw error;
        }
    }

    /**
     * 根據地理邊界查詢位置歷史歸檔
     * 
     * @param {number} minLat - 最小緯度
     * @param {number} maxLat - 最大緯度
     * @param {number} minLng - 最小經度
     * @param {number} maxLng - 最大經度
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定地理邊界內的位置歷史歸檔陣列
     */
    async findByGeoBounds(minLat: number, maxLat: number, minLng: number, maxLng: number, limit: number = 200): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching drone positions archive by geo bounds', { minLat, maxLat, minLng, maxLng, limit });
            
            const archives = await DronePositionsArchiveModel.findAll({
                where: {
                    latitude: {
                        [Op.between]: [minLat, maxLat]
                    },
                    longitude: {
                        [Op.between]: [minLng, maxLng]
                    }
                },
                order: [['timestamp', 'DESC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} positions archive records in geo bounds`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone positions archive by geo bounds', { minLat, maxLat, minLng, maxLng, limit, error });
            throw error;
        }
    }

    /**
     * 根據無人機和時間範圍查詢軌跡
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 1000
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 無人機軌跡資料陣列（按時間排序）
     */
    async findTrajectoryByDroneAndTime(droneId: number, startTime: Date, endTime: Date, limit: number = 1000): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching drone trajectory by drone and time', { droneId, startTime, endTime, limit });
            
            const archives = await DronePositionsArchiveModel.findAll({
                where: {
                    drone_id: droneId,
                    timestamp: {
                        [Op.between]: [startTime, endTime]
                    }
                },
                order: [['timestamp', 'ASC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} trajectory points for drone ${droneId}`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone trajectory by drone and time', { droneId, startTime, endTime, limit, error });
            throw error;
        }
    }

    /**
     * 取得最新的歷史歸檔記錄
     * 
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 最新的歷史歸檔記錄陣列
     */
    async findLatest(limit: number = 50): Promise<DronePositionsArchiveAttributes[]> {
        try {
            this.logger.info('Fetching latest drone positions archive records', { limit });
            
            const archives = await DronePositionsArchiveModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });
            
            this.logger.info(`Successfully fetched ${archives.length} latest positions archive records`);
            return archives.map(item => item.toJSON() as DronePositionsArchiveAttributes);
        } catch (error) {
            this.logger.error('Error fetching latest drone positions archive records', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 最新的歷史歸檔記錄或 null
     */
    async findLatestByDroneId(droneId: number): Promise<DronePositionsArchiveAttributes | null> {
        try {
            this.logger.info('Fetching latest drone positions archive by drone ID', { droneId });
            
            const archive = await DronePositionsArchiveModel.findOne({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']]
            });
            
            if (archive) {
                this.logger.info('Latest positions archive record found for drone', { droneId });
                return archive.toJSON() as DronePositionsArchiveAttributes;
            } else {
                this.logger.warn('No positions archive records found for drone', { droneId });
                return null;
            }
        } catch (error) {
            this.logger.error('Error fetching latest drone positions archive by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 統計總記錄數
     * 
     * @returns {Promise<number>} 總記錄數
     */
    async count(): Promise<number> {
        try {
            this.logger.info('Counting total drone positions archive records');
            const count = await DronePositionsArchiveModel.count();
            
            this.logger.info(`Total positions archive records: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting total drone positions archive records', { error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計記錄數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的記錄數
     */
    async countByDroneId(droneId: number): Promise<number> {
        try {
            this.logger.info('Counting drone positions archive records by drone ID', { droneId });
            const count = await DronePositionsArchiveModel.count({
                where: { drone_id: droneId }
            });
            
            this.logger.info(`Positions archive records for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting drone positions archive records by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍統計記錄數
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<number>} 指定時間範圍的記錄數
     */
    async countByTimeRange(startTime: Date, endTime: Date): Promise<number> {
        try {
            this.logger.info('Counting drone positions archive records by time range', { startTime, endTime });
            const count = await DronePositionsArchiveModel.count({
                where: {
                    timestamp: {
                        [Op.between]: [startTime, endTime]
                    }
                }
            });
            
            this.logger.info(`Positions archive records in time range: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting drone positions archive records by time range', { startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 根據歸檔批次統計記錄數
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 指定批次的記錄數
     */
    async countByBatchId(batchId: string): Promise<number> {
        try {
            this.logger.info('Counting drone positions archive records by batch ID', { batchId });
            const count = await DronePositionsArchiveModel.count({
                where: { archive_batch_id: batchId }
            });
            
            this.logger.info(`Positions archive records for batch ${batchId}: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting drone positions archive records by batch ID', { batchId, error });
            throw error;
        }
    }
}
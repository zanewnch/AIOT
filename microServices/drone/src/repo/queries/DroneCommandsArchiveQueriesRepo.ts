/**
 * @fileoverview 無人機指令歷史歸檔查詢 Repository - CQRS 查詢端
 *
 * 專門處理無人機指令歷史歸檔資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandsArchiveModel, type DroneCommandsArchiveAttributes } from '../../models/DroneCommandsArchiveModel.js';
import type { PaginationParams, PaginatedResponse } from '../../../../../packages/types/ApiResponseType.js';
import { createLogger } from '../../../../../packages/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DroneCommandsArchiveQueriesRepository');

/**
 * 無人機指令歷史歸檔查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機指令歷史歸檔資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneCommandsArchiveQueriesRepository
 */
@injectable()
export class DroneCommandsArchiveQueriesRepository {
    /**
     * 取得所有指令歷史歸檔資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    async selectAll(limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching all drone commands archive data', { limit });
            const archives = await DroneCommandsArchiveModel.findAll({
                order: [['created_at', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${archives.length} commands archive records`);
            return archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching all drone commands archive data', { error });
            throw error;
        }
    }

    /**
     * 取得分頁指令歷史歸檔資料
     *
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneCommandsArchiveAttributes>>} 分頁歷史歸檔資料
     */
    async selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneCommandsArchiveAttributes>> {
        try {
            const { page, limit, sortBy = 'created_at', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;

            logger.info('Fetching paginated drone commands archive', { page, limit, sortBy, sortOrder });

            // 統計總數
            const totalItems = await DroneCommandsArchiveModel.count();
            const totalPages = Math.ceil(totalItems / limit);

            // 取得分頁資料
            const archives = await DroneCommandsArchiveModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });

            const data = archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);

            const response: PaginatedResponse<DroneCommandsArchiveAttributes> = {
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

            logger.info(`Successfully fetched paginated commands archive: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            logger.error('Error fetching paginated drone commands archive', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 指令歷史歸檔資料或 null
     */
    async selectById(id: number): Promise<DroneCommandsArchiveAttributes | null> {
        try {
            logger.info('Fetching drone command archive by ID', { id });
            const archive = await DroneCommandsArchiveModel.findByPk(id);

            if (archive) {
                logger.info('Successfully fetched command archive by ID', { id });
                return archive.toJSON() as DroneCommandsArchiveAttributes;
            } else {
                logger.warn('Command archive not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone command archive by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 取得指令歷史歸檔資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    async selectByDroneId(droneId: number, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by drone ID', { droneId, limit });
            const archives = await DroneCommandsArchiveModel.findAll({
                where: { drone_id: droneId },
                order: [['created_at', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${archives.length} commands archive records for drone`, { droneId });
            return archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone command archives by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍取得指令歷史歸檔資料
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    async selectByTimeRange(startTime: Date, endTime: Date, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by time range', { startTime, endTime, limit });
            const archives = await DroneCommandsArchiveModel.findAll({
                where: {
                    created_at: {
                        [Op.between]: [startTime, endTime]
                    }
                },
                order: [['created_at', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${archives.length} commands archive records for time range`);
            return archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone command archives by time range', { startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 根據指令類型取得指令歷史歸檔資料
     *
     * @param {string} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    async selectByCommandType(commandType: string, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by command type', { commandType, limit });
            const archives = await DroneCommandsArchiveModel.findAll({
                where: { command_type: commandType },
                order: [['created_at', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${archives.length} commands archive records for command type`, { commandType });
            return archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone command archives by command type', { commandType, error });
            throw error;
        }
    }

    /**
     * 根據指令狀態取得指令歷史歸檔資料
     *
     * @param {string} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    async selectByStatus(status: string, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by status', { status, limit });
            const archives = await DroneCommandsArchiveModel.findAll({
                where: { status },
                order: [['created_at', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${archives.length} commands archive records for status`, { status });
            return archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);
        } catch (error) {
            logger.error('Error fetching drone command archives by status', { status, error });
            throw error;
        }
    }

    /**
     * 統計總歷史歸檔數量
     *
     * @returns {Promise<number>} 總歷史歸檔數量
     */
    async count(): Promise<number> {
        try {
            logger.info('Counting total drone commands archive');
            const count = await DroneCommandsArchiveModel.count();

            logger.info(`Total commands archive count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands archive', { error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計歷史歸檔數量
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的歷史歸檔數量
     */
    async countByDroneId(droneId: number): Promise<number> {
        try {
            logger.info('Counting drone commands archive by drone ID', { droneId });
            const count = await DroneCommandsArchiveModel.count({
                where: { drone_id: droneId }
            });

            logger.info(`Commands archive for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands archive by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據指令類型統計歷史歸檔數量
     *
     * @param {string} commandType - 指令類型
     * @returns {Promise<number>} 指定類型的歷史歸檔數量
     */
    async countByCommandType(commandType: string): Promise<number> {
        try {
            logger.info('Counting drone commands archive by command type', { commandType });
            const count = await DroneCommandsArchiveModel.count({
                where: { command_type: commandType }
            });

            logger.info(`Commands archive of type ${commandType}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands archive by command type', { commandType, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍統計歷史歸檔數量
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<number>} 指定時間範圍的歷史歸檔數量
     */
    async countByTimeRange(startTime: Date, endTime: Date): Promise<number> {
        try {
            logger.info('Counting drone commands archive by time range', { startTime, endTime });
            const count = await DroneCommandsArchiveModel.count({
                where: {
                    created_at: {
                        [Op.between]: [startTime, endTime]
                    }
                }
            });

            logger.info(`Commands archive in time range: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands archive by time range', { startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 根據狀態統計歷史歸檔數量
     *
     * @param {string} status - 指令狀態
     * @returns {Promise<number>} 指定狀態的歷史歸檔數量
     */
    async countByStatus(status: string): Promise<number> {
        try {
            logger.info('Counting drone commands archive by status', { status });
            const count = await DroneCommandsArchiveModel.count({
                where: { status }
            });

            logger.info(`Commands archive with status ${status}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands archive by status', { status, error });
            throw error;
        }
    }
}
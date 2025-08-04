/**
 * @fileoverview 無人機指令歷史歸檔 Repository 實現
 *
 * 實現無人機指令歷史歸檔資料存取層的具體邏輯，使用 Sequelize ORM 進行資料庫操作。
 * 遵循 Repository Pattern，提供清晰的資料存取介面。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DroneCommandsArchiveModel, type DroneCommandsArchiveAttributes, type DroneCommandsArchiveCreationAttributes } from '../../models/drone/DroneCommandsArchiveModel.js';
import type { IDroneCommandsArchiveRepository } from '../../types/repositories/IDroneCommandsArchiveRepository.js';
import type { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DroneCommandsArchiveRepository');

/**
 * 無人機指令歷史歸檔 Repository 實現類別
 *
 * 實現 IDroneCommandsArchiveRepository 介面，提供指令歷史歸檔資料的具體存取方法
 *
 * @class DroneCommandsArchiveRepository
 * @implements {IDroneCommandsArchiveRepository}
 */
export class DroneCommandsArchiveRepository implements IDroneCommandsArchiveRepository {
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
     * 創建新的指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes} data - 要創建的歸檔資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 創建後的歸檔資料
     */
    async insert(data: DroneCommandsArchiveCreationAttributes): Promise<DroneCommandsArchiveAttributes> {
        try {
            logger.info('Creating new drone command archive', { droneId: data.drone_id, commandType: data.command_type });
            const archive = await DroneCommandsArchiveModel.create(data);

            logger.info('Successfully created command archive', { id: archive.id });
            return archive.toJSON() as DroneCommandsArchiveAttributes;
        } catch (error) {
            logger.error('Error creating drone command archive', { data, error });
            throw error;
        }
    }

    /**
     * 更新指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 更新後的歸檔資料或 null
     */
    async update(id: number, data: Partial<DroneCommandsArchiveAttributes>): Promise<DroneCommandsArchiveAttributes | null> {
        try {
            logger.info('Updating drone command archive', { id, data });
            const [affectedRows] = await DroneCommandsArchiveModel.update(data, {
                where: { id }
            });

            if (affectedRows === 0) {
                logger.warn('Command archive not found for update', { id });
                return null;
            }

            const updatedArchive = await DroneCommandsArchiveModel.findByPk(id);
            if (updatedArchive) {
                logger.info('Successfully updated command archive', { id });
                return updatedArchive.toJSON() as DroneCommandsArchiveAttributes;
            } else {
                logger.error('Failed to fetch updated command archive', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error updating drone command archive', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone command archive', { id });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: { id }
            });

            const success = deletedRows > 0;
            if (success) {
                logger.info('Successfully deleted command archive', { id });
            } else {
                logger.warn('Command archive not found for deletion', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error deleting drone command archive', { id, error });
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
}
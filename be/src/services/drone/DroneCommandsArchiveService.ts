/**
 * @fileoverview 無人機指令歷史歸檔 Service 實現
 *
 * 實現無人機指令歷史歸檔業務邏輯層的具體邏輯，處理資料驗證、業務規則和複雜查詢。
 * 遵循 Service Layer Pattern，封裝所有與指令歷史歸檔相關的業務邏輯。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { IDroneCommandsArchiveService } from '../../types/services/IDroneCommandsArchiveService.js';
import type { IDroneCommandsArchiveRepository } from '../../types/repositories/IDroneCommandsArchiveRepository.js';
import { DroneCommandsArchiveRepository } from '../repo/DroneCommandsArchiveRepo.js';
import type { DroneCommandsArchiveAttributes, DroneCommandsArchiveCreationAttributes } from '../../models/DroneCommandsArchiveModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('DroneCommandsArchiveService');

/**
 * 無人機指令歷史歸檔 Service 實現類別
 *
 * 實現 IDroneCommandsArchiveService 介面，提供指令歷史歸檔的業務邏輯處理
 *
 * @class DroneCommandsArchiveService
 * @implements {IDroneCommandsArchiveService}
 */
export class DroneCommandsArchiveService implements IDroneCommandsArchiveService {
    private archiveRepository: IDroneCommandsArchiveRepository;

    /**
     * 建構子
     *
     * @param {IDroneCommandsArchiveRepository} archiveRepository - 指令歷史歸檔 Repository 實例
     */
    constructor() {
        this.archiveRepository = new DroneCommandsArchiveRepository();
    }

    /**
     * 取得所有指令歷史歸檔資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    async getAllCommandsArchive(limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching all drone commands archive data', { limit });

            // 驗證限制參數
            if (limit <= 0 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }

            const archives = await this.archiveRepository.selectAll(limit);
            logger.info(`Successfully retrieved ${archives.length} commands archive records`);

            return archives;
        } catch (error) {
            logger.error('Error in getAllCommandsArchive', { error, limit });
            throw error;
        }
    }

    /**
     * 根據 ID 取得指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<DroneCommandsArchiveAttributes>} 指令歷史歸檔資料
     * @throws {Error} 當資料不存在時拋出錯誤
     */
    async getCommandArchiveById(id: number): Promise<DroneCommandsArchiveAttributes> {
        try {
            logger.info('Fetching drone command archive by ID', { id });

            // 驗證 ID 參數
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('Invalid ID: must be a positive integer');
            }

            const archive = await this.archiveRepository.selectById(id);

            if (!archive) {
                throw new Error(`Command archive with ID ${id} not found`);
            }

            logger.info('Successfully retrieved command archive by ID', { id });
            return archive;
        } catch (error) {
            logger.error('Error in getCommandArchiveById', { error, id });
            throw error;
        }
    }

    /**
     * 創建新的指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes} data - 要創建的歸檔資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 創建後的歸檔資料
     */
    async createCommandArchive(data: DroneCommandsArchiveCreationAttributes): Promise<DroneCommandsArchiveAttributes> {
        try {
            logger.info('Creating new drone command archive', { droneId: data.drone_id, commandType: data.command_type });

            // 驗證必要欄位
            this.validateCommandArchiveData(data);

            const archive = await this.archiveRepository.insert(data);
            logger.info('Successfully created command archive', { id: archive.id });

            return archive;
        } catch (error) {
            logger.error('Error in createCommandArchive', { error, data });
            throw error;
        }
    }

    /**
     * 更新指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 更新後的歸檔資料
     * @throws {Error} 當資料不存在時拋出錯誤
     */
    async updateCommandArchive(id: number, data: Partial<DroneCommandsArchiveAttributes>): Promise<DroneCommandsArchiveAttributes> {
        try {
            logger.info('Updating drone command archive', { id, data });

            // 驗證 ID 參數
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('Invalid ID: must be a positive integer');
            }

            const updatedArchive = await this.archiveRepository.update(id, data);

            if (!updatedArchive) {
                throw new Error(`Command archive with ID ${id} not found`);
            }

            logger.info('Successfully updated command archive', { id });
            return updatedArchive;
        } catch (error) {
            logger.error('Error in updateCommandArchive', { error, id, data });
            throw error;
        }
    }

    /**
     * 刪除指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    async deleteCommandArchive(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone command archive', { id });

            // 驗證 ID 參數
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('Invalid ID: must be a positive integer');
            }

            const success = await this.archiveRepository.delete(id);

            if (success) {
                logger.info('Successfully deleted command archive', { id });
            } else {
                logger.warn('Command archive not found for deletion', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error in deleteCommandArchive', { error, id });
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
    async getCommandArchivesByDroneId(droneId: number, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by drone ID', { droneId, limit });

            // 驗證參數
            if (!Number.isInteger(droneId) || droneId <= 0) {
                throw new Error('Invalid drone ID: must be a positive integer');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }

            const archives = await this.archiveRepository.selectByDroneId(droneId, limit);
            logger.info(`Successfully retrieved ${archives.length} commands archive records for drone`, { droneId });

            return archives;
        } catch (error) {
            logger.error('Error in getCommandArchivesByDroneId', { error, droneId, limit });
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
    async getCommandArchivesByTimeRange(startTime: Date, endTime: Date, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by time range', { startTime, endTime, limit });

            // 驗證參數
            if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
                throw new Error('Invalid date parameters: must be Date objects');
            }
            if (startTime >= endTime) {
                throw new Error('Start time must be before end time');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }

            const archives = await this.archiveRepository.selectByTimeRange(startTime, endTime, limit);
            logger.info(`Successfully retrieved ${archives.length} commands archive records for time range`);

            return archives;
        } catch (error) {
            logger.error('Error in getCommandArchivesByTimeRange', { error, startTime, endTime, limit });
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
    async getCommandArchivesByType(commandType: string, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by command type', { commandType, limit });

            // 驗證參數
            if (!commandType || typeof commandType !== 'string') {
                throw new Error('Invalid command type: must be a non-empty string');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }

            const archives = await this.archiveRepository.selectByCommandType(commandType, limit);
            logger.info(`Successfully retrieved ${archives.length} commands archive records for command type`, { commandType });

            return archives;
        } catch (error) {
            logger.error('Error in getCommandArchivesByType', { error, commandType, limit });
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
    async getCommandArchivesByStatus(status: string, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Fetching drone command archives by status', { status, limit });

            // 驗證參數
            if (!status || typeof status !== 'string') {
                throw new Error('Invalid status: must be a non-empty string');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }

            const archives = await this.archiveRepository.selectByStatus(status, limit);
            logger.info(`Successfully retrieved ${archives.length} commands archive records for status`, { status });

            return archives;
        } catch (error) {
            logger.error('Error in getCommandArchivesByStatus', { error, status, limit });
            throw error;
        }
    }

    /**
     * 驗證指令歷史歸檔資料
     *
     * @private
     * @param {DroneCommandsArchiveCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料無效時拋出錯誤
     */
    private validateCommandArchiveData(data: DroneCommandsArchiveCreationAttributes): void {
        if (!Number.isInteger(data.drone_id) || data.drone_id <= 0) {
            throw new Error('Invalid drone ID: must be a positive integer');
        }

        if (!data.command_type || typeof data.command_type !== 'string') {
            throw new Error('Invalid command type: must be a non-empty string');
        }

        if (!data.status || typeof data.status !== 'string') {
            throw new Error('Invalid status: must be a non-empty string');
        }

        // 可以添加更多驗證邏輯
    }
}
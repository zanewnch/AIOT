/**
 * @fileoverview 無人機指令歷史歸檔查詢 Service 實現
 *
 * 此文件實作了無人機指令歷史歸檔查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandsArchiveQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import type { IDroneCommandsArchiveRepository } from '../../types/repositories/IDroneCommandsArchiveRepository.js';
import { DroneCommandsArchiveQueriesRepository } from '../../repo/queries/DroneCommandsArchiveQueriesRepo.js';
import { DroneCommandsArchiveCommandsRepository } from '../../repo/commands/DroneCommandsArchiveCommandsRepo.js';
import type { DroneCommandsArchiveAttributes } from '../../models/DroneCommandsArchiveModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneCommandsArchiveQueriesSvc');

/**
 * 無人機指令歷史歸檔查詢 Service 實現類別
 *
 * 專門處理無人機指令歷史歸檔相關的查詢請求，包含取得歸檔資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandsArchiveQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneCommandsArchiveQueriesSvc {
    private queriesRepository: DroneCommandsArchiveQueriesRepository;
    private commandsRepository: DroneCommandsArchiveCommandsRepository;
    private archiveRepository: IDroneCommandsArchiveRepository; // 組合介面

    constructor() {
        this.queriesRepository = new DroneCommandsArchiveQueriesRepository();
        this.commandsRepository = new DroneCommandsArchiveCommandsRepository();
        
        // 創建組合repository
        this.archiveRepository = Object.assign(
            Object.create(Object.getPrototypeOf(this.queriesRepository)),
            this.queriesRepository,
            this.commandsRepository
        ) as IDroneCommandsArchiveRepository;
    }

    /**
     * 取得所有指令歷史歸檔資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    getAllCommandsArchive = async (limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> => {
        try {
            logger.info('Getting all drone commands archive data', { limit });

            // 驗證限制參數
            if (limit <= 0 || limit > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }

            const archives = await this.archiveRepository.selectAll(limit);
            logger.info(`Successfully retrieved ${archives.length} commands archive records`);

            return archives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據 ID 取得指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 指令歷史歸檔資料或 null
     */
    getCommandArchiveById = async (id: number): Promise<DroneCommandsArchiveAttributes | null> => {
        try {
            logger.info('Getting drone command archive by ID', { id });

            // 驗證 ID 參數
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('Invalid ID: must be a positive integer');
            }

            const archive = await this.archiveRepository.selectById(id);

            if (archive) {
                logger.info('Successfully retrieved command archive by ID', { id });
            } else {
                logger.info('Command archive not found', { id });
            }

            return archive;
        } catch (error) {
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
    getCommandArchivesByDroneId = async (droneId: number, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> => {
        try {
            logger.info('Getting drone command archives by drone ID', { droneId, limit });

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
    getCommandArchivesByTimeRange = async (startTime: Date, endTime: Date, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> => {
        try {
            logger.info('Getting drone command archives by time range', { startTime, endTime, limit });

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
    getCommandArchivesByType = async (commandType: string, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> => {
        try {
            logger.info('Getting drone command archives by command type', { commandType, limit });

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
    getCommandArchivesByStatus = async (status: string, limit: number = 100): Promise<DroneCommandsArchiveAttributes[]> => {
        try {
            logger.info('Getting drone command archives by status', { status, limit });

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
            throw error;
        }
    }
}
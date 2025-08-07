/**
 * @fileoverview 無人機指令查詢 Repository - CQRS 查詢端
 * 
 * 專門處理無人機指令資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandModel, type DroneCommandAttributes, DroneCommandType, DroneCommandStatus } from '../../models/drone/DroneCommandModel.js';
import type { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DroneCommandQueriesRepository');

/**
 * 無人機指令查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理無人機指令資料的查詢操作，遵循 CQRS 模式
 * 
 * @class DroneCommandQueriesRepository
 */
@injectable()
export class DroneCommandQueriesRepository {
    /**
     * 取得所有無人機指令
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 無人機指令陣列
     */
    async selectAll(limit: number = 100): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching all drone commands', { limit });
            const commands = await DroneCommandModel.findAll({
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} drone commands`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching all drone commands', { error });
            throw error;
        }
    }

    /**
     * 取得分頁無人機指令
     * 
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneCommandAttributes>>} 分頁無人機指令資料
     */
    async selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneCommandAttributes>> {
        try {
            const { page, limit, sortBy = 'issued_at', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;
            
            logger.info('Fetching paginated drone commands', { page, limit, sortBy, sortOrder });
            
            // 統計總數
            const totalItems = await DroneCommandModel.count();
            const totalPages = Math.ceil(totalItems / limit);
            
            // 取得分頁資料
            const commands = await DroneCommandModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });
            
            const data = commands.map(item => item.toJSON() as DroneCommandAttributes);
            
            const response: PaginatedResponse<DroneCommandAttributes> = {
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
            
            logger.info(`Successfully fetched paginated drone commands: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            logger.error('Error fetching paginated drone commands', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆無人機指令
     * 
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 無人機指令或 null
     */
    async findById(id: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Fetching drone command by ID', { id });
            const command = await DroneCommandModel.findByPk(id);
            
            if (command) {
                logger.info('Drone command found', { id });
                return command.toJSON() as DroneCommandAttributes;
            } else {
                logger.warn('Drone command not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone command by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定無人機的指令陣列
     */
    async findByDroneId(droneId: number, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by drone ID', { droneId, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { drone_id: droneId },
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} commands for drone ${droneId}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by drone ID', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 根據指令狀態查詢
     * 
     * @param {DroneCommandStatus} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定狀態的指令陣列
     */
    async findByStatus(status: DroneCommandStatus, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by status', { status, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { status },
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} commands with status ${status}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by status', { status, limit, error });
            throw error;
        }
    }

    /**
     * 根據指令類型查詢
     * 
     * @param {DroneCommandType} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定類型的指令陣列
     */
    async findByCommandType(commandType: DroneCommandType, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by command type', { commandType, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { command_type: commandType },
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} commands of type ${commandType}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by command type', { commandType, limit, error });
            throw error;
        }
    }

    /**
     * 根據發送者查詢指令
     * 
     * @param {number} issuedBy - 發送者 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定發送者的指令陣列
     */
    async findByIssuedBy(issuedBy: number, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by issued by', { issuedBy, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { issued_by: issuedBy },
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} commands issued by user ${issuedBy}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by issued by', { issuedBy, limit, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢指令
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 指定時間範圍的指令陣列
     */
    async findByDateRange(startDate: Date, endDate: Date, limit: number = 100): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by date range', { startDate, endDate, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: {
                    issued_at: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['issued_at', 'ASC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} commands in date range`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by date range', { startDate, endDate, limit, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 和狀態查詢指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {DroneCommandStatus} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 符合條件的指令陣列
     */
    async findByDroneIdAndStatus(droneId: number, status: DroneCommandStatus, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by drone ID and status', { droneId, status, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { 
                    drone_id: droneId,
                    status 
                },
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} commands for drone ${droneId} with status ${status}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by drone ID and status', { droneId, status, limit, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 和指令類型查詢
     * 
     * @param {number} droneId - 無人機 ID
     * @param {DroneCommandType} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 符合條件的指令陣列
     */
    async findByDroneIdAndCommandType(droneId: number, commandType: DroneCommandType, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching drone commands by drone ID and command type', { droneId, commandType, limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { 
                    drone_id: droneId,
                    command_type: commandType 
                },
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} ${commandType} commands for drone ${droneId}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching drone commands by drone ID and command type', { droneId, commandType, limit, error });
            throw error;
        }
    }

    /**
     * 取得無人機的待執行指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes[]>} 待執行的指令陣列（按發送時間排序）
     */
    async findPendingCommandsByDroneId(droneId: number): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching pending commands for drone', { droneId });
            
            const commands = await DroneCommandModel.findAll({
                where: { 
                    drone_id: droneId,
                    status: DroneCommandStatus.PENDING 
                },
                order: [['issued_at', 'ASC']] // 按發送時間順序執行
            });
            
            logger.info(`Successfully fetched ${commands.length} pending commands for drone ${droneId}`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching pending commands for drone', { droneId, error });
            throw error;
        }
    }

    /**
     * 取得正在執行的指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 正在執行的指令或 null
     */
    async findExecutingCommandByDroneId(droneId: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Fetching executing command for drone', { droneId });
            
            const command = await DroneCommandModel.findOne({
                where: { 
                    drone_id: droneId,
                    status: DroneCommandStatus.EXECUTING 
                },
                order: [['executed_at', 'DESC']]
            });
            
            if (command) {
                logger.info('Executing command found for drone', { droneId, commandId: command.id });
                return command.toJSON() as DroneCommandAttributes;
            } else {
                logger.info('No executing command found for drone', { droneId });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching executing command for drone', { droneId, error });
            throw error;
        }
    }

    /**
     * 取得最新的指令記錄
     * 
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneCommandAttributes[]>} 最新的指令記錄陣列
     */
    async findLatest(limit: number = 20): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching latest drone commands', { limit });
            
            const commands = await DroneCommandModel.findAll({
                order: [['issued_at', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} latest commands`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching latest drone commands', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 最新的指令記錄或 null
     */
    async findLatestByDroneId(droneId: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Fetching latest command for drone', { droneId });
            
            const command = await DroneCommandModel.findOne({
                where: { drone_id: droneId },
                order: [['issued_at', 'DESC']]
            });
            
            if (command) {
                logger.info('Latest command found for drone', { droneId, commandId: command.id });
                return command.toJSON() as DroneCommandAttributes;
            } else {
                logger.warn('No commands found for drone', { droneId });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching latest command for drone', { droneId, error });
            throw error;
        }
    }

    /**
     * 取得失敗的指令
     * 
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 失敗的指令陣列
     */
    async findFailedCommands(limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching failed commands', { limit });
            
            const commands = await DroneCommandModel.findAll({
                where: { status: DroneCommandStatus.FAILED },
                order: [['updatedAt', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} failed commands`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching failed commands', { limit, error });
            throw error;
        }
    }

    /**
     * 取得超時的指令（發送後超過指定時間仍未執行）
     * 
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 超時的指令陣列
     */
    async findTimeoutCommands(timeoutMinutes: number, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Fetching timeout commands', { timeoutMinutes, limit });
            
            const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
            
            const commands = await DroneCommandModel.findAll({
                where: { 
                    status: DroneCommandStatus.PENDING,
                    issued_at: {
                        [Op.lt]: timeoutDate
                    }
                },
                order: [['issued_at', 'ASC']],
                limit
            });
            
            logger.info(`Successfully fetched ${commands.length} timeout commands`);
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error fetching timeout commands', { timeoutMinutes, limit, error });
            throw error;
        }
    }

    /**
     * 統計總指令數
     * 
     * @returns {Promise<number>} 總指令數
     */
    async count(): Promise<number> {
        try {
            logger.info('Counting total drone commands');
            const count = await DroneCommandModel.count();
            
            logger.info(`Total drone commands: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting total drone commands', { error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計指令數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的指令數
     */
    async countByDroneId(droneId: number): Promise<number> {
        try {
            logger.info('Counting drone commands by drone ID', { droneId });
            const count = await DroneCommandModel.count({
                where: { drone_id: droneId }
            });
            
            logger.info(`Commands for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據狀態統計指令數
     * 
     * @param {DroneCommandStatus} status - 指令狀態
     * @returns {Promise<number>} 指定狀態的指令數
     */
    async countByStatus(status: DroneCommandStatus): Promise<number> {
        try {
            logger.info('Counting drone commands by status', { status });
            const count = await DroneCommandModel.count({
                where: { status }
            });
            
            logger.info(`Commands with status ${status}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands by status', { status, error });
            throw error;
        }
    }

    /**
     * 根據指令類型統計指令數
     * 
     * @param {DroneCommandType} commandType - 指令類型
     * @returns {Promise<number>} 指定類型的指令數
     */
    async countByCommandType(commandType: DroneCommandType): Promise<number> {
        try {
            logger.info('Counting drone commands by command type', { commandType });
            const count = await DroneCommandModel.count({
                where: { command_type: commandType }
            });
            
            logger.info(`Commands of type ${commandType}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands by command type', { commandType, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍統計指令數
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @returns {Promise<number>} 指定時間範圍的指令數
     */
    async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
        try {
            logger.info('Counting drone commands by date range', { startDate, endDate });
            const count = await DroneCommandModel.count({
                where: {
                    issued_at: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            
            logger.info(`Commands in date range: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone commands by date range', { startDate, endDate, error });
            throw error;
        }
    }
}
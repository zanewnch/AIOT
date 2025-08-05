/**
 * @fileoverview 無人機指令 Service 實現
 *
 * 實現無人機指令業務邏輯層的具體邏輯，處理資料驗證、業務規則和指令管理。
 * 遵循 Service Layer Pattern，封裝所有與無人機指令相關的業務邏輯。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type {
    IDroneCommandService,
    CommandStatistics,
    CommandTypeStatistics,
    DroneCommandSummary,
    CommandExecutionResult,
    BatchCommandResult
} from '../../types/services/IDroneCommandService.js';
import type { IDroneCommandRepository } from '../../types/repositories/IDroneCommandRepository.js';
import { DroneCommandRepository } from '../../repo/drone/DroneCommandRepo.js';
import type { DroneCommandAttributes, DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/drone/DroneCommandModel.js';
import { DroneCommandType as CommandType, DroneCommandStatus as CommandStatus } from '../../models/drone/DroneCommandModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('DroneCommandService');

/**
 * 無人機指令 Service 實現類別
 *
 * 實現 IDroneCommandService 介面，提供無人機指令的業務邏輯處理
 *
 * @class DroneCommandService
 * @implements {IDroneCommandService}
 */
export class DroneCommandService implements IDroneCommandService {
    private commandRepository: IDroneCommandRepository;

    /**
     * 建構子
     */
    constructor() {
        this.commandRepository = new DroneCommandRepository();
    }

    /**
     * 取得所有無人機指令
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 無人機指令陣列
     */
    async getAllCommands(limit: number = 100): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting all commands', { limit });

            // 驗證 limit 參數
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.selectAll(limit);

            logger.info(`Successfully retrieved ${commands.length} commands`);
            return commands;
        } catch (error) {
            logger.error('Error in getAllCommands', { limit, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆無人機指令
     *
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 無人機指令或 null
     */
    async getCommandById(id: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Getting command by ID', { id });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            const command = await this.commandRepository.findById(id);

            if (command) {
                logger.info('Command found', { id });
            } else {
                logger.info('Command not found', { id });
            }

            return command;
        } catch (error) {
            logger.error('Error in getCommandById', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的無人機指令記錄
     *
     * @param {DroneCommandCreationAttributes} data - 無人機指令建立資料
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async createCommand(data: DroneCommandCreationAttributes): Promise<CommandExecutionResult> {
        try {
            logger.info('Creating command', { data });

            // 驗證指令資料
            if (!await this.validateCommandData(data)) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '指令資料驗證失敗',
                    error: '無效的指令資料'
                };
            }

            // 檢查無人機是否可以接收新指令
            if (!await this.canReceiveNewCommand(data.drone_id)) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '無人機目前無法接收新指令',
                    error: '無人機狀態不允許接收新指令'
                };
            }

            // 檢查指令衝突
            if (await this.checkCommandConflict(data.drone_id, data.command_type)) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '指令與現有指令衝突',
                    error: '存在衝突的指令'
                };
            }

            // 設定預設值
            const commandData = {
                ...data,
                status: CommandStatus.PENDING,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            const createdCommand = await this.commandRepository.create(commandData);

            logger.info('Command created successfully', { id: createdCommand.id });

            return {
                success: true,
                command: createdCommand,
                message: '指令創建成功'
            };
        } catch (error) {
            logger.error('Error in createCommand', { data, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '指令創建失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 批量建立無人機指令記錄
     *
     * @param {DroneCommandCreationAttributes[]} dataArray - 無人機指令建立資料陣列
     * @returns {Promise<BatchCommandResult>} 批次指令執行結果
     */
    async createBatchCommands(dataArray: DroneCommandCreationAttributes[]): Promise<BatchCommandResult> {
        try {
            logger.info('Creating batch commands', { count: dataArray.length });

            const result: BatchCommandResult = {
                successful: [],
                failed: [],
                total: dataArray.length,
                successCount: 0,
                failedCount: 0
            };

            // 驗證批量資料
            if (!dataArray || dataArray.length === 0) {
                throw new Error('批量建立資料不能為空');
            }

            if (dataArray.length > 100) {
                throw new Error('批量建立指令數不能超過 100 筆');
            }

            // 逐一處理每個指令
            for (const data of dataArray) {
                try {
                    const commandResult = await this.createCommand(data);
                    if (commandResult.success) {
                        result.successful.push(commandResult.command);
                        result.successCount++;
                    } else {
                        result.failed.push({
                            command: data,
                            error: commandResult.error || '未知錯誤'
                        });
                        result.failedCount++;
                    }
                } catch (error) {
                    result.failed.push({
                        command: data,
                        error: error instanceof Error ? error.message : '未知錯誤'
                    });
                    result.failedCount++;
                }
            }

            logger.info('Batch commands creation completed', {
                total: result.total,
                successful: result.successCount,
                failed: result.failedCount
            });

            return result;
        } catch (error) {
            logger.error('Error in createBatchCommands', { count: dataArray?.length, error });
            throw error;
        }
    }

    /**
     * 更新無人機指令資料
     *
     * @param {number} id - 無人機指令 ID
     * @param {Partial<DroneCommandCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的無人機指令資料或 null
     */
    async updateCommand(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Updating command', { id, data });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查指令是否存在
            const existingCommand = await this.commandRepository.findById(id);
            if (!existingCommand) {
                throw new Error('指定的指令不存在');
            }

            // 檢查指令是否可以更新
            if (existingCommand.status === CommandStatus.EXECUTING || existingCommand.status === CommandStatus.COMPLETED) {
                throw new Error('正在執行或已完成的指令無法更新');
            }

            const updatedCommand = await this.commandRepository.update(id, data);

            if (updatedCommand) {
                logger.info('Command updated successfully', { id });
            } else {
                logger.warn('Command not found for update', { id });
            }

            return updatedCommand;
        } catch (error) {
            logger.error('Error in updateCommand', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機指令資料
     *
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async deleteCommand(id: number): Promise<boolean> {
        try {
            logger.info('Deleting command', { id });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查指令是否存在
            const existingCommand = await this.commandRepository.findById(id);
            if (!existingCommand) {
                throw new Error('指定的指令不存在');
            }

            // 檢查指令是否可以刪除
            if (existingCommand.status === CommandStatus.EXECUTING) {
                throw new Error('正在執行的指令無法刪除');
            }

            const success = await this.commandRepository.delete(id);

            if (success) {
                logger.info('Command deleted successfully', { id });
            } else {
                logger.warn('Command not found for deletion', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error in deleteCommand', { id, error });
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
    async getCommandsByDroneId(droneId: number, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting commands by drone ID', { droneId, limit });

            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findByDroneId(droneId, limit);

            logger.info(`Successfully retrieved ${commands.length} commands for drone ${droneId}`);
            return commands;
        } catch (error) {
            logger.error('Error in getCommandsByDroneId', { droneId, limit, error });
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
    async getCommandsByStatus(status: DroneCommandStatus, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting commands by status', { status, limit });

            // 驗證參數
            if (!Object.values(CommandStatus).includes(status)) {
                throw new Error('無效的指令狀態');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findByStatus(status, limit);

            logger.info(`Successfully retrieved ${commands.length} commands with status ${status}`);
            return commands;
        } catch (error) {
            logger.error('Error in getCommandsByStatus', { status, limit, error });
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
    async getCommandsByType(commandType: DroneCommandType, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting commands by type', { commandType, limit });

            // 驗證參數
            if (!Object.values(CommandType).includes(commandType)) {
                throw new Error('無效的指令類型');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findByCommandType(commandType, limit);

            logger.info(`Successfully retrieved ${commands.length} commands of type ${commandType}`);
            return commands;
        } catch (error) {
            logger.error('Error in getCommandsByType', { commandType, limit, error });
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
    async getCommandsByIssuedBy(issuedBy: number, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting commands by issued by', { issuedBy, limit });

            // 驗證參數
            if (!issuedBy || issuedBy <= 0) {
                throw new Error('發送者 ID 必須是正整數');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findByIssuedBy(issuedBy, limit);

            logger.info(`Successfully retrieved ${commands.length} commands issued by user ${issuedBy}`);
            return commands;
        } catch (error) {
            logger.error('Error in getCommandsByIssuedBy', { issuedBy, limit, error });
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
    async getCommandsByDateRange(startDate: Date, endDate: Date, limit: number = 100): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting commands by date range', { startDate, endDate, limit });

            // 驗證時間範圍
            if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
                throw new Error('開始時間和結束時間必須是有效的日期');
            }
            if (startDate >= endDate) {
                throw new Error('開始時間必須早於結束時間');
            }
            if (limit <= 0 || limit > 2000) {
                throw new Error('限制筆數必須在 1 到 2000 之間');
            }

            const commands = await this.commandRepository.findByDateRange(startDate, endDate, limit);

            logger.info(`Successfully retrieved ${commands.length} commands in date range`);
            return commands;
        } catch (error) {
            logger.error('Error in getCommandsByDateRange', { startDate, endDate, limit, error });
            throw error;
        }
    }

    /**
     * 取得無人機的待執行指令
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes[]>} 待執行的指令陣列（按發送時間排序）
     */
    async getPendingCommandsByDroneId(droneId: number): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting pending commands by drone ID', { droneId });

            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const commands = await this.commandRepository.findPendingCommandsByDroneId(droneId);

            logger.info(`Successfully retrieved ${commands.length} pending commands for drone ${droneId}`);
            return commands;
        } catch (error) {
            logger.error('Error in getPendingCommandsByDroneId', { droneId, error });
            throw error;
        }
    }

    /**
     * 取得正在執行的指令
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 正在執行的指令或 null
     */
    async getExecutingCommandByDroneId(droneId: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Getting executing command by drone ID', { droneId });

            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const command = await this.commandRepository.findExecutingCommandByDroneId(droneId);

            if (command) {
                logger.info('Executing command found for drone', { droneId, commandId: command.id });
            } else {
                logger.info('No executing command found for drone', { droneId });
            }

            return command;
        } catch (error) {
            logger.error('Error in getExecutingCommandByDroneId', { droneId, error });
            throw error;
        }
    }

    /**
     * 取得最新的指令記錄
     *
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneCommandAttributes[]>} 最新的指令記錄陣列
     */
    async getLatestCommands(limit: number = 20): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting latest commands', { limit });

            // 驗證 limit 參數
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            const commands = await this.commandRepository.findLatest(limit);

            logger.info(`Successfully retrieved ${commands.length} latest commands`);
            return commands;
        } catch (error) {
            logger.error('Error in getLatestCommands', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新指令
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 最新的指令記錄或 null
     */
    async getLatestCommandByDroneId(droneId: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Getting latest command by drone ID', { droneId });

            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const command = await this.commandRepository.findLatestByDroneId(droneId);

            if (command) {
                logger.info('Latest command found for drone', { droneId, commandId: command.id });
            } else {
                logger.info('No commands found for drone', { droneId });
            }

            return command;
        } catch (error) {
            logger.error('Error in getLatestCommandByDroneId', { droneId, error });
            throw error;
        }
    }

    /**
     * 取得失敗的指令
     *
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 失敗的指令陣列
     */
    async getFailedCommands(limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting failed commands', { limit });

            // 驗證 limit 參數
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findFailedCommands(limit);

            logger.info(`Successfully retrieved ${commands.length} failed commands`);
            return commands;
        } catch (error) {
            logger.error('Error in getFailedCommands', { limit, error });
            throw error;
        }
    }

    /**
     * 取得超時的指令
     *
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 超時的指令陣列
     */
    async getTimeoutCommands(timeoutMinutes: number, limit: number = 50): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Getting timeout commands', { timeoutMinutes, limit });

            // 驗證參數
            if (timeoutMinutes <= 0 || timeoutMinutes > 1440) { // 最大 24 小時
                throw new Error('超時時間必須在 1 到 1440 分鐘之間');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findTimeoutCommands(timeoutMinutes, limit);

            logger.info(`Successfully retrieved ${commands.length} timeout commands`);
            return commands;
        } catch (error) {
            logger.error('Error in getTimeoutCommands', { timeoutMinutes, limit, error });
            throw error;
        }
    }

    /**
     * 取得指令統計資料
     *
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<CommandStatistics>} 指令統計資料
     */
    async getCommandStatistics(startDate?: Date, endDate?: Date): Promise<CommandStatistics> {
        try {
            logger.info('Getting command statistics', { startDate, endDate });

            // 取得各種狀態的指令數量
            let totalCommands = 0;
            let pendingCommands = 0;
            let executingCommands = 0;
            let completedCommands = 0;
            let failedCommands = 0;

            if (startDate && endDate) {
                totalCommands = await this.commandRepository.countByDateRange(startDate, endDate);
                // 這裡可以加入更複雜的統計邏輯
            } else {
                totalCommands = await this.commandRepository.count();
                pendingCommands = await this.commandRepository.countByStatus(CommandStatus.PENDING);
                executingCommands = await this.commandRepository.countByStatus(CommandStatus.EXECUTING);
                completedCommands = await this.commandRepository.countByStatus(CommandStatus.COMPLETED);
                failedCommands = await this.commandRepository.countByStatus(CommandStatus.FAILED);
            }

            const successRate = totalCommands > 0 ? (completedCommands / totalCommands) * 100 : 0;

            const statistics: CommandStatistics = {
                totalCommands,
                pendingCommands,
                executingCommands,
                completedCommands,
                failedCommands,
                successRate: Math.round(successRate * 100) / 100,
                averageExecutionTime: 0, // 需要額外計算
                averageWaitTime: 0       // 需要額外計算
            };

            logger.info('Command statistics retrieved successfully', { statistics });
            return statistics;
        } catch (error) {
            logger.error('Error in getCommandStatistics', { startDate, endDate, error });
            throw error;
        }
    }

    /**
     * 取得指令類型統計
     *
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<CommandTypeStatistics[]>} 指令類型統計陣列
     */
    async getCommandTypeStatistics(startDate?: Date, endDate?: Date): Promise<CommandTypeStatistics[]> {
        try {
            logger.info('Getting command type statistics', { startDate, endDate });

            const typeStats: CommandTypeStatistics[] = [];

            for (const commandType of Object.values(CommandType)) {
                const count = await this.commandRepository.countByCommandType(commandType);

                const stat: CommandTypeStatistics = {
                    commandType,
                    count,
                    successRate: 0, // 需要額外計算
                    averageExecutionTime: 0 // 需要額外計算
                };

                typeStats.push(stat);
            }

            logger.info('Command type statistics retrieved successfully', { typeStats });
            return typeStats;
        } catch (error) {
            logger.error('Error in getCommandTypeStatistics', { startDate, endDate, error });
            throw error;
        }
    }

    /**
     * 取得無人機指令執行摘要
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandSummary>} 無人機指令執行摘要
     */
    async getDroneCommandSummary(droneId: number): Promise<DroneCommandSummary> {
        try {
            logger.info('Getting drone command summary', { droneId });

            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const [
                totalCommands,
                latestCommand,
                pendingCommands,
                executingCommand,
                failedCommands
            ] = await Promise.all([
                this.commandRepository.countByDroneId(droneId),
                this.commandRepository.findLatestByDroneId(droneId),
                this.commandRepository.findPendingCommandsByDroneId(droneId),
                this.commandRepository.findExecutingCommandByDroneId(droneId),
                this.commandRepository.findByDroneIdAndStatus(droneId, CommandStatus.FAILED, 1)
            ]);

            const commandTypeStats: CommandTypeStatistics[] = [];
            for (const commandType of Object.values(CommandType)) {
                const commands = await this.commandRepository.findByDroneIdAndCommandType(droneId, commandType, 1000);
                const count = commands.length;
                const completedCount = commands.filter(cmd => cmd.status === CommandStatus.COMPLETED).length;
                const successRate = count > 0 ? (completedCount / count) * 100 : 0;

                commandTypeStats.push({
                    commandType,
                    count,
                    successRate: Math.round(successRate * 100) / 100,
                    averageExecutionTime: 0 // 需要額外計算
                });
            }

            const summary: DroneCommandSummary = {
                droneId,
                totalCommands,
                latestCommand,
                pendingCount: pendingCommands.length,
                executingCommand,
                latestFailedCommand: failedCommands.length > 0 ? failedCommands[0] : null,
                commandTypeStats
            };

            logger.info('Drone command summary retrieved successfully', { droneId, summary });
            return summary;
        } catch (error) {
            logger.error('Error in getDroneCommandSummary', { droneId, error });
            throw error;
        }
    }

    /**
     * 發送起飛指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { altitude, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendTakeoffCommand(droneId: number, issuedBy: number, commandData: { altitude: number; speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending takeoff command', { droneId, issuedBy, commandData });

            // 驗證參數
            if (!await this.validateCommandParameters(CommandType.TAKEOFF, commandData)) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '起飛指令參數無效',
                    error: '高度必須在 1-500 公尺之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.TAKEOFF,
                command_data: commandData,
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendTakeoffCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送起飛指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送降落指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendLandCommand(droneId: number, issuedBy: number, commandData?: { speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending land command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.LAND,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendLandCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送降落指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送飛行到指定位置指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { latitude, longitude, altitude, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendFlyToCommand(droneId: number, issuedBy: number, commandData: { latitude: number; longitude: number; altitude: number; speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending flyTo command', { droneId, issuedBy, commandData });

            // 驗證座標
            if (commandData.latitude < -90 || commandData.latitude > 90) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '移動指令參數無效',
                    error: '緯度必須在 -90 到 90 度之間'
                };
            }

            if (commandData.longitude < -180 || commandData.longitude > 180) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '移動指令參數無效',
                    error: '經度必須在 -180 到 180 度之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.FLY_TO,
                command_data: commandData,
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendFlyToCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送飛行到指定位置指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送懸停指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { duration }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendHoverCommand(droneId: number, issuedBy: number, commandData?: { duration?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending hover command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.HOVER,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendHoverCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送懸停指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送返航指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendReturnCommand(droneId: number, issuedBy: number, commandData?: { speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending return command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.RETURN,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendReturnCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送返航指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送前進指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendMoveForwardCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending moveForward command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_FORWARD,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendMoveForwardCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送前進指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送後退指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendMoveBackwardCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending moveBackward command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_BACKWARD,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendMoveBackwardCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送後退指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送左移指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendMoveLeftCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending moveLeft command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_LEFT,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendMoveLeftCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送左移指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送右移指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendMoveRightCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending moveRight command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_RIGHT,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendMoveRightCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送右移指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送左轉指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { angle }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendRotateLeftCommand(droneId: number, issuedBy: number, commandData?: { angle?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending rotateLeft command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.ROTATE_LEFT,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendRotateLeftCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送左轉指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送右轉指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { angle }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendRotateRightCommand(droneId: number, issuedBy: number, commandData?: { angle?: number }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending rotateRight command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.ROTATE_RIGHT,
                command_data: commandData || {},
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendRotateRightCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送右轉指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送緊急停止指令
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { action }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    async sendEmergencyCommand(droneId: number, issuedBy: number, commandData?: { action?: 'stop' | 'land' }): Promise<CommandExecutionResult> {
        try {
            logger.info('Sending emergency command', { droneId, issuedBy, commandData });

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.EMERGENCY,
                command_data: commandData || { action: 'land' },
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createCommand(data);
        } catch (error) {
            logger.error('Error in sendEmergencyCommand', { droneId, issuedBy, commandData, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '發送緊急停止指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 執行指令（標記為執行中）
     *
     * @param {number} commandId - 指令 ID
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    async executeCommand(commandId: number): Promise<CommandExecutionResult> {
        try {
            logger.info('Executing command', { commandId });

            const command = await this.commandRepository.markAsExecuting(commandId);

            if (command) {
                return {
                    success: true,
                    command,
                    message: '指令開始執行'
                };
            } else {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '指令執行失敗',
                    error: '指令不存在或無法執行'
                };
            }
        } catch (error) {
            logger.error('Error in executeCommand', { commandId, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '指令執行失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 完成指令
     *
     * @param {number} commandId - 指令 ID
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    async completeCommand(commandId: number): Promise<CommandExecutionResult> {
        try {
            logger.info('Completing command', { commandId });

            const command = await this.commandRepository.markAsCompleted(commandId);

            if (command) {
                return {
                    success: true,
                    command,
                    message: '指令執行完成'
                };
            } else {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '指令完成失敗',
                    error: '指令不存在或無法完成'
                };
            }
        } catch (error) {
            logger.error('Error in completeCommand', { commandId, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '指令完成失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 標記指令失敗
     *
     * @param {number} commandId - 指令 ID
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    async failCommand(commandId: number, errorMessage: string): Promise<CommandExecutionResult> {
        try {
            logger.info('Marking command as failed', { commandId, errorMessage });

            const command = await this.commandRepository.markAsFailed(commandId, errorMessage);

            if (command) {
                return {
                    success: true,
                    command,
                    message: '指令標記為失敗'
                };
            } else {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '指令失敗標記失敗',
                    error: '指令不存在'
                };
            }
        } catch (error) {
            logger.error('Error in failCommand', { commandId, errorMessage, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '指令失敗標記失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 取消待執行指令
     *
     * @param {number} commandId - 指令 ID
     * @param {string} reason - 取消原因
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    async cancelCommand(commandId: number, reason: string): Promise<CommandExecutionResult> {
        try {
            logger.info('Cancelling command', { commandId, reason });

            const command = await this.commandRepository.markAsFailed(commandId, `已取消: ${reason}`);

            if (command) {
                return {
                    success: true,
                    command,
                    message: '指令已取消'
                };
            } else {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '指令取消失敗',
                    error: '指令不存在或無法取消'
                };
            }
        } catch (error) {
            logger.error('Error in cancelCommand', { commandId, reason, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '指令取消失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 驗證指令資料
     *
     * @param {DroneCommandCreationAttributes} data - 指令資料
     * @returns {Promise<boolean>} 是否有效
     */
    async validateCommandData(data: DroneCommandCreationAttributes): Promise<boolean> {
        try {
            // 檢查必填欄位
            if (!data.drone_id || !data.command_type || !data.issued_by) {
                logger.warn('Missing required fields in command data', { data });
                return false;
            }

            // 檢查指令類型是否有效
            if (!Object.values(CommandType).includes(data.command_type)) {
                logger.warn('Invalid command type', { commandType: data.command_type });
                return false;
            }

            // 檢查 ID 是否為正整數
            if (data.drone_id <= 0 || data.issued_by <= 0) {
                logger.warn('Invalid ID values', { droneId: data.drone_id, issuedBy: data.issued_by });
                return false;
            }

            // 驗證指令參數
            if (!await this.validateCommandParameters(data.command_type, data.command_data)) {
                return false;
            }

            logger.debug('Command data validated successfully', { data });
            return true;
        } catch (error) {
            logger.error('Error in validateCommandData', { data, error });
            return false;
        }
    }

    /**
     * 驗證指令參數
     *
     * @param {DroneCommandType} commandType - 指令類型
     * @param {object} commandData - 指令參數
     * @returns {Promise<boolean>} 是否有效
     */
    async validateCommandParameters(commandType: DroneCommandType, commandData: any): Promise<boolean> {
        try {
            if (!commandData) {
                return true; // 某些指令可能不需要參數
            }

            switch (commandType) {
                case CommandType.TAKEOFF:
                    if (typeof commandData.altitude !== 'number' || commandData.altitude < 1 || commandData.altitude > 500) {
                        logger.warn('Invalid takeoff altitude', { altitude: commandData.altitude });
                        return false;
                    }
                    break;

                case CommandType.MOVE:
                    if (
                        typeof commandData.latitude !== 'number' ||
                        typeof commandData.longitude !== 'number' ||
                        typeof commandData.altitude !== 'number' ||
                        commandData.latitude < -90 || commandData.latitude > 90 ||
                        commandData.longitude < -180 || commandData.longitude > 180 ||
                        commandData.altitude < 0 || commandData.altitude > 1000
                    ) {
                        logger.warn('Invalid move parameters', { commandData });
                        return false;
                    }
                    break;

                case CommandType.HOVER:
                    if (commandData.duration !== undefined && (typeof commandData.duration !== 'number' || commandData.duration < 0)) {
                        logger.warn('Invalid hover duration', { duration: commandData.duration });
                        return false;
                    }
                    break;

                default:
                    // 其他指令類型的參數驗證
                    break;
            }

            logger.debug('Command parameters validated successfully', { commandType, commandData });
            return true;
        } catch (error) {
            logger.error('Error in validateCommandParameters', { commandType, commandData, error });
            return false;
        }
    }

    /**
     * 檢查無人機是否可以接收新指令
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<boolean>} 是否可以接收新指令
     */
    async canReceiveNewCommand(droneId: number): Promise<boolean> {
        try {
            // 檢查是否有執行中的指令
            const executingCommand = await this.commandRepository.findExecutingCommandByDroneId(droneId);
            if (executingCommand) {
                logger.info('Drone has executing command', { droneId, commandId: executingCommand.id });
                return false;
            }

            // 檢查待執行指令數量
            const pendingCommands = await this.commandRepository.findPendingCommandsByDroneId(droneId);
            if (pendingCommands.length >= 10) { // 最多 10 個待執行指令
                logger.info('Drone has too many pending commands', { droneId, pendingCount: pendingCommands.length });
                return false;
            }

            logger.debug('Drone can receive new command', { droneId });
            return true;
        } catch (error) {
            logger.error('Error in canReceiveNewCommand', { droneId, error });
            return false;
        }
    }

    /**
     * 檢查指令衝突
     *
     * @param {number} droneId - 無人機 ID
     * @param {DroneCommandType} commandType - 新指令類型
     * @returns {Promise<boolean>} 是否有衝突
     */
    async checkCommandConflict(droneId: number, commandType: DroneCommandType): Promise<boolean> {
        try {
            const pendingCommands = await this.commandRepository.findPendingCommandsByDroneId(droneId);

            // 檢查衝突邏輯
            for (const pendingCommand of pendingCommands) {
                // 起飛和降落指令互相衝突
                if ((commandType === CommandType.TAKEOFF && pendingCommand.command_type === CommandType.LAND) ||
                    (commandType === CommandType.LAND && pendingCommand.command_type === CommandType.TAKEOFF)) {
                    logger.info('Command conflict detected', { droneId, newType: commandType, pendingType: pendingCommand.command_type });
                    return true;
                }
            }

            logger.debug('No command conflict detected', { droneId, commandType });
            return false;
        } catch (error) {
            logger.error('Error in checkCommandConflict', { droneId, commandType, error });
            return false;
        }
    }

    /**
     * 處理超時指令
     *
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @returns {Promise<number>} 處理的指令數量
     */
    async handleTimeoutCommands(timeoutMinutes: number): Promise<number> {
        try {
            logger.info('Handling timeout commands', { timeoutMinutes });

            const timeoutCommands = await this.commandRepository.findTimeoutCommands(timeoutMinutes, 100);
            let handledCount = 0;

            for (const command of timeoutCommands) {
                try {
                    await this.commandRepository.markAsFailed(command.id, '指令執行超時');
                    handledCount++;
                } catch (error) {
                    logger.error('Error handling timeout command', { commandId: command.id, error });
                }
            }

            logger.info('Timeout commands handled', { timeoutMinutes, handledCount });
            return handledCount;
        } catch (error) {
            logger.error('Error in handleTimeoutCommands', { timeoutMinutes, error });
            throw error;
        }
    }

    /**
     * 清理舊指令記錄
     *
     * @param {Date} beforeDate - 清理此時間之前的記錄
     * @param {boolean} onlyCompleted - 是否只清理已完成的指令
     * @returns {Promise<number>} 清理的記錄數
     */
    async cleanupOldCommands(beforeDate: Date, onlyCompleted: boolean = true): Promise<number> {
        try {
            logger.info('Cleaning up old commands', { beforeDate, onlyCompleted });

            let deletedCount = 0;
            if (onlyCompleted) {
                deletedCount = await this.commandRepository.deleteCompletedBefore(beforeDate);
            } else {
                deletedCount = await this.commandRepository.deleteBeforeDate(beforeDate);
            }

            logger.info('Old commands cleaned up', { beforeDate, onlyCompleted, deletedCount });
            return deletedCount;
        } catch (error) {
            logger.error('Error in cleanupOldCommands', { beforeDate, onlyCompleted, error });
            throw error;
        }
    }

    /**
     * 取得下一個待執行指令
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 下一個待執行指令或 null
     */
    async getNextPendingCommand(droneId: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Getting next pending command', { droneId });

            const pendingCommands = await this.commandRepository.findPendingCommandsByDroneId(droneId);

            if (pendingCommands.length > 0) {
                const nextCommand = pendingCommands[0]; // 已按時間排序
                logger.info('Next pending command found', { droneId, commandId: nextCommand.id });
                return nextCommand;
            } else {
                logger.info('No pending commands found', { droneId });
                return null;
            }
        } catch (error) {
            logger.error('Error in getNextPendingCommand', { droneId, error });
            throw error;
        }
    }

    /**
     * 批量更新指令狀態
     *
     * @param {number[]} commandIds - 指令 ID 陣列
     * @param {DroneCommandStatus} status - 新狀態
     * @param {string} errorMessage - 錯誤訊息（可選）
     * @returns {Promise<number>} 更新的指令數量
     */
    async batchUpdateCommandStatus(commandIds: number[], status: DroneCommandStatus, errorMessage?: string): Promise<number> {
        try {
            logger.info('Batch updating command status', { commandIds, status, errorMessage });

            let updatedCount = 0;
            for (const commandId of commandIds) {
                try {
                    const result = await this.commandRepository.updateStatus(commandId, status, errorMessage);
                    if (result) {
                        updatedCount++;
                    }
                } catch (error) {
                    logger.error('Error updating command status', { commandId, error });
                }
            }

            logger.info('Batch command status update completed', { updatedCount, total: commandIds.length });
            return updatedCount;
        } catch (error) {
            logger.error('Error in batchUpdateCommandStatus', { commandIds, status, errorMessage, error });
            throw error;
        }
    }

    /**
     * 重試失敗的指令
     *
     * @param {number} commandId - 指令 ID
     * @param {number} issuedBy - 重試發起者 ID
     * @returns {Promise<CommandExecutionResult>} 重試結果
     */
    async retryFailedCommand(commandId: number, issuedBy: number): Promise<CommandExecutionResult> {
        try {
            logger.info('Retrying failed command', { commandId, issuedBy });

            // 取得原始指令
            const originalCommand = await this.commandRepository.findById(commandId);
            if (!originalCommand) {
                return {
                    success: false,
                    command: {} as DroneCommandAttributes,
                    message: '重試失敗',
                    error: '原始指令不存在'
                };
            }

            if (originalCommand.status !== CommandStatus.FAILED) {
                return {
                    success: false,
                    command: originalCommand,
                    message: '重試失敗',
                    error: '只能重試失敗的指令'
                };
            }

            // 創建新的指令
            const newCommandData: DroneCommandCreationAttributes = {
                drone_id: originalCommand.drone_id,
                command_type: originalCommand.command_type,
                command_data: originalCommand.command_data,
                status: CommandStatus.PENDING,
                issued_by: issuedBy,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            };

            const result = await this.createCommand(newCommandData);

            if (result.success) {
                logger.info('Command retried successfully', { originalCommandId: commandId, newCommandId: result.command.id });
            }

            return result;
        } catch (error) {
            logger.error('Error in retryFailedCommand', { commandId, issuedBy, error });
            return {
                success: false,
                command: {} as DroneCommandAttributes,
                message: '重試失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }
}
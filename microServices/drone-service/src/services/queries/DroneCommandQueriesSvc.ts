/**
 * @fileoverview 無人機指令查詢 Service 實現
 *
 * 此文件實作了無人機指令查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import type {
    CommandStatistics,
    CommandTypeStatistics,
    DroneCommandSummary
} from '../../types/services/IDroneCommandService.js';
import type { IDroneCommandRepository } from '../../types/repositories/IDroneCommandRepository.js';
import { DroneCommandQueriesRepository } from '../../repo/queries/DroneCommandQueriesRepo.js';
import { DroneCommandCommandsRepository } from '../../repo/commands/DroneCommandCommandsRepo.js';
import type { DroneCommandAttributes, DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/DroneCommandModel.js';
import { DroneCommandType as CommandType, DroneCommandStatus as CommandStatus } from '../../models/DroneCommandModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneCommandQueriesSvc');

/**
 * 無人機指令查詢 Service 實現類別
 *
 * 專門處理無人機指令相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueriesSvc {
    private commandRepository: IDroneCommandRepository;
    private queriesRepository: DroneCommandQueriesRepository;
    private commandsRepository: DroneCommandCommandsRepository;

    constructor() {
        this.queriesRepository = new DroneCommandQueriesRepository();
        this.commandsRepository = new DroneCommandCommandsRepository();
        
        // 創建組合repository來滿足IDroneCommandRepository接口
        this.commandRepository = Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IDroneCommandRepository;
    }

    /**
     * 取得所有無人機指令
     */
    getAllCommands = async (limit: number = 100): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting all commands', { limit });

            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findAll(limit);
            logger.info(`Successfully retrieved ${commands.length} commands`);
            return commands;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆無人機指令
     */
    getCommandById = async (id: number): Promise<DroneCommandAttributes | null> => {
        try {
            logger.info('Getting command by ID', { id });

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
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢指令
     */
    getCommandsByDroneId = async (droneId: number, limit: number = 50): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting commands by drone ID', { droneId, limit });

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
            throw error;
        }
    }

    /**
     * 根據指令狀態查詢
     */
    getCommandsByStatus = async (status: DroneCommandStatus, limit: number = 50): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting commands by status', { status, limit });

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
            throw error;
        }
    }

    /**
     * 根據指令類型查詢
     */
    getCommandsByType = async (commandType: DroneCommandType, limit: number = 50): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting commands by type', { commandType, limit });

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
            throw error;
        }
    }

    /**
     * 根據發送者查詢指令
     */
    getCommandsByIssuedBy = async (issuedBy: number, limit: number = 50): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting commands by issued by', { issuedBy, limit });

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
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢指令
     */
    getCommandsByDateRange = async (startDate: Date, endDate: Date, limit: number = 100): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting commands by date range', { startDate, endDate, limit });

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
            throw error;
        }
    }

    /**
     * 取得無人機的待執行指令
     */
    getPendingCommandsByDroneId = async (droneId: number): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting pending commands by drone ID', { droneId });

            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const commands = await this.commandRepository.findPendingCommandsByDroneId(droneId);
            logger.info(`Successfully retrieved ${commands.length} pending commands for drone ${droneId}`);
            return commands;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得正在執行的指令
     */
    getExecutingCommandByDroneId = async (droneId: number): Promise<DroneCommandAttributes | null> => {
        try {
            logger.info('Getting executing command by drone ID', { droneId });

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
            throw error;
        }
    }

    /**
     * 取得最新的指令記錄
     */
    getLatestCommands = async (limit: number = 20): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting latest commands', { limit });

            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            const commands = await this.commandRepository.findLatest(limit);
            logger.info(`Successfully retrieved ${commands.length} latest commands`);
            return commands;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新指令
     */
    getLatestCommandByDroneId = async (droneId: number): Promise<DroneCommandAttributes | null> => {
        try {
            logger.info('Getting latest command by drone ID', { droneId });

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
            throw error;
        }
    }

    /**
     * 取得失敗的指令
     */
    getFailedCommands = async (limit: number = 50): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting failed commands', { limit });

            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findFailedCommands(limit);
            logger.info(`Successfully retrieved ${commands.length} failed commands`);
            return commands;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得超時的指令
     */
    getTimeoutCommands = async (timeoutMinutes: number, limit: number = 50): Promise<DroneCommandAttributes[]> => {
        try {
            logger.info('Getting timeout commands', { timeoutMinutes, limit });

            if (timeoutMinutes <= 0 || timeoutMinutes > 1440) {
                throw new Error('超時時間必須在 1 到 1440 分鐘之間');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const commands = await this.commandRepository.findTimeoutCommands(timeoutMinutes, limit);
            logger.info(`Successfully retrieved ${commands.length} timeout commands`);
            return commands;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得指令統計資料
     */
    getCommandStatistics = async (startDate?: Date, endDate?: Date): Promise<CommandStatistics> => {
        try {
            logger.info('Getting command statistics', { startDate, endDate });

            let totalCommands = 0;
            let pendingCommands = 0;
            let executingCommands = 0;
            let completedCommands = 0;
            let failedCommands = 0;

            if (startDate && endDate) {
                totalCommands = await this.commandRepository.countByDateRange(startDate, endDate);
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
                averageExecutionTime: 0,
                averageWaitTime: 0
            };

            logger.info('Command statistics retrieved successfully', { statistics });
            return statistics;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得指令類型統計
     */
    getCommandTypeStatistics = async (startDate?: Date, endDate?: Date): Promise<CommandTypeStatistics[]> => {
        try {
            logger.info('Getting command type statistics', { startDate, endDate });

            const typeStats: CommandTypeStatistics[] = [];

            for (const commandType of Object.values(CommandType)) {
                const count = await this.commandRepository.countByCommandType(commandType);

                const stat: CommandTypeStatistics = {
                    commandType,
                    count,
                    successRate: 0,
                    averageExecutionTime: 0
                };

                typeStats.push(stat);
            }

            logger.info('Command type statistics retrieved successfully', { typeStats });
            return typeStats;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得無人機指令執行摘要
     */
    getDroneCommandSummary = async (droneId: number): Promise<DroneCommandSummary> => {
        try {
            logger.info('Getting drone command summary', { droneId });

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
                const completedCount = commands.filter((cmd: any) => cmd.status === CommandStatus.COMPLETED).length;
                const successRate = count > 0 ? (completedCount / count) * 100 : 0;

                commandTypeStats.push({
                    commandType,
                    count,
                    successRate: Math.round(successRate * 100) / 100,
                    averageExecutionTime: 0
                });
            }

            const summary: DroneCommandSummary = {
                id: latestCommand?.id || 0,
                drone_id: droneId,
                droneId: droneId,
                command_type: latestCommand?.command_type || 'unknown',
                status: latestCommand?.status || 'unknown',
                issued_at: latestCommand?.issued_at || new Date(),
                executed_at: latestCommand?.executed_at,
                completed_at: latestCommand?.completed_at,
                error_message: latestCommand?.error_message,
                totalCommands: totalCommands
            };

            logger.info('Drone command summary retrieved successfully', { droneId, summary });
            return summary;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得下一個待執行指令
     */
    getNextPendingCommand = async (droneId: number): Promise<DroneCommandAttributes | null> => {
        try {
            logger.info('Getting next pending command', { droneId });

            const pendingCommands = await this.commandRepository.findPendingCommandsByDroneId(droneId);

            if (pendingCommands.length > 0) {
                const nextCommand = pendingCommands[0];
                logger.info('Next pending command found', { droneId, commandId: nextCommand.id });
                return nextCommand;
            } else {
                logger.info('No pending commands found', { droneId });
                return null;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證指令資料
     */
    validateCommandData = async (data: DroneCommandCreationAttributes): Promise<boolean> => {
        try {
            if (!data.drone_id || !data.command_type || !data.issued_by) {
                logger.warn('Missing required fields in command data', { data });
                return false;
            }

            if (!Object.values(CommandType).includes(data.command_type)) {
                logger.warn('Invalid command type', { commandType: data.command_type });
                return false;
            }

            if (data.drone_id <= 0 || data.issued_by <= 0) {
                logger.warn('Invalid ID values', { droneId: data.drone_id, issuedBy: data.issued_by });
                return false;
            }

            if (!await this.validateCommandParameters(data.command_type, data.command_data)) {
                return false;
            }

            logger.debug('Command data validated successfully', { data });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 驗證指令參數
     */
    validateCommandParameters = async (commandType: DroneCommandType, commandData: any): Promise<boolean> => {
        try {
            if (!commandData) {
                return true;
            }

            switch (commandType) {
                case CommandType.TAKEOFF:
                    if (typeof commandData.altitude !== 'number' || commandData.altitude < 1 || commandData.altitude > 500) {
                        logger.warn('Invalid takeoff altitude', { altitude: commandData.altitude });
                        return false;
                    }
                    break;

                case CommandType.FLY_TO:
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
                    break;
            }

            logger.debug('Command parameters validated successfully', { commandType, commandData });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 檢查無人機是否可以接收新指令
     */
    canReceiveNewCommand = async (droneId: number): Promise<boolean> => {
        try {
            const executingCommand = await this.commandRepository.findExecutingCommandByDroneId(droneId);
            if (executingCommand) {
                logger.info('Drone has executing command', { droneId, commandId: executingCommand.id });
                return false;
            }

            const pendingCommands = await this.commandRepository.findPendingCommandsByDroneId(droneId);
            if (pendingCommands.length >= 10) {
                logger.info('Drone has too many pending commands', { droneId, pendingCount: pendingCommands.length });
                return false;
            }

            logger.debug('Drone can receive new command', { droneId });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 檢查指令衝突
     */
    checkCommandConflict = async (droneId: number, commandType: DroneCommandType): Promise<boolean> => {
        try {
            const pendingCommands = await this.commandRepository.findPendingCommandsByDroneId(droneId);

            for (const pendingCommand of pendingCommands) {
                if ((commandType === CommandType.TAKEOFF && pendingCommand.command_type === CommandType.LAND) ||
                    (commandType === CommandType.LAND && pendingCommand.command_type === CommandType.TAKEOFF)) {
                    logger.info('Command conflict detected', { droneId, newType: commandType, pendingType: pendingCommand.command_type });
                    return true;
                }
            }

            logger.debug('No command conflict detected', { droneId, commandType });
            return false;
        } catch (error) {
            return false;
        }
    }
}
/**
 * @fileoverview 無人機指令命令 Service 實現
 *
 * 此文件實作了無人機指令命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneCommandCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import type {
    CommandExecutionResult,
    BatchCommandResult
} from '../../types/services/IDroneCommandService.js';
import type { IDroneCommandRepository } from '../../types/repositories/IDroneCommandRepository.js';
import { DroneCommandCommandsRepository } from '../../repo/commands/DroneCommandCommandsRepo.js';
import { DroneCommandQueriesRepository } from '../../repo/queries/DroneCommandQueriesRepo.js';
import type { DroneCommandAttributes, DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/DroneCommandModel.js';
import { DroneCommandType as CommandType, DroneCommandStatus as CommandStatus } from '../../models/DroneCommandModel.js';
import { DroneCommandQueriesSvc } from '../queries/DroneCommandQueriesSvc.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneCommandCommandsSvc');

/**
 * 無人機指令命令 Service 實現類別
 *
 * 專門處理無人機指令相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneCommandCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DroneCommandCommandsSvc {
    constructor(
        @inject(TYPES.DroneCommandQueriesSvc)
        private readonly queryService: DroneCommandQueriesSvc
    ) {
        // Initialize repositories directly for now since they're not in DI container yet
        this.commandsRepository = new DroneCommandCommandsRepository();
        this.queriesRepository = new DroneCommandQueriesRepository();
        
        // 創建組合repository
        this.commandRepository = Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IDroneCommandRepository;
    }

    private readonly commandsRepository: DroneCommandCommandsRepository;
    private readonly queriesRepository: DroneCommandQueriesRepository;
    private readonly commandRepository: IDroneCommandRepository;

    /**
     * 建立新的無人機指令記錄
     */
    createCommand = async (data: DroneCommandCreationAttributes): Promise<CommandExecutionResult> => {
        try {
            logger.info('Creating command', { data });

            if (!await this.queryService.validateCommandData(data)) {
                return {
                    success: false,
                    command: null,
                    message: '指令資料驗證失敗',
                    error: '無效的指令資料'
                };
            }

            if (!await this.queryService.canReceiveNewCommand(data.drone_id)) {
                return {
                    success: false,
                    command: null,
                    message: '無人機目前無法接收新指令',
                    error: '無人機狀態不允許接收新指令'
                };
            }

            if (await this.queryService.checkCommandConflict(data.drone_id, data.command_type)) {
                return {
                    success: false,
                    command: null,
                    message: '指令與現有指令衝突',
                    error: '存在衝突的指令'
                };
            }

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
            return {
                success: false,
                command: null,
                message: '指令創建失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 批量建立無人機指令記錄
     */
    createBatchCommands = async (dataArray: DroneCommandCreationAttributes[]): Promise<BatchCommandResult> => {
        try {
            logger.info('Creating batch commands', { count: dataArray.length });

            const result: BatchCommandResult = {
                successful: [],
                failed: [],
                total: dataArray.length,
                successCount: 0,
                failureCount: 0
            };

            if (!dataArray || dataArray.length === 0) {
                throw new Error('批量建立資料不能為空');
            }

            if (dataArray.length > 100) {
                throw new Error('批量建立指令數不能超過 100 筆');
            }

            for (const data of dataArray) {
                try {
                    const commandResult = await this.createCommand(data);
                    if (commandResult.success && commandResult.command) {
                        result.successful.push(commandResult.command);
                        result.successCount++;
                    } else {
                        result.failed.push({
                            command: data,
                            error: commandResult.error || '未知錯誤'
                        });
                        result.failureCount++;
                    }
                } catch (error) {
                    result.failed.push({
                        command: data,
                        error: error instanceof Error ? error.message : '未知錯誤'
                    });
                    result.failureCount++;
                }
            }

            logger.info('Batch commands creation completed', {
                total: result.total,
                successful: result.successCount,
                failed: result.failureCount
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新無人機指令資料
     */
    updateCommand = async (id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandAttributes | null> => {
        try {
            logger.info('Updating command', { id, data });

            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            const existingCommand = await this.queryService.getCommandById(id);
            if (!existingCommand) {
                throw new Error('指定的指令不存在');
            }

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
            throw error;
        }
    }

    /**
     * 刪除無人機指令資料
     */
    deleteCommand = async (id: number): Promise<boolean> => {
        try {
            logger.info('Deleting command', { id });

            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            const existingCommand = await this.queryService.getCommandById(id);
            if (!existingCommand) {
                throw new Error('指定的指令不存在');
            }

            if (existingCommand.status === CommandStatus.EXECUTING) {
                throw new Error('正在執行的指令無法刪除');
            }

            await this.commandRepository.delete(id);

            logger.info('Command deleted successfully', { id });

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 執行指令（標記為執行中）
     */
    executeCommand = async (commandId: number): Promise<CommandExecutionResult> => {
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
                    command: null,
                    message: '指令執行失敗',
                    error: '指令不存在或無法執行'
                };
            }
        } catch (error) {
            return {
                success: false,
                command: null,
                message: '指令執行失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 完成指令
     */
    completeCommand = async (commandId: number): Promise<CommandExecutionResult> => {
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
                    command: null,
                    message: '指令完成失敗',
                    error: '指令不存在或無法完成'
                };
            }
        } catch (error) {
            return {
                success: false,
                command: null,
                message: '指令完成失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 標記指令失敗
     */
    failCommand = async (commandId: number, errorMessage: string): Promise<CommandExecutionResult> => {
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
                    command: null,
                    message: '指令失敗標記失敗',
                    error: '指令不存在'
                };
            }
        } catch (error) {
            return {
                success: false,
                command: null,
                message: '指令失敗標記失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 取消待執行指令
     */
    cancelCommand = async (commandId: number, reason: string): Promise<CommandExecutionResult> => {
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
                    command: null,
                    message: '指令取消失敗',
                    error: '指令不存在或無法取消'
                };
            }
        } catch (error) {
            return {
                success: false,
                command: null,
                message: '指令取消失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送起飛指令
     */
    sendTakeoffCommand = async (droneId: number, issuedBy: number, commandData: { altitude: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending takeoff command', { droneId, issuedBy, commandData });

            if (!await this.queryService.validateCommandParameters(CommandType.TAKEOFF, commandData)) {
                return {
                    success: false,
                    command: null,
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
            return {
                success: false,
                command: null,
                message: '發送起飛指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送降落指令
     */
    sendLandCommand = async (droneId: number, issuedBy: number, commandData?: { speed?: number }): Promise<CommandExecutionResult> => {
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
            return {
                success: false,
                command: null,
                message: '發送降落指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送飛行到指定位置指令
     */
    sendFlyToCommand = async (droneId: number, issuedBy: number, commandData: { latitude: number; longitude: number; altitude: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending flyTo command', { droneId, issuedBy, commandData });

            if (commandData.latitude < -90 || commandData.latitude > 90) {
                return {
                    success: false,
                    command: null,
                    message: '移動指令參數無效',
                    error: '緯度必須在 -90 到 90 度之間'
                };
            }

            if (commandData.longitude < -180 || commandData.longitude > 180) {
                return {
                    success: false,
                    command: null,
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
            return {
                success: false,
                command: null,
                message: '發送飛行到指定位置指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送移動指令（别名：飛行到指定位置）
     */
    sendMoveCommand = async (droneId: number, issuedBy: number, commandData: { latitude: number; longitude: number; altitude: number; speed?: number }): Promise<CommandExecutionResult> => {
        return await this.sendFlyToCommand(droneId, issuedBy, commandData);
    }

    /**
     * 發送懸停指令
     */
    sendHoverCommand = async (droneId: number, issuedBy: number, commandData?: { duration?: number }): Promise<CommandExecutionResult> => {
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
            return {
                success: false,
                command: null,
                message: '發送懸停指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送返航指令
     */
    sendReturnCommand = async (droneId: number, issuedBy: number, commandData?: { speed?: number }): Promise<CommandExecutionResult> => {
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
            return {
                success: false,
                command: null,
                message: '發送返航指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送緊急停止指令
     */
    sendEmergencyCommand = async (droneId: number, issuedBy: number, commandData?: { action?: 'stop' | 'land' }): Promise<CommandExecutionResult> => {
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
            return {
                success: false,
                command: null,
                message: '發送緊急停止指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 處理超時指令
     */
    handleTimeoutCommands = async (timeoutMinutes: number): Promise<number> => {
        try {
            logger.info('Handling timeout commands', { timeoutMinutes });

            const timeoutCommands = await this.queryService.getTimeoutCommands(timeoutMinutes, 100);
            let handledCount = 0;

            for (const command of timeoutCommands) {
                try {
                    await this.commandRepository.markAsFailed(command.id, '指令執行超時');
                    handledCount++;
                } catch (error) {
                    }
            }

            logger.info('Timeout commands handled', { timeoutMinutes, handledCount });
            return handledCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 清理舊指令記錄
     */
    cleanupOldCommands = async (beforeDate: Date, onlyCompleted: boolean = true): Promise<number> => {
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
            throw error;
        }
    }

    /**
     * 批量更新指令狀態
     */
    batchUpdateCommandStatus = async (commandIds: number[], status: DroneCommandStatus, errorMessage?: string): Promise<number> => {
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
                    }
            }

            logger.info('Batch command status update completed', { updatedCount, total: commandIds.length });
            return updatedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 發送前進指令
     */
    sendMoveForwardCommand = async (droneId: number, issuedBy: number, commandData: { distance: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending move forward command', { droneId, issuedBy, commandData });

            if (commandData.distance <= 0 || commandData.distance > 100) {
                return {
                    success: false,
                    command: null,
                    message: '前進距離參數無效',
                    error: '距離必須在 0.1-100 公尺之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_FORWARD,
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
            return {
                success: false,
                command: null,
                message: '發送前進指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送後退指令
     */
    sendMoveBackwardCommand = async (droneId: number, issuedBy: number, commandData: { distance: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending move backward command', { droneId, issuedBy, commandData });

            if (commandData.distance <= 0 || commandData.distance > 100) {
                return {
                    success: false,
                    command: null,
                    message: '後退距離參數無效',
                    error: '距離必須在 0.1-100 公尺之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_BACKWARD,
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
            return {
                success: false,
                command: null,
                message: '發送後退指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送左移指令
     */
    sendMoveLeftCommand = async (droneId: number, issuedBy: number, commandData: { distance: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending move left command', { droneId, issuedBy, commandData });

            if (commandData.distance <= 0 || commandData.distance > 100) {
                return {
                    success: false,
                    command: null,
                    message: '左移距離參數無效',
                    error: '距離必須在 0.1-100 公尺之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_LEFT,
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
            return {
                success: false,
                command: null,
                message: '發送左移指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送右移指令
     */
    sendMoveRightCommand = async (droneId: number, issuedBy: number, commandData: { distance: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending move right command', { droneId, issuedBy, commandData });

            if (commandData.distance <= 0 || commandData.distance > 100) {
                return {
                    success: false,
                    command: null,
                    message: '右移距離參數無效',
                    error: '距離必須在 0.1-100 公尺之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.MOVE_RIGHT,
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
            return {
                success: false,
                command: null,
                message: '發送右移指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送左轉指令
     */
    sendRotateLeftCommand = async (droneId: number, issuedBy: number, commandData: { degrees: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending rotate left command', { droneId, issuedBy, commandData });

            if (commandData.degrees <= 0 || commandData.degrees > 360) {
                return {
                    success: false,
                    command: null,
                    message: '左轉角度參數無效',
                    error: '角度必須在 1-360 度之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.ROTATE_LEFT,
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
            return {
                success: false,
                command: null,
                message: '發送左轉指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 發送右轉指令
     */
    sendRotateRightCommand = async (droneId: number, issuedBy: number, commandData: { degrees: number; speed?: number }): Promise<CommandExecutionResult> => {
        try {
            logger.info('Sending rotate right command', { droneId, issuedBy, commandData });

            if (commandData.degrees <= 0 || commandData.degrees > 360) {
                return {
                    success: false,
                    command: null,
                    message: '右轉角度參數無效',
                    error: '角度必須在 1-360 度之間'
                };
            }

            const data: DroneCommandCreationAttributes = {
                drone_id: droneId,
                command_type: CommandType.ROTATE_RIGHT,
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
            return {
                success: false,
                command: null,
                message: '發送右轉指令失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 重試失敗的指令
     */
    retryFailedCommand = async (commandId: number, issuedBy: number): Promise<CommandExecutionResult> => {
        try {
            logger.info('Retrying failed command', { commandId, issuedBy });

            const originalCommand = await this.queryService.getCommandById(commandId);
            if (!originalCommand) {
                return {
                    success: false,
                    command: null,
                    message: '重試失敗',
                    error: '原始指令不存在'
                };
            }

            if (originalCommand.status !== CommandStatus.FAILED) {
                return {
                    success: false,
                    command: null,
                    message: '重試失敗',
                    error: '只能重試失敗的指令'
                };
            }

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

            if (result.success && result.command) {
                logger.info('Command retried successfully', { originalCommandId: commandId, newCommandId: result.command.id });
            }

            return result;
        } catch (error) {
            return {
                success: false,
                command: null,
                message: '重試失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }
}
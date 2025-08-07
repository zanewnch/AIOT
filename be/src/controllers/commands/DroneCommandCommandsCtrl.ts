/**
 * @fileoverview 無人機指令命令控制器
 * 
 * 此文件實作了無人機指令命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除、發送指令等寫入邏輯。
 * 
 * @module DroneCommandCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneCommandCommandsSvc } from '../../services/commands/DroneCommandCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';
import type { DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/drone/DroneCommandModel.js';

const logger = createLogger('DroneCommandCommands');

/**
 * 無人機指令命令控制器類別
 * 
 * 專門處理無人機指令相關的命令請求，包含創建、更新、刪除、發送指令等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DroneCommandCommands
 * @since 1.0.0
 */
@injectable()
export class DroneCommandCommands {
    constructor(
        @inject(TYPES.DroneCommandCommandsSvc) private readonly commandService: DroneCommandCommandsSvc
    ) {}

    /**
     * 創建新的無人機指令
     * @route POST /api/drone-commands/data
     */
    async createCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandData: DroneCommandCreationAttributes = req.body;

            // 基本驗證
            if (!commandData.drone_id || typeof commandData.drone_id !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!commandData.command_type || typeof commandData.command_type !== 'string') {
                const result = ControllerResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, 'Creating new command');
            logger.info('Command creation request received', { commandData });

            const result = await this.commandService.createCommand(commandData);
            
            if (result.success) {
                const response = ControllerResult.created('無人機指令創建成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command creation completed successfully', {
                    id: result.command?.id,
                    droneId: commandData.drone_id,
                    commandType: commandData.command_type
                });
            } else {
                const response = ControllerResult.badRequest(result.message || '指令創建失敗');
                res.status(response.status).json(response);
                logger.warn('Command creation failed', { reason: result.message });
            }
        } catch (error) {
            logger.error('Error in createCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 批量創建指令
     * @route POST /api/drone-commands/data/batch
     */
    async createCommandsBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandsData: DroneCommandCreationAttributes[] = req.body;

            // 驗證批量資料
            if (!Array.isArray(commandsData) || commandsData.length === 0) {
                const result = ControllerResult.badRequest('請提供有效的指令資料陣列');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每筆資料
            for (let i = 0; i < commandsData.length; i++) {
                const data = commandsData[i];
                if (!data.drone_id || typeof data.drone_id !== 'number') {
                    const result = ControllerResult.badRequest(`第 ${i + 1} 筆資料的無人機 ID 無效`);
                    res.status(result.status).json(result);
                    return;
                }
                if (!data.command_type || typeof data.command_type !== 'string') {
                    const result = ControllerResult.badRequest(`第 ${i + 1} 筆資料的指令類型無效`);
                    res.status(result.status).json(result);
                    return;
                }
            }

            logRequest(req, `Creating ${commandsData.length} commands in batch`);
            logger.info('Commands batch creation request received', { count: commandsData.length });

            const result = await this.commandService.createBatchCommands(commandsData);
            
            if (result.successCount > 0) {
                const response = ControllerResult.created('批量無人機指令創建成功', result.successful);
                res.status(response.status).json(response);
                logger.info('Commands batch creation completed successfully', {
                    total: result.total,
                    successful: result.successCount,
                    failed: result.failedCount
                });
            } else {
                const response = ControllerResult.badRequest('所有批量指令創建失敗');
                res.status(response.status).json(response);
                logger.warn('All commands batch creation failed', { 
                    total: result.total,
                    failedCount: result.failedCount
                });
            }
        } catch (error) {
            logger.error('Error in createCommandsBatch', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指令
     * @route PUT /api/drone-commands/data/:id
     */
    async updateCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating command with ID: ${id}`);
            logger.info('Command update request received', { id, updateData });

            const result = await this.commandService.updateCommand(id, updateData);
            
            if (result) {
                const response = ControllerResult.success('無人機指令更新成功', result);
                res.status(response.status).json(response);
                logger.info('Command update completed successfully', { id });
            } else {
                const response = ControllerResult.notFound('找不到指定的無人機指令');
                res.status(response.status).json(response);
                logger.warn('Command update failed - not found', { id });
            }
        } catch (error) {
            logger.error('Error in updateCommand', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指令
     * @route DELETE /api/drone-commands/data/:id
     */
    async deleteCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting command with ID: ${id}`);
            logger.info('Command deletion request received', { id });

            const result = await this.commandService.deleteCommand(id);
            
            if (result) {
                const response = ControllerResult.success('無人機指令刪除成功');
                res.status(response.status).json(response);
                logger.info('Command deletion completed successfully', { id });
            } else {
                const response = ControllerResult.notFound('找不到指定的無人機指令');
                res.status(response.status).json(response);
                logger.warn('Command deletion failed - not found', { id });
            }
        } catch (error) {
            logger.error('Error in deleteCommand', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    // ==================== 指令發送相關方法 ====================

    /**
     * 發送起飛指令
     * @route POST /api/drone-commands/send/takeoff
     */
    async sendTakeoffCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, altitude = 10, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending takeoff command to drone ${droneId}`);
            logger.info('Takeoff command request received', { droneId, altitude });

            const result = await this.commandService.sendTakeoffCommand(droneId, 1, { altitude, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('起飛指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Takeoff command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '起飛指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Takeoff command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendTakeoffCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送降落指令
     * @route POST /api/drone-commands/send/land
     */
    async sendLandCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending land command to drone ${droneId}`);
            logger.info('Land command request received', { droneId });

            const result = await this.commandService.sendLandCommand(droneId, 1, parameters);
            
            if (result.success) {
                const response = ControllerResult.success('降落指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Land command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '降落指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Land command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendLandCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送懸停指令
     * @route POST /api/drone-commands/send/hover
     */
    async sendHoverCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, duration, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending hover command to drone ${droneId}`);
            logger.info('Hover command request received', { droneId, duration });

            const result = await this.commandService.sendHoverCommand(droneId, 1, { duration });
            
            if (result.success) {
                const response = ControllerResult.success('懸停指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Hover command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '懸停指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Hover command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendHoverCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送飛行到指定位置指令
     * @route POST /api/drone-commands/send/flyTo
     */
    async sendFlyToCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, latitude, longitude, altitude, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                const result = ControllerResult.badRequest('緯度和經度為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending flyTo command to drone ${droneId}`);
            logger.info('FlyTo command request received', { droneId, latitude, longitude, altitude });

            const result = await this.commandService.sendMoveCommand(droneId, 1, { latitude, longitude, altitude, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('飛行指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('FlyTo command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '飛行指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('FlyTo command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendFlyToCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送返航指令
     * @route POST /api/drone-commands/send/return
     */
    async sendReturnCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending return command to drone ${droneId}`);
            logger.info('Return command request received', { droneId });

            const result = await this.commandService.sendReturnCommand(droneId, 1, parameters);
            
            if (result.success) {
                const response = ControllerResult.success('返航指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Return command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '返航指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Return command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendReturnCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送前進指令
     * @route POST /api/drone-commands/send/moveForward
     */
    async sendMoveForwardCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, distance = 1, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending move forward command to drone ${droneId}`);
            logger.info('Move forward command request received', { droneId, distance });

            const result = await this.commandService.sendMoveForwardCommand(droneId, 1, { distance, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('前進指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Move forward command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '前進指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Move forward command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendMoveForwardCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送後退指令
     * @route POST /api/drone-commands/send/moveBackward
     */
    async sendMoveBackwardCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, distance = 1, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending move backward command to drone ${droneId}`);
            logger.info('Move backward command request received', { droneId, distance });

            const result = await this.commandService.sendMoveBackwardCommand(droneId, 1, { distance, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('後退指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Move backward command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '後退指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Move backward command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendMoveBackwardCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送左移指令
     * @route POST /api/drone-commands/send/moveLeft
     */
    async sendMoveLeftCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, distance = 1, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending move left command to drone ${droneId}`);
            logger.info('Move left command request received', { droneId, distance });

            const result = await this.commandService.sendMoveLeftCommand(droneId, 1, { distance, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('左移指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Move left command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '左移指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Move left command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendMoveLeftCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送右移指令
     * @route POST /api/drone-commands/send/moveRight
     */
    async sendMoveRightCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, distance = 1, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending move right command to drone ${droneId}`);
            logger.info('Move right command request received', { droneId, distance });

            const result = await this.commandService.sendMoveRightCommand(droneId, 1, { distance, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('右移指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Move right command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '右移指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Move right command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendMoveRightCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送左轉指令
     * @route POST /api/drone-commands/send/rotateLeft
     */
    async sendRotateLeftCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, degrees = 90, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending rotate left command to drone ${droneId}`);
            logger.info('Rotate left command request received', { droneId, degrees });

            const result = await this.commandService.sendRotateLeftCommand(droneId, 1, { degrees, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('左轉指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Rotate left command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '左轉指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Rotate left command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendRotateLeftCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送右轉指令
     * @route POST /api/drone-commands/send/rotateRight
     */
    async sendRotateRightCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, degrees = 90, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending rotate right command to drone ${droneId}`);
            logger.info('Rotate right command request received', { droneId, degrees });

            const result = await this.commandService.sendRotateRightCommand(droneId, 1, { degrees, speed: parameters?.speed });
            
            if (result.success) {
                const response = ControllerResult.success('右轉指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Rotate right command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '右轉指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Rotate right command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendRotateRightCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送緊急停止指令
     * @route POST /api/drone-commands/send/emergency
     */
    async sendEmergencyCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, parameters } = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending emergency command to drone ${droneId}`);
            logger.info('Emergency command request received', { droneId });

            const result = await this.commandService.sendEmergencyCommand(droneId, 1, parameters);
            
            if (result.success) {
                const response = ControllerResult.success('緊急停止指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Emergency command sent successfully', { droneId, commandId: result.command?.id });
            } else {
                const response = ControllerResult.badRequest(result.message || '緊急停止指令發送失敗');
                res.status(response.status).json(response);
                logger.warn('Emergency command failed', { droneId, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in sendEmergencyCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    // ==================== 指令狀態管理相關方法 ====================

    /**
     * 執行指令
     * @route PUT /api/drone-commands/:id/execute
     */
    async executeCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Executing command with ID: ${id}`);
            logger.info('Command execution request received', { id });

            const result = await this.commandService.executeCommand(id);
            
            if (result.success) {
                const response = ControllerResult.success('指令執行成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command execution completed successfully', { id });
            } else {
                const response = ControllerResult.badRequest(result.message || '指令執行失敗');
                res.status(response.status).json(response);
                logger.warn('Command execution failed', { id, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in executeCommand', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 完成指令
     * @route PUT /api/drone-commands/:id/complete
     */
    async completeCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Completing command with ID: ${id}`);
            logger.info('Command completion request received', { id });

            const result = await this.commandService.completeCommand(id);
            
            if (result.success) {
                const response = ControllerResult.success('指令完成成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command completion completed successfully', { id });
            } else {
                const response = ControllerResult.badRequest(result.message || '指令完成失敗');
                res.status(response.status).json(response);
                logger.warn('Command completion failed', { id, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in completeCommand', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 標記指令失敗
     * @route PUT /api/drone-commands/:id/fail
     */
    async failCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { reason } = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Marking command as failed with ID: ${id}`);
            logger.info('Command failure request received', { id, reason });

            const result = await this.commandService.failCommand(id, reason);
            
            if (result.success) {
                const response = ControllerResult.success('指令標記失敗成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command failure marking completed successfully', { id });
            } else {
                const response = ControllerResult.badRequest(result.message || '指令標記失敗失敗');
                res.status(response.status).json(response);
                logger.warn('Command failure marking failed', { id, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in failCommand', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 取消指令
     * @route PUT /api/drone-commands/:id/cancel
     */
    async cancelCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { reason } = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Cancelling command with ID: ${id}`);
            logger.info('Command cancellation request received', { id, reason });

            const result = await this.commandService.cancelCommand(id, reason);
            
            if (result.success) {
                const response = ControllerResult.success('指令取消成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command cancellation completed successfully', { id });
            } else {
                const response = ControllerResult.badRequest(result.message || '指令取消失敗');
                res.status(response.status).json(response);
                logger.warn('Command cancellation failed', { id, reason: result.message });
            }
        } catch (error) {
            logger.error('Error in cancelCommand', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送移動指令
     * @route POST /api/drone-commands/send/move
     */
    async sendMoveCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, issuedBy, latitude, longitude, altitude, speed } = req.body;

            // 基本驗證
            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!issuedBy || typeof issuedBy !== 'number') {
                const result = ControllerResult.badRequest('發送者 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof altitude !== 'number') {
                const result = ControllerResult.badRequest('緯度、經度和高度為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Sending move command for drone: ${droneId}`);
            logger.info('Move command request received', { droneId, issuedBy, latitude, longitude, altitude, speed });

            const result = await this.commandService.sendFlyToCommand(droneId, issuedBy, { latitude, longitude, altitude, speed });
            
            if (result.success) {
                const response = ControllerResult.created('移動指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Move command sent successfully', { droneId, commandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message);
                res.status(response.status).json(response);
                logger.warn('Move command failed', { droneId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in sendMoveCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 重試失敗的指令
     * @route POST /api/drone-commands/:id/retry
     */
    async retryFailedCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandId = parseInt(req.params.id);
            const { issuedBy } = req.body;

            // 驗證 ID
            if (isNaN(commandId)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!issuedBy || typeof issuedBy !== 'number') {
                const result = ControllerResult.badRequest('發送者 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Retrying failed command: ${commandId}`);
            logger.info('Retry failed command request received', { commandId, issuedBy });

            const result = await this.commandService.retryFailedCommand(commandId, issuedBy);
            
            if (result.success) {
                const response = ControllerResult.created('指令重試成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command retried successfully', { originalCommandId: commandId, newCommandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message);
                res.status(response.status).json(response);
                logger.warn('Command retry failed', { commandId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in retryFailedCommand', {
                commandId: req.params.id,
                issuedBy: req.body.issuedBy,
                error
            });
            next(error);
        }
    }
}
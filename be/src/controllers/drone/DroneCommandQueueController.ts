/**
 * @fileoverview 無人機指令佇列控制器
 *
 * 此控制器提供無人機指令佇列系統的完整管理功能，包括：
 * - 佇列 CRUD 操作
 * - 批次指令規劃與執行
 * - 條件式指令執行
 * - 佇列狀態管理（開始、暫停、重置、取消）
 * - 智能衝突檢測和執行監控
 *
 * @module Controllers/DroneCommandQueueController
 * @version 1.0.0
 * @author AIOT Team
 */

import { Request, Response, NextFunction } from 'express';
import { DroneCommandQueueModel, DroneCommandQueueStatus } from '../../models/drone/DroneCommandQueueModel.js';
import { DroneCommandModel, DroneCommandStatus, DroneCommandType } from '../../models/drone/DroneCommandModel.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 logger
const logger = createLogger('DroneCommandQueueController');

/**
 * 無人機指令佇列控制器類別
 *
 * 提供無人機指令佇列系統的完整管理功能
 */
export class DroneCommandQueueController {

    /**
     * 獲取所有指令佇列
     */
    public getAllQueues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.debug('Getting all command queues', { 
                query: req.query,
                user: req.user?.id 
            });

            const { page = 1, limit = 50, status, created_by } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            // 構建查詢條件
            const whereClause: any = {};
            if (status) whereClause.status = status;
            if (created_by) whereClause.created_by = created_by;

            const queues = await DroneCommandQueueModel.findAll({
                where: whereClause,
                include: [{
                    model: DroneCommandModel,
                    as: 'commands',
                    required: false
                }],
                limit: Number(limit),
                offset: offset,
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Successfully retrieved ${queues.length} command queues`);
            
            const result = ControllerResult.success(`成功獲取 ${queues.length} 個指令佇列`, queues);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to get command queues', { error: error.message, stack: error.stack });
            const result = ControllerResult.internalError('獲取指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據 ID 獲取指令佇列
     */
    public getQueueById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;
            
            logger.debug('Getting command queue by ID', { 
                queueId,
                user: req.user?.id 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId, {
                include: [{
                    model: DroneCommandModel,
                    as: 'commands',
                    required: false,
                    order: [['createdAt', 'ASC']]
                }]
            });

            if (!queue) {
                logger.warn('Command queue not found', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            logger.info('Successfully retrieved command queue', { queueId });
            
            const result = ControllerResult.success('成功獲取指令佇列', queue);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to get command queue by ID', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('獲取指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 創建新的指令佇列
     */
    public createQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { 
                name, 
                auto_execute = false, 
                execution_conditions = null,
                max_loops = null,
                commands = []
            } = req.body;

            const userId = req.user?.id;
            if (!userId) {
                const result = ControllerResult.unauthorized('用戶未登入');
                res.status(result.status).json(result);
                return;
            }

            logger.debug('Creating new command queue', { 
                name,
                auto_execute,
                commands: commands.length,
                user: userId 
            });

            // 創建佇列
            const queue = await DroneCommandQueueModel.create({
                name,
                status: DroneCommandQueueStatus.PENDING,
                current_index: 0,
                auto_execute,
                execution_conditions,
                loop_count: 0,
                max_loops,
                created_by: userId,
                started_at: null,
                completed_at: null,
                error_message: null
            });

            // 如果有指令，批次創建指令並關聯到佇列
            if (commands && commands.length > 0) {
                const commandsToCreate = commands.map((cmd: any) => ({
                    ...cmd,
                    queue_id: queue.id,
                    status: DroneCommandStatus.PENDING,
                    issued_by: userId,
                    issued_at: new Date()
                }));

                await DroneCommandModel.bulkCreate(commandsToCreate);
            }

            // 重新查詢包含關聯的完整資料
            const createdQueue = await DroneCommandQueueModel.findByPk(queue.id, {
                include: [{
                    model: DroneCommandModel,
                    as: 'commands',
                    required: false
                }]
            });

            logger.info('Successfully created command queue', { 
                queueId: queue.id,
                commandCount: commands.length 
            });
            
            const result = ControllerResult.created('成功創建指令佇列', createdQueue);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to create command queue', { error: error.message, stack: error.stack });
            const result = ControllerResult.internalError('創建指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 更新指令佇列
     */
    public updateQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;
            const updateData = req.body;

            logger.debug('Updating command queue', { 
                queueId,
                updateData,
                user: req.user?.id 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId);

            if (!queue) {
                logger.warn('Command queue not found for update', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            await queue.update(updateData);

            // 重新查詢包含關聯的完整資料
            const updatedQueue = await DroneCommandQueueModel.findByPk(queueId, {
                include: [{
                    model: DroneCommandModel,
                    as: 'commands',
                    required: false
                }]
            });

            logger.info('Successfully updated command queue', { queueId });
            
            const result = ControllerResult.success('成功更新指令佇列', updatedQueue);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to update command queue', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('更新指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 刪除指令佇列
     */
    public deleteQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;

            logger.debug('Deleting command queue', { 
                queueId,
                user: req.user?.id 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId);

            if (!queue) {
                logger.warn('Command queue not found for deletion', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            // 刪除關聯的指令
            await DroneCommandModel.destroy({
                where: { queue_id: queueId }
            });

            // 刪除佇列
            await queue.destroy();

            logger.info('Successfully deleted command queue', { queueId });
            
            const result = ControllerResult.success('成功刪除指令佇列');
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to delete command queue', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('刪除指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 開始執行佇列
     */
    public startQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;

            logger.debug('Starting command queue', { 
                queueId,
                user: req.user?.id 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId, {
                include: [{
                    model: DroneCommandModel,
                    as: 'commands',
                    required: false
                }]
            });

            if (!queue) {
                logger.warn('Command queue not found for start', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            if (queue.status === DroneCommandQueueStatus.RUNNING) {
                logger.warn('Command queue already running', { queueId });
                const result = ControllerResult.badRequest('指令佇列已在執行中');
                res.status(result.status).json(result);
                return;
            }

            // 更新佇列狀態
            await queue.update({
                status: DroneCommandQueueStatus.RUNNING,
                started_at: new Date(),
                current_index: 0
            });

            logger.info('Successfully started command queue', { queueId });
            
            const result = ControllerResult.success('成功開始執行指令佇列', queue);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to start command queue', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('開始執行指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 暫停佇列執行
     */
    public pauseQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;

            logger.debug('Pausing command queue', { 
                queueId,
                user: req.user?.id 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId);

            if (!queue) {
                logger.warn('Command queue not found for pause', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            if (queue.status !== DroneCommandQueueStatus.RUNNING) {
                logger.warn('Command queue not running, cannot pause', { queueId, status: queue.status });
                const result = ControllerResult.badRequest('只能暫停正在執行的佇列');
                res.status(result.status).json(result);
                return;
            }

            await queue.update({
                status: DroneCommandQueueStatus.PAUSED
            });

            logger.info('Successfully paused command queue', { queueId });
            
            const result = ControllerResult.success('成功暫停指令佇列', queue);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to pause command queue', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('暫停指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 重置佇列
     */
    public resetQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;

            logger.debug('Resetting command queue', { 
                queueId,
                user: req.user?.id 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId);

            if (!queue) {
                logger.warn('Command queue not found for reset', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            // 重置佇列狀態
            await queue.update({
                status: DroneCommandQueueStatus.PENDING,
                current_index: 0,
                loop_count: 0,
                started_at: null,
                completed_at: null,
                error_message: null
            });

            // 重置所有關聯指令狀態
            await DroneCommandModel.update(
                {
                    status: DroneCommandStatus.PENDING,
                    executed_at: null,
                    completed_at: null,
                    error_message: null
                },
                {
                    where: { queue_id: queueId }
                }
            );

            logger.info('Successfully reset command queue', { queueId });
            
            const result = ControllerResult.success('成功重置指令佇列', queue);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to reset command queue', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('重置指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 向佇列添加指令
     */
    public addCommandToQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueId = req.params.id;
            const { command_type, command_data, drone_id } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                const result = ControllerResult.unauthorized('用戶未登入');
                res.status(result.status).json(result);
                return;
            }

            logger.debug('Adding command to queue', { 
                queueId,
                command_type,
                drone_id,
                user: userId 
            });

            const queue = await DroneCommandQueueModel.findByPk(queueId);

            if (!queue) {
                logger.warn('Command queue not found for adding command', { queueId });
                const result = ControllerResult.notFound('指令佇列不存在');
                res.status(result.status).json(result);
                return;
            }

            if (queue.status === DroneCommandQueueStatus.RUNNING) {
                logger.warn('Cannot add command to running queue', { queueId });
                const result = ControllerResult.badRequest('無法向正在執行的佇列添加指令');
                res.status(result.status).json(result);
                return;
            }

            const command = await DroneCommandModel.create({
                queue_id: Number(queueId),
                drone_id,
                command_type,
                command_data,
                status: DroneCommandStatus.PENDING,
                issued_by: userId,
                issued_at: new Date(),
                executed_at: null,
                completed_at: null,
                error_message: null
            });

            logger.info('Successfully added command to queue', { queueId, commandId: command.id });
            
            const result = ControllerResult.created('成功向佇列添加指令', command);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to add command to queue', { 
                error: error.message, 
                stack: error.stack,
                queueId: req.params.id 
            });
            const result = ControllerResult.internalError('向佇列添加指令失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 獲取佇列統計
     */
    public getQueueStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.debug('Getting queue statistics', { user: req.user?.id });

            const stats = {
                totalQueues: await DroneCommandQueueModel.count(),
                pendingQueues: await DroneCommandQueueModel.count({ where: { status: DroneCommandQueueStatus.PENDING } }),
                runningQueues: await DroneCommandQueueModel.count({ where: { status: DroneCommandQueueStatus.RUNNING } }),
                pausedQueues: await DroneCommandQueueModel.count({ where: { status: DroneCommandQueueStatus.PAUSED } }),
                completedQueues: await DroneCommandQueueModel.count({ where: { status: DroneCommandQueueStatus.COMPLETED } }),
                failedQueues: await DroneCommandQueueModel.count({ where: { status: DroneCommandQueueStatus.FAILED } })
            };

            logger.info('Successfully retrieved queue statistics');
            
            const result = ControllerResult.success('成功獲取佇列統計', stats);
            res.status(result.status).json(result);

        } catch (error: any) {
            logger.error('Failed to get queue statistics', { error: error.message, stack: error.stack });
            const result = ControllerResult.internalError('獲取佇列統計失敗');
            res.status(result.status).json(result);
        }
    };
}
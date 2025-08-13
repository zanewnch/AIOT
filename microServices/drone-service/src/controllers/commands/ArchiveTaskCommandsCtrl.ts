/**
 * @fileoverview 歸檔任務命令 Controller 實作
 * 
 * 此文件實作了歸檔任務命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、執行、取消等寫入邏輯。
 * 
 * @module ArchiveTaskCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { 
    CreateArchiveTaskRequest 
} from '../../types/services/IArchiveTaskService.js';
import { ArchiveTaskCommandsSvc } from '../../services/commands/ArchiveTaskCommandsSvc.js';
import { ArchiveTaskStatus } from '../../models/ArchiveTaskModel.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

/**
 * 歸檔任務命令 Controller 類別
 * 
 * 專門處理歸檔任務相關的命令請求，包含創建、執行、取消、重試等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class ArchiveTaskCommands
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const commands = container.get<ArchiveTaskCommands>(TYPES.ArchiveTaskCommandsCtrl);
 * 
 * // 在路由中使用
 * router.post('/api/archive-tasks', commands.createTask.bind(commands));
 * router.post('/api/archive-tasks/:id/execute', commands.executeTask.bind(commands));
 * ```
 */
@injectable()
export class ArchiveTaskCommands {
    private readonly logger = createLogger('ArchiveTaskCommands');

    constructor(
        @inject(TYPES.ArchiveTaskCommandsSvc) private readonly commandService: ArchiveTaskCommandsSvc
    ) {}

    /**
     * 創建新的歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route POST /api/archive-tasks
     * @body {CreateArchiveTaskRequest} request - 創建請求資料
     */
    createTask = async (req: Request, res: Response): Promise<void> => {
        try {
            this.logger.info('創建歸檔任務請求', { body: req.body });

            const request: CreateArchiveTaskRequest = req.body;
            
            // 簡單的請求驗證
            if (!request.job_type || !request.table_name || !request.archive_table_name ||
                !request.date_range_start || !request.date_range_end || !request.created_by) {
                const result = ControllerResult.badRequest('缺少必要的請求參數');
                res.status(result.status).json(result);
                return;
            }

            // 轉換日期字串為 Date 對象
            if (typeof request.date_range_start === 'string') {
                request.date_range_start = new Date(request.date_range_start);
            }
            if (typeof request.date_range_end === 'string') {
                request.date_range_end = new Date(request.date_range_end);
            }

            const task = await this.commandService.createTask(request);
            
            this.logger.info('歸檔任務創建成功', { 
                taskId: task.id,
                batchId: task.batch_id,
                jobType: task.job_type 
            });

            const result = ControllerResult.created('歸檔任務創建成功', task);
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('創建歸檔任務失敗', { 
                body: req.body,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`創建歸檔任務失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 批次創建歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route POST /api/archive-tasks/batch
     * @body {CreateArchiveTaskRequest[]} requests - 批次創建請求資料
     */
    createBatchTasks = async (req: Request, res: Response): Promise<void> => {
        try {
            this.logger.info('批次創建歸檔任務請求', { count: req.body?.length });

            const requests: CreateArchiveTaskRequest[] = req.body;
            
            if (!Array.isArray(requests) || requests.length === 0) {
                const result = ControllerResult.badRequest('請求必須是非空的陣列');
                res.status(result.status).json(result);
                return;
            }

            // 轉換日期字串為 Date 對象
            requests.forEach(request => {
                if (typeof request.date_range_start === 'string') {
                    request.date_range_start = new Date(request.date_range_start);
                }
                if (typeof request.date_range_end === 'string') {
                    request.date_range_end = new Date(request.date_range_end);
                }
            });

            const result = await this.commandService.createBatchTasks(requests);
            
            this.logger.info('批次創建歸檔任務完成', { 
                total: requests.length,
                success: result.successCount,
                failure: result.failureCount 
            });

            const finalResult = result.failureCount === 0 ? 
                ControllerResult.created(`批次創建完成: 成功 ${result.successCount} 個，失敗 ${result.failureCount} 個`, result) :
                ControllerResult.success(`批次創建完成: 成功 ${result.successCount} 個，失敗 ${result.failureCount} 個`, result);
            res.status(result.failureCount === 0 ? 201 : 207).json(finalResult);
        } catch (error) {
            this.logger.error('批次創建歸檔任務失敗', { 
                count: req.body?.length,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`批次創建歸檔任務失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 執行歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route POST /api/archive-tasks/:id/execute
     * @param {number} id - 任務 ID
     */
    executeTask = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id, 10);
            
            if (isNaN(taskId)) {
                const result = ControllerResult.badRequest('無效的任務 ID');
                res.status(result.status).json(result);
                return;
            }

            this.logger.info('執行歸檔任務請求', { taskId });

            const result = await this.commandService.executeTask(taskId);
            
            this.logger.info('歸檔任務執行完成', { 
                taskId,
                status: result.status,
                archivedRecords: result.archivedRecords 
            });

            const controllerResult = result.status === ArchiveTaskStatus.COMPLETED ?
                ControllerResult.success('歸檔任務執行成功', result) :
                new ControllerResult(400, `歸檔任務執行失敗: ${result.errorMessage}`, result);

            res.status(controllerResult.status).json(controllerResult);
        } catch (error) {
            this.logger.error('執行歸檔任務失敗', { 
                taskId: req.params.id,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`執行歸檔任務失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 取消歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route POST /api/archive-tasks/:id/cancel
     * @param {number} id - 任務 ID
     * @body {string} reason - 取消原因
     */
    cancelTask = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id, 10);
            const { reason } = req.body;
            
            if (isNaN(taskId)) {
                const result = ControllerResult.badRequest('無效的任務 ID');
                res.status(result.status).json(result);
                return;
            }

            if (!reason || !reason.trim()) {
                const result = ControllerResult.badRequest('取消原因不能為空');
                res.status(result.status).json(result);
                return;
            }

            this.logger.info('取消歸檔任務請求', { taskId, reason });

            const task = await this.commandService.cancelTask(taskId, reason);
            
            this.logger.info('歸檔任務取消成功', { taskId, reason });

            const result = ControllerResult.success('歸檔任務取消成功', task);
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('取消歸檔任務失敗', { 
                taskId: req.params.id,
                reason: req.body?.reason,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`取消歸檔任務失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 重試歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route POST /api/archive-tasks/:id/retry
     * @param {number} id - 任務 ID
     */
    retryTask = async (req: Request, res: Response): Promise<void> => {
        try {
            const taskId = parseInt(req.params.id, 10);
            
            if (isNaN(taskId)) {
                const result = ControllerResult.badRequest('無效的任務 ID');
                res.status(result.status).json(result);
                return;
            }

            this.logger.info('重試歸檔任務請求', { taskId });

            const result = await this.commandService.retryTask(taskId);
            
            this.logger.info('歸檔任務重試完成', { 
                taskId,
                status: result.status 
            });

            const controllerResult = result.status === ArchiveTaskStatus.COMPLETED ?
                ControllerResult.success('歸檔任務重試成功', result) :
                new ControllerResult(400, `歸檔任務重試失敗: ${result.errorMessage}`, result);

            res.status(controllerResult.status).json(controllerResult);
        } catch (error) {
            this.logger.error('重試歸檔任務失敗', { 
                taskId: req.params.id,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`重試歸檔任務失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 清理舊的歸檔任務記錄
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route DELETE /api/archive-tasks/cleanup
     * @queries {number} daysOld - 保留天數
     * @queries {string} [status] - 要清理的任務狀態
     */
    cleanupOldTasks = async (req: Request, res: Response): Promise<void> => {
        try {
            const { daysOld, status } = req.query;
            
            if (!daysOld) {
                const result = ControllerResult.badRequest('必須指定保留天數');
                res.status(result.status).json(result);
                return;
            }

            const daysOldNum = parseInt(daysOld as string, 10);
            if (isNaN(daysOldNum) || daysOldNum <= 0) {
                const result = ControllerResult.badRequest('保留天數必須是正整數');
                res.status(result.status).json(result);
                return;
            }

            let statusFilter: ArchiveTaskStatus | undefined;
            if (status && Object.values(ArchiveTaskStatus).includes(status as ArchiveTaskStatus)) {
                statusFilter = status as ArchiveTaskStatus;
            }

            this.logger.info('清理舊歸檔任務記錄請求', { daysOld: daysOldNum, status: statusFilter });

            const cleanedCount = await this.commandService.cleanupOldTasks(daysOldNum, statusFilter);
            
            this.logger.info('舊歸檔任務記錄清理完成', { 
                daysOld: daysOldNum,
                status: statusFilter,
                cleanedCount 
            });

            const result = ControllerResult.success(`成功清理 ${cleanedCount} 筆舊記錄`, { cleanedCount });
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('清理舊歸檔任務記錄失敗', { 
                query: req.query,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`清理舊歸檔任務記錄失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }
}
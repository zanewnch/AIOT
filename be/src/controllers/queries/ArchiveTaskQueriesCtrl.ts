/**
 * @fileoverview 歸檔任務查詢 Controller 實作
 * 
 * 此文件實作了歸檔任務查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module ArchiveTaskQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { ArchiveTaskQueriesSvc } from '../../services/queries/ArchiveTaskQueriesSvc.js';
import { ArchiveJobType, ArchiveTaskStatus } from '../../models/drone/ArchiveTaskModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

/**
 * 歸檔任務查詢 Controller 類別
 * 
 * 專門處理歸檔任務相關的查詢請求，包含列表查詢、詳情查詢、統計資訊等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class ArchiveTaskQueries
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const queries = new ArchiveTaskQueries();
 * 
 * // 在路由中使用
 * router.get('/api/archive-tasks', queries.getAllTasks.bind(queries));
 * router.get('/api/archive-tasks/:id', queries.getTaskById.bind(queries));
 * ```
 */
export class ArchiveTaskQueries {
    private readonly logger = createLogger('ArchiveTaskQueries');
    private readonly queryService: ArchiveTaskQueriesSvc;

    constructor(queryService?: ArchiveTaskQueriesSvc) {
        this.queryService = queryService || new ArchiveTaskQueriesSvc();
    }

    /**
     * 獲取所有歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route GET /api/archive-tasks
     * @queries {string} [status] - 任務狀態篩選
     * @queries {string} [jobType] - 任務類型篩選
     * @queries {string} [batchId] - 批次ID篩選
     * @queries {string} [createdBy] - 創建者篩選
     * @queries {string} [sortBy] - 排序欄位
     * @queries {string} [sortOrder] - 排序順序 (ASC|DESC)
     * @queries {number} [limit] - 限制數量
     * @queries {number} [offset] - 偏移量
     */
    async getAllTasks(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('獲取所有歸檔任務請求', { 
                query: req.query,
                userAgent: req.get('User-Agent') 
            });

            const {
                status,
                jobType,
                batchId,
                createdBy,
                sortBy,
                sortOrder,
                limit,
                offset
            } = req.query;

            const options: any = {};
            
            if (status && Object.values(ArchiveTaskStatus).includes(status as ArchiveTaskStatus)) {
                options.status = status as ArchiveTaskStatus;
            }
            
            if (jobType && Object.values(ArchiveJobType).includes(jobType as ArchiveJobType)) {
                options.jobType = jobType as ArchiveJobType;
            }
            
            if (batchId) {
                options.batchId = batchId as string;
            }
            
            if (createdBy) {
                options.createdBy = createdBy as string;
            }
            
            if (sortBy) {
                options.sortBy = sortBy as string;
            }
            
            if (sortOrder && ['ASC', 'DESC'].includes(sortOrder as string)) {
                options.sortOrder = sortOrder as 'ASC' | 'DESC';
            }
            
            if (limit) {
                const limitNum = parseInt(limit as string, 10);
                if (!isNaN(limitNum) && limitNum > 0) {
                    options.limit = limitNum;
                }
            }
            
            if (offset) {
                const offsetNum = parseInt(offset as string, 10);
                if (!isNaN(offsetNum) && offsetNum >= 0) {
                    options.offset = offsetNum;
                }
            }

            const tasks = await this.queryService.getAllTasks(options);
            
            this.logger.info('歸檔任務列表獲取成功', { 
                count: tasks.length,
                options 
            });

            const result = ControllerResult.success('歸檔任務列表獲取成功', tasks);
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('獲取歸檔任務列表失敗', { 
                query: req.query,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`獲取歸檔任務列表失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 根據 ID 獲取歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route GET /api/archive-tasks/:id
     * @param {number} id - 任務 ID
     */
    async getTaskById(req: Request, res: Response): Promise<void> {
        try {
            const taskId = parseInt(req.params.id, 10);
            
            if (isNaN(taskId)) {
                const result = ControllerResult.badRequest('無效的任務 ID');
                res.status(result.status).json(result);
                return;
            }

            this.logger.info('根據 ID 獲取歸檔任務請求', { taskId });

            const task = await this.queryService.getTaskById(taskId);
            
            if (!task) {
                const result = ControllerResult.notFound(`任務 ${taskId} 不存在`);
                res.status(result.status).json(result);
                return;
            }

            this.logger.info('歸檔任務獲取成功', { taskId, status: task.status });

            const result = ControllerResult.success('歸檔任務獲取成功', task);
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('獲取歸檔任務失敗', { 
                taskId: req.params.id,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`獲取歸檔任務失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 獲取歸檔任務統計資訊
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route GET /api/archive-tasks/statistics
     */
    async getTaskStatistics(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('獲取歸檔任務統計資訊請求');

            const statistics = await this.queryService.getTaskStatistics();
            
            this.logger.info('歸檔任務統計資訊獲取成功', { 
                totalTasks: statistics.totalTasks 
            });

            const result = ControllerResult.success('歸檔任務統計資訊獲取成功', statistics);
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('獲取歸檔任務統計資訊失敗', { 
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`獲取歸檔任務統計資訊失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }

    /**
     * 獲取歸檔任務資料（用於前端表格顯示）
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route GET /api/archive-tasks/data
     */
    async getTasksData(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('獲取歸檔任務資料請求', { query: req.query });

            // 使用預設的查詢選項來獲取所有任務資料
            const tasks = await this.queryService.getAllTasks({
                sortBy: 'createdAt',
                sortOrder: 'DESC',
                limit: 1000 // 限制返回數量以避免過多資料
            });
            
            this.logger.info('歸檔任務資料獲取成功', { count: tasks.length });

            const result = ControllerResult.success('歸檔任務資料獲取成功', tasks);
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('獲取歸檔任務資料失敗', { 
                query: req.query,
                error: (error as Error).message,
                stack: (error as Error).stack 
            });

            const result = ControllerResult.internalError(`獲取歸檔任務資料失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    }
}
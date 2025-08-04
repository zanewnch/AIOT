/**
 * @fileoverview 歸檔任務 Controller 實作
 * 
 * 此文件實作了歸檔任務控制器，
 * 提供歸檔任務相關的 HTTP API 端點處理。
 * 
 * @module ArchiveTaskController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { 
    IArchiveTaskService,
    CreateArchiveTaskRequest 
} from '../types/services/IArchiveTaskService';
import { ArchiveTaskService } from '../services/ArchiveTaskService';
import { ArchiveJobType, ArchiveTaskStatus } from '../models/ArchiveTaskModel';
import { createLogger } from '../utils/logger';
import { ApiResponse } from '../types/ApiResponseType';

/**
 * 歸檔任務 Controller 類別
 * 
 * 處理歸檔任務相關的 HTTP 請求，包含 CRUD 操作、任務執行、統計等功能。
 * 提供 RESTful API 端點供前端或其他服務調用。
 * 
 * @class ArchiveTaskController
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const controller = new ArchiveTaskController();
 * 
 * // 在路由中使用
 * router.get('/api/archive-tasks', controller.getAllTasks.bind(controller));
 * router.post('/api/archive-tasks', controller.createTask.bind(controller));
 * ```
 */
export class ArchiveTaskController {
    private readonly logger = createLogger('ArchiveTaskController');
    private readonly service: IArchiveTaskService;

    constructor(service?: IArchiveTaskService) {
        this.service = service || new ArchiveTaskService();
    }

    /**
     * 獲取所有歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route GET /api/archive-tasks
     * @query {string} [status] - 任務狀態篩選
     * @query {string} [jobType] - 任務類型篩選
     * @query {string} [batchId] - 批次ID篩選
     * @query {string} [createdBy] - 創建者篩選
     * @query {string} [sortBy] - 排序欄位
     * @query {string} [sortOrder] - 排序順序 (ASC|DESC)
     * @query {number} [limit] - 限制數量
     * @query {number} [offset] - 偏移量
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

            const tasks = await this.service.getAllTasks(options);
            
            this.logger.info('歸檔任務列表獲取成功', { 
                count: tasks.length,
                options 
            });

            const response: ApiResponse<typeof tasks> = {
                success: true,
                data: tasks,
                message: '歸檔任務列表獲取成功'
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('獲取歸檔任務列表失敗', { 
                query: req.query,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `獲取歸檔任務列表失敗: ${error.message}`
            };

            res.status(500).json(response);
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
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '無效的任務 ID'
                };
                res.status(400).json(response);
                return;
            }

            this.logger.info('根據 ID 獲取歸檔任務請求', { taskId });

            const task = await this.service.getTaskById(taskId);
            
            if (!task) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: `任務 ${taskId} 不存在`
                };
                res.status(404).json(response);
                return;
            }

            this.logger.info('歸檔任務獲取成功', { taskId, status: task.status });

            const response: ApiResponse<typeof task> = {
                success: true,
                data: task,
                message: '歸檔任務獲取成功'
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('獲取歸檔任務失敗', { 
                taskId: req.params.id,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `獲取歸檔任務失敗: ${error.message}`
            };

            res.status(500).json(response);
        }
    }

    /**
     * 創建新的歸檔任務
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route POST /api/archive-tasks
     * @body {CreateArchiveTaskRequest} request - 創建請求資料
     */
    async createTask(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('創建歸檔任務請求', { body: req.body });

            const request: CreateArchiveTaskRequest = req.body;
            
            // 簡單的請求驗證
            if (!request.jobType || !request.tableName || !request.archiveTableName ||
                !request.dateRangeStart || !request.dateRangeEnd || !request.createdBy) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '缺少必要的請求參數'
                };
                res.status(400).json(response);
                return;
            }

            // 轉換日期字串為 Date 對象
            if (typeof request.dateRangeStart === 'string') {
                request.dateRangeStart = new Date(request.dateRangeStart);
            }
            if (typeof request.dateRangeEnd === 'string') {
                request.dateRangeEnd = new Date(request.dateRangeEnd);
            }

            const task = await this.service.createTask(request);
            
            this.logger.info('歸檔任務創建成功', { 
                taskId: task.id,
                batchId: task.batch_id,
                jobType: task.job_type 
            });

            const response: ApiResponse<typeof task> = {
                success: true,
                data: task,
                message: '歸檔任務創建成功'
            };

            res.status(201).json(response);
        } catch (error) {
            this.logger.error('創建歸檔任務失敗', { 
                body: req.body,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `創建歸檔任務失敗: ${error.message}`
            };

            res.status(500).json(response);
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
    async createBatchTasks(req: Request, res: Response): Promise<void> {
        try {
            this.logger.info('批次創建歸檔任務請求', { count: req.body?.length });

            const requests: CreateArchiveTaskRequest[] = req.body;
            
            if (!Array.isArray(requests) || requests.length === 0) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '請求必須是非空的陣列'
                };
                res.status(400).json(response);
                return;
            }

            // 轉換日期字串為 Date 對象
            requests.forEach(request => {
                if (typeof request.dateRangeStart === 'string') {
                    request.dateRangeStart = new Date(request.dateRangeStart);
                }
                if (typeof request.dateRangeEnd === 'string') {
                    request.dateRangeEnd = new Date(request.dateRangeEnd);
                }
            });

            const result = await this.service.createBatchTasks(requests);
            
            this.logger.info('批次創建歸檔任務完成', { 
                total: requests.length,
                success: result.successCount,
                failure: result.failureCount 
            });

            const response: ApiResponse<typeof result> = {
                success: result.failureCount === 0,
                data: result,
                message: `批次創建完成: 成功 ${result.successCount} 個，失敗 ${result.failureCount} 個`
            };

            res.status(result.failureCount === 0 ? 201 : 207).json(response);
        } catch (error) {
            this.logger.error('批次創建歸檔任務失敗', { 
                count: req.body?.length,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `批次創建歸檔任務失敗: ${error.message}`
            };

            res.status(500).json(response);
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
    async executeTask(req: Request, res: Response): Promise<void> {
        try {
            const taskId = parseInt(req.params.id, 10);
            
            if (isNaN(taskId)) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '無效的任務 ID'
                };
                res.status(400).json(response);
                return;
            }

            this.logger.info('執行歸檔任務請求', { taskId });

            const result = await this.service.executeTask(taskId);
            
            this.logger.info('歸檔任務執行完成', { 
                taskId,
                status: result.status,
                archivedRecords: result.archivedRecords 
            });

            const response: ApiResponse<typeof result> = {
                success: result.status === ArchiveTaskStatus.COMPLETED,
                data: result,
                message: result.status === ArchiveTaskStatus.COMPLETED ? 
                    '歸檔任務執行成功' : 
                    `歸檔任務執行失敗: ${result.errorMessage}`
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('執行歸檔任務失敗', { 
                taskId: req.params.id,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `執行歸檔任務失敗: ${error.message}`
            };

            res.status(500).json(response);
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
    async cancelTask(req: Request, res: Response): Promise<void> {
        try {
            const taskId = parseInt(req.params.id, 10);
            const { reason } = req.body;
            
            if (isNaN(taskId)) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '無效的任務 ID'
                };
                res.status(400).json(response);
                return;
            }

            if (!reason || !reason.trim()) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '取消原因不能為空'
                };
                res.status(400).json(response);
                return;
            }

            this.logger.info('取消歸檔任務請求', { taskId, reason });

            const task = await this.service.cancelTask(taskId, reason);
            
            this.logger.info('歸檔任務取消成功', { taskId, reason });

            const response: ApiResponse<typeof task> = {
                success: true,
                data: task,
                message: '歸檔任務取消成功'
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('取消歸檔任務失敗', { 
                taskId: req.params.id,
                reason: req.body?.reason,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `取消歸檔任務失敗: ${error.message}`
            };

            res.status(500).json(response);
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
    async retryTask(req: Request, res: Response): Promise<void> {
        try {
            const taskId = parseInt(req.params.id, 10);
            
            if (isNaN(taskId)) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '無效的任務 ID'
                };
                res.status(400).json(response);
                return;
            }

            this.logger.info('重試歸檔任務請求', { taskId });

            const result = await this.service.retryTask(taskId);
            
            this.logger.info('歸檔任務重試完成', { 
                taskId,
                status: result.status 
            });

            const response: ApiResponse<typeof result> = {
                success: result.status === ArchiveTaskStatus.COMPLETED,
                data: result,
                message: result.status === ArchiveTaskStatus.COMPLETED ? 
                    '歸檔任務重試成功' : 
                    `歸檔任務重試失敗: ${result.errorMessage}`
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('重試歸檔任務失敗', { 
                taskId: req.params.id,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `重試歸檔任務失敗: ${error.message}`
            };

            res.status(500).json(response);
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

            const statistics = await this.service.getTaskStatistics();
            
            this.logger.info('歸檔任務統計資訊獲取成功', { 
                totalTasks: statistics.totalTasks 
            });

            const response: ApiResponse<typeof statistics> = {
                success: true,
                data: statistics,
                message: '歸檔任務統計資訊獲取成功'
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('獲取歸檔任務統計資訊失敗', { 
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `獲取歸檔任務統計資訊失敗: ${error.message}`
            };

            res.status(500).json(response);
        }
    }

    /**
     * 清理舊的歸檔任務記錄
     * 
     * @param req - Express 請求對象
     * @param res - Express 響應對象
     * 
     * @route DELETE /api/archive-tasks/cleanup
     * @query {number} daysOld - 保留天數
     * @query {string} [status] - 要清理的任務狀態
     */
    async cleanupOldTasks(req: Request, res: Response): Promise<void> {
        try {
            const { daysOld, status } = req.query;
            
            if (!daysOld) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '必須指定保留天數'
                };
                res.status(400).json(response);
                return;
            }

            const daysOldNum = parseInt(daysOld as string, 10);
            if (isNaN(daysOldNum) || daysOldNum <= 0) {
                const response: ApiResponse<null> = {
                    success: false,
                    data: null,
                    message: '保留天數必須是正整數'
                };
                res.status(400).json(response);
                return;
            }

            let statusFilter: ArchiveTaskStatus | undefined;
            if (status && Object.values(ArchiveTaskStatus).includes(status as ArchiveTaskStatus)) {
                statusFilter = status as ArchiveTaskStatus;
            }

            this.logger.info('清理舊歸檔任務記錄請求', { daysOld: daysOldNum, status: statusFilter });

            const cleanedCount = await this.service.cleanupOldTasks(daysOldNum, statusFilter);
            
            this.logger.info('舊歸檔任務記錄清理完成', { 
                daysOld: daysOldNum,
                status: statusFilter,
                cleanedCount 
            });

            const response: ApiResponse<{ cleanedCount: number }> = {
                success: true,
                data: { cleanedCount },
                message: `成功清理 ${cleanedCount} 筆舊記錄`
            };

            res.status(200).json(response);
        } catch (error) {
            this.logger.error('清理舊歸檔任務記錄失敗', { 
                query: req.query,
                error: error.message,
                stack: error.stack 
            });

            const response: ApiResponse<null> = {
                success: false,
                data: null,
                message: `清理舊歸檔任務記錄失敗: ${error.message}`
            };

            res.status(500).json(response);
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
            const tasks = await this.service.getAllTasks({
                sortBy: 'createdAt',
                sortOrder: 'DESC',
                limit: 1000 // 限制返回數量以避免過多資料
            });
            
            this.logger.info('歸檔任務資料獲取成功', { count: tasks.length });

            // 直接返回陣列格式，符合前端 TableView 的期望
            res.status(200).json(tasks);
        } catch (error) {
            this.logger.error('獲取歸檔任務資料失敗', { 
                query: req.query,
                error: error.message,
                stack: error.stack 
            });

            res.status(500).json({
                error: '獲取歸檔任務資料失敗',
                message: error.message
            });
        }
    }
}
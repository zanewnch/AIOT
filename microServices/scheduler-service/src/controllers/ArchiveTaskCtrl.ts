/**
 * @fileoverview 歸檔任務控制器 - 歸檔任務的 HTTP API 管理介面
 * 
 * ============================================================================
 * 🏗️ 系統架構職責分工說明 (Producer-Consumer 模式)
 * ============================================================================
 * 
 * 1. 【ArchiveScheduler】= 任務調度引擎 (Publisher/Producer)
 *    職責：
 *    • 負責「什麼時候」做歸檔 (定時 cron 排程)
 *    • 負責「發布」歸檔任務到 RabbitMQ
 *    • 監控任務超時、重試、狀態同步
 *    • ⚠️ 重要：不執行實際歸檔操作，只負責任務創建與發布
 * 
 * 2. 【ArchiveTaskController】= 任務管理介面 (Task Management API) ← 本文件
 *    職責：
 *    • 負責「查看和管理」已創建的任務 (HTTP REST API)
 *    • 提供人工干預的入口 (手動觸發、狀態更新)
 *    • 任務列表查詢、統計報表、CRUD 操作
 *    • ⚠️ 重要：不負責任務調度，不執行實際歸檔
 * 
 * 3. 【Archive Consumer】= 實際歸檔執行者 (Consumer/Worker) [另外的服務]
 *    職責：
 *    • 負責「實際執行」歸檔操作 (監聽 RabbitMQ 任務)
 *    • 執行資料搬移、壓縮、清理等具體業務邏輯
 *    • 完成後回報結果到 TASK_RESULT 佇列
 * 
 * 🔄 工作流程：
 * Scheduler (定時發布) → RabbitMQ → Consumer (執行歸檔) → 回報結果 → Scheduler (更新狀態)
 *                     ↕
 *              Controller (查詢/管理) ← 本文件的角色
 * 
 * ============================================================================
 * 
 * 職責說明：
 * - 負責處理歸檔任務相關的 HTTP API 請求
 * - 提供歸檔任務的 CRUD 操作和狀態管理
 * - 支援任務篩選、分頁和統計查詢
 * - 實現統一的 API 回應格式和錯誤處理
 * 
 * 功能定位：
 * - 這是一個 **資料管理型** 控制器，專注於歸檔任務的資料操作
 * - **不負責實際的任務執行**，只負責任務資料的管理和查詢
 * - **不負責任務調度**，任務的自動化創建由 ArchiveScheduler 負責處理
 * - 實際的任務執行由 Archive Consumer 負責處理
 * 
 * API 端點：
 * - GET /archive-tasks - 獲取歸檔任務列表 (支援分頁和篩選)
 * - GET /archive-tasks/:id - 獲取特定歸檔任務詳情
 * - POST /archive-tasks - 創建新的歸檔任務
 * - PUT /archive-tasks/:id - 更新歸檔任務
 * - DELETE /archive-tasks/:id - 刪除歸檔任務
 * - GET /archive-tasks/statistics - 獲取歸檔任務統計資訊
 * - POST /archive-tasks/batch-status - 批量更新任務狀態
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { ArchiveTaskService } from '../services/ArchiveTaskService';
import { 
  ArchiveTaskCreationAttributes,
  ArchiveTaskStatus 
} from '../models/ArchiveTaskModel';
import { 
  ArchiveTaskFilter,
  PaginationOptions 
} from '../repositories/ArchiveTaskRepository';

/**
 * ArchiveTaskController - 歸檔任務控制器類別
 * 
 * 架構模式：
 * - 使用 InversifyJS 依賴注入實現鬆耦合設計
 * - 遵循控制器-服務-儲存庫架構模式
 * - 實現統一的錯誤處理和回應格式
 * - 採用輸入驗證確保資料安全性
 */
@injectable()
export class class ArchiveTaskCtrl {Ctrl {
  constructor(
    @inject(TYPES.ArchiveTaskService) private readonly archiveTaskService: ArchiveTaskService,
    @inject(TYPES.Logger) private readonly logger: any
  ) {}

  /**
   * 獲取歸檔任務列表 API 端點
   * 
   * HTTP 方法: GET
   * 路由路徑: /archive-tasks
   * 查詢參數: page, limit, orderBy, orderDirection, jobType, status, dateRangeStart, dateRangeEnd
   */
  getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      // 解析查詢參數
      const {
        page = '1',
        limit = '50',
        orderBy = 'createdAt',
        orderDirection = 'DESC',
        jobType,
        status,
        dateRangeStart,
        dateRangeEnd,
        createdBy,
        batchId
      } = req.query;

      // 構建篩選條件
      const filter: ArchiveTaskFilter = {};
      if (jobType) filter.jobType = jobType as any;
      if (status) filter.status = status as ArchiveTaskStatus;
      if (createdBy) filter.createdBy = createdBy as string;
      if (batchId) filter.batchId = batchId as string;
      if (dateRangeStart) filter.dateRangeStart = new Date(dateRangeStart as string);
      if (dateRangeEnd) filter.dateRangeEnd = new Date(dateRangeEnd as string);

      // 構建分頁選項
      const pagination: PaginationOptions = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        orderBy: orderBy as string,
        orderDirection: orderDirection as 'ASC' | 'DESC'
      };

      // 驗證分頁參數
      if (pagination.page! < 1 || pagination.limit! < 1 || pagination.limit! > 100) {
        res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1, limit must be between 1 and 100',
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.debug('獲取歸檔任務列表請求', {
        filter,
        pagination,
        ip: req.ip
      });

      // 獲取任務列表
      const result = await this.archiveTaskService.getTasksByFilter(filter, pagination);

      this.logger.info('歸檔任務列表獲取成功', {
        count: result.tasks.length,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit
      });

      res.json({
        success: true,
        data: {
          tasks: result.tasks,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / pagination.limit!)
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('獲取歸檔任務列表失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query
      });

      res.status(500).json({
        error: 'Failed to retrieve archive tasks',
        message: process.env.NODE_ENV === 'production' 
          ? 'Archive tasks temporarily unavailable'
          : (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 獲取特定歸檔任務詳情 API 端點
   * 
   * HTTP 方法: GET
   * 路由路徑: /archive-tasks/:id
   */
  getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id);

      if (isNaN(taskId)) {
        res.status(400).json({
          error: 'Invalid task ID',
          message: 'Task ID must be a valid number',
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.debug('獲取歸檔任務詳情請求', {
        taskId,
        ip: req.ip
      });

      const task = await this.archiveTaskService.getTaskById(taskId);

      if (!task) {
        res.status(404).json({
          error: 'Task not found',
          message: `Archive task with ID ${taskId} not found`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('歸檔任務詳情獲取成功', {
        taskId: task.id,
        status: task.status,
        jobType: task.jobType
      });

      res.json({
        success: true,
        data: task,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('獲取歸檔任務詳情失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskId: req.params.id
      });

      res.status(500).json({
        error: 'Failed to retrieve archive task',
        message: process.env.NODE_ENV === 'production' 
          ? 'Archive task temporarily unavailable'
          : (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 創建新的歸檔任務 API 端點
   * 
   * HTTP 方法: POST
   * 路由路徑: /archive-tasks
   */
  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskData: ArchiveTaskCreationAttributes = req.body;

      // 基本輸入驗證
      if (!taskData.jobType || !taskData.batchId) {
        res.status(400).json({
          error: 'Invalid task data',
          message: 'jobType and batchId are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('創建歸檔任務請求', {
        jobType: taskData.jobType,
        batchId: taskData.batchId,
        ip: req.ip
      });

      const task = await this.archiveTaskService.createTask(taskData);

      this.logger.info('歸檔任務創建成功', {
        taskId: task.id,
        jobType: task.jobType,
        batchId: task.batchId
      });

      res.status(201).json({
        success: true,
        data: task,
        message: 'Archive task created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('創建歸檔任務失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body
      });

      const statusCode = error instanceof Error && error.message.includes('已存在') ? 409 : 500;

      res.status(statusCode).json({
        error: 'Failed to create archive task',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 更新歸檔任務狀態 API 端點
   * 
   * HTTP 方法: PUT
   * 路由路徑: /archive-tasks/:id/status
   */
  updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id);
      const { status, archivedRecords, error: errorMessage } = req.body;

      if (isNaN(taskId)) {
        res.status(400).json({
          error: 'Invalid task ID',
          message: 'Task ID must be a valid number',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Status is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('更新歸檔任務狀態請求', {
        taskId,
        status,
        ip: req.ip
      });

      let updatedTask;

      switch (status) {
        case ArchiveTaskStatus.RUNNING:
          updatedTask = await this.archiveTaskService.startTask(taskId);
          break;
        case ArchiveTaskStatus.COMPLETED:
          updatedTask = await this.archiveTaskService.completeTask(taskId, archivedRecords);
          break;
        case ArchiveTaskStatus.FAILED:
          updatedTask = await this.archiveTaskService.failTask(taskId, errorMessage || '任務執行失敗');
          break;
        default:
          res.status(400).json({
            error: 'Invalid status',
            message: 'Status must be one of: running, completed, failed',
            timestamp: new Date().toISOString()
          });
          return;
      }

      if (!updatedTask) {
        res.status(404).json({
          error: 'Task not found',
          message: `Archive task with ID ${taskId} not found`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('歸檔任務狀態更新成功', {
        taskId: updatedTask.id,
        newStatus: updatedTask.status
      });

      res.json({
        success: true,
        data: updatedTask,
        message: 'Task status updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('更新歸檔任務狀態失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskId: req.params.id,
        requestBody: req.body
      });

      res.status(500).json({
        error: 'Failed to update task status',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 刪除歸檔任務 API 端點
   * 
   * HTTP 方法: DELETE
   * 路由路徑: /archive-tasks/:id
   */
  deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = parseInt(req.params.id);

      if (isNaN(taskId)) {
        res.status(400).json({
          error: 'Invalid task ID',
          message: 'Task ID must be a valid number',
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('刪除歸檔任務請求', {
        taskId,
        ip: req.ip
      });

      const success = await this.archiveTaskService.deleteTask(taskId);

      if (!success) {
        res.status(404).json({
          error: 'Task not found',
          message: `Archive task with ID ${taskId} not found or cannot be deleted`,
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('歸檔任務刪除成功', { taskId });

      res.json({
        success: true,
        message: 'Archive task deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('刪除歸檔任務失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskId: req.params.id
      });

      const statusCode = error instanceof Error && error.message.includes('不允許刪除') ? 409 : 500;

      res.status(statusCode).json({
        error: 'Failed to delete archive task',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 獲取歸檔任務統計資訊 API 端點
   * 
   * HTTP 方法: GET
   * 路由路徑: /archive-tasks/statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };

        // 驗證日期範圍
        if (dateRange.start >= dateRange.end) {
          res.status(400).json({
            error: 'Invalid date range',
            message: 'Start date must be earlier than end date',
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      this.logger.debug('獲取歸檔任務統計請求', {
        dateRange,
        ip: req.ip
      });

      const statistics = await this.archiveTaskService.getStatistics(dateRange);

      this.logger.info('歸檔任務統計獲取成功', {
        totalTasks: statistics.totalTasks,
        dateRange
      });

      res.json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('獲取歸檔任務統計失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query
      });

      res.status(500).json({
        error: 'Failed to retrieve statistics',
        message: process.env.NODE_ENV === 'production' 
          ? 'Statistics temporarily unavailable'
          : (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 批量更新任務狀態 API 端點
   * 
   * HTTP 方法: POST
   * 路由路徑: /archive-tasks/batch-status
   */
  batchUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskIds, status } = req.body;

      if (!Array.isArray(taskIds) || taskIds.length === 0 || !status) {
        res.status(400).json({
          error: 'Invalid request data',
          message: 'taskIds (non-empty array) and status are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 驗證 taskIds 都是數字
      const invalidIds = taskIds.filter(id => !Number.isInteger(id));
      if (invalidIds.length > 0) {
        res.status(400).json({
          error: 'Invalid task IDs',
          message: 'All task IDs must be integers',
          invalidIds,
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.info('批量更新任務狀態請求', {
        taskCount: taskIds.length,
        status,
        ip: req.ip
      });

      const affectedCount = await this.archiveTaskService.updateTasksStatus(taskIds, status);

      this.logger.info('批量更新任務狀態成功', {
        affectedCount,
        status,
        requestedCount: taskIds.length
      });

      res.json({
        success: true,
        data: {
          affectedCount,
          requestedCount: taskIds.length,
          status
        },
        message: `Successfully updated ${affectedCount} tasks`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('批量更新任務狀態失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body
      });

      res.status(500).json({
        error: 'Failed to batch update task status',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };
}
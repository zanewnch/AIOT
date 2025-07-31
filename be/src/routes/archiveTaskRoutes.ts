/**
 * @fileoverview 歸檔任務路由定義
 * 
 * 此文件定義了歸檔任務相關的 HTTP 路由，
 * 提供歸檔任務管理的 RESTful API 端點。
 * 
 * @module archiveTaskRoutes
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from 'express';
import { ArchiveTaskController } from '../controllers/ArchiveTaskController';
import { createLogger } from '../utils/logger';

const logger = createLogger('ArchiveTaskRoutes');
const router = Router();
const controller = new ArchiveTaskController();

/**
 * 歸檔任務路由配置
 * 
 * 定義了完整的歸檔任務管理 API 端點，包含：
 * - 任務 CRUD 操作
 * - 任務執行控制
 * - 統計資訊查詢
 * - 資料清理功能
 * 
 * @namespace ArchiveTaskRoutes
 * @since 1.0.0
 */

// =============================================================================
// 查詢路由 (GET)
// =============================================================================

/**
 * 獲取歸檔任務資料（用於前端表格顯示）
 * 
 * @route GET /api/archive-tasks/data
 * @description 獲取歸檔任務資料，專門用於前端 TableView 組件顯示
 * @access Public
 * @returns {Array} 歸檔任務資料陣列
 * 
 * @example
 * GET /api/archive-tasks/data
 * 
 * Response:
 * [
 *   {
 *     "id": 1,
 *     "job_type": "positions",
 *     "table_name": "drone_positions",
 *     "archive_table_name": "drone_positions_archive",
 *     "date_range_start": "2025-07-01T00:00:00.000Z",
 *     "date_range_end": "2025-07-28T23:59:59.000Z",
 *     "batch_id": "POS_BATCH_20250729_001",
 *     "total_records": 5000,
 *     "archived_records": 5000,
 *     "status": "completed",
 *     "started_at": "2025-07-29T08:00:00.000Z",
 *     "completed_at": "2025-07-29T08:05:30.000Z",
 *     "error_message": null,
 *     "created_by": "system",
 *     "createdAt": "2025-07-29T07:55:00.000Z",
 *     "updatedAt": "2025-07-29T08:05:30.000Z"
 *   }
 * ]
 */
router.get('/data', async (req, res) => {
    logger.debug('歸檔任務資料查詢路由被調用', { path: '/data' });
    await controller.getTasksData(req, res);
});

/**
 * 獲取歸檔任務統計資訊
 * 
 * @route GET /api/archive-tasks/statistics
 * @description 獲取歸檔任務的統計資訊，包含各種狀態和類型的統計
 * @access Public
 * @returns {Object} 統計資訊對象
 * 
 * @example
 * GET /api/archive-tasks/statistics
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalTasks": 150,
 *     "pendingTasks": 5,
 *     "runningTasks": 2,
 *     "completedTasks": 140,
 *     "failedTasks": 3,
 *     "tasksByType": {
 *       "positions": 80,
 *       "commands": 45,
 *       "status": 25
 *     },
 *     "todayTasks": 10,
 *     "weekTasks": 35,
 *     "monthTasks": 120
 *   },
 *   "message": "歸檔任務統計資訊獲取成功"
 * }
 */
router.get('/statistics', async (req, res) => {
    logger.debug('歸檔任務統計查詢路由被調用', { path: '/statistics' });
    await controller.getTaskStatistics(req, res);
});

/**
 * 獲取所有歸檔任務
 * 
 * @route GET /api/archive-tasks
 * @description 獲取歸檔任務列表，支援多種查詢條件和分頁
 * @access Public
 * @query {string} [status] - 任務狀態篩選 (pending|running|completed|failed)
 * @query {string} [jobType] - 任務類型篩選 (positions|commands|status)
 * @query {string} [batchId] - 批次ID篩選
 * @query {string} [createdBy] - 創建者篩選
 * @query {string} [sortBy] - 排序欄位
 * @query {string} [sortOrder] - 排序順序 (ASC|DESC)
 * @query {number} [limit] - 限制數量
 * @query {number} [offset] - 偏移量
 * @returns {Array} 歸檔任務列表
 * 
 * @example
 * GET /api/archive-tasks?status=completed&limit=10&sortBy=createdAt&sortOrder=DESC
 */
router.get('/', async (req, res) => {
    logger.debug('歸檔任務列表查詢路由被調用', { 
        path: '/',
        query: req.query 
    });
    await controller.getAllTasks(req, res);
});

/**
 * 根據 ID 獲取歸檔任務
 * 
 * @route GET /api/archive-tasks/:id
 * @description 根據任務 ID 獲取單一歸檔任務的詳細資訊
 * @access Public
 * @param {number} id - 任務 ID
 * @returns {Object} 歸檔任務詳細資訊
 * 
 * @example
 * GET /api/archive-tasks/123
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 123,
 *     "job_type": "positions",
 *     // ... 其他任務資訊
 *   },
 *   "message": "歸檔任務獲取成功"
 * }
 */
router.get('/:id', async (req, res) => {
    logger.debug('歸檔任務詳情查詢路由被調用', { 
        path: '/:id',
        taskId: req.params.id 
    });
    await controller.getTaskById(req, res);
});

// =============================================================================
// 創建路由 (POST)
// =============================================================================

/**
 * 批次創建歸檔任務
 * 
 * @route POST /api/archive-tasks/batch
 * @description 批次創建多個歸檔任務
 * @access Public
 * @body {Array} requests - 歸檔任務創建請求陣列
 * @returns {Object} 批次創建結果
 * 
 * @example
 * POST /api/archive-tasks/batch
 * Body:
 * [
 *   {
 *     "jobType": "positions",
 *     "tableName": "drone_positions",
 *     "archiveTableName": "drone_positions_archive",
 *     "dateRangeStart": "2025-07-01T00:00:00.000Z",
 *     "dateRangeEnd": "2025-07-28T23:59:59.000Z",
 *     "createdBy": "system"
 *   },
 *   {
 *     "jobType": "commands",
 *     "tableName": "drone_commands",
 *     "archiveTableName": "drone_commands_archive",
 *     "dateRangeStart": "2025-07-01T00:00:00.000Z",
 *     "dateRangeEnd": "2025-07-28T23:59:59.000Z",
 *     "createdBy": "system"
 *   }
 * ]
 */
router.post('/batch', async (req, res) => {
    logger.debug('批次創建歸檔任務路由被調用', { 
        path: '/batch',
        requestCount: req.body?.length 
    });
    await controller.createBatchTasks(req, res);
});

/**
 * 執行歸檔任務
 * 
 * @route POST /api/archive-tasks/:id/execute
 * @description 開始執行指定的歸檔任務
 * @access Public
 * @param {number} id - 任務 ID
 * @returns {Object} 執行結果
 * 
 * @example
 * POST /api/archive-tasks/123/execute
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "taskId": 123,
 *     "status": "completed",
 *     "totalRecords": 5000,
 *     "archivedRecords": 5000,
 *     "executionTime": 30000
 *   },
 *   "message": "歸檔任務執行成功"
 * }
 */
router.post('/:id/execute', async (req, res) => {
    logger.debug('執行歸檔任務路由被調用', { 
        path: '/:id/execute',
        taskId: req.params.id 
    });
    await controller.executeTask(req, res);
});

/**
 * 取消歸檔任務
 * 
 * @route POST /api/archive-tasks/:id/cancel
 * @description 取消指定的歸檔任務
 * @access Public
 * @param {number} id - 任務 ID
 * @body {string} reason - 取消原因
 * @returns {Object} 取消後的任務資訊
 * 
 * @example
 * POST /api/archive-tasks/123/cancel
 * Body:
 * {
 *   "reason": "用戶手動取消"
 * }
 */
router.post('/:id/cancel', async (req, res) => {
    logger.debug('取消歸檔任務路由被調用', { 
        path: '/:id/cancel',
        taskId: req.params.id,
        reason: req.body?.reason 
    });
    await controller.cancelTask(req, res);
});

/**
 * 重試歸檔任務
 * 
 * @route POST /api/archive-tasks/:id/retry
 * @description 重試失敗的歸檔任務
 * @access Public
 * @param {number} id - 任務 ID
 * @returns {Object} 重試執行結果
 * 
 * @example
 * POST /api/archive-tasks/123/retry
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "taskId": 123,
 *     "status": "completed",
 *     "totalRecords": 5000,
 *     "archivedRecords": 5000,
 *     "executionTime": 25000
 *   },
 *   "message": "歸檔任務重試成功"
 * }
 */
router.post('/:id/retry', async (req, res) => {
    logger.debug('重試歸檔任務路由被調用', { 
        path: '/:id/retry',
        taskId: req.params.id 
    });
    await controller.retryTask(req, res);
});

/**
 * 創建新的歸檔任務
 * 
 * @route POST /api/archive-tasks
 * @description 創建新的歸檔任務
 * @access Public
 * @body {Object} request - 歸檔任務創建請求
 * @returns {Object} 創建的歸檔任務
 * 
 * @example
 * POST /api/archive-tasks
 * Body:
 * {
 *   "jobType": "positions",
 *   "tableName": "drone_positions",
 *   "archiveTableName": "drone_positions_archive",
 *   "dateRangeStart": "2025-07-01T00:00:00.000Z",
 *   "dateRangeEnd": "2025-07-28T23:59:59.000Z",
 *   "createdBy": "system",
 *   "batchId": "POS_BATCH_20250729_001"  // 可選
 * }
 */
router.post('/', async (req, res) => {
    logger.debug('創建歸檔任務路由被調用', { 
        path: '/',
        jobType: req.body?.jobType,
        tableName: req.body?.tableName 
    });
    await controller.createTask(req, res);
});

// =============================================================================
// 刪除路由 (DELETE)
// =============================================================================

/**
 * 清理舊的歸檔任務記錄
 * 
 * @route DELETE /api/archive-tasks/cleanup
 * @description 根據指定條件清理舊的歸檔任務記錄
 * @access Public
 * @query {number} daysOld - 保留天數
 * @query {string} [status] - 要清理的任務狀態 (pending|running|completed|failed)
 * @returns {Object} 清理結果
 * 
 * @example
 * DELETE /api/archive-tasks/cleanup?daysOld=30&status=completed
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "cleanedCount": 25
 *   },
 *   "message": "成功清理 25 筆舊記錄"
 * }
 */
router.delete('/cleanup', async (req, res) => {
    logger.debug('清理舊歸檔任務記錄路由被調用', { 
        path: '/cleanup',
        daysOld: req.query.daysOld,
        status: req.query.status 
    });
    await controller.cleanupOldTasks(req, res);
});

// =============================================================================
// 錯誤處理中間件
// =============================================================================

/**
 * 路由錯誤處理中間件
 * 
 * 捕獲路由處理過程中未被捕獲的錯誤，統一處理並返回錯誤響應
 */
router.use((error: any, req: any, res: any, next: any) => {
    logger.error('歸檔任務路由處理錯誤', {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack
    });
    
    res.status(500).json({
        success: false,
        data: null,
        message: `路由處理錯誤: ${error.message}`
    });
});

// 記錄路由初始化完成
logger.info('歸檔任務路由初始化完成', {
    routes: [
        'GET /data',
        'GET /statistics', 
        'GET /',
        'GET /:id',
        'POST /batch',
        'POST /:id/execute',
        'POST /:id/cancel',
        'POST /:id/retry',
        'POST /',
        'DELETE /cleanup'
    ]
});

export default router;
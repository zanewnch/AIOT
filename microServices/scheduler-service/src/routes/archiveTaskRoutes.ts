/**
 * @fileoverview 歸檔任務路由配置
 * 
 * 定義所有歸檔任務相關的 API 端點路由
 * 實現 RESTful API 設計原則
 */

import { Router } from 'express';
import { container } from '../container/container';
import { TYPES } from '../container/types';
import { ArchiveTaskController } from '../controllers/ArchiveTaskController';

const router = Router();

// 獲取歸檔任務控制器實例
const archiveTaskController = container.get<ArchiveTaskController>(TYPES.ArchiveTaskController);

/**
 * 歸檔任務 API 路由
 * 
 * 基礎路徑: /api/archive-tasks
 */

// 獲取任務列表 (支援分頁和篩選)
// GET /api/archive-tasks?page=1&limit=50&status=pending&jobType=positions
router.get('/', archiveTaskController.getTasks);

// 獲取統計資訊
// GET /api/archive-tasks/statistics?startDate=2025-01-01&endDate=2025-01-31
router.get('/statistics', archiveTaskController.getStatistics);

// 批量更新任務狀態
// POST /api/archive-tasks/batch-status
router.post('/batch-status', archiveTaskController.batchUpdateStatus);

// 獲取特定任務詳情
// GET /api/archive-tasks/:id
router.get('/:id', archiveTaskController.getTaskById);

// 創建新的歸檔任務
// POST /api/archive-tasks
router.post('/', archiveTaskController.createTask);

// 更新任務狀態
// PUT /api/archive-tasks/:id/status
router.put('/:id/status', archiveTaskController.updateTaskStatus);

// 刪除任務
// DELETE /api/archive-tasks/:id
router.delete('/:id', archiveTaskController.deleteTask);

export { router as archiveTaskRoutes };
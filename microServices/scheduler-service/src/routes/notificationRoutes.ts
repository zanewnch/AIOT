/**
 * @fileoverview 通知系統路由配置
 * 
 * 定義所有通知相關的 API 端點路由
 * 實現 RESTful API 設計原則
 */

import { Router } from 'express';
import { container } from '../container/container';
import { TYPES } from '../container/types';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();

// 獲取通知控制器實例
const notificationController = container.get<NotificationController>(TYPES.NotificationController);

/**
 * 通知系統 API 路由
 * 
 * 基礎路徑: /api/notifications
 */

// 測試相關端點
router.post('/test', notificationController.testNotification);
router.post('/test-monitoring', notificationController.testMonitoringNotification);

// 統計和監控端點
router.get('/stats', notificationController.getNotificationStats);
router.get('/health', notificationController.getNotificationHealth);

// 通知記錄和狀態端點
router.get('/history', notificationController.getNotificationHistory);
router.get('/pending', notificationController.getPendingNotifications);

// 手動發送端點
router.post('/send', notificationController.sendManualNotification);

export { router as notificationRoutes };
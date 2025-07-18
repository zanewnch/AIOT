import { Router } from 'express';
import { UserActivityController } from '../controller/UserActivityController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * 使用者活動追蹤路由配置
 * 
 * 處理使用者活動追蹤相關的路由設定，包括活動資料查詢、頁面造訪記錄、
 * 會話資訊更新和統計資料取得等功能。
 * 
 * @module Routes
 */

const router = Router();
const userActivityController = new UserActivityController();
const authMiddleware = new AuthMiddleware();

/**
 * 使用者活動追蹤相關路由
 * ====================
 */

// 取得使用者活動資料
// GET /api/user/activity
router.get('/activity', authMiddleware.authenticate, userActivityController.getUserActivity.bind(userActivityController));

// 記錄頁面造訪
// POST /api/user/activity/page-visit
router.post('/activity/page-visit', authMiddleware.authenticate, userActivityController.recordPageVisit.bind(userActivityController));

// 更新會話資訊
// POST /api/user/activity/session
router.post('/activity/session', authMiddleware.authenticate, userActivityController.updateSessionInfo.bind(userActivityController));

// 取得活動統計資料
// GET /api/user/activity/stats
router.get('/activity/stats', authMiddleware.authenticate, userActivityController.getActivityStats.bind(userActivityController));

export { router as userActivityRoutes };
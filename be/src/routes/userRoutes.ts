import { Router } from 'express';
import { userPreferenceRoutes } from './userPreferenceRoutes.js';
import { userActivityRoutes } from './userActivityRoutes.js';
import { ActivityTrackingMiddleware } from '../middleware/ActivityTrackingMiddleware.js';

/**
 * 使用者相關路由配置
 * 
 * 處理使用者偏好設定、功能開關、活動追蹤等功能的路由設定。
 * 包含自動活動追蹤中間件的套用。
 * 
 * @module Routes
 */

const router = Router();


// 套用活動追蹤中間件到所有使用者相關路由
router.use(ActivityTrackingMiddleware.trackActivity);

/**
 * 使用者偏好設定相關路由
 * ========================
 */

// 取得使用者偏好設定
// GET /api/user/preferences
router.use('/api/user', userPreferenceRoutes);


/**
 * 使用者活動追蹤相關路由
 * ====================
 */

// 取得使用者活動資料
// GET /api/user/activity
// POST /api/user/activity/page-visit
// POST /api/user/activity/session
// GET /api/user/activity/stats
router.use('/api/user', userActivityRoutes);

export { router as userRoutes };
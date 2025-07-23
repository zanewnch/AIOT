/**
 * @fileoverview 使用者相關路由配置
 * 
 * 此文件定義了使用者相關的主要路由配置，包括：
 * - 使用者偏好設定路由整合
 * - 使用者活動追蹤路由整合
 * - 全域活動追蹤中間件配置
 * 
 * 作為使用者相關功能的路由聚合器，統一管理所有使用者相關的端點。
 * 自動為所有子路由應用活動追蹤中間件。
 * 
 * @module Routes/UserRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express'; // 引入 Express 路由器模組
import { userPreferenceRoutes } from './userPreferenceRoutes.js'; // 引入使用者偏好設定路由
import { userActivityRoutes } from './userActivityRoutes.js'; // 引入使用者活動追蹤路由
import { ActivityTrackingMiddleware } from '../middlewares/ActivityTrackingMiddleware.js'; // 引入活動追蹤中間件

/**
 * 創建 Express 路由器實例
 * 作為使用者相關功能的主要路由聚合器
 */
const router = Router();


/**
 * 應用全域活動追蹤中間件
 * 
 * 為所有使用者相關的路由自動應用活動追蹤中間件，
 * 確保所有使用者操作都會被記錄用於分析和審計。
 */
router.use(ActivityTrackingMiddleware.trackActivity);

/**
 * 整合使用者偏好設定路由
 * 
 * 將使用者偏好設定相關的路由整合到 /api/user 路徑下。
 * 包含以下端點：
 * - GET /api/user/preferences - 取得使用者偏好設定
 * - PUT /api/user/preferences - 更新使用者偏好設定
 * - POST /api/user/preferences - 建立使用者偏好設定
 * 
 * @see userPreferenceRoutes
 */
router.use('/api/user', userPreferenceRoutes); // 掛載使用者偏好設定路由

/**
 * 整合使用者活動追蹤路由
 * 
 * 將使用者活動追蹤相關的路由整合到 /api/user 路徑下。
 * 包含以下端點：
 * - GET /api/user/activity - 取得使用者活動資料
 * - POST /api/user/activity/page-visit - 記錄頁面造訪
 * - POST /api/user/activity/session - 更新會話資訊
 * - GET /api/user/activity/stats - 取得活動統計資料
 * 
 * @see userActivityRoutes
 */
router.use('/api/user', userActivityRoutes); // 掛載使用者活動追蹤路由

/**
 * 匯出使用者路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器聚合了所有使用者相關的子路由，包括偏好設定和活動追蹤。
 */
export { router as userRoutes };
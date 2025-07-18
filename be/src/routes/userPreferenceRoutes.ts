import { Router } from 'express';
import { UserPreferenceController } from '../controller/UserPreferenceController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * 使用者偏好設定路由配置
 * 
 * 處理使用者個人化設定的路由設定，包括取得、更新和建立偏好設定等功能。
 * 涵蓋主題、語言、時區、自動儲存和通知等設定選項。
 * 
 * @module Routes
 */

const router = Router();
const userPreferenceController = new UserPreferenceController();

/**
 * 使用者偏好設定相關路由
 * ========================
 */

// 取得使用者偏好設定
// GET /api/user/preferences
router.get('/preferences', AuthMiddleware.verifyJWT, userPreferenceController.getUserPreferences.bind(userPreferenceController));

// 更新使用者偏好設定
// PUT /api/user/preferences
router.put('/preferences', AuthMiddleware.verifyJWT, userPreferenceController.updateUserPreferences.bind(userPreferenceController));

// 建立使用者偏好設定
// POST /api/user/preferences
router.post('/preferences', AuthMiddleware.verifyJWT, userPreferenceController.createUserPreferences.bind(userPreferenceController));

export { router as userPreferenceRoutes };
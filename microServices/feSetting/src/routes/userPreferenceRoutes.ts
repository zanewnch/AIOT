/**
 * @fileoverview 用戶偏好設定路由定義 - 集中式權限管理版本
 * 
 * 此文件定義了用戶偏好設定相關的所有 HTTP 路由。
 * 遵循 CQRS 模式，分離命令（Commands）和查詢（Queries）路由。
 * 認證和授權現在由 Kong Gateway + OPA 集中處理。
 * 
 * @module userPreferenceRoutes
 * @author AIOT Team
 * @since 1.0.0
 * @version 2.0.0
 */

import { Router } from 'express';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { UserPreferenceCommands } from '../controllers/commands/UserPreferenceCommandsCtrl.js';
import { UserPreferenceQueries } from '../controllers/queries/UserPreferenceQueriesCtrl.js';

const router = Router();

// 從容器中獲取控制器實例
const commandsController = container.get<UserPreferenceCommands>(TYPES.UserPreferenceCommandsCtrl);
const queriesController = container.get<UserPreferenceQueries>(TYPES.UserPreferenceQueriesCtrl);

/**
 * ==============================================
 * 用戶偏好設定查詢路由（Queries）
 * ==============================================
 */

/**
 * 取得所有用戶偏好設定
 * @route GET /api/user-preferences
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/', queriesController.getAllUserPreferences.bind(queriesController));

/**
 * 根據 ID 取得用戶偏好設定
 * @route GET /api/user-preferences/:id
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/:id', queriesController.getUserPreferenceById.bind(queriesController));

/**
 * 根據用戶 ID 取得用戶偏好設定
 * @route GET /api/user-preferences/user/:userId
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/user/:userId', queriesController.getUserPreferenceByUserId.bind(queriesController));

/**
 * 根據主題查詢用戶偏好設定
 * @route GET /api/user-preferences/theme/:theme
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/theme/:theme', queriesController.getUserPreferencesByTheme.bind(queriesController));

/**
 * 分頁查詢用戶偏好設定
 * @route GET /api/user-preferences/paginated
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/paginated', queriesController.getUserPreferencesWithPagination.bind(queriesController));

/**
 * 搜尋用戶偏好設定
 * @route GET /api/user-preferences/search
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/search', queriesController.searchUserPreferences.bind(queriesController));

/**
 * 取得用戶偏好設定統計資料
 * @route GET /api/user-preferences/statistics
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/statistics', queriesController.getUserPreferenceStatistics.bind(queriesController));

/**
 * 檢查用戶是否有偏好設定
 * @route GET /api/user-preferences/exists/:userId
 * @access Controlled by Kong Gateway + OPA
 */
router.get('/exists/:userId', queriesController.checkUserPreferenceExists.bind(queriesController));

/**
 * ==============================================
 * 用戶偏好設定命令路由（Commands）
 * ==============================================
 */

/**
 * 創建新的用戶偏好設定
 * @route POST /api/user-preferences
 * @access Controlled by Kong Gateway + OPA
 */
router.post('/', commandsController.createUserPreference.bind(commandsController));

/**
 * 批量創建用戶偏好設定
 * @route POST /api/user-preferences/bulk
 * @access Controlled by Kong Gateway + OPA
 */
router.post('/bulk', commandsController.bulkCreateUserPreferences.bind(commandsController));

/**
 * 根據 ID 更新用戶偏好設定
 * @route PUT /api/user-preferences/:id
 * @access Controlled by Kong Gateway + OPA
 */
router.put('/:id', commandsController.updateUserPreference.bind(commandsController));

/**
 * 根據用戶 ID 更新用戶偏好設定
 * @route PUT /api/user-preferences/user/:userId
 * @access Controlled by Kong Gateway + OPA
 */
router.put('/user/:userId', commandsController.updateUserPreferenceByUserId.bind(commandsController));

/**
 * 根據 ID 刪除用戶偏好設定
 * @route DELETE /api/user-preferences/:id
 * @access Controlled by Kong Gateway + OPA
 */
router.delete('/:id', commandsController.deleteUserPreference.bind(commandsController));

/**
 * 根據用戶 ID 刪除用戶偏好設定
 * @route DELETE /api/user-preferences/user/:userId
 * @access Controlled by Kong Gateway + OPA
 */
router.delete('/user/:userId', commandsController.deleteUserPreferenceByUserId.bind(commandsController));

/**
 * 創建或更新用戶偏好設定（upsert）
 * @route POST /api/user-preferences/upsert/:userId
 * @access Controlled by Kong Gateway + OPA
 */
router.post('/upsert/:userId', commandsController.upsertUserPreference.bind(commandsController));

/**
 * 重置用戶偏好設定為預設值
 * @route POST /api/user-preferences/reset/:userId
 * @access Controlled by Kong Gateway + OPA
 */
router.post('/reset/:userId', commandsController.resetUserPreferenceToDefault.bind(commandsController));

export default router;
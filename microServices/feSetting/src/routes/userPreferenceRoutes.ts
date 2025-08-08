/**
 * @fileoverview 用戶偏好設定路由定義
 * 
 * 此文件定義了用戶偏好設定相關的所有 HTTP 路由。
 * 遵循 CQRS 模式，分離命令（Commands）和查詢（Queries）路由。
 * 整合簡化版權限檢查中間件。
 * 
 * @module userPreferenceRoutes
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from 'express';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { UserPreferenceCommands } from '../controllers/commands/UserPreferenceCommandsCtrl.js';
import { UserPreferenceQueries } from '../controllers/queries/UserPreferenceQueriesCtrl.js';
import { FinalPermissionMiddleware } from '../middlewares/FinalPermissionMiddleware.js';

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
 * @access Admin only
 */
router.get('/', 
    FinalPermissionMiddleware.requireUserPreferencePermission('read'),
    queriesController.getAllUserPreferences.bind(queriesController)
);

/**
 * 根據 ID 取得用戶偏好設定
 * @route GET /api/user-preferences/:id
 * @access Admin or Owner
 */
router.get('/:id', 
    FinalPermissionMiddleware.requireUserPreferencePermission('read'),
    queriesController.getUserPreferenceById.bind(queriesController)
);

/**
 * 根據用戶 ID 取得用戶偏好設定
 * @route GET /api/user-preferences/user/:userId
 * @access Admin or Owner
 */
router.get('/user/:userId',
    FinalPermissionMiddleware.requireUserPreferencePermission('read'),
    queriesController.getUserPreferenceByUserId.bind(queriesController)
);

/**
 * 根據主題查詢用戶偏好設定
 * @route GET /api/user-preferences/theme/:theme
 * @access Admin only
 */
router.get('/theme/:theme',
    FinalPermissionMiddleware.requireAdmin(),
    queriesController.getUserPreferencesByTheme.bind(queriesController)
);

/**
 * 分頁查詢用戶偏好設定
 * @route GET /api/user-preferences/paginated
 * @access Admin only
 */
router.get('/paginated',
    FinalPermissionMiddleware.requireAdmin(),
    queriesController.getUserPreferencesWithPagination.bind(queriesController)
);

/**
 * 搜尋用戶偏好設定
 * @route GET /api/user-preferences/search
 * @access Admin only
 */
router.get('/search',
    FinalPermissionMiddleware.requireAdmin(),
    queriesController.searchUserPreferences.bind(queriesController)
);

/**
 * 取得用戶偏好設定統計資料
 * @route GET /api/user-preferences/statistics
 * @access Admin only
 */
router.get('/statistics',
    FinalPermissionMiddleware.requireAdmin(),
    queriesController.getUserPreferenceStatistics.bind(queriesController)
);

/**
 * 檢查用戶是否有偏好設定
 * @route GET /api/user-preferences/exists/:userId
 * @access Admin or Owner
 */
router.get('/exists/:userId',
    FinalPermissionMiddleware.requireUserPreferencePermission('read'),
    queriesController.checkUserPreferenceExists.bind(queriesController)
);

/**
 * ==============================================
 * 用戶偏好設定命令路由（Commands）
 * ==============================================
 */

/**
 * 創建新的用戶偏好設定
 * @route POST /api/user-preferences
 * @access Authenticated users
 */
router.post('/',
    FinalPermissionMiddleware.requireUserPreferencePermission('create'),
    commandsController.createUserPreference.bind(commandsController)
);

/**
 * 批量創建用戶偏好設定
 * @route POST /api/user-preferences/bulk
 * @access Admin only
 */
router.post('/bulk',
    FinalPermissionMiddleware.requireAdmin(),
    commandsController.bulkCreateUserPreferences.bind(commandsController)
);

/**
 * 根據 ID 更新用戶偏好設定
 * @route PUT /api/user-preferences/:id
 * @access Admin or Owner
 */
router.put('/:id',
    FinalPermissionMiddleware.requireUserPreferencePermission('update'),
    commandsController.updateUserPreference.bind(commandsController)
);

/**
 * 根據用戶 ID 更新用戶偏好設定
 * @route PUT /api/user-preferences/user/:userId
 * @access Admin or Owner
 */
router.put('/user/:userId',
    FinalPermissionMiddleware.requireUserPreferencePermission('update'),
    commandsController.updateUserPreferenceByUserId.bind(commandsController)
);

/**
 * 根據 ID 刪除用戶偏好設定
 * @route DELETE /api/user-preferences/:id
 * @access Admin only
 */
router.delete('/:id',
    FinalPermissionMiddleware.requireUserPreferencePermission('delete'),
    commandsController.deleteUserPreference.bind(commandsController)
);

/**
 * 根據用戶 ID 刪除用戶偏好設定
 * @route DELETE /api/user-preferences/user/:userId
 * @access Admin only
 */
router.delete('/user/:userId',
    FinalPermissionMiddleware.requireUserPreferencePermission('delete'),
    commandsController.deleteUserPreferenceByUserId.bind(commandsController)
);

/**
 * 創建或更新用戶偏好設定（upsert）
 * @route POST /api/user-preferences/upsert/:userId
 * @access Admin or Owner
 */
router.post('/upsert/:userId',
    FinalPermissionMiddleware.requireUserPreferencePermission('upsert'),
    commandsController.upsertUserPreference.bind(commandsController)
);

/**
 * 重置用戶偏好設定為預設值
 * @route POST /api/user-preferences/reset/:userId
 * @access Admin or Owner
 */
router.post('/reset/:userId',
    FinalPermissionMiddleware.requireUserPreferencePermission('update'),
    commandsController.resetUserPreferenceToDefault.bind(commandsController)
);

export default router;
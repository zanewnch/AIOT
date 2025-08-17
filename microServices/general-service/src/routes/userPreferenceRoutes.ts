/**
 * @fileoverview 用戶偏好設定路由類別 - InversifyJS + Arrow Functions 版本
 * 
 * 使用 class 封裝路由邏輯，結合 InversifyJS 依賴注入和 arrow functions。
 * 遵循 CQRS 模式，分離命令（Commands）和查詢（Queries）路由。
 * 認證和授權現在由 Express.js Gateway 集中處理。
 * 
 * @module UserPreferenceRoutes
 * @author AIOT Team
 * @since 2.0.0
 * @version 2.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router } from 'express';
import { TYPES } from '../container/types.js';
import { UserPreferenceCommands } from '../controllers/commands/UserPreferenceCommandsCtrl.js';
import { UserPreferenceQueries } from '../controllers/queries/UserPreferenceQueriesCtrl.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';
import { KongHeadersMiddleware } from '../middleware/KongHeadersMiddleware.js';

/**
 * 用戶偏好設定路由類別
 * 
 * 使用 InversifyJS 進行依賴注入，class 內的方法使用 arrow functions
 * 避免 this 綁定問題並提供更清晰的代碼結構
 */
@injectable()
export class UserPreferenceRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.UserPreferenceCommandsCtrl) 
        private readonly commandsController: UserPreferenceCommands,
        @inject(TYPES.UserPreferenceQueriesCtrl) 
        private readonly queriesController: UserPreferenceQueries
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes = (): void => {
        this.setupQueryRoutes();
        this.setupCommandRoutes();
    }

    /**
     * 設定查詢路由 (GET 操作)
     * 使用 Kong Headers 中間件獲取用戶信息，由 Express.js Gateway 處理權限驗證
     */
    private setupQueryRoutes = (): void => {
        // ==============================================
        // 用戶偏好設定查詢路由（Queries）
        // ==============================================

        /**
         * 取得所有用戶偏好設定
         * @route GET /api/user-preferences
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/', 
            KongHeadersMiddleware.extractUserInfo,
            this.getAllUserPreferences
        );

        /**
         * 根據 ID 取得用戶偏好設定
         * @route GET /api/user-preferences/:id
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/:id', this.getUserPreferenceById);

        /**
         * 根據用戶 ID 取得用戶偏好設定
         * @route GET /api/user-preferences/user/:userId
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/user/:userId', this.getUserPreferenceByUserId);

        /**
         * 根據主題查詢用戶偏好設定
         * @route GET /api/user-preferences/theme/:theme
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/theme/:theme', this.getUserPreferencesByTheme);

        /**
         * 分頁查詢用戶偏好設定
         * @route GET /api/user-preferences/paginated
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/paginated', this.getUserPreferencesWithPagination);

        /**
         * 搜尋用戶偏好設定
         * @route GET /api/user-preferences/search
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/search', this.searchUserPreferences);

        /**
         * 取得用戶偏好設定統計資料
         * @route GET /api/user-preferences/statistics
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/statistics', this.getUserPreferenceStatistics);

        /**
         * 檢查用戶偏好設定是否存在
         * @route GET /api/user-preferences/exists/:userId
         * @access Controlled by Express.js Gateway
         */
        this.router.get('/exists/:userId', this.checkUserPreferenceExists);
    }

    /**
     * 設定命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes = (): void => {
        // ==============================================
        // 用戶偏好設定命令路由（Commands）
        // ==============================================

        /**
         * 創建新的用戶偏好設定
         * @route POST /api/user-preferences
         * @access Controlled by Express.js Gateway
         */
        this.router.post('/', this.createUserPreference);

        /**
         * 批量創建用戶偏好設定
         * @route POST /api/user-preferences/bulk
         * @access Controlled by Express.js Gateway
         */
        this.router.post('/bulk', this.bulkCreateUserPreferences);

        /**
         * 更新用戶偏好設定
         * @route PUT /api/user-preferences/:id
         * @access Controlled by Express.js Gateway
         */
        this.router.put('/:id', this.updateUserPreference);

        /**
         * 根據用戶 ID 更新用戶偏好設定
         * @route PUT /api/user-preferences/user/:userId
         * @access Controlled by Express.js Gateway
         */
        this.router.put('/user/:userId', this.updateUserPreferenceByUserId);

        /**
         * 刪除用戶偏好設定
         * @route DELETE /api/user-preferences/:id
         * @access Controlled by Express.js Gateway
         */
        this.router.delete('/:id', this.deleteUserPreference);

        /**
         * 根據用戶 ID 刪除用戶偏好設定
         * @route DELETE /api/user-preferences/user/:userId
         * @access Controlled by Express.js Gateway
         */
        this.router.delete('/user/:userId', this.deleteUserPreferenceByUserId);

        /**
         * Upsert 用戶偏好設定（如果存在則更新，否則創建）
         * @route POST /api/user-preferences/upsert/:userId
         * @access Controlled by Express.js Gateway
         */
        this.router.post('/upsert/:userId', this.upsertUserPreference);

        /**
         * 重設用戶偏好設定為預設值
         * @route POST /api/user-preferences/reset/:userId
         * @access Controlled by Express.js Gateway
         */
        this.router.post('/reset/:userId', this.resetUserPreferenceToDefault);
    }

    // ==============================================
    // 查詢路由處理器 (Arrow Functions)
    // ==============================================

    /**
     * 取得所有用戶偏好設定
     */
    private getAllUserPreferences = (req: any, res: any, next: any) => {
        return this.queriesController.getAllUserPreferences(req, res, next);
    }

    /**
     * 根據 ID 取得用戶偏好設定
     */
    private getUserPreferenceById = (req: any, res: any, next: any) => {
        return this.queriesController.getUserPreferenceById(req, res, next);
    }

    /**
     * 根據用戶 ID 取得用戶偏好設定
     */
    private getUserPreferenceByUserId = (req: any, res: any, next: any) => {
        return this.queriesController.getUserPreferenceByUserId(req, res, next);
    }

    /**
     * 根據主題查詢用戶偏好設定
     */
    private getUserPreferencesByTheme = (req: any, res: any, next: any) => {
        return this.queriesController.getUserPreferencesByTheme(req, res, next);
    }

    /**
     * 分頁查詢用戶偏好設定
     */
    private getUserPreferencesWithPagination = (req: any, res: any, next: any) => {
        return this.queriesController.getUserPreferencesWithPagination(req, res, next);
    }

    /**
     * 搜尋用戶偏好設定
     */
    private searchUserPreferences = (req: any, res: any, next: any) => {
        return this.queriesController.searchUserPreferences(req, res, next);
    }

    /**
     * 取得用戶偏好設定統計資料
     */
    private getUserPreferenceStatistics = (req: any, res: any, next: any) => {
        return this.queriesController.getUserPreferenceStatistics(req, res, next);
    }

    /**
     * 檢查用戶偏好設定是否存在
     */
    private checkUserPreferenceExists = (req: any, res: any, next: any) => {
        return this.queriesController.checkUserPreferenceExists(req, res, next);
    }

    // ==============================================
    // 命令路由處理器 (Arrow Functions)
    // ==============================================

    /**
     * 創建新的用戶偏好設定
     */
    private createUserPreference = (req: any, res: any, next: any) => {
        return this.commandsController.createUserPreference(req, res, next);
    }

    /**
     * 批量創建用戶偏好設定
     */
    private bulkCreateUserPreferences = (req: any, res: any, next: any) => {
        return this.commandsController.bulkCreateUserPreferences(req, res, next);
    }

    /**
     * 更新用戶偏好設定
     */
    private updateUserPreference = (req: any, res: any, next: any) => {
        return this.commandsController.updateUserPreference(req, res, next);
    }

    /**
     * 根據用戶 ID 更新用戶偏好設定
     */
    private updateUserPreferenceByUserId = (req: any, res: any, next: any) => {
        return this.commandsController.updateUserPreferenceByUserId(req, res, next);
    }

    /**
     * 刪除用戶偏好設定
     */
    private deleteUserPreference = (req: any, res: any, next: any) => {
        return this.commandsController.deleteUserPreference(req, res, next);
    }

    /**
     * 根據用戶 ID 刪除用戶偏好設定
     */
    private deleteUserPreferenceByUserId = (req: any, res: any, next: any) => {
        return this.commandsController.deleteUserPreferenceByUserId(req, res, next);
    }

    /**
     * Upsert 用戶偏好設定
     */
    private upsertUserPreference = (req: any, res: any, next: any) => {
        return this.commandsController.upsertUserPreference(req, res, next);
    }

    /**
     * 重設用戶偏好設定為預設值
     */
    private resetUserPreferenceToDefault = (req: any, res: any, next: any) => {
        return this.commandsController.resetUserPreferenceToDefault(req, res, next);
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}
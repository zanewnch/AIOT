/**
 * @fileoverview 用戶偏好設定查詢控制器
 * 
 * 此文件實作了用戶偏好設定查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module UserPreferenceQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { UserPreferenceQueriesSvc } from '../../services/queries/UserPreferenceQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import type { PaginationParams } from '../../types/ApiResponseType.js';

const logger = createLogger('UserPreferenceQueries');

/**
 * 用戶偏好設定查詢控制器類別
 * 
 * 專門處理用戶偏好設定相關的查詢請求，包含各種查詢、搜尋和統計功能。
 * 所有方法都是唯讀操作，遵循 CQRS 模式的查詢端原則。
 * 
 * @class UserPreferenceQueries
 * @since 1.0.0
 */
@injectable()
export class UserPreferenceQueries {
    constructor(
        @inject(TYPES.UserPreferenceQueriesSvc) 
        private readonly userPreferenceQueriesSvc: UserPreferenceQueriesSvc
    ) {}

    /**
     * 取得所有用戶偏好設定
     * @route GET /api/user-preferences
     */
    async getAllUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Fetching all user preferences');
            
            const limit = parseInt(req.query.limit as string) || 100;
            
            // 驗證 limit 參數
            if (limit <= 0 || limit > 1000) {
                const result = ControllerResult.badRequest('limit 參數必須在 1 到 1000 之間');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const preferences = await this.userPreferenceQueriesSvc.getAllUserPreferences(limit);
            
            const result = ControllerResult.success(res, '用戶偏好設定列表獲取成功', preferences);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error fetching all user preferences', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得用戶偏好設定
     * @route GET /api/user-preferences/:id
     */
    async getUserPreferenceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            logRequest(req, `Fetching user preference by ID: ${id}`);

            // ID 驗證
            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的偏好設定 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const preference = await this.userPreferenceQueriesSvc.getUserPreferenceById(id);
            
            if (!preference) {
                const result = ControllerResult.notFound('用戶偏好設定不存在');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const result = ControllerResult.success(res, '用戶偏好設定獲取成功', preference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error fetching user preference by ID', { 
                id: req.params.id, 
                error 
            });
            next(error);
        }
    }

    /**
     * 根據用戶 ID 取得用戶偏好設定
     * @route GET /api/user-preferences/user/:userId
     */
    async getUserPreferenceByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            logRequest(req, `Fetching user preference by user ID: ${userId}`);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ControllerResult.badRequest('無效的用戶 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const preference = await this.userPreferenceQueriesSvc.getUserPreferenceByUserId(userId);
            
            if (!preference) {
                // 返回預設值而不是 404
                const defaultPreference = await this.userPreferenceQueriesSvc.getUserPreferenceOrDefault(userId);
                const result = ControllerResult.success(res, '返回預設用戶偏好設定', defaultPreference);
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 設定偏好設定 Cookie，供前端快速存取
            res.cookie('user_preferences', JSON.stringify({
                theme: preference.theme,
                language: preference.language,
                timezone: preference.timezone,
                autoSave: preference.autoSave,
                notifications: preference.notifications
            }), {
                httpOnly: false, // 允許前端 JavaScript 存取
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 天
            });

            const result = ControllerResult.success(res, '用戶偏好設定獲取成功', preference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error fetching user preference by user ID', { 
                userId: req.params.userId, 
                error 
            });
            next(error);
        }
    }

    /**
     * 根據主題偏好查詢用戶偏好設定
     * @route GET /api/user-preferences/theme/:theme
     */
    async getUserPreferencesByTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const theme = req.params.theme;
            logRequest(req, `Fetching user preferences by theme: ${theme}`);

            // 主題驗證
            if (!['light', 'dark', 'auto'].includes(theme)) {
                const result = ControllerResult.badRequest('無效的主題類型，必須為 light、dark 或 auto');
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            const pagination: PaginationParams = { page, limit };
            
            const result_data = await this.userPreferenceQueriesSvc.getUserPreferencesByTheme(theme, pagination);
            
            const result = ControllerResult.success(res, '按主題查詢用戶偏好設定成功', result_data);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error fetching user preferences by theme', { 
                theme: req.params.theme, 
                error 
            });
            next(error);
        }
    }

    /**
     * 分頁查詢用戶偏好設定
     * @route GET /api/user-preferences/paginated
     */
    async getUserPreferencesWithPagination(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Fetching user preferences with pagination');

            // 分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            // 驗證分頁參數
            if (page <= 0) {
                const result = ControllerResult.badRequest('頁碼必須大於 0');
                res.status(result.status).json(result.toJSON());
                return;
            }
            
            if (limit <= 0 || limit > 100) {
                const result = ControllerResult.badRequest('每頁項目數必須在 1 到 100 之間');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const pagination: PaginationParams = { page, limit };
            
            const result_data = await this.userPreferenceQueriesSvc.getUserPreferencesWithPagination(pagination);
            
            const result = ControllerResult.success(res, '分頁查詢用戶偏好設定成功', result_data);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error fetching user preferences with pagination', { 
                query: req.query, 
                error 
            });
            next(error);
        }
    }

    /**
     * 搜尋用戶偏好設定
     * @route GET /api/user-preferences/search
     */
    async searchUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Searching user preferences');

            // 搜尋條件
            const searchCriteria: any = {};
            
            if (req.query.userId) {
                const userId = parseInt(req.query.userId as string);
                if (isNaN(userId) || userId <= 0) {
                    const result = ControllerResult.badRequest('無效的用戶 ID');
                    res.status(result.status).json(result.toJSON());
                    return;
                }
                searchCriteria.userId = userId;
            }
            
            if (req.query.theme) searchCriteria.theme = req.query.theme;
            if (req.query.language) searchCriteria.language = req.query.language;
            if (req.query.timezone) searchCriteria.timezone = req.query.timezone;
            if (req.query.autoSave !== undefined) searchCriteria.autoSave = req.query.autoSave === 'true';
            if (req.query.notifications !== undefined) searchCriteria.notifications = req.query.notifications === 'true';

            // 分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const pagination: PaginationParams = { page, limit };
            
            const result_data = await this.userPreferenceQueriesSvc.searchUserPreferences(searchCriteria, pagination);
            
            const result = ControllerResult.success(res, '搜尋用戶偏好設定成功', result_data);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error searching user preferences', { 
                query: req.query, 
                error 
            });
            next(error);
        }
    }

    /**
     * 取得用戶偏好設定統計資料
     * @route GET /api/user-preferences/statistics
     */
    async getUserPreferenceStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Fetching user preference statistics');

            const statistics = await this.userPreferenceQueriesSvc.getUserPreferenceStatistics();
            
            const result = ControllerResult.success(res, '用戶偏好設定統計資料獲取成功', statistics);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error fetching user preference statistics', { error });
            next(error);
        }
    }

    /**
     * 檢查用戶是否有偏好設定
     * @route GET /api/user-preferences/exists/:userId
     */
    async checkUserPreferenceExists(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            logRequest(req, `Checking user preference existence for user ID: ${userId}`);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ControllerResult.badRequest('無效的用戶 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const exists = await this.userPreferenceQueriesSvc.checkUserPreferenceExists(userId);
            
            const result = ControllerResult.success(res, '用戶偏好設定存在性檢查完成', { exists });
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error checking user preference existence', { 
                userId: req.params.userId, 
                error 
            });
            next(error);
        }
    }
}
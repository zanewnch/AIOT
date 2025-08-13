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
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import { Logger } from '../../decorators/LoggerDecorator.js';
import type { PaginationParams } from '../../types/ApiResponseType.js';

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
@Logger('UserPreferenceQueries')
export class UserPreferenceQueries {
    constructor(
        @inject(TYPES.UserPreferenceQueriesSvc) 
        private readonly userPreferenceQueriesSvc: UserPreferenceQueriesSvc
    ) {}

    /**
     * 取得所有用戶偏好設定
     * @route GET /api/user-preferences
     */
    getAllUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            
            const limit = parseInt(req.query.limit as string) || 100;
            
            // 驗證 limit 參數
            if (limit <= 0 || limit > 1000) {
                ControllerResult.badRequest(res, 'limit 參數必須在 1 到 1000 之間');
                return;
            }

            const preferences = await this.userPreferenceQueriesSvc.getAllUserPreferences(limit);
            
            ControllerResult.success(res, preferences, '用戶偏好設定列表獲取成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得用戶偏好設定
     * @route GET /api/user-preferences/:id
     */
    getUserPreferenceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            // ID 驗證
            if (isNaN(id) || id <= 0) {
                ControllerResult.badRequest(res, '無效的偏好設定 ID');
                return;
            }

            const preference = await this.userPreferenceQueriesSvc.getUserPreferenceById(id);
            
            if (!preference) {
                ControllerResult.notFound(res, '用戶偏好設定不存在');
                return;
            }

            ControllerResult.success(res, preference, '用戶偏好設定獲取成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據用戶 ID 取得用戶偏好設定
     * @route GET /api/user-preferences/user/:userId
     */
    getUserPreferenceByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                ControllerResult.badRequest(res, '無效的用戶 ID');
                return;
            }

            const preference = await this.userPreferenceQueriesSvc.getUserPreferenceByUserId(userId);
            
            if (!preference) {
                // 返回預設值而不是 404
                const defaultPreference = await this.userPreferenceQueriesSvc.getUserPreferenceOrDefault(userId);
                ControllerResult.success(res, defaultPreference, '返回預設用戶偏好設定');
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

            ControllerResult.success(res, preference, '用戶偏好設定獲取成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據主題偏好查詢用戶偏好設定
     * @route GET /api/user-preferences/theme/:theme
     */
    getUserPreferencesByTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const theme = req.params.theme;

            // 主題驗證
            if (!['light', 'dark', 'auto'].includes(theme)) {
                ControllerResult.badRequest(res, '無效的主題類型，必須為 light、dark 或 auto');
                return;
            }

            // 分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            const pagination: PaginationParams = { page, limit };
            
            const result_data = await this.userPreferenceQueriesSvc.getUserPreferencesByTheme(theme, pagination);
            
            ControllerResult.success(res, result_data, '按主題查詢用戶偏好設定成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 分頁查詢用戶偏好設定
     * @route GET /api/user-preferences/paginated
     */
    getUserPreferencesWithPagination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            // 分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            // 驗證分頁參數
            if (page <= 0) {
                ControllerResult.badRequest(res, '頁碼必須大於 0');
                return;
            }
            
            if (limit <= 0 || limit > 100) {
                ControllerResult.badRequest(res, '每頁項目數必須在 1 到 100 之間');
                return;
            }

            const pagination: PaginationParams = { page, limit };
            
            const result_data = await this.userPreferenceQueriesSvc.getUserPreferencesWithPagination(pagination);
            
            ControllerResult.success(res, result_data, '分頁查詢用戶偏好設定成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 搜尋用戶偏好設定
     * @route GET /api/user-preferences/search
     */
    searchUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            // 搜尋條件
            const searchCriteria: any = {};
            
            if (req.query.userId) {
                const userId = parseInt(req.query.userId as string);
                if (isNaN(userId) || userId <= 0) {
                    ControllerResult.badRequest(res, '無效的用戶 ID');
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
            
            ControllerResult.success(res, result_data, '搜尋用戶偏好設定成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得用戶偏好設定統計資料
     * @route GET /api/user-preferences/statistics
     */
    getUserPreferenceStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            const statistics = await this.userPreferenceQueriesSvc.getUserPreferenceStatistics();
            
            ControllerResult.success(res, statistics, '用戶偏好設定統計資料獲取成功');

        } catch (error) {
            next(error);
        }
    }

    /**
     * 檢查用戶是否有偏好設定
     * @route GET /api/user-preferences/exists/:userId
     */
    checkUserPreferenceExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                ControllerResult.badRequest(res, '無效的用戶 ID');
                return;
            }

            const exists = await this.userPreferenceQueriesSvc.checkUserPreferenceExists(userId);
            
            ControllerResult.success(res, { exists }, '用戶偏好設定存在性檢查完成');

        } catch (error) {
            next(error);
        }
    }
}
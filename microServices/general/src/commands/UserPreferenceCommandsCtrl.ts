/**
 * @fileoverview 用戶偏好設定命令控制器
 * 
 * 此文件實作了用戶偏好設定命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module UserPreferenceCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { UserPreferenceCommandsSvc } from '../../services/commands/UserPreferenceCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import type { UserPreferenceCreationAttributes, UserPreferenceAttributes } from '../../models/UserPreferenceModel.js';

const logger = createLogger('UserPreferenceCommands');

/**
 * 用戶偏好設定命令控制器類別
 * 
 * 專門處理用戶偏好設定相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class UserPreferenceCommands
 * @since 1.0.0
 */
@injectable()
export class UserPreferenceCommands {
    constructor(
        @inject(TYPES.UserPreferenceCommandsSvc) 
        private readonly userPreferenceCommandsSvc: UserPreferenceCommandsSvc
    ) {}

    /**
     * 創建新的用戶偏好設定
     * @route POST /api/user-preferences
     */
    async createUserPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Creating user preference');
            const preferenceData: UserPreferenceCreationAttributes = req.body;

            // 基本驗證
            if (!preferenceData.userId || typeof preferenceData.userId !== 'number') {
                const result = ControllerResult.badRequest('用戶 ID 為必填項且必須為數字');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const createdPreference = await this.userPreferenceCommandsSvc.createUserPreference(preferenceData);
            
            const result = ControllerResult.created('用戶偏好設定創建成功', createdPreference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error creating user preference', { body: req.body, error });
            next(error);
        }
    }

    /**
     * 批量創建用戶偏好設定
     * @route POST /api/user-preferences/bulk
     */
    async bulkCreateUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Bulk creating user preferences');
            const preferencesData: UserPreferenceCreationAttributes[] = req.body;

            // 基本驗證
            if (!Array.isArray(preferencesData)) {
                const result = ControllerResult.badRequest('請求體必須為陣列格式');
                res.status(result.status).json(result.toJSON());
                return;
            }

            if (preferencesData.length === 0) {
                const result = ControllerResult.badRequest('請求陣列不能為空');
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 驗證每個項目的 user_id
            const invalidItems = preferencesData.filter(item => !item.userId || typeof item.userId !== 'number');
            if (invalidItems.length > 0) {
                const result = ControllerResult.badRequest('所有項目的用戶 ID 必須為有效數字');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const createdPreferences = await this.userPreferenceCommandsSvc.bulkCreateUserPreferences(preferencesData);
            
            const result = ControllerResult.created(
                `成功批量創建 ${createdPreferences.length} 個用戶偏好設定`,
                createdPreferences
            );
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error bulk creating user preferences', { body: req.body, error });
            next(error);
        }
    }

    /**
     * 根據 ID 更新用戶偏好設定
     * @route PUT /api/user-preferences/:id
     */
    async updateUserPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            logRequest(req, `Updating user preference with ID: ${id}`);

            // ID 驗證
            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的偏好設定 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const updateData: Partial<UserPreferenceAttributes> = req.body;

            // 檢查是否有更新資料
            if (Object.keys(updateData).length === 0) {
                const result = ControllerResult.badRequest('更新資料不能為空');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const updatedPreference = await this.userPreferenceCommandsSvc.updateUserPreference(id, updateData);
            
            const result = ControllerResult.success(res, '用戶偏好設定更新成功', updatedPreference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error updating user preference', { 
                id: req.params.id, 
                body: req.body, 
                error 
            });
            next(error);
        }
    }

    /**
     * 根據用戶 ID 更新用戶偏好設定
     * @route PUT /api/user-preferences/user/:userId
     */
    async updateUserPreferenceByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            logRequest(req, `Updating user preference for user ID: ${userId}`);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ControllerResult.badRequest('無效的用戶 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const updateData: Partial<UserPreferenceAttributes> = req.body;

            // 檢查是否有更新資料
            if (Object.keys(updateData).length === 0) {
                const result = ControllerResult.badRequest('更新資料不能為空');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const updatedPreference = await this.userPreferenceCommandsSvc.updateUserPreferenceByUserId(userId, updateData);
            
            const result = ControllerResult.success(res, '用戶偏好設定更新成功', updatedPreference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error updating user preference by user ID', { 
                userId: req.params.userId, 
                body: req.body, 
                error 
            });
            next(error);
        }
    }

    /**
     * 根據 ID 刪除用戶偏好設定
     * @route DELETE /api/user-preferences/:id
     */
    async deleteUserPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            logRequest(req, `Deleting user preference with ID: ${id}`);

            // ID 驗證
            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的偏好設定 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const deleted = await this.userPreferenceCommandsSvc.deleteUserPreference(id);
            
            const result = ControllerResult.success(res, '用戶偏好設定刪除成功', { deleted });
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error deleting user preference', { 
                id: req.params.id, 
                error 
            });
            next(error);
        }
    }

    /**
     * 根據用戶 ID 刪除用戶偏好設定
     * @route DELETE /api/user-preferences/user/:userId
     */
    async deleteUserPreferenceByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            logRequest(req, `Deleting user preference for user ID: ${userId}`);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ControllerResult.badRequest('無效的用戶 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const deleted = await this.userPreferenceCommandsSvc.deleteUserPreferenceByUserId(userId);
            
            const result = ControllerResult.success(res, '用戶偏好設定刪除成功', { deleted });
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error deleting user preference by user ID', { 
                userId: req.params.userId, 
                error 
            });
            next(error);
        }
    }

    /**
     * 創建或更新用戶偏好設定（upsert）
     * @route POST /api/user-preferences/upsert/:userId
     */
    async upsertUserPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            logRequest(req, `Upserting user preference for user ID: ${userId}`);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ControllerResult.badRequest('無效的用戶 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const preferenceData: Partial<UserPreferenceAttributes> = req.body;

            // 檢查是否有資料
            if (Object.keys(preferenceData).length === 0) {
                const result = ControllerResult.badRequest('偏好設定資料不能為空');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const upsertedPreference = await this.userPreferenceCommandsSvc.upsertUserPreference(userId, preferenceData);
            
            const result = ControllerResult.success(res, '用戶偏好設定操作成功', upsertedPreference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error upserting user preference', { 
                userId: req.params.userId, 
                body: req.body, 
                error 
            });
            next(error);
        }
    }

    /**
     * 重置用戶偏好設定為預設值
     * @route POST /api/user-preferences/reset/:userId
     */
    async resetUserPreferenceToDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            logRequest(req, `Resetting user preference to default for user ID: ${userId}`);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ControllerResult.badRequest('無效的用戶 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const resetPreference = await this.userPreferenceCommandsSvc.resetUserPreferenceToDefault(userId);
            
            const result = ControllerResult.success(res, '用戶偏好設定已重置為預設值', resetPreference);
            res.status(result.status).json(result.toJSON());

        } catch (error) {
            logger.error('Error resetting user preference to default', { 
                userId: req.params.userId, 
                error 
            });
            next(error);
        }
    }
}
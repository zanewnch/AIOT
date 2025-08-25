/**
 * @fileoverview 用戶偏好設定命令控制器
 * 
 * 此文件實作了用戶偏好設定命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module UserPreferenceCommandsController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { UserPreferenceCommandsService } from '../../services/commands/UserPreferenceCommandsService.js';
import { ResResult } from 'aiot-shared-packages';
import { TYPES } from '../../container/types.js';
// LoggerDecorator will be updated separately - temporarily keeping pattern import
import type { UserPreferenceCreationAttributes, UserPreferenceAttributes } from '../../models/UserPreferenceModel.js';

/**
 * 用戶偏好設定命令控制器類別
 * 
 * 專門處理用戶偏好設定相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class UserPreferenceCommandsController
 * @since 1.0.0
 */
@injectable()
export class class UserPreferenceCommandsCtrl {Ctrl {
    constructor(
        @inject(TYPES.UserPreferenceCommandsService) 
        private readonly userPreferenceCommandsService: UserPreferenceCommandsService
    ) {}

    /**
     * 創建新的用戶偏好設定
     * @route POST /api/user-preferences
     */
    createUserPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const preferenceData: UserPreferenceCreationAttributes = req.body;

            // 基本驗證
            if (!preferenceData.userId || typeof preferenceData.userId !== 'number') {
                const result = ResResult.badRequest('用戶 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const createdPreference = await this.userPreferenceCommandsService.createUserPreference(preferenceData);
            
            const result = ResResult.created('用戶偏好設定創建成功', createdPreference);
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * 批量創建用戶偏好設定
     * @route POST /api/user-preferences/bulk
     */
    bulkCreateUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const preferencesData: UserPreferenceCreationAttributes[] = req.body;

            // 基本驗證
            if (!Array.isArray(preferencesData)) {
                const result = ResResult.badRequest('請求體必須為陣列格式');
                res.status(result.status).json(result);
                return;
            }

            if (preferencesData.length === 0) {
                const result = ResResult.badRequest('請求陣列不能為空');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每個項目的 user_id
            const invalidItems = preferencesData.filter(item => !item.userId || typeof item.userId !== 'number');
            if (invalidItems.length > 0) {
                const result = ResResult.badRequest('所有項目的用戶 ID 必須為有效數字');
                res.status(result.status).json(result);
                return;
            }

            const createdPreferences = await this.userPreferenceCommandsService.bulkCreateUserPreferences(preferencesData);
            
            const result = ResResult.created(`成功批量創建 ${createdPreferences.length} 個用戶偏好設定`, createdPreferences);
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }

    }
    /**
     * 根據 ID 更新用戶偏好設定
     * @route PUT /api/user-preferences/:id
     */
    updateUserPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            // ID 驗證
            if (isNaN(id) || id <= 0) {
                const result = ResResult.badRequest('無效的偏好設定 ID');
                res.status(result.status).json(result);
                return;
            }

            const updateData: Partial<UserPreferenceAttributes> = req.body;

            // 檢查是否有更新資料
            if (Object.keys(updateData).length === 0) {
                const result = ResResult.badRequest('更新資料不能為空');
                res.status(result.status).json(result);
                return;
            }

            const updatedPreference = await this.userPreferenceCommandsService.updateUserPreference(id, updateData);
            
            const result = ResResult.success('用戶偏好設定更新成功', updatedPreference);
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據用戶 ID 更新用戶偏好設定
     * @route PUT /api/user-preferences/user/:userId
     */
    updateUserPreferenceByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ResResult.badRequest('無效的用戶 ID');
                return;
            }

            const updateData: Partial<UserPreferenceAttributes> = req.body;

            // 檢查是否有更新資料
            if (Object.keys(updateData).length === 0) {
                const result = ResResult.badRequest('更新資料不能為空');
                res.status(result.status).json(result);
                return;
            }

            const updatedPreference = await this.userPreferenceCommandsService.updateUserPreferenceByUserId(userId, updateData);
            
            const result = ResResult.success('用戶偏好設定更新成功', updatedPreference);
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 刪除用戶偏好設定
     * @route DELETE /api/user-preferences/:id
     */
    deleteUserPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            // ID 驗證
            if (isNaN(id) || id <= 0) {
                const result = ResResult.badRequest('無效的偏好設定 ID');
                res.status(result.status).json(result);
                return;
            }

            const deleted = await this.userPreferenceCommandsService.deleteUserPreference(id);
            
            const result = ResResult.success('用戶偏好設定刪除成功', { deleted });
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據用戶 ID 刪除用戶偏好設定
     * @route DELETE /api/user-preferences/user/:userId
     */
    deleteUserPreferenceByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ResResult.badRequest('無效的用戶 ID');
                return;
            }

            const deleted = await this.userPreferenceCommandsService.deleteUserPreferenceByUserId(userId);
            
            const result = ResResult.success('用戶偏好設定刪除成功', { deleted });
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * 創建或更新用戶偏好設定（upsert）
     * @route POST /api/user-preferences/upsert/:userId
     */
    upsertUserPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ResResult.badRequest('無效的用戶 ID');
                return;
            }

            const preferenceData: Partial<UserPreferenceAttributes> = req.body;

            // 檢查是否有資料
            if (Object.keys(preferenceData).length === 0) {
                const result = ResResult.badRequest('偏好設定資料不能為空');
                return;
            }

            const upsertedPreference = await this.userPreferenceCommandsService.upsertUserPreference(userId, preferenceData);
            
            const result = ResResult.success('用戶偏好設定操作成功', upsertedPreference);
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * 重置用戶偏好設定為預設值
     * 
     * 將指定用戶的所有偏好設定重置為系統預設值
     * 適用於用戶重置或初始化偏好設定
     * 
     * @param req - Express 請求物件，包含用戶 ID
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當用戶不存在或重置失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 重置請求範例
     * POST /api/user-preferences/reset/456
     * // 無需 body，系統將使用預設值
     * ```
     * 
     * @route POST /api/user-preferences/reset/:userId
     */
    resetUserPreferenceToDefault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            // 用戶 ID 驗證
            if (isNaN(userId) || userId <= 0) {
                const result = ResResult.badRequest('無效的用戶 ID');
                return;
            }

            const resetPreference = await this.userPreferenceCommandsService.resetUserPreferenceToDefault(userId);
            
            const result = ResResult.success('用戶偏好設定已重置為預設值', resetPreference);
            res.status(result.status).json(result);

        } catch (error) {
            next(error);
        }
    }
}
/**
 * @fileoverview 使用者偏好設定命令控制器
 * 
 * 此文件實作了使用者偏好設定命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含建立、更新偏好設定等寫入邏輯。
 * 
 * @module UserPreferenceCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { UserPreferenceModel } from '../../models/UserPreferenceModel.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('UserPreferenceCommands');

/**
 * 使用者偏好設定命令控制器類別
 * 
 * 專門處理使用者偏好設定相關的命令請求，包含建立、更新偏好設定等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class UserPreferenceCommands
 * @since 1.0.0
 */
export class UserPreferenceCommands {
    constructor() {
        // 控制器專注於業務邏輯處理
    }

    /**
     * 更新使用者偏好設定
     * @route PUT /api/user-preferences
     */
    public updateUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 從請求物件中取得已認證的使用者 ID
            const userId = (req as any).user?.id;
            // 從請求主體中解構取得要更新的偏好設定欄位
            const { theme, language, timezone, autoSave, notifications } = req.body;

            logger.info(`Updating user preferences for user ID: ${userId}`);
            logRequest(req, `User preferences update request for user: ${userId}`, 'info');
            logger.debug(`Update data: theme=${theme}, language=${language}, timezone=${timezone}, autoSave=${autoSave}, notifications=${notifications}`);

            // 驗證使用者是否已認證
            if (!userId) {
                logger.warn('User preferences update attempted without valid authentication');
                const response = ControllerResult.unauthorized('未授權的存取');
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 驗證主題設定的有效性，只允許三種模式
            if (theme && !['light', 'dark', 'auto'].includes(theme)) {
                logger.warn(`Invalid theme setting provided: ${theme} for user ID: ${userId}`);
                const response = ControllerResult.badRequest('無效的主題設定');
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 使用 findOrCreate 方法確保偏好設定記錄存在，如果不存在則建立新記錄
            const [preferences, created] = await UserPreferenceModel.findOrCreate({
                where: { userId },
                defaults: {
                    userId, // 使用者 ID
                    theme: theme || 'light', // 主題設定，預設為亮色模式
                    language: language || 'zh-TW', // 語言設定，預設為繁體中文
                    timezone: timezone || 'Asia/Taipei', // 時區設定，預設為台北時區
                    autoSave: autoSave !== undefined ? autoSave : true, // 自動儲存設定，預設為開啟
                    notifications: notifications !== undefined ? notifications : true // 通知設定，預設為開啟
                }
            });

            // 如果記錄已存在（created 為 false），則更新現有記錄
            if (!created) {
                await preferences.update({
                    // 使用展開運算子進行部分更新，只更新提供的欄位
                    ...(theme && { theme }), // 如果提供了主題設定則更新
                    ...(language && { language }), // 如果提供了語言設定則更新
                    ...(timezone && { timezone }), // 如果提供了時區設定則更新
                    ...(autoSave !== undefined && { autoSave }), // 如果提供了自動儲存設定則更新
                    ...(notifications !== undefined && { notifications }) // 如果提供了通知設定則更新
                });
            }

            // 更新偏好設定 Cookie，保持與資料庫的同步
            res.cookie('user_preferences', JSON.stringify({
                theme: preferences.theme, // 更新後的主題設定
                language: preferences.language, // 更新後的語言設定
                timezone: preferences.timezone, // 更新後的時區設定
                autoSave: preferences.autoSave, // 更新後的自動儲存設定
                notifications: preferences.notifications // 更新後的通知設定
            }), {
                httpOnly: false, // 允許前端存取
                secure: process.env.NODE_ENV === 'production', // 生產環境下使用 HTTPS
                sameSite: 'strict', // 防止 CSRF 攻擊
                maxAge: 30 * 24 * 60 * 60 * 1000 // Cookie 有效期為 30 天
            });

            logger.info(`User preferences updated successfully for user ID: ${userId}`);

            // 回傳成功結果，包含更新後的偏好設定資料
            const response = ControllerResult.success('偏好設定已更新', preferences);
            res.status(response.status).json(response.toJSON());
        } catch (error) {
            logger.error('Error updating user preferences:', error);
            next(error);
        }
    }

    /**
     * 建立使用者偏好設定
     * @route POST /api/user-preferences
     */
    public createUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 從請求物件中取得已認證的使用者 ID
            const userId = (req as any).user?.id;
            // 從請求主體中解構取得新的偏好設定資料
            const { theme, language, timezone, autoSave, notifications } = req.body;

            logger.info(`Creating new user preferences for user ID: ${userId}`);
            logRequest(req, `User preferences creation request for user: ${userId}`, 'info');

            // 驗證使用者是否已認證
            if (!userId) {
                logger.warn('User preferences creation attempted without valid authentication');
                const response = ControllerResult.unauthorized('未授權的存取');
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 檢查使用者是否已經有偏好設定，防止重複建立
            const existingPreferences = await UserPreferenceModel.findOne({
                where: { userId }
            });

            // 如果已存在偏好設定，回傳 409 衝突狀態碼
            if (existingPreferences) {
                logger.warn(`Preferences creation failed - preferences already exist for user ID: ${userId}`);
                const response = ControllerResult.conflict('使用者偏好設定已存在');
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 建立新的偏好設定記錄，使用提供的值或預設值
            const preferences = await UserPreferenceModel.create({
                userId, // 使用者 ID
                theme: theme || 'light', // 主題設定，預設為亮色模式
                language: language || 'zh-TW', // 語言設定，預設為繁體中文
                timezone: timezone || 'Asia/Taipei', // 時區設定，預設為台北時區
                autoSave: autoSave !== undefined ? autoSave : true, // 自動儲存設定，預設為開啟
                notifications: notifications !== undefined ? notifications : true // 通知設定，預設為開啟
            });

            // 設定偏好設定 Cookie，供前端快速存取
            res.cookie('user_preferences', JSON.stringify({
                theme: preferences.theme, // 主題設定
                language: preferences.language, // 語言設定
                timezone: preferences.timezone, // 時區設定
                autoSave: preferences.autoSave, // 自動儲存設定
                notifications: preferences.notifications // 通知設定
            }), {
                httpOnly: false, // 允許前端存取
                secure: process.env.NODE_ENV === 'production', // 生產環境下使用 HTTPS
                sameSite: 'strict', // 防止 CSRF 攻擊
                maxAge: 30 * 24 * 60 * 60 * 1000 // Cookie 有效期為 30 天
            });

            logger.info(`User preferences created successfully for user ID: ${userId}`);

            // 回傳 201 建立成功狀態碼，包含新建立的偏好設定資料
            const response = ControllerResult.created('偏好設定已建立', preferences);
            res.status(response.status).json(response.toJSON());
        } catch (error) {
            logger.error('Error creating user preferences:', error);
            next(error);
        }
    }
}
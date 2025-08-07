/**
 * @fileoverview 使用者偏好設定查詢控制器
 * 
 * 此文件實作了使用者偏好設定查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module UserPreferenceQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { UserPreferenceModel } from '../../models/UserPreferenceModel.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('UserPreferenceQueries');

/**
 * 使用者偏好設定查詢控制器類別
 * 
 * 專門處理使用者偏好設定相關的查詢請求，包含獲取使用者偏好設定等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class UserPreferenceQueries
 * @since 1.0.0
 */
export class UserPreferenceQueries {
    constructor() {
        // 控制器專注於業務邏輯處理
    }

    /**
     * 取得使用者偏好設定
     * @route GET /api/user-preferences
     */
    public getUserPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 從請求物件中取得已認證的使用者 ID（透過認證中間件設定）
            const userId = (req as any).user?.id;

            logger.info(`Retrieving user preferences for user ID: ${userId}`);
            logRequest(req, `User preferences request for user: ${userId}`, 'info');

            // 驗證使用者是否已認證，未認證則回傳 401 未授權錯誤
            if (!userId) {
                logger.warn('User preferences request without valid authentication');
                const response = ControllerResult.unauthorized('未授權的存取');
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 從資料庫中查詢使用者的偏好設定
            let preferences = await UserPreferenceModel.findOne({
                where: { userId }
            });

            // 如果沒有偏好設定，建立預設值，這通常發生在使用者第一次使用系統時
            if (!preferences) {
                logger.debug(`Creating default preferences for user ID: ${userId}`);
                preferences = await UserPreferenceModel.create({
                    userId, // 使用者 ID
                    theme: 'light', // 預設主題為亮色模式
                    language: 'zh-TW', // 預設語言為繁體中文
                    timezone: 'Asia/Taipei', // 預設時區為台北時區
                    autoSave: true, // 預設開啟自動儲存
                    notifications: true // 預設開啟通知功能
                });
                logger.info(`Default preferences created for user ID: ${userId}`);
            } else {
                logger.debug(`Existing preferences found for user ID: ${userId}`);
            }

            // 設定偏好設定 Cookie，供前端快速存取
            res.cookie('user_preferences', JSON.stringify({
                theme: preferences.theme, // 主題設定
                language: preferences.language, // 語言設定
                timezone: preferences.timezone, // 時區設定
                autoSave: preferences.autoSave, // 自動儲存設定
                notifications: preferences.notifications // 通知設定
            }), {
                httpOnly: false, // 允許前端 JavaScript 存取，因為需要讓前端讀取偏好設定
                secure: process.env.NODE_ENV === 'production', // 生產環境下使用 HTTPS
                sameSite: 'strict', // 防止 CSRF 攻擊，限制同站請求
                maxAge: 30 * 24 * 60 * 60 * 1000 // Cookie 有效期為 30 天
            });

            logger.info(`User preferences retrieved successfully for user ID: ${userId}`);

            // 回傳成功結果，包含完整的偏好設定資料
            const response = ControllerResult.success('User preferences retrieved successfully', preferences);
            res.status(response.status).json(response.toJSON());
        } catch (error) {
            logger.error('Error retrieving user preferences:', error);
            next(error);
        }
    }
}
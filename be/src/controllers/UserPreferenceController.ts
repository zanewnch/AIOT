/**
 * @fileoverview 使用者偏好設定控制器 - 處理使用者個人化設定的管理功能
 *
 * 此控制器負責管理使用者的個人化偏好設定，包括：
 * - 主題模式（亮色/暗色/自動）
 * - 語言設定（多語言支援）
 * - 時區設定（全球時區支援）
 * - 自動儲存功能開關
 * - 通知功能開關
 *
 * 特色功能：
 * - 自動建立預設偏好設定
 * - 雙重儲存機制（資料庫 + Cookie）
 * - 即時設定同步更新
 * - 完整的輸入驗證
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response, NextFunction } from 'express'; // 引入 Express 的請求、回應和中間件類型定義
import { UserPreferenceModel } from '../models/UserPreferenceModel.js'; // 引入使用者偏好設定資料模型
import { createLogger, logRequest } from '../configs/loggerConfig.js'; // 匯入日誌記錄器
import { ControllerResult } from '../utils/ControllerResult.js'; // 匯入控制器結果介面

// 創建控制器專用的日誌記錄器
const logger = createLogger('UserPreferenceController');

/**
 * 使用者偏好設定控制器類別
 *
 * 提供完整的使用者偏好設定管理功能，包括：
 * - 取得使用者偏好設定
 * - 更新使用者偏好設定
 * - 建立使用者偏好設定
 * - 雙重儲存機制（資料庫 + Cookie）
 *
 * @class UserPreferenceController
 * @description 處理所有與使用者偏好設定相關的 HTTP 請求
 */
export class UserPreferenceController {
  /**
   * 建構函式
   *
   * 初始化使用者偏好設定控制器實例
   * 現代化的控制器設計將路由邏輯分離，專注於業務邏輯處理
   *
   * @constructor
   */
  constructor() {
    // Controller 不再處理路由邏輯，路由配置已移至專門的路由檔案中
  }

  /**
   * 取得使用者偏好設定
   *
   * 此方法負責取得使用者的個人化偏好設定，包括：
   * - 主題模式（light/dark/auto）
   * - 語言設定（zh-TW/en-US 等）
   * - 時區設定（Asia/Taipei 等）
   * - 自動儲存和通知設定
   * - 自動建立預設設定（如果不存在）
   * - 設定偏好設定 Cookie
   *
   * @async
   * @method getUserPreferences
   * @param {Request} req - Express 請求物件，包含使用者認證資訊
   * @param {Response} res - Express 回應物件，用於回傳偏好設定資料
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   *
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   *
   * @example
   * // GET /api/user-preferences
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "theme": "light",
   * //     "language": "zh-TW",
   * //     "timezone": "Asia/Taipei",
   * //     "autoSave": true,
   * //     "notifications": true
   * //   }
   * // }
   */
  public async getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // 回傳 500 伺服器內部錯誤，不暴露敏感的錯誤細節
      const response = ControllerResult.internalError('伺服器內部錯誤');
      res.status(response.status).json(response.toJSON());
    }
  }

  /**
   * 更新使用者偏好設定
   *
   * 此方法負責更新使用者的偏好設定，包括：
   * - 支援部分更新（只更新提供的欄位）
   * - 輸入驗證（主題模式驗證）
   * - 自動建立（如果不存在）
   * - 同步更新 Cookie
   *
   * @async
   * @method updateUserPreferences
   * @param {Request} req - Express 請求物件，包含更新的偏好設定資料
   * @param {Response} res - Express 回應物件，用於回傳更新結果
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   *
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {400} 當主題設定無效時回傳 400 狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   *
   * @example
   * // PUT /api/user-preferences
   * // 請求 body: { "theme": "dark", "language": "en-US" }
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": { ... },
   * //   "message": "偏好設定已更新"
   * // }
   */
  public async updateUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // 回傳 500 伺服器內部錯誤
      const response = ControllerResult.internalError('伺服器內部錯誤');
      res.status(response.status).json(response.toJSON());
    }
  }

  /**
   * 建立使用者偏好設定
   *
   * 此方法負責為使用者建立全新的偏好設定，包括：
   * - 檢查設定是否已存在（防止重複建立）
   * - 使用預設值填充缺失的設定
   * - 設定偏好設定 Cookie
   * - 回傳 201 建立成功狀態碼
   *
   * @async
   * @method createUserPreferences
   * @param {Request} req - Express 請求物件，包含新的偏好設定資料
   * @param {Response} res - Express 回應物件，用於回傳建立結果
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   *
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {409} 當偏好設定已存在時回傳 409 衝突狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   *
   * @example
   * // POST /api/user-preferences
   * // 請求 body: { "theme": "dark", "language": "en-US", "timezone": "America/New_York" }
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": { ... },
   * //   "message": "偏好設定已建立"
   * // }
   */
  public async createUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // 回傳 500 伺服器內部錯誤
      const response = ControllerResult.internalError('伺服器內部錯誤');
      res.status(response.status).json(response.toJSON());
    }
  }
}
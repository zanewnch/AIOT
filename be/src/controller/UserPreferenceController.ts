import { Request, Response, NextFunction } from 'express';
import { UserPreferenceModel } from '../models/UserPreferenceModel.js';

/**
 * 使用者偏好設定控制器
 * 
 * 處理使用者個人化設定的 CRUD 操作，包括主題、語言、時區等偏好設定。
 * 設定會同時儲存在資料庫和 cookie 中，以提供快速存取。
 * 
 * @module Controllers
 */
export class UserPreferenceController {
  constructor() {
    // Controller 不再處理路由邏輯
  }

  /**
   * 取得使用者偏好設定
   * 
   * @param req - Express 請求物件 (包含 user.id)
   * @param res - Express 回應物件
   */
  public async getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      let preferences = await UserPreferenceModel.findOne({
        where: { userId }
      });

      // 如果沒有偏好設定，建立預設值
      if (!preferences) {
        preferences = await UserPreferenceModel.create({
          userId,
          theme: 'light',
          language: 'zh-TW',
          timezone: 'Asia/Taipei',
          autoSave: true,
          notifications: true
        });
      }

      // 設定 cookie
      res.cookie('user_preferences', JSON.stringify({
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        autoSave: preferences.autoSave,
        notifications: preferences.notifications
      }), {
        httpOnly: false, // 允許前端存取
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 天
      });

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('取得使用者偏好設定時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }

  /**
   * 更新使用者偏好設定
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   */
  public async updateUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { theme, language, timezone, autoSave, notifications } = req.body;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      // 驗證輸入
      if (theme && !['light', 'dark', 'auto'].includes(theme)) {
        res.status(400).json({ 
          success: false, 
          message: '無效的主題設定' 
        });
        return;
      }

      const [preferences, created] = await UserPreferenceModel.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          theme: theme || 'light',
          language: language || 'zh-TW',
          timezone: timezone || 'Asia/Taipei',
          autoSave: autoSave !== undefined ? autoSave : true,
          notifications: notifications !== undefined ? notifications : true
        }
      });

      if (!created) {
        await preferences.update({
          ...(theme && { theme }),
          ...(language && { language }),
          ...(timezone && { timezone }),
          ...(autoSave !== undefined && { autoSave }),
          ...(notifications !== undefined && { notifications })
        });
      }

      // 更新 cookie
      res.cookie('user_preferences', JSON.stringify({
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        autoSave: preferences.autoSave,
        notifications: preferences.notifications
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 天
      });

      res.json({
        success: true,
        data: preferences,
        message: '偏好設定已更新'
      });
    } catch (error) {
      console.error('更新使用者偏好設定時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }

  /**
   * 建立使用者偏好設定
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   */
  public async createUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { theme, language, timezone, autoSave, notifications } = req.body;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      // 檢查是否已存在
      const existingPreferences = await UserPreferenceModel.findOne({
        where: { userId }
      });

      if (existingPreferences) {
        res.status(409).json({ 
          success: false, 
          message: '使用者偏好設定已存在' 
        });
        return;
      }

      const preferences = await UserPreferenceModel.create({
        userId,
        theme: theme || 'light',
        language: language || 'zh-TW',
        timezone: timezone || 'Asia/Taipei',
        autoSave: autoSave !== undefined ? autoSave : true,
        notifications: notifications !== undefined ? notifications : true
      });

      // 設定 cookie
      res.cookie('user_preferences', JSON.stringify({
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        autoSave: preferences.autoSave,
        notifications: preferences.notifications
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 天
      });

      res.status(201).json({
        success: true,
        data: preferences,
        message: '偏好設定已建立'
      });
    } catch (error) {
      console.error('建立使用者偏好設定時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }
}
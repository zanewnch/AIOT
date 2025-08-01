/**
 * @fileoverview 使用者偏好設定路由配置
 * 
 * 此文件定義了使用者偏好設定相關的路由端點，包括：
 * - 取得使用者偏好設定
 * - 更新使用者偏好設定
 * - 建立使用者偏好設定
 * 
 * 這些路由處理使用者的個人化設定，包括介面主題、語言、時區、
 * 自動儲存、通知偏好等設定選項。所有端點都需要 JWT 認證。
 * 
 * @module Routes/UserPreferenceRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { UserPreferenceController } from '../controllers/UserPreferenceController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

/**
 * 使用者偏好設定路由類別
 * 
 * 負責配置和管理所有使用者偏好設定相關的路由端點
 */
class UserPreferenceRoutes {
  private router: Router;
  private userPreferenceController: UserPreferenceController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.userPreferenceController = new UserPreferenceController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    this.router.get('/preferences', 
      this.authMiddleware.authenticate,
      this.userPreferenceController.getUserPreferences.bind(this.userPreferenceController)
    );

    this.router.put('/preferences', 
      this.authMiddleware.authenticate,
      this.userPreferenceController.updateUserPreferences.bind(this.userPreferenceController)
    );

    this.router.post('/preferences', 
      this.authMiddleware.authenticate,
      this.userPreferenceController.createUserPreferences.bind(this.userPreferenceController)
    );
  }

  /**
   * 取得路由器實例
   * 
   * @returns {Router} Express 路由器實例
   */
  public getRouter(): Router {
    return this.router;
  }
}

/**
 * 匯出使用者偏好設定路由實例
 */
export const userPreferenceRoutes = new UserPreferenceRoutes().getRouter();
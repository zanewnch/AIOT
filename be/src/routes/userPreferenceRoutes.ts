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
    this.initializeRoutes();
  }

  /**
   * 初始化所有使用者偏好設定路由
   */
  private initializeRoutes(): void {
    this.setupGetUserPreferencesRoute();
    this.setupUpdateUserPreferencesRoute();
    this.setupCreateUserPreferencesRoute();
  }

  /**
   * 設定取得使用者偏好設定路由
   * 
   * 此端點用於獲取當前使用者的偏好設定，包括介面主題、語言、
   * 時區、自動儲存、通知偏好等個人化設定。
   * 
   * @route GET /api/user/preferences
   * @group UserPreference - 使用者偏好設定相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @returns {Object} 200 - 使用者偏好設定
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 404 - 使用者偏好設定不存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupGetUserPreferencesRoute(): void {
    this.router.get('/preferences', 
      this.authMiddleware.authenticate,
      this.userPreferenceController.getUserPreferences.bind(this.userPreferenceController)
    );
  }

  /**
   * 設定更新使用者偏好設定路由
   * 
   * 此端點用於更新使用者的偏好設定，支援部分更新。
   * 只需要提供要更新的設定項目，未提供的項目將保持原有設定。
   * 
   * @route PUT /api/user/preferences
   * @group UserPreference - 使用者偏好設定相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @param {Object} body - 要更新的偏好設定
   * @returns {Object} 200 - 偏好設定更新成功
   * @returns {Object} 400 - 請求參數錯誤
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 404 - 使用者偏好設定不存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupUpdateUserPreferencesRoute(): void {
    this.router.put('/preferences', 
      this.authMiddleware.authenticate,
      this.userPreferenceController.updateUserPreferences.bind(this.userPreferenceController)
    );
  }

  /**
   * 設定建立使用者偏好設定路由
   * 
   * 此端點用於為新使用者建立初始偏好設定。
   * 通常在使用者首次登入或註冊時調用，設定預設值。
   * 
   * @route POST /api/user/preferences
   * @group UserPreference - 使用者偏好設定相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @param {Object} body - 初始偏好設定
   * @returns {Object} 201 - 偏好設定建立成功
   * @returns {Object} 400 - 請求參數錯誤
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 409 - 使用者偏好設定已存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupCreateUserPreferencesRoute(): void {
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
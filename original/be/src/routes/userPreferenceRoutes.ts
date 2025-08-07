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
import { UserPreferenceQueries } from '../controllers/queries/UserPreferenceQueriesCtrl.js';
import { UserPreferenceCommands } from '../controllers/commands/UserPreferenceCommandsCtrl.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

/**
 * 使用者偏好設定路由類別
 * 
 * 負責配置和管理所有使用者偏好設定相關的路由端點
 */
class UserPreferenceRoutes {
  private router: Router;
  private userPreferenceQueries: UserPreferenceQueries;
  private userPreferenceCommands: UserPreferenceCommands;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    PREFERENCES: '/preferences'
  } as const;

  constructor() {
    this.router = Router();
    this.userPreferenceQueries = new UserPreferenceQueries();
    this.userPreferenceCommands = new UserPreferenceCommands();
    this.authMiddleware = new AuthMiddleware();
    
    this.setupPreferenceRoutes();
  }

  /**
   * 設定偏好設定路由
   */
  private setupPreferenceRoutes = (): void => {
    // GET /preferences - 獲取使用者偏好設定 (Query)
    this.router.get(this.ROUTES.PREFERENCES,
      this.authMiddleware.authenticate,
      (req, res, next) => this.userPreferenceQueries.getUserPreferences(req, res, next)
    );

    // PUT /preferences - 更新使用者偏好設定 (Command)
    this.router.put(this.ROUTES.PREFERENCES,
      this.authMiddleware.authenticate,
      (req, res, next) => this.userPreferenceCommands.updateUserPreferences(req, res, next)
    );

    // POST /preferences - 創建使用者偏好設定 (Command)
    this.router.post(this.ROUTES.PREFERENCES,
      this.authMiddleware.authenticate,
      (req, res, next) => this.userPreferenceCommands.createUserPreferences(req, res, next)
    );
  };

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
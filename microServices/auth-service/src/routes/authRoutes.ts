/**
 * @fileoverview 認證相關路由配置
 * 
 * 此文件定義了使用者認證相關的路由端點，包括：
 * - 使用者登入
 * - 使用者登出
 * - 活動追蹤整合
 * 
 * 這些路由處理使用者的身份驗證和會話管理，並集成了
 * 活動追蹤中間件來記錄使用者的登入登出行為。
 * 
 * @module Routes/AuthRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { inject, injectable } from 'inversify';
import { AuthQueriesCtrl } from '../controllers/queries/AuthQueriesCtrl.js';
import { AuthCommandsCtrl } from '../controllers/commands/AuthCommandsCtrl.js';
import { ApiGatewayHeadersMiddleware } from '../middleware/ApiGatewayHeadersMiddleware.js';
import { TYPES } from '../container/types.js';

/**
 * 認證路由類別
 * 
 * 負責配置和管理所有認證相關的路由端點
 * 使用 API Gateway Headers 中間件來獲取用戶信息，由 Express.js Gateway 層進行認證和授權
 */
@injectable()
class AuthRoutes {
  private router: Router;
  // private authMiddleware: AuthMiddleware;

  // RESTful 路由設計 - 使用 HTTP 方法區分功能
  private readonly ROUTES = {
    AUTH: '/'  // /api/auth 被 Gateway strip_path 後變成 /
  } as const;

  constructor(
    @inject(TYPES.AuthQueriesCtrl) private authQueries: AuthQueriesCtrl,
    @inject(TYPES.AuthCommandsCtrl) private authCommands: AuthCommandsCtrl
  ) {
    this.router = Router();
    this.setupAuthRoutes();
  }

  /**
   * 建構子 - 由 DI container 解析 Controller 並初始化路由
   *
   * @remarks
   * 使用 container 取得被註冊的 controller 實例，並呼叫 setupAuthRoutes 設定路由。
   */
  // (constructor 已定義於上方)

  /**
   * 設定認證路由 - RESTful 設計
   */
  private setupAuthRoutes = (): void => {
    // 在開發環境中啟用 API Gateway headers 調試
    if (process.env.NODE_ENV === 'development') {
      this.router.use(ApiGatewayHeadersMiddleware.debugHeaders);
    }
    
    // POST /api/auth - 使用者登入 (不需要認證)
    this.router.post(this.ROUTES.AUTH, 
      (req, res, next) => this.authCommands.login(req, res, next)
    );
    
    // GET /api/auth - 獲取當前使用者資訊 (由 Gateway 處理 JWT 認證)
    this.router.get(this.ROUTES.AUTH,
      (req, res, next): void => {
        // 從 Cookie 中獲取 JWT 並解析用戶信息
        try {
          const authToken = req.cookies?.auth_token;
          if (!authToken) {
            res.status(401).json({
              status: 401,
              message: 'Authentication token not found',
              data: null
            });
            return;
          }

          // 解析 JWT (不驗證簽名，因為 API Gateway 已經驗證過了)
          const base64Payload = authToken.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          
          // 提取用戶信息 (payload 來自已驗證的 JWT)
          const userInfo = {
            id: payload.user.id,
            username: payload.user.username,
            roles: payload.permissions.roles,
            permissions: payload.permissions.permissions,
            departmentId: 1, // 若 payload 未提供則使用預設值
            level: 8,        // 若 payload 未提供則使用預設值
            sessionId: payload.session.session_id,
            isAuthenticated: true,
            authMethod: 'gateway-jwt'
          };

          res.json({
            status: 200,
            message: 'User information retrieved successfully',
            data: {
              isAuthenticated: true,
              user: userInfo
            }
          });
        } catch (error) {
          res.status(401).json({
            status: 401,
            message: 'Invalid authentication token',
            data: null
          });
        }
      }
    );
    
    // DELETE /api/auth - 使用者登出 (由 Gateway 處理 JWT 認證)
    this.router.delete(this.ROUTES.AUTH,
      (req, res, next) => this.authCommands.logout(req, res, next)
    );

    // PUT /api/auth - 更新認證信息 (預留，由 Gateway 處理 JWT 認證)
    this.router.put(this.ROUTES.AUTH,
      ApiGatewayHeadersMiddleware.extractUserInfo,
      (req, res, next): void => {
        // TODO: 實現密碼變更等功能
        res.status(501).json({
          status: 501,
          message: 'Password change functionality not implemented yet',
          data: null
        });
      }
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
 * 匯出 AuthRoutes 類別
 */
export { AuthRoutes };

/**
 * 匯出認證路由實例（透過容器獲取）
 */
import { container } from '../container/container.js';

export const router = container.get<AuthRoutes>(TYPES.AuthRoutes).getRouter();
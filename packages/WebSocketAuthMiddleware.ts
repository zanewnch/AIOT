/**
 * @fileoverview WebSocket JWT 認證中間件
 * 
 * 此檔案實現 Socket.IO 連線的 JWT 認證機制，包括：
 * - JWT Token 驗證和解析
 * - 用戶身份驗證和授權
 * - 連線安全檢查
 * - 錯誤處理和日誌記錄
 * - 與現有 HTTP API 認證系統整合
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { getAuthConfig } from '../configs/authConfig.js';
import { DRONE_EVENTS } from '../configs/websocket/index.js';

/**
 * JWT Payload 介面
 * 定義 JWT Token 中包含的用戶資訊結構
 */
interface JwtPayload {
  userId: string;
  username: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * 擴展的 Socket 介面
 * 添加用戶認證資訊到原始 Socket 物件
 */
interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
  };
  isAuthenticated: boolean;
}

/**
 * WebSocket JWT 認證中間件類別
 * 
 * 提供 Socket.IO 連線的完整認證機制：
 * 
 * **主要功能：**
 * - JWT Token 的驗證和解析
 * - 用戶身份的識別和授權
 * - 連線安全性檢查
 * - 認證失敗處理
 * 
 * **安全特性：**
 * - Token 過期檢查
 * - 簽名驗證
 * - 用戶權限驗證
 * - 惡意連線防護
 * 
 * **與現有系統整合：**
 * - 複用 HTTP API 的 JWT 配置
 * - 共享用戶認證邏輯
 * - 統一的錯誤處理機制
 * 
 * @class WebSocketAuthMiddleware
 */
@injectable()
export class WebSocketAuthMiddleware {
  /**
   * JWT 密鑰
   * @private
   */
  private readonly jwtSecret: string;

  /**
   * 建構函式 - 初始化認證中間件
   * 
   * 載入 JWT 配置並準備認證環境
   */
  constructor() {
    const authConfig = getAuthConfig();
    this.jwtSecret = authConfig.jwtSecret;
  }

  /**
   * 建立認證中間件函式
   * 
   * 返回可用於 Socket.IO 的認證中間件函式
   * 
   * @returns {Function} Socket.IO 認證中間件函式
   * 
   * @example
   * ```typescript
   * const authMiddleware = new WebSocketAuthMiddleware();
   * io.use(authMiddleware.createMiddleware());
   * ```
   */
  public createMiddleware() {
    return (socket: Socket, next: (err?: Error) => void) => {
      const authSocket = socket as AuthenticatedSocket;
      this.authenticateSocket(authSocket, next);
    };
  }

  /**
   * 執行 Socket 認證
   * 
   * 從連線中提取並驗證 JWT Token，設定用戶認證狀態
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {Function} next - 中間件回調函式
   * @private
   */
  private async authenticateSocket(
    socket: AuthenticatedSocket, 
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      // 初始化認證狀態
      socket.isAuthenticated = false;
      socket.user = undefined;

      // 從多個來源提取 Token
      const token = this.extractToken(socket);
      
      if (!token) {
        console.warn(`🔒 No JWT token provided for socket: ${socket.id}`);
        this.sendAuthenticationError(socket, 'No authentication token provided');
        return next(new Error('Authentication required'));
      }

      // 驗證和解析 JWT Token
      const payload = await this.verifyToken(token);
      
      if (!payload) {
        console.warn(`🔒 Invalid JWT token for socket: ${socket.id}`);
        this.sendAuthenticationError(socket, 'Invalid authentication token');
        return next(new Error('Invalid authentication token'));
      }

      // 設定用戶認證資訊
      socket.user = {
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles || [],
        permissions: payload.permissions || []
      };
      socket.isAuthenticated = true;

      console.log(`✅ Socket authenticated successfully:`, {
        socketId: socket.id,
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles,
        clientIP: socket.handshake.address
      });

      // 發送認證成功事件
      socket.emit(DRONE_EVENTS.AUTHENTICATION_SUCCESS, {
        message: 'Authentication successful',
        user: {
          userId: payload.userId,
          username: payload.username,
          roles: payload.roles
        }
      });

      next(); // 認證通過，繼續處理

    } catch (error) {
      console.error(`❌ Socket authentication error for ${socket.id}:`, error);
      this.sendAuthenticationError(socket, 'Authentication failed');
      next(new Error('Authentication failed'));
    }
  }

  /**
   * 從 Socket 連線中提取 JWT Token
   * 
   * 支援多種 Token 傳遞方式：
   * - Query string: ?token=xxx
   * - Headers: Authorization: Bearer xxx
   * - Handshake auth: { auth: { token: xxx } }
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @returns {string | null} JWT Token 或 null
   * @private
   */
  private extractToken(socket: AuthenticatedSocket): string | null {
    const { query, headers, auth } = socket.handshake;

    // 1. 從查詢參數提取 Token
    if (query.token && typeof query.token === 'string') {
      return query.token;
    }

    // 2. 從 Authorization header 提取 Token
    const authHeader = headers.authorization || headers.Authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7); // 移除 'Bearer ' 前綴
    }

    // 3. 從 auth 物件提取 Token (Socket.IO 客戶端推薦方式)
    if (auth && typeof auth === 'object' && 'token' in auth) {
      const authObj = auth as { token?: string };
      if (typeof authObj.token === 'string') {
        return authObj.token;
      }
    }

    return null;
  }

  /**
   * 驗證 JWT Token
   * 
   * 使用 JWT 密鑰驗證 Token 的有效性和完整性
   * 
   * @param {string} token - JWT Token
   * @returns {Promise<JwtPayload | null>} 解析後的 Payload 或 null
   * @private
   */
  private async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      
      // 檢查必要欄位
      if (!payload.userId || !payload.username) {
        console.warn('JWT payload missing required fields:', payload);
        return null;
      }

      // 檢查 Token 是否過期
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.warn('JWT token has expired');
        return null;
      }

      return payload;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        console.warn('JWT verification failed:', error.message);
      } else {
        console.error('Unexpected error during JWT verification:', error);
      }
      return null;
    }
  }

  /**
   * 發送認證錯誤事件
   * 
   * 向客戶端發送認證失敗的詳細資訊
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} message - 錯誤訊息
   * @private
   */
  private sendAuthenticationError(socket: AuthenticatedSocket, message: string): void {
    socket.emit(DRONE_EVENTS.AUTHENTICATION_FAILED, {
      error: 'AUTHENTICATION_FAILED',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 檢查用戶是否具有特定權限
   * 
   * 輔助方法，用於在事件處理器中檢查權限
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} requiredPermission - 需要的權限
   * @returns {boolean} 是否具有權限
   * 
   * @example
   * ```typescript
   * const authMiddleware = new WebSocketAuthMiddleware();
   * if (authMiddleware.hasPermission(socket, 'drone:control')) {
   *   // 處理無人機控制邏輯
   * }
   * ```
   */
  public hasPermission(socket: AuthenticatedSocket, requiredPermission: string): boolean {
    if (!socket.isAuthenticated || !socket.user) {
      return false;
    }

    // 檢查用戶權限列表
    return socket.user.permissions.includes(requiredPermission) ||
           socket.user.roles.includes('admin'); // 管理員擁有所有權限
  }

  /**
   * 檢查用戶是否具有特定角色
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} requiredRole - 需要的角色
   * @returns {boolean} 是否具有角色
   */
  public hasRole(socket: AuthenticatedSocket, requiredRole: string): boolean {
    if (!socket.isAuthenticated || !socket.user) {
      return false;
    }

    return socket.user.roles.includes(requiredRole);
  }

  /**
   * 獲取認證用戶資訊
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @returns {object | null} 用戶資訊或 null
   */
  public getAuthenticatedUser(socket: AuthenticatedSocket): object | null {
    if (!socket.isAuthenticated || !socket.user) {
      return null;
    }

    return {
      userId: socket.user.userId,
      username: socket.user.username,
      roles: socket.user.roles,
      permissions: socket.user.permissions
    };
  }
}
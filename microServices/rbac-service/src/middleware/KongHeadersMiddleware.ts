/**
 * @fileoverview Kong Headers 中間件
 * 
 * 此中間件從 Kong Gateway 傳遞的 headers 中提取用戶信息，
 * 替代原本的 JWT 認證中間件。OPA 已經在 Kong 層完成了認證和授權檢查。
 * 
 * @module KongHeadersMiddleware
 * @author AIOT Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('KongHeadersMiddleware');

/**
 * 從 Kong headers 提取的用戶信息介面
 */
export interface KongUserInfo {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  departmentId: number;
  level: number;
  sessionId?: string;
  ipAddress?: string;
}

/**
 * 擴展 Express Request 介面以包含 Kong 用戶信息
 */
declare global {
  namespace Express {
    interface Request {
      kongUser?: KongUserInfo;
      user?: KongUserInfo; // 保持向後兼容
    }
  }
}

/**
 * Kong Headers 中間件類別
 */
export class KongHeadersMiddleware {
  
  /**
   * Kong 設置的標準 headers
   */
  private static readonly KONG_HEADERS = {
    USER_ID: 'x-user-id',
    USERNAME: 'x-username', 
    ROLES: 'x-user-roles',
    PERMISSIONS: 'x-user-permissions',
    DEPARTMENT_ID: 'x-user-department',
    LEVEL: 'x-user-level',
    SESSION_ID: 'x-session-id',
    IP_ADDRESS: 'x-real-ip',
    AUTH_METHOD: 'x-auth-method'
  } as const;

  /**
   * 提取用戶信息中間件
   */
  public static extractUserInfo = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 檢查是否為認證端點，認證端點不需要用戶信息
      if (req.path.startsWith('/login') || req.path.startsWith('/logout')) {
        return next();
      }

      // 從 Kong headers 提取用戶信息
      const userId = req.headers[KongHeadersMiddleware.KONG_HEADERS.USER_ID] as string;
      const username = req.headers[KongHeadersMiddleware.KONG_HEADERS.USERNAME] as string;
      const rolesHeader = req.headers[KongHeadersMiddleware.KONG_HEADERS.ROLES] as string;
      const permissionsHeader = req.headers[KongHeadersMiddleware.KONG_HEADERS.PERMISSIONS] as string;
      const departmentId = req.headers[KongHeadersMiddleware.KONG_HEADERS.DEPARTMENT_ID] as string;
      const level = req.headers[KongHeadersMiddleware.KONG_HEADERS.LEVEL] as string;
      const sessionId = req.headers[KongHeadersMiddleware.KONG_HEADERS.SESSION_ID] as string;
      const authMethod = req.headers[KongHeadersMiddleware.KONG_HEADERS.AUTH_METHOD] as string;

      // 檢查必要的用戶信息是否存在
      if (!userId || !username) {
        logger.warn('Missing required user headers from Kong', { 
          path: req.path,
          method: req.method,
          headers: {
            userId: !!userId,
            username: !!username,
            authMethod
          }
        });
        
        return res.status(401).json({
          status: 401,
          message: 'Authentication required - missing user information',
          data: null
        });
      }

      // 解析角色和權限（可能是逗號分隔的字符串）
      const roles = rolesHeader ? rolesHeader.split(',').map(r => r.trim()) : [];
      const permissions = permissionsHeader ? permissionsHeader.split(',').map(p => p.trim()) : [];

      // 構建用戶信息對象
      const kongUser: KongUserInfo = {
        id: userId,
        username: username,
        roles: roles,
        permissions: permissions,
        departmentId: departmentId ? parseInt(departmentId, 10) : 1,
        level: level ? parseInt(level, 10) : 1,
        sessionId: sessionId,
        ipAddress: req.ip || req.headers[KongHeadersMiddleware.KONG_HEADERS.IP_ADDRESS] as string
      };

      // 將用戶信息添加到 request 對象
      req.kongUser = kongUser;
      req.user = kongUser; // 保持向後兼容

      logger.debug('User info extracted from Kong headers', {
        userId: kongUser.id,
        username: kongUser.username,
        roles: kongUser.roles,
        permissionCount: kongUser.permissions.length,
        departmentId: kongUser.departmentId,
        level: kongUser.level,
        authMethod
      });

      next();
    } catch (error) {
      logger.error('Error extracting user info from Kong headers:', error);
      
      res.status(500).json({
        status: 500,
        message: 'Internal server error while processing user information',
        data: null
      });
    }
  };

  /**
   * 檢查用戶權限的中間件工廠
   */
  public static requirePermission = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = req.kongUser || req.user;
        
        if (!user) {
          logger.warn('Permission check failed - no user info', { 
            path: req.path,
            requiredPermission 
          });
          
          return res.status(401).json({
            status: 401,
            message: 'Authentication required',
            data: null
          });
        }

        // 檢查是否有超級權限
        if (user.permissions.includes('*')) {
          logger.debug('Permission granted - superuser', {
            userId: user.id,
            requiredPermission
          });
          return next();
        }

        // 檢查特定權限
        if (user.permissions.includes(requiredPermission)) {
          logger.debug('Permission granted', {
            userId: user.id,
            requiredPermission
          });
          return next();
        }

        logger.warn('Permission denied', {
          userId: user.id,
          username: user.username,
          requiredPermission,
          userPermissions: user.permissions
        });

        res.status(403).json({
          status: 403,
          message: `Access denied - required permission: ${requiredPermission}`,
          data: null
        });
      } catch (error) {
        logger.error('Error checking permission:', error);
        
        res.status(500).json({
          status: 500,
          message: 'Internal server error while checking permissions',
          data: null
        });
      }
    };
  };

  /**
   * 檢查用戶角色的中間件工廠
   */
  public static requireRole = (requiredRoles: string | string[]) => {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = req.kongUser || req.user;
        
        if (!user) {
          return res.status(401).json({
            status: 401,
            message: 'Authentication required',
            data: null
          });
        }

        // 檢查是否有超級權限
        if (user.roles.includes('superadmin')) {
          return next();
        }

        // 檢查是否有任一所需角色
        const hasRequiredRole = rolesArray.some(role => user.roles.includes(role));
        
        if (hasRequiredRole) {
          logger.debug('Role check passed', {
            userId: user.id,
            requiredRoles: rolesArray,
            userRoles: user.roles
          });
          return next();
        }

        logger.warn('Role check failed', {
          userId: user.id,
          username: user.username,
          requiredRoles: rolesArray,
          userRoles: user.roles
        });

        res.status(403).json({
          status: 403,
          message: `Access denied - required roles: ${rolesArray.join(', ')}`,
          data: null
        });
      } catch (error) {
        logger.error('Error checking role:', error);
        
        res.status(500).json({
          status: 500,
          message: 'Internal server error while checking roles',
          data: null
        });
      }
    };
  };

  /**
   * 記錄 Kong headers 的調試中間件
   */
  public static debugHeaders = (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'development') {
      const kongHeaders: Record<string, any> = {};
      
      Object.values(KongHeadersMiddleware.KONG_HEADERS).forEach(header => {
        kongHeaders[header] = req.headers[header];
      });
      
      logger.debug('Kong headers received', {
        path: req.path,
        method: req.method,
        kongHeaders
      });
    }
    
    next();
  };
}
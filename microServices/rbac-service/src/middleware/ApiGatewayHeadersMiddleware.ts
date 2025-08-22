/**
 * @fileoverview API Gateway Headers 中間件
 * 
 * 此中間件從 API Gateway 傳遞的 headers 中提取用戶信息，
 * 替代原本的 JWT 認證中間件。Express.js Gateway 已經完成了認證和授權檢查。
 * 
 * @module ApiGatewayHeadersMiddleware
 * @author AIOT Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('ApiGatewayHeadersMiddleware');

/**
 * 從 API Gateway headers 提取的用戶信息介面
 */
export interface ApiGatewayUserInfo {
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
 * 擴展 Express Request 介面以包含 API Gateway 用戶信息
 */
declare module 'express-serve-static-core' {
  interface Request {
    gatewayUser?: ApiGatewayUserInfo;
    user?: any; // 兼容所有用戶類型
  }
}

/**
 * API Gateway Headers 中間件類別
 */
export class ApiGatewayHeadersMiddleware {
  
  /**
   * API Gateway 設置的標準 headers
   */
  private static readonly GATEWAY_HEADERS = {
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

      // 從 API Gateway headers 提取用戶信息
      const userId = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.USER_ID] as string;
      const username = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.USERNAME] as string;
      const rolesHeader = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.ROLES] as string;
      const permissionsHeader = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.PERMISSIONS] as string;
      const departmentId = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.DEPARTMENT_ID] as string;
      const level = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.LEVEL] as string;
      const sessionId = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.SESSION_ID] as string;
      const authMethod = req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.AUTH_METHOD] as string;

      // 檢查必要的用戶信息是否存在
      if (!userId || !username) {
        logger.warn('Missing required user headers from API Gateway', { 
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
      const gatewayUser: ApiGatewayUserInfo = {
        id: userId,
        username: username,
        roles: roles,
        permissions: permissions,
        departmentId: departmentId ? parseInt(departmentId, 10) : 1,
        level: level ? parseInt(level, 10) : 1,
        sessionId: sessionId,
        ipAddress: req.ip || req.headers[ApiGatewayHeadersMiddleware.GATEWAY_HEADERS.IP_ADDRESS] as string
      };

      // 將用戶信息添加到 request 對象
      req.gatewayUser = gatewayUser;
      req.user = gatewayUser; // 保持向後兼容

      logger.debug('User info extracted from API Gateway headers', {
        userId: gatewayUser.id,
        username: gatewayUser.username,
        roles: gatewayUser.roles,
        permissionCount: gatewayUser.permissions.length,
        departmentId: gatewayUser.departmentId,
        level: gatewayUser.level,
        authMethod
      });

      next();
    } catch (error) {
      logger.error('Error extracting user info from API Gateway headers:', error);
      
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
        const user = req.gatewayUser || req.user;
        
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
        if ((user as any).permissions.includes('*')) {
          logger.debug('Permission granted - superuser', {
            userId: (user as any).id,
            requiredPermission
          });
          return next();
        }

        // 檢查特定權限
        if ((user as any).permissions.includes(requiredPermission)) {
          logger.debug('Permission granted', {
            userId: (user as any).id,
            requiredPermission
          });
          return next();
        }

        logger.warn('Permission denied', {
          userId: (user as any).id,
          username: (user as any).username,
          requiredPermission,
          userPermissions: (user as any).permissions
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
        const user = req.gatewayUser || req.user;
        
        if (!user) {
          return res.status(401).json({
            status: 401,
            message: 'Authentication required',
            data: null
          });
        }

        // 檢查是否有超級權限
        if ((user as any).roles.includes('superadmin')) {
          return next();
        }

        // 檢查是否有任一所需角色
        const hasRequiredRole = rolesArray.some(role => (user as any).roles.includes(role));
        
        if (hasRequiredRole) {
          logger.debug('Role check passed', {
            userId: (user as any).id,
            requiredRoles: rolesArray,
            userRoles: (user as any).roles
          });
          return next();
        }

        logger.warn('Role check failed', {
          userId: (user as any).id,
          username: (user as any).username,
          requiredRoles: rolesArray,
          userRoles: (user as any).roles
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
   * 記錄 API Gateway headers 的調試中間件
   */
  public static debugHeaders = (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'development') {
      const gatewayHeaders: Record<string, any> = {};
      
      Object.values(ApiGatewayHeadersMiddleware.GATEWAY_HEADERS).forEach(header => {
        gatewayHeaders[header] = req.headers[header];
      });
      
      logger.debug('API Gateway headers received', {
        path: req.path,
        method: req.method,
        gatewayHeaders
      });
    }
    
    next();
  };
}
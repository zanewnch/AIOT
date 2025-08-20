/**
 * @fileoverview API Gateway Headers 中間件
 * 
 * 此中間件用於從 API Gateway 傳遞的 headers 中提取用戶和權限信息
 * 替代內部的 JWT 驗證邏輯，信任 Express.js Gateway 的認證和授權結果
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-16
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('ApiGatewayHeadersMiddleware');

/**
 * API Gateway 傳遞的用戶信息介面
 */
export interface ApiGatewayUserInfo {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    sessionId: string;
    departmentId?: string;
    level?: number;
}

/**
 * 擴展 Express Request 類型以包含 API Gateway 用戶信息
 */
declare global {
    namespace Express {
        interface Request {
            gatewayUser?: ApiGatewayUserInfo;
            user?: ApiGatewayUserInfo; // 保持向後兼容
        }
    }
}

/**
 * API Gateway Headers 中間件類別
 * 
 * 處理 API Gateway 傳遞的認證和授權信息
 */
export class ApiGatewayHeadersMiddleware {
    
    /**
     * 從 API Gateway JWT 驗證結果中提取用戶信息
     * 
     * API Gateway JWT 插件驗證 token 後，我們直接從 auth_token cookie 中解析用戶信息
     * API Gateway 確保了 JWT 的有效性，所以我們只需要解析 payload
     */
    public static extractUserInfo = (req: Request, res: Response, next: NextFunction): void => {
        try {
            // 檢查 API Gateway 是否已經驗證了 JWT（通過檢查 consumer headers）
            const consumerUsername = req.headers['x-consumer-username'] as string;
            const consumerId = req.headers['x-consumer-id'] as string;
            
            if (!consumerUsername || !consumerId) {
                logger.warn(`JWT authentication failed - missing API Gateway consumer headers for path: ${req.path}`);
                return res.status(401).json({
                    status: 401,
                    message: 'Authentication required - JWT verification failed',
                    error: 'JWT_AUTH_FAILED'
                });
            }

            // 從 Cookie 中獲取 JWT 並解析用戶信息
            const authToken = req.cookies?.auth_token;
            if (!authToken) {
                logger.warn(`Authentication token not found in cookies for path: ${req.path}`);
                return res.status(401).json({
                    status: 401,
                    message: 'Authentication token not found',
                    error: 'TOKEN_NOT_FOUND'
                });
            }

            // 解析 JWT payload (不驗證簽名，因為 API Gateway 已經驗證過了)
            const base64Payload = authToken.split('.')[1];
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            
            // 構建用戶信息對象
            const gatewayUserInfo: ApiGatewayUserInfo = {
                userId: payload.user.id.toString(),
                username: payload.user.username,
                roles: payload.permissions.roles || [],
                permissions: payload.permissions.permissions || [],
                sessionId: payload.session?.session_id || 'unknown',
                departmentId: '1', // 從 payload 或設定預設值
                level: 8           // 從 payload 或設定預設值
            };

            // 將用戶信息添加到請求對象
            req.gatewayUser = gatewayUserInfo;
            req.user = gatewayUserInfo; // 向後兼容

            logger.debug(`JWT user extracted: ${gatewayUserInfo.username} (${gatewayUserInfo.userId}) with ${gatewayUserInfo.roles.length} roles and ${gatewayUserInfo.permissions.length} permissions`);
            
            next();

        } catch (error) {
            logger.error('JWT user extraction error:', error);
            return res.status(401).json({
                status: 401,
                message: 'Invalid authentication token',
                error: 'INVALID_TOKEN'
            });
        }
    };


    /**
     * 檢查是否具有特定角色
     */
    public static requireRole = (requiredRole: string) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            const userInfo = req.gatewayUser;

            if (!userInfo) {
                return res.status(401).json({
                    status: 401,
                    message: 'Authentication required'
                });
            }

            if (userInfo.roles.includes('superadmin') || userInfo.roles.includes(requiredRole)) {
                return next();
            }

            logger.warn(`Role check failed for user ${userInfo.username}: required ${requiredRole}`);
            return res.status(403).json({
                status: 403,
                message: 'Insufficient role',
                required: requiredRole
            });
        };
    };

    /**
     * 可選的用戶信息提取 - 不強制要求認證
     */
    public static optionalUserInfo = (req: Request, res: Response, next: NextFunction): void => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const username = req.headers['x-user-name'] as string;

            if (userId && username) {
                ApiGatewayHeadersMiddleware.extractUserInfo(req, res, next);
            } else {
                logger.debug(`No API Gateway user headers for optional endpoint: ${req.path}`);
                next();
            }
        } catch (error) {
            logger.error('Optional API Gateway headers middleware error:', error);
            next();
        }
    };

    /**
     * 調試中間件 - 輸出所有 API Gateway headers
     */
    public static debugHeaders = (req: Request, res: Response, next: NextFunction): void => {
        if (process.env.NODE_ENV === 'development') {
            const gatewayHeaders = Object.keys(req.headers)
                .filter(key => key.toLowerCase().startsWith('x-'))
                .reduce((acc, key) => {
                    acc[key] = req.headers[key];
                    return acc;
                }, {} as Record<string, any>);

            logger.debug(`API Gateway Headers for ${req.method} ${req.path}:`, gatewayHeaders);
        }
        next();
    };
}
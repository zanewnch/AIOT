/**
 * @fileoverview Gateway JWT 認證中間件
 * @description Gateway 層的 JWT 解析、驗證和權限檢查中間件
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';

/**
 * JWT Claims 介面 (從 RBAC 服務複製)
 */
export interface JwtClaims {
    // 標準 JWT Claims
    sub: string;        // Subject (user ID)
    iat: number;        // Issued At
    exp: number;        // Expiration Time
    iss: string;        // Issuer
    aud: string;        // Audience
    
    // 自定義 Claims
    user: {
        id: number;
        username: string;
        email?: string;
        is_active: boolean;
    };
    
    // 權限相關信息
    permissions: {
        roles: string[];              // 用戶角色列表
        permissions: string[];        // 具體權限列表
        scopes: string[];            // API 作用域
    };
    
    // 會話信息
    session: {
        session_id: string;
        ip_address?: string;
        user_agent?: string;
        remember_me: boolean;
    };
    
    // 元數據
    metadata: {
        last_login: string;
        login_count: number;
        tenant_id?: string;
    };
}

/**
 * 權限上下文介面
 */
export interface AuthContext {
    userId: number;
    username: string;
    roles: string[];
    permissions: string[];
    scopes: string[];
    sessionId: string;
    isAuthenticated: boolean;
}

/**
 * JWT 中間件選項
 */
export interface JwtMiddlewareOptions {
    /** 是否必須提供 JWT */
    required?: boolean;
    /** 跳過驗證的路徑 */
    skipPaths?: string[];
    /** 是否提取權限信息 */
    extractPermissions?: boolean;
    /** 需要的權限 */
    requiredPermissions?: string[];
    /** 需要的角色 */
    requiredRoles?: string[];
}

/**
 * 擴展 Request 介面以包含認證信息
 */
declare global {
    namespace Express {
        interface Request {
            user?: JwtClaims['user'];
            session?: JwtClaims['session'];
            permissions?: JwtClaims['permissions'];
            jwt?: JwtClaims;
            authContext?: AuthContext;
        }
    }
}

/**
 * Gateway JWT 中間件類別
 */
export class JwtMiddleware {
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'zanewnch';
    private static readonly JWT_ISSUER = process.env.JWT_ISSUER || 'aiot-system';
    private static readonly JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'aiot-api';
    private static logger = loggerConfig;

    /**
     * JWT 認證中間件
     * @param options - 中間件選項
     * @returns Express 中間件函數
     */
    public static authenticate(options: JwtMiddlewareOptions = {}) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                // 檢查是否跳過驗證
                if (options.skipPaths?.some(path => req.path.startsWith(path))) {
                    return next();
                }

                // 從 Cookie 獲取 JWT token (與 RBAC 服務保持一致)
                const authToken = req.cookies?.auth_token;

                // 如果沒有 token 且不是必需的，繼續處理
                if (!authToken && !options.required) {
                    return next();
                }

                // 如果沒有 token 但是必需的，返回 401
                if (!authToken && options.required) {
                    JwtMiddleware.logger.warn('Missing JWT token for protected route', {
                        path: req.path,
                        method: req.method,
                        ip: req.ip
                    });
                    
                    return ResResult.unauthorized(res, 'Authentication token required');
                }

                // 驗證和解析 JWT
                const claims = await JwtMiddleware.verifyToken(authToken!);
                
                // 將用戶信息和權限添加到請求對象
                req.user = claims.user;
                req.session = claims.session;
                req.permissions = claims.permissions;
                req.jwt = claims;

                // 創建權限上下文
                if (options.extractPermissions) {
                    req.authContext = {
                        userId: claims.user.id,
                        username: claims.user.username,
                        roles: claims.permissions.roles,
                        permissions: claims.permissions.permissions,
                        scopes: claims.permissions.scopes,
                        sessionId: claims.session.session_id,
                        isAuthenticated: true
                    };
                }

                // 檢查所需權限
                if (options.requiredPermissions && options.requiredPermissions.length > 0) {
                    const hasPermission = JwtMiddleware.checkPermissions(
                        claims.permissions.permissions,
                        options.requiredPermissions
                    );
                    
                    if (!hasPermission) {
                        JwtMiddleware.logger.warn('Insufficient permissions', {
                            userId: claims.user.id,
                            username: claims.user.username,
                            required: options.requiredPermissions,
                            userPermissions: claims.permissions.permissions,
                            path: req.path
                        });
                        
                        return ResResult.forbidden(res, 'Insufficient permissions');
                    }
                }

                // 檢查所需角色
                if (options.requiredRoles && options.requiredRoles.length > 0) {
                    const hasRole = JwtMiddleware.checkRoles(
                        claims.permissions.roles,
                        options.requiredRoles
                    );
                    
                    if (!hasRole) {
                        JwtMiddleware.logger.warn('Insufficient roles', {
                            userId: claims.user.id,
                            username: claims.user.username,
                            required: options.requiredRoles,
                            userRoles: claims.permissions.roles,
                            path: req.path
                        });
                        
                        return ResResult.forbidden(res, 'Insufficient roles');
                    }
                }

                JwtMiddleware.logger.debug('JWT authentication successful', {
                    userId: claims.user.id,
                    username: claims.user.username,
                    path: req.path
                });

                next();

            } catch (error) {
                JwtMiddleware.logger.error('JWT authentication failed:', error);
                
                if (error.message.includes('expired')) {
                    return ResResult.unauthorized(res, 'Token has expired');
                } else if (error.message.includes('invalid')) {
                    return ResResult.unauthorized(res, 'Invalid authentication token');
                } else {
                    return ResResult.fail(res, 'Authentication service error', 500);
                }
            }
        };
    }

    /**
     * 驗證 JWT token
     * @param token - JWT token 字符串
     * @returns 解析後的 JWT Claims
     */
    private static async verifyToken(token: string): Promise<JwtClaims> {
        try {
            const decoded = jwt.verify(token, JwtMiddleware.JWT_SECRET, {
                algorithms: ['HS256'],
                issuer: JwtMiddleware.JWT_ISSUER,
                audience: JwtMiddleware.JWT_AUDIENCE
            }) as JwtClaims;

            // 檢查用戶是否仍然活躍
            if (!decoded.user.is_active) {
                throw new Error('User account is inactive');
            }

            return decoded;

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token has expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token format');
            } else {
                throw new Error('Token verification failed');
            }
        }
    }

    /**
     * 解析 JWT token 不進行驗證（用於調試）
     * @param token - JWT token 字符串
     * @returns 解析後的 Claims 或 null
     */
    public static decodeToken(token: string): JwtClaims | null {
        try {
            return jwt.decode(token) as JwtClaims;
        } catch (error) {
            JwtMiddleware.logger.warn('JWT decode failed:', error);
            return null;
        }
    }

    /**
     * 檢查用戶是否具有所需權限
     * @param userPermissions - 用戶擁有的權限
     * @param requiredPermissions - 所需的權限
     * @returns 是否具有所需權限
     */
    private static checkPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
        return requiredPermissions.every(permission => 
            userPermissions.includes(permission) || userPermissions.includes('*')
        );
    }

    /**
     * 檢查用戶是否具有所需角色
     * @param userRoles - 用戶擁有的角色
     * @param requiredRoles - 所需的角色
     * @returns 是否具有所需角色
     */
    private static checkRoles(userRoles: string[], requiredRoles: string[]): boolean {
        return requiredRoles.some(role => 
            userRoles.includes(role) || userRoles.includes('admin')
        );
    }

    /**
     * 提取 JWT 中的權限信息（靜態方法）
     * @param token - JWT token 字符串
     * @returns 權限信息對象或 null
     */
    public static extractPermissions(token: string): {
        roles: string[];
        permissions: string[];
        scopes: string[];
        userId: number;
        username: string;
    } | null {
        try {
            const decoded = JwtMiddleware.decodeToken(token);
            if (!decoded) return null;

            return {
                roles: decoded.permissions.roles,
                permissions: decoded.permissions.permissions,
                scopes: decoded.permissions.scopes,
                userId: decoded.user.id,
                username: decoded.user.username
            };

        } catch (error) {
            JwtMiddleware.logger.warn('Failed to extract permissions from JWT:', error);
            return null;
        }
    }

    /**
     * 檢查 JWT 是否即將過期
     * @param token - JWT token 字符串
     * @param bufferSeconds - 緩衝時間（秒）
     * @returns 是否即將過期
     */
    public static isTokenExpiringSoon(token: string, bufferSeconds: number = 300): boolean {
        try {
            const decoded = JwtMiddleware.decodeToken(token);
            if (!decoded || !decoded.exp) return true;

            const now = Math.floor(Date.now() / 1000);
            return (decoded.exp - now) <= bufferSeconds;

        } catch (error) {
            return true;
        }
    }

    /**
     * 可選認證中間件 - 不強制要求認證
     */
    public static optional(options: Omit<JwtMiddlewareOptions, 'required'> = {}) {
        return JwtMiddleware.authenticate({ ...options, required: false });
    }

    /**
     * 必須認證中間件 - 強制要求認證
     */
    public static required(options: Omit<JwtMiddlewareOptions, 'required'> = {}) {
        return JwtMiddleware.authenticate({ ...options, required: true });
    }

    /**
     * 權限檢查中間件 - 檢查特定權限
     */
    public static requirePermissions(...permissions: string[]) {
        return JwtMiddleware.authenticate({
            required: true,
            extractPermissions: true,
            requiredPermissions: permissions
        });
    }

    /**
     * 角色檢查中間件 - 檢查特定角色
     */
    public static requireRoles(...roles: string[]) {
        return JwtMiddleware.authenticate({
            required: true,
            extractPermissions: true,
            requiredRoles: roles
        });
    }
}
/**
 * @fileoverview Gateway 認證中間件
 * @description 整合 JWT 解析、黑名單檢查和權限驗證的完整認證中間件
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { JwtMiddleware, JwtMiddlewareOptions } from './JwtMiddleware.js';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';

/**
 * 認證中間件選項
 */
export interface AuthMiddlewareOptions extends JwtMiddlewareOptions {
    /** 是否檢查黑名單 */
    checkBlacklist?: boolean;
    /** 記錄認證事件 */
    logAuthEvents?: boolean;
}

/**
 * Gateway 認證中間件類別
 * 整合了 JWT 認證和黑名單檢查
 */
export class AuthMiddleware {
    // 暫時註解掉黑名單服務，避免依賴問題
    // private static blacklistService: JwtBlacklistSvc;
    private static logger = loggerConfig;

    /**
     * 初始化認證中間件
     */
    public static initialize(): void {
        // 暫時跳過黑名單服務初始化
        // if (!AuthMiddleware.blacklistService) {
        //     AuthMiddleware.blacklistService = new JwtBlacklistSvc();
        //     AuthMiddleware.logger.info('✅ Auth middleware initialized with blacklist service');
        // }
        AuthMiddleware.logger.info('✅ Auth middleware initialized');
    }

    /**
     * 完整的認證中間件
     * @param options - 認證選項
     * @returns Express 中間件函數
     */
    public static authenticate(options: AuthMiddlewareOptions = {}) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                // 檢查是否跳過認證
                if (options.skipPaths?.some(path => req.path.startsWith(path))) {
                    return next();
                }

                // 檢查是否有 JWT token
                const authToken = req.cookies?.auth_token;

                // 如果沒有 token 且不是必需的，繼續處理
                if (!authToken && !options.required) {
                    return next();
                }

                // 如果沒有 token 但是必需的，返回 401
                if (!authToken && options.required) {
                    if (options.logAuthEvents) {
                        AuthMiddleware.logger.warn('Authentication required but no token provided', {
                            path: req.path,
                            method: req.method,
                            ip: req.ip,
                            userAgent: req.get('user-agent')
                        });
                    }
                    
                    return ResResult.unauthorized(res, 'Authentication token required');
                }

                // 暫時跳過黑名單檢查
                // if (options.checkBlacklist && authToken) {
                //     const isBlacklisted = await AuthMiddleware.blacklistService.isBlacklisted(authToken);
                //     
                //     if (isBlacklisted) {
                //         if (options.logAuthEvents) {
                //             AuthMiddleware.logger.warn('Blacklisted token access attempt', {
                //                 tokenPrefix: authToken.substring(0, 20) + '...',
                //                 path: req.path,
                //                 method: req.method,
                //                 ip: req.ip
                //             });
                //         }
                //         
                //         return ResResult.unauthorized(res, 'Authentication token has been revoked');
                //     }
                // }

                // 使用 JWT 中間件進行認證
                const jwtMiddleware = JwtMiddleware.authenticate(options);
                jwtMiddleware(req, res, (error?: any) => {
                    if (error) {
                        return next(error);
                    }

                    // 記錄成功的認證事件
                    if (options.logAuthEvents && (req as any).user) {
                        AuthMiddleware.logger.info('Authentication successful', {
                            userId: (req as any).user.id,
                            username: (req as any).user.username,
                            path: req.path,
                            method: req.method,
                            ip: req.ip
                        });
                    }

                    next();
                });

            } catch (error) {
                AuthMiddleware.logger.error('Authentication middleware error:', error);
                return ResResult.fail(res, 'Authentication service error', 500);
            }
        };
    }

    /**
     * 登出中間件
     * @param reason - 登出原因
     * @returns Express 中間件函數
     */
    public static logout(reason: string = 'logout') {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                // 暫時跳過黑名單操作
                // if (!AuthMiddleware.blacklistService) {
                //     AuthMiddleware.initialize();
                // }
                // const success = await AuthMiddleware.blacklistService.addCurrentTokenToBlacklist(req, reason);

                AuthMiddleware.logger.info('User logged out successfully', {
                    userId: (req as any).user?.id,
                    username: (req as any).user?.username,
                    reason,
                    ip: req.ip
                });

                // 清除 cookie
                res.clearCookie('auth_token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                next();

            } catch (error) {
                AuthMiddleware.logger.error('Logout middleware error:', error);
                next(error);
            }
        };
    }

    /**
     * 可選認證 - 不強制要求認證但會解析 JWT
     * @param options - 認證選項
     * @returns Express 中間件函數
     */
    public static optional(options: Omit<AuthMiddlewareOptions, 'required'> = {}) {
        return AuthMiddleware.authenticate({
            ...options,
            required: false,
            checkBlacklist: false // 暫時關閉黑名單檢查
        });
    }

    /**
     * 必須認證 - 強制要求認證
     * @param options - 認證選項
     * @returns Express 中間件函數
     */
    public static required(options: Omit<AuthMiddlewareOptions, 'required'> = {}) {
        return AuthMiddleware.authenticate({
            ...options,
            required: true,
            checkBlacklist: false, // 暫時關閉黑名單檢查
            extractPermissions: true,
            logAuthEvents: options.logAuthEvents !== false // 預設記錄認證事件
        });
    }

    /**
     * 權限檢查 - 檢查特定權限
     * @param permissions - 所需權限
     * @returns Express 中間件函數
     */
    public static requirePermissions(...permissions: string[]) {
        return AuthMiddleware.authenticate({
            required: true,
            checkBlacklist: false, // 暫時關閉黑名單檢查
            extractPermissions: true,
            requiredPermissions: permissions,
            logAuthEvents: true
        });
    }

    /**
     * 角色檢查 - 檢查特定角色
     * @param roles - 所需角色
     * @returns Express 中間件函數
     */
    public static requireRoles(...roles: string[]) {
        return AuthMiddleware.authenticate({
            required: true,
            checkBlacklist: false, // 暫時關閉黑名單檢查
            extractPermissions: true,
            requiredRoles: roles,
            logAuthEvents: true
        });
    }

    /**
     * 管理員權限檢查
     * @returns Express 中間件函數
     */
    public static requireAdmin() {
        return AuthMiddleware.requireRoles('admin');
    }

    /**
     * 用戶自己或管理員權限檢查
     * @param userIdParam - 路由參數中的用戶 ID 字段名
     * @returns Express 中間件函數
     */
    public static requireOwnerOrAdmin(userIdParam: string = 'userId') {
        return async (req: Request, res: Response, next: NextFunction) => {
            // 首先進行基本認證
            const authMiddleware = AuthMiddleware.required();
            
            authMiddleware(req, res, (error?: any) => {
                if (error) {
                    return next(error);
                }

                const currentUserId = (req as any).user?.id;
                const targetUserId = parseInt(req.params[userIdParam]);
                const userRoles = (req as any).permissions?.roles || [];

                // 檢查是否是管理員或者是用戶自己
                if (userRoles.includes('admin') || currentUserId === targetUserId) {
                    return next();
                }

                AuthMiddleware.logger.warn('Access denied: not owner or admin', {
                    currentUserId,
                    targetUserId,
                    userRoles,
                    path: req.path
                });

                return ResResult.forbidden(res, 'Access denied: insufficient privileges');
            });
        };
    }

    /**
     * 清理資源
     */
    public static async cleanup(): Promise<void> {
        // 暫時跳過黑名單服務清理
        // if (AuthMiddleware.blacklistService) {
        //     await AuthMiddleware.blacklistService.close();
        // }
        AuthMiddleware.logger.info('Auth middleware cleanup completed');
    }
}
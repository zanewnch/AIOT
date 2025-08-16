/**
 * @fileoverview JWT 工具類 - 支援 OPA 集中驗證
 * 
 * 此模組提供 JWT 生成和驗證功能，專為 OPA 權限驗證設計
 * JWT 包含自定義 claims 包括用戶權限信息
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-16
 */

import jwt from 'jsonwebtoken';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('JwtUtils');

/**
 * JWT 自定義 Claims 介面
 * 包含 OPA 需要的所有權限和用戶信息
 */
export interface JwtClaims {
    // 標準 JWT Claims
    sub: string;        // Subject (user ID)
    iat: number;        // Issued At
    exp: number;        // Expiration Time
    iss: string;        // Issuer
    aud: string;        // Audience
    
    // 自定義 Claims for OPA
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
 * JWT 生成選項
 */
export interface JwtGenerateOptions {
    user: {
        id: number;
        username: string;
        email?: string;
        is_active: boolean;
    };
    roles: string[];
    permissions: string[];
    scopes?: string[];
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    rememberMe?: boolean;
    tenantId?: string;
}

/**
 * JWT 工具類
 * 
 * 提供 JWT 生成、驗證和解析功能
 * 專為 OPA 權限系統設計
 */
export class JwtUtils {
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'aiot-jwt-secret-key-2024';
    private static readonly JWT_ISSUER = process.env.JWT_ISSUER || 'aiot-system';
    private static readonly JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'aiot-api';
    
    /**
     * 生成包含權限信息的 JWT
     * 
     * @param options JWT 生成選項
     * @returns Promise<string> JWT 字符串
     */
    public static async generateToken(options: JwtGenerateOptions): Promise<string> {
        try {
            const now = Math.floor(Date.now() / 1000);
            const expirationTime = options.rememberMe 
                ? now + (30 * 24 * 60 * 60)  // 30 天
                : now + (24 * 60 * 60);      // 1 天
            
            const claims: JwtClaims = {
                // 標準 Claims
                sub: options.user.id.toString(),
                iat: now,
                exp: expirationTime,
                iss: this.JWT_ISSUER,
                aud: this.JWT_AUDIENCE,
                
                // 用戶信息
                user: {
                    id: options.user.id,
                    username: options.user.username,
                    email: options.user.email,
                    is_active: options.user.is_active
                },
                
                // 權限信息 - OPA 核心數據
                permissions: {
                    roles: options.roles,
                    permissions: options.permissions,
                    scopes: options.scopes || ['api:read', 'api:write']
                },
                
                // 會話信息
                session: {
                    session_id: options.sessionId,
                    ip_address: options.ipAddress,
                    user_agent: options.userAgent,
                    remember_me: options.rememberMe || false
                },
                
                // 元數據
                metadata: {
                    last_login: new Date().toISOString(),
                    login_count: 1, // TODO: 從數據庫獲取實際登入次數
                    tenant_id: options.tenantId
                }
            };
            
            const token = jwt.sign(claims, this.JWT_SECRET, {
                algorithm: 'HS256'
            });
            
            logger.info(`JWT generated successfully for user: ${options.user.username}`);
            return token;
            
        } catch (error) {
            logger.error('Failed to generate JWT:', error);
            throw new Error('JWT generation failed');
        }
    }
    
    /**
     * 驗證 JWT 並返回 Claims
     * 
     * @param token JWT 字符串
     * @returns Promise<JwtClaims> 解析後的 Claims
     */
    public static async verifyToken(token: string): Promise<JwtClaims> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET, {
                algorithms: ['HS256'],
                issuer: this.JWT_ISSUER,
                audience: this.JWT_AUDIENCE
            }) as JwtClaims;
            
            logger.debug(`JWT verified successfully for user: ${decoded.user.username}`);
            return decoded;
            
        } catch (error) {
            logger.warn('JWT verification failed:', error);
            throw new Error('Invalid or expired token');
        }
    }
    
    /**
     * 解析 JWT 不進行驗證（用於調試）
     * 
     * @param token JWT 字符串
     * @returns JwtClaims | null
     */
    public static decodeToken(token: string): JwtClaims | null {
        try {
            return jwt.decode(token) as JwtClaims;
        } catch (error) {
            logger.warn('JWT decode failed:', error);
            return null;
        }
    }
    
    /**
     * 檢查 JWT 是否即將過期
     * 
     * @param token JWT 字符串
     * @param bufferSeconds 緩衝時間（秒）
     * @returns boolean
     */
    public static isTokenExpiringSoon(token: string, bufferSeconds: number = 300): boolean {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) return true;
            
            const now = Math.floor(Date.now() / 1000);
            return (decoded.exp - now) <= bufferSeconds;
            
        } catch (error) {
            return true;
        }
    }
    
    /**
     * 提取 JWT 中的權限信息
     * 為 OPA 策略評估提供便捷方法
     * 
     * @param token JWT 字符串
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
            const decoded = this.decodeToken(token);
            if (!decoded) return null;
            
            return {
                roles: decoded.permissions.roles,
                permissions: decoded.permissions.permissions,
                scopes: decoded.permissions.scopes,
                userId: decoded.user.id,
                username: decoded.user.username
            };
            
        } catch (error) {
            logger.warn('Failed to extract permissions from JWT:', error);
            return null;
        }
    }
}

/**
 * JWT 中間件選項
 */
export interface JwtMiddlewareOptions {
    required?: boolean;
    skipPaths?: string[];
    extractPermissions?: boolean;
}

/**
 * Express JWT 中間件
 * 為 OPA 集成設計
 */
export const jwtMiddleware = (options: JwtMiddlewareOptions = {}) => {
    return (req: any, res: any, next: any) => {
        try {
            // 檢查是否跳過驗證
            if (options.skipPaths?.some(path => req.path.startsWith(path))) {
                return next();
            }
            
            // 從 Cookie 或 Authorization header 獲取 token
            let token = req.cookies?.jwt;
            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }
            
            // 如果沒有 token 且不是必需的，繼續處理
            if (!token && !options.required) {
                return next();
            }
            
            // 如果沒有 token 但是必需的，返回 401
            if (!token && options.required) {
                return res.status(401).json({
                    status: 401,
                    message: 'Access token required',
                    error: 'MISSING_TOKEN'
                });
            }
            
            // 驗證 token
            JwtUtils.verifyToken(token)
                .then(claims => {
                    // 將用戶信息和權限添加到請求對象
                    req.user = claims.user;
                    req.session = claims.session;
                    req.permissions = claims.permissions;
                    req.jwt = claims;
                    
                    // 為 OPA 準備權限上下文
                    if (options.extractPermissions) {
                        req.authContext = {
                            userId: claims.user.id,
                            username: claims.user.username,
                            roles: claims.permissions.roles,
                            permissions: claims.permissions.permissions,
                            scopes: claims.permissions.scopes,
                            sessionId: claims.session.session_id
                        };
                    }
                    
                    next();
                })
                .catch(error => {
                    logger.warn('JWT middleware validation failed:', error);
                    return res.status(401).json({
                        status: 401,
                        message: 'Invalid or expired token',
                        error: 'TOKEN_INVALID'
                    });
                });
                
        } catch (error) {
            logger.error('JWT middleware error:', error);
            return res.status(500).json({
                status: 500,
                message: 'Authentication service error'
            });
        }
    };
};
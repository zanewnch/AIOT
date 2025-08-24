/**
 * @fileoverview Gateway JWT 工具類別
 * @description 為 Gateway 服務提供 JWT 解析和驗證功能
 * @author AIOT Development Team
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * JWT Payload 介面
 */
export interface JwtPayload {
    /** 用戶 ID */
    sub: string;
    /** 發行時間 */
    iat: number;
    /** 過期時間 */
    exp: number;
    /** 發行者 */
    iss: string;
    /** 受眾 */
    aud: string;
    
    /** 用戶信息 */
    user: {
        id: number;
        username: string;
        email?: string;
        is_active: boolean;
    };
    
    /** 權限信息 */
    permissions: {
        roles: string[];
        permissions: string[];
        scopes: string[];
    };
    
    /** 會話信息 */
    session: {
        session_id: string;
        created_at: string;
        expires_at: string;
        ip_address?: string;
        user_agent?: string;
    };
}

/**
 * Gateway JWT 工具類別
 */
export class JwtUtils {
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'aiot-jwt-secret-key-2024';
    private static logger = loggerConfig;

    /**
     * 驗證 JWT token
     * @param token - JWT token 字符串
     * @returns JWT payload 或 null
     */
    public static verifyJwt(token: string): JwtPayload | null {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
            
            this.logger.debug('JWT verification successful', {
                userId: decoded.user?.id,
                username: decoded.user?.username,
                exp: new Date(decoded.exp * 1000).toISOString()
            });
            
            return decoded;
            
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                this.logger.warn('JWT verification failed', {
                    error: error.message,
                    tokenPrefix: token.substring(0, 20) + '...'
                });
            } else {
                this.logger.error('JWT verification error:', error);
            }
            
            return null;
        }
    }

    /**
     * 檢查 JWT 是否已過期
     * @param token - JWT token 字符串
     * @returns 是否已過期
     */
    public static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwt.decode(token) as JwtPayload;
            
            if (!decoded || !decoded.exp) {
                return true;
            }
            
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
            
        } catch (error) {
            this.logger.error('Error checking token expiration:', error);
            return true;
        }
    }

    /**
     * 解析 JWT token（不驗證簽名）
     * @param token - JWT token 字符串
     * @returns JWT payload 或 null
     */
    public static decodeJwt(token: string): JwtPayload | null {
        try {
            const decoded = jwt.decode(token) as JwtPayload;
            return decoded;
            
        } catch (error) {
            this.logger.error('JWT decode error:', error);
            return null;
        }
    }

    /**
     * 提取 JWT 中的權限信息
     * @param token - JWT token 字符串
     * @returns 權限信息或 null
     */
    public static extractPermissions(token: string): {
        roles: string[];
        permissions: string[];
        scopes: string[];
    } | null {
        try {
            const payload = this.verifyJwt(token);
            
            if (!payload || !payload.permissions) {
                return null;
            }
            
            return {
                roles: payload.permissions.roles || [],
                permissions: payload.permissions.permissions || [],
                scopes: payload.permissions.scopes || []
            };
            
        } catch (error) {
            this.logger.error('Error extracting permissions from JWT:', error);
            return null;
        }
    }

    /**
     * 檢查用戶是否有特定權限
     * @param token - JWT token 字符串
     * @param requiredPermissions - 所需權限列表
     * @returns 是否有權限
     */
    public static hasPermissions(token: string, requiredPermissions: string[]): boolean {
        try {
            const permissions = this.extractPermissions(token);
            
            if (!permissions) {
                return false;
            }
            
            // 檢查是否為管理員
            if (permissions.roles.includes('admin')) {
                return true;
            }
            
            // 檢查特定權限
            for (const permission of requiredPermissions) {
                if (!permissions.permissions.includes(permission)) {
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            this.logger.error('Error checking permissions:', error);
            return false;
        }
    }

    /**
     * 檢查用戶是否有特定角色
     * @param token - JWT token 字符串
     * @param requiredRoles - 所需角色列表
     * @returns 是否有角色
     */
    public static hasRoles(token: string, requiredRoles: string[]): boolean {
        try {
            const permissions = this.extractPermissions(token);
            
            if (!permissions) {
                return false;
            }
            
            // 檢查是否有任一所需角色
            for (const role of requiredRoles) {
                if (permissions.roles.includes(role)) {
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            this.logger.error('Error checking roles:', error);
            return false;
        }
    }
}
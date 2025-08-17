/**
 * @fileoverview WebSocket 認證中間件
 * @description 專門處理 WebSocket 連接的 JWT 認證和權限檢查
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { AuthMiddleware } from './AuthMiddleware.js';
import { JwtUtils } from '../utils/JwtUtils.js';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * WebSocket 認證結果介面
 */
export interface WebSocketAuthResult {
    /** 認證是否成功 */
    success: boolean;
    /** 錯誤訊息 */
    error?: string;
    /** 用戶信息 */
    user?: any;
    /** 權限信息 */
    permissions?: any;
    /** HTTP 狀態碼 */
    statusCode?: number;
}

/**
 * WebSocket 認證中間件類別
 */
export class WebSocketAuthMiddleware {
    private static logger = loggerConfig;

    /**
     * 驗證 WebSocket 連接的認證
     * @param request - WebSocket 升級請求
     * @returns 認證結果
     */
    public static async validateWebSocketAuth(request: IncomingMessage): Promise<WebSocketAuthResult> {
        try {
            // 從 Cookie 或 Query 參數獲取 JWT token
            const token = this.extractToken(request);
            
            if (!token) {
                this.logger.warn('🔒 WebSocket connection without authentication token', {
                    url: request.url,
                    headers: request.headers
                });
                
                return {
                    success: false,
                    error: 'Authentication token required for WebSocket connection',
                    statusCode: 401
                };
            }

            // 檢查黑名單
            const blacklistService = AuthMiddleware.getBlacklistService();
            const isBlacklisted = await blacklistService.isBlacklisted(token);
            
            if (isBlacklisted) {
                this.logger.warn('🚫 WebSocket connection with blacklisted token', {
                    tokenPrefix: token.substring(0, 20) + '...',
                    url: request.url
                });
                
                return {
                    success: false,
                    error: 'Authentication token has been revoked',
                    statusCode: 401
                };
            }

            // 驗證並解析 JWT
            const jwtPayload = JwtUtils.verifyJwt(token);
            
            if (!jwtPayload) {
                this.logger.warn('🔐 WebSocket connection with invalid JWT', {
                    url: request.url
                });
                
                return {
                    success: false,
                    error: 'Invalid authentication token',
                    statusCode: 401
                };
            }

            // 提取用戶和權限信息
            const user = jwtPayload.user;
            const permissions = jwtPayload.permissions;

            this.logger.info('✅ WebSocket authentication successful', {
                userId: user?.id,
                username: user?.username,
                url: request.url,
                permissions: permissions?.roles
            });

            return {
                success: true,
                user,
                permissions
            };

        } catch (error) {
            this.logger.error('❌ WebSocket authentication error:', error);
            
            return {
                success: false,
                error: 'Authentication service error',
                statusCode: 500
            };
        }
    }

    /**
     * 檢查 WebSocket 權限
     * @param authResult - 認證結果
     * @param requiredPermissions - 所需權限
     * @returns 是否有權限
     */
    public static checkWebSocketPermissions(
        authResult: WebSocketAuthResult,
        requiredPermissions: string[] = []
    ): boolean {
        if (!authResult.success || !authResult.permissions) {
            return false;
        }

        // 如果沒有特定權限要求，認證成功即可
        if (requiredPermissions.length === 0) {
            return true;
        }

        const userPermissions = authResult.permissions.permissions || [];
        const userRoles = authResult.permissions.roles || [];

        // 檢查是否為管理員
        if (userRoles.includes('admin')) {
            return true;
        }

        // 檢查特定權限
        for (const permission of requiredPermissions) {
            if (!userPermissions.includes(permission)) {
                this.logger.warn(`🚫 WebSocket permission denied: missing ${permission}`, {
                    userId: authResult.user?.id,
                    userPermissions,
                    requiredPermissions
                });
                return false;
            }
        }

        return true;
    }

    /**
     * 拒絕 WebSocket 連接
     * @param socket - WebSocket 連接
     * @param reason - 拒絕原因
     * @param statusCode - HTTP 狀態碼
     */
    public static rejectWebSocketConnection(
        socket: Socket,
        reason: string = 'Authentication failed',
        statusCode: number = 401
    ): void {
        try {
            const statusText = this.getStatusText(statusCode);
            const response = [
                `HTTP/1.1 ${statusCode} ${statusText}`,
                'Content-Type: text/plain',
                'Connection: close',
                '',
                reason
            ].join('\r\n');

            socket.write(response);
            socket.destroy();

            this.logger.info(`🚫 WebSocket connection rejected: ${reason}`, {
                statusCode
            });

        } catch (error) {
            this.logger.error('❌ Error rejecting WebSocket connection:', error);
            socket.destroy();
        }
    }

    /**
     * 從請求中提取 JWT token
     * @param request - WebSocket 升級請求
     * @returns JWT token 或 null
     */
    private static extractToken(request: IncomingMessage): string | null {
        // 1. 從 Cookie 獲取
        const cookies = request.headers.cookie;
        if (cookies) {
            const match = cookies.match(/auth_token=([^;]+)/);
            if (match) {
                return match[1];
            }
        }

        // 2. 從 Authorization header 獲取
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // 3. 從 Query 參數獲取（僅用於 WebSocket 連接）
        const url = new URL(request.url || '', 'http://localhost');
        const tokenFromQuery = url.searchParams.get('token');
        if (tokenFromQuery) {
            return tokenFromQuery;
        }

        return null;
    }

    /**
     * 獲取 HTTP 狀態碼對應的文字
     * @param statusCode - HTTP 狀態碼
     * @returns 狀態文字
     */
    private static getStatusText(statusCode: number): string {
        const statusTexts: Record<number, string> = {
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
            503: 'Service Unavailable'
        };

        return statusTexts[statusCode] || 'Unknown';
    }
}
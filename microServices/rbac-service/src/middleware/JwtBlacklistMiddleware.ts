/**
 * @fileoverview JWT 黑名單檢查中間件
 * 
 * 此中間件在 API Gateway JWT 驗證之後執行，檢查 token 是否在黑名單中
 * 如果 token 已被加入黑名單（如登出後），則拒絕請求
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-16
 */

import { Request, Response, NextFunction } from 'express';
import { JwtBlacklistService } from '@aiot/shared-packages';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('JwtBlacklistMiddleware');

/**
 * JWT 黑名單檢查中間件類別
 */
export class JwtBlacklistMiddleware {
    private static blacklistService: JwtBlacklistSvc;

    /**
     * 初始化黑名單服務
     */
    static initialize(): void {
        if (!this.blacklistService) {
            this.blacklistService = new JwtBlacklistSvc();
        }
    }

    /**
     * 檢查 JWT token 是否在黑名單中的中間件
     * 
     * 此中間件應該在 API Gateway JWT 驗證之後執行，因為：
     * 1. API Gateway 已經驗證了 token 的有效性和簽名
     * 2. 我們只需要檢查 token 是否被主動撤銷（黑名單）
     * 
     * @param req Express 請求對象
     * @param res Express 回應對象
     * @param next Next 函數
     */
    static checkBlacklist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 確保黑名單服務已初始化
            if (!JwtBlacklistMiddleware.blacklistService) {
                JwtBlacklistMiddleware.initialize();
            }

            // 從 Cookie 中獲取 JWT token
            const authToken = req.cookies?.auth_token;
            
            if (!authToken) {
                logger.debug('No JWT token found in request cookies');
                return next(); // 讓其他中間件處理未認證的情況
            }

            // 檢查 token 是否在黑名單中
            const isBlacklisted = await JwtBlacklistMiddleware.blacklistService.isBlacklisted(authToken);
            
            if (isBlacklisted) {
                logger.warn('JWT token found in blacklist, rejecting request');
                return res.status(401).json({
                    status: 401,
                    message: 'Authentication token has been revoked',
                    error: 'TOKEN_REVOKED',
                    data: null
                });
            }

            // Token 不在黑名單中，繼續處理
            logger.debug('JWT token not in blacklist, proceeding');
            next();

        } catch (error) {
            logger.error('Error checking JWT blacklist:', error);
            
            // 在錯誤情況下，為了系統可用性，允許請求繼續
            // 但記錄錯誤以便後續排查
            logger.warn('JWT blacklist check failed, allowing request to proceed');
            next();
        }
    };

    /**
     * 將當前請求的 JWT token 加入黑名單
     * 
     * @param req Express 請求對象
     * @param reason 加入黑名單的原因
     * @returns Promise<boolean> 是否成功加入黑名單
     */
    static async addCurrentTokenToBlacklist(req: Request, reason: string = 'logout'): Promise<boolean> {
        try {
            // 確保黑名單服務已初始化
            if (!JwtBlacklistMiddleware.blacklistService) {
                JwtBlacklistMiddleware.initialize();
            }

            // 從 Cookie 中獲取 JWT token
            const authToken = req.cookies?.auth_token;
            
            if (!authToken) {
                logger.warn('No JWT token found to add to blacklist');
                return false;
            }

            // 解析 JWT 獲取過期時間
            const tokenParts = authToken.split('.');
            if (tokenParts.length !== 3) {
                logger.error('Invalid JWT token format');
                return false;
            }

            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const expiresAt = payload.exp;

            if (!expiresAt) {
                logger.error('JWT token missing expiration time');
                return false;
            }

            // 加入黑名單
            await JwtBlacklistMiddleware.blacklistService.addToBlacklist(authToken, expiresAt, reason);
            
            logger.info(`JWT token added to blacklist: reason=${reason}`);
            return true;

        } catch (error) {
            logger.error('Failed to add JWT token to blacklist:', error);
            return false;
        }
    }

    /**
     * 獲取黑名單統計信息
     * 
     * @returns Promise<{count: number, keys: string[]}> 黑名單統計
     */
    static async getBlacklistStats(): Promise<{count: number, keys: string[]}> {
        try {
            if (!JwtBlacklistMiddleware.blacklistService) {
                JwtBlacklistMiddleware.initialize();
            }

            return await JwtBlacklistMiddleware.blacklistService.getBlacklistStats();
        } catch (error) {
            logger.error('Failed to get blacklist stats:', error);
            throw error;
        }
    }

    /**
     * 關閉黑名單服務
     */
    static async close(): Promise<void> {
        if (JwtBlacklistMiddleware.blacklistService) {
            await JwtBlacklistMiddleware.blacklistService.close();
        }
    }
}
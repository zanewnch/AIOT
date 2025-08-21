/**
 * @fileoverview JWT 黑名單服務
 * @description Gateway 層的 JWT 黑名單檢查服務，與 RBAC 服務保持一致
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { RedisClientType } from 'redis';
import { loggerConfig } from '../configs/loggerConfig.js';
import { BaseRedisService, getRedisClient } from '@aiot-shared-packages';

/**
 * JWT 黑名單服務類別
 */
export class JwtBlacklistSvc extends BaseRedisService {
    // logger 已經在 BaseRedisService 中定義，這裡移除避免衝突

    constructor() {
        super({
            serviceName: 'JwtBlacklistSvc',
            defaultTTL: 86400, // 24 hours default
            enableDebugLogs: false,
            logger: loggerConfig
        });
    }

    /**
     * 實作 BaseRedisService 要求的 getRedisClientFactory 方法
     * 
     * @returns Redis 客戶端工廠函式
     * @protected
     */
    protected getRedisClientFactory(): () => RedisClientType {
        return getRedisClient;
    }

    /**
     * 檢查 JWT token 是否在黑名單中
     * @param token - JWT token 字符串
     * @returns Promise<boolean> - 是否在黑名單中
     */
    public async isBlacklisted(token: string): Promise<boolean> {
        const key = this.getBlacklistKey(token);
        
        const result = await this.safeRedisOperation(
            async (redis: RedisClientType) => {
                const exists = await redis.exists(key);
                return exists === 1;
            },
            'isBlacklisted',
            false // 在錯誤情況下，為了系統可用性，假設 token 不在黑名單中
        );
        
        loggerConfig.debug(`JWT blacklist check: ${result ? 'found' : 'not found'}`, {
            tokenPrefix: token.substring(0, 20) + '...'
        });
        
        return result;
    }

    /**
     * 將 JWT token 加入黑名單
     * @param token - JWT token 字符串
     * @param expiresAt - token 過期時間 (Unix timestamp)
     * @param reason - 加入黑名單的原因
     * @returns Promise<boolean> - 是否成功加入
     */
    public async addToBlacklist(token: string, expiresAt: number, reason: string = 'logout'): Promise<boolean> {
        const key = this.getBlacklistKey(token);
        const now = Math.floor(Date.now() / 1000);
        const ttl = expiresAt - now;

        // 只有在 token 還沒過期時才加入黑名單
        if (ttl <= 0) {
            loggerConfig.debug('Token already expired, not adding to blacklist');
            return false;
        }

        const value = JSON.stringify({
            reason,
            blacklistedAt: new Date().toISOString(),
            expiresAt: new Date(expiresAt * 1000).toISOString()
        });

        const success = await this.safeRedisWrite(
            async (redis: RedisClientType) => {
                await redis.setEx(key, ttl, value);
            },
            `addToBlacklist(${reason})`
        );
        
        if (success) {
            loggerConfig.info('JWT token added to blacklist', {
                reason,
                ttl,
                tokenPrefix: token.substring(0, 20) + '...'
            });
        }
        
        return success;
    }

    /**
     * 從請求中提取 JWT 並加入黑名單
     * @param req - Express 請求對象
     * @param reason - 加入黑名單的原因
     * @returns Promise<boolean> - 是否成功加入
     */
    public async addCurrentTokenToBlacklist(req: any, reason: string = 'logout'): Promise<boolean> {
        try {
            const authToken = req.cookies?.auth_token;
            
            if (!authToken) {
                loggerConfig.warn('No JWT token found to add to blacklist');
                return false;
            }

            // 解析 JWT 獲取過期時間
            const tokenParts = authToken.split('.');
            if (tokenParts.length !== 3) {
                loggerConfig.error('Invalid JWT token format');
                return false;
            }

            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const expiresAt = payload.exp;

            if (!expiresAt) {
                loggerConfig.error('JWT token missing expiration time');
                return false;
            }

            return await this.addToBlacklist(authToken, expiresAt, reason);

        } catch (error) {
            loggerConfig.error('Failed to add current token to blacklist:', error);
            return false;
        }
    }

    /**
     * 獲取黑名單統計信息
     * @returns Promise<{count: number, keys: string[]}> - 黑名單統計
     */
    public async getBlacklistStats(): Promise<{count: number, keys: string[]}> {
        const pattern = 'jwt_blacklist:*';
        
        return await this.safeRedisOperation(
            async (redis: RedisClientType) => {
                const keys = await redis.keys(pattern);
                return {
                    count: keys.length,
                    keys: keys.map(key => key.replace('jwt_blacklist:', ''))
                };
            },
            'getBlacklistStats',
            { count: 0, keys: [] }
        );
    }

    /**
     * 清理過期的黑名單條目
     * @returns Promise<number> - 清理的條目數量
     */
    public async cleanupExpiredTokens(): Promise<number> {
        const pattern = 'jwt_blacklist:*';
        
        const cleanedCount = await this.safeRedisOperation(
            async (redis: RedisClientType) => {
                const keys = await redis.keys(pattern);
                let count = 0;

                for (const key of keys) {
                    const ttl = await redis.ttl(key);
                    if (ttl === -1 || ttl === -2) {
                        // TTL 為 -1 表示沒有設置過期時間，-2 表示 key 不存在
                        await redis.del(key);
                        count++;
                    }
                }

                return count;
            },
            'cleanupExpiredTokens',
            0
        );
        
        if (cleanedCount > 0) {
            loggerConfig.info(`Cleaned up ${cleanedCount} expired blacklist tokens`);
        }

        return cleanedCount;
    }

    /**
     * 生成黑名單 Redis key
     * @param token - JWT token 字符串
     * @returns Redis key
     */
    private getBlacklistKey(token: string): string {
        // 使用 token 的前 32 個字符作為 key（避免 key 過長）
        const tokenHash = token.substring(0, 32);
        return `jwt_blacklist:${tokenHash}`;
    }

    /**
     * 關閉 Redis 連接
     */
    public async close(): Promise<void> {
        // BaseRedisService 會處理連線管理，這裡只需要記錄
        loggerConfig.info('JWT Blacklist Service closed');
    }

    /**
     * 檢查服務是否可用
     * @returns Promise<boolean> - 服務是否可用
     */
    public async isHealthy(): Promise<boolean> {
        return await this.safeRedisOperation(
            async (redis: RedisClientType) => {
                await redis.ping();
                return true;
            },
            'healthCheck',
            false
        );
    }
}
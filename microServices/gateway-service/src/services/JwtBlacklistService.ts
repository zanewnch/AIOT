/**
 * @fileoverview JWT 黑名單服務
 * @description Gateway 層的 JWT 黑名單檢查服務，與 RBAC 服務保持一致
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * JWT 黑名單服務類別
 */
export class JwtBlacklistService {
    private redisClient: RedisClientType;
    private logger = loggerConfig;
    private isConnected = false;

    constructor() {
        // 創建 Redis 客戶端
        this.redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://aiot-redis:6379/0'
        });

        // 設置錯誤處理
        this.redisClient.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });

        this.redisClient.on('connect', () => {
            this.logger.info('✅ JWT Blacklist Service connected to Redis');
            this.isConnected = true;
        });

        this.redisClient.on('disconnect', () => {
            this.logger.warn('⚠️ JWT Blacklist Service disconnected from Redis');
            this.isConnected = false;
        });

        // 連接到 Redis
        this.connect();
    }

    /**
     * 連接到 Redis
     */
    private async connect(): Promise<void> {
        try {
            if (!this.isConnected) {
                await this.redisClient.connect();
            }
        } catch (error) {
            this.logger.error('Failed to connect to Redis:', error);
        }
    }

    /**
     * 檢查 JWT token 是否在黑名單中
     * @param token - JWT token 字符串
     * @returns Promise<boolean> - 是否在黑名單中
     */
    public async isBlacklisted(token: string): Promise<boolean> {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const key = this.getBlacklistKey(token);
            const result = await this.redisClient.exists(key);
            
            this.logger.debug(`JWT blacklist check: ${result ? 'found' : 'not found'}`, {
                tokenPrefix: token.substring(0, 20) + '...'
            });
            
            return result === 1;

        } catch (error) {
            this.logger.error('Failed to check JWT blacklist:', error);
            // 在錯誤情況下，為了系統可用性，假設 token 不在黑名單中
            return false;
        }
    }

    /**
     * 將 JWT token 加入黑名單
     * @param token - JWT token 字符串
     * @param expiresAt - token 過期時間 (Unix timestamp)
     * @param reason - 加入黑名單的原因
     * @returns Promise<boolean> - 是否成功加入
     */
    public async addToBlacklist(token: string, expiresAt: number, reason: string = 'logout'): Promise<boolean> {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const key = this.getBlacklistKey(token);
            const now = Math.floor(Date.now() / 1000);
            const ttl = expiresAt - now;

            // 只有在 token 還沒過期時才加入黑名單
            if (ttl > 0) {
                const value = JSON.stringify({
                    reason,
                    blacklistedAt: new Date().toISOString(),
                    expiresAt: new Date(expiresAt * 1000).toISOString()
                });

                await this.redisClient.setEx(key, ttl, value);
                
                this.logger.info('JWT token added to blacklist', {
                    reason,
                    ttl,
                    tokenPrefix: token.substring(0, 20) + '...'
                });
                
                return true;
            } else {
                this.logger.debug('Token already expired, not adding to blacklist');
                return false;
            }

        } catch (error) {
            this.logger.error('Failed to add JWT to blacklist:', error);
            return false;
        }
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
                this.logger.warn('No JWT token found to add to blacklist');
                return false;
            }

            // 解析 JWT 獲取過期時間
            const tokenParts = authToken.split('.');
            if (tokenParts.length !== 3) {
                this.logger.error('Invalid JWT token format');
                return false;
            }

            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const expiresAt = payload.exp;

            if (!expiresAt) {
                this.logger.error('JWT token missing expiration time');
                return false;
            }

            return await this.addToBlacklist(authToken, expiresAt, reason);

        } catch (error) {
            this.logger.error('Failed to add current token to blacklist:', error);
            return false;
        }
    }

    /**
     * 獲取黑名單統計信息
     * @returns Promise<{count: number, keys: string[]}> - 黑名單統計
     */
    public async getBlacklistStats(): Promise<{count: number, keys: string[]}> {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const pattern = 'jwt_blacklist:*';
            const keys = await this.redisClient.keys(pattern);
            
            return {
                count: keys.length,
                keys: keys.map(key => key.replace('jwt_blacklist:', ''))
            };

        } catch (error) {
            this.logger.error('Failed to get blacklist stats:', error);
            return { count: 0, keys: [] };
        }
    }

    /**
     * 清理過期的黑名單條目
     * @returns Promise<number> - 清理的條目數量
     */
    public async cleanupExpiredTokens(): Promise<number> {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const pattern = 'jwt_blacklist:*';
            const keys = await this.redisClient.keys(pattern);
            let cleanedCount = 0;

            for (const key of keys) {
                const ttl = await this.redisClient.ttl(key);
                if (ttl === -1 || ttl === -2) {
                    // TTL 為 -1 表示沒有設置過期時間，-2 表示 key 不存在
                    await this.redisClient.del(key);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                this.logger.info(`Cleaned up ${cleanedCount} expired blacklist tokens`);
            }

            return cleanedCount;

        } catch (error) {
            this.logger.error('Failed to cleanup expired tokens:', error);
            return 0;
        }
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
        try {
            if (this.isConnected) {
                await this.redisClient.quit();
                this.isConnected = false;
                this.logger.info('JWT Blacklist Service Redis connection closed');
            }
        } catch (error) {
            this.logger.error('Error closing Redis connection:', error);
        }
    }

    /**
     * 檢查服務是否可用
     * @returns Promise<boolean> - 服務是否可用
     */
    public async isHealthy(): Promise<boolean> {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            await this.redisClient.ping();
            return true;
        } catch (error) {
            this.logger.error('JWT Blacklist Service health check failed:', error);
            return false;
        }
    }
}
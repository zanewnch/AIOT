/**
 * @fileoverview JWT 黑名單服務
 * 
 * 此服務用於管理已登出或失效的 JWT token，確保登出後的 token 無法被重複使用
 * 使用 Redis 作為存儲機制，支持 token 自動過期
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-16
 */

import { createClient, RedisClientType } from 'redis';
import { createHash } from 'crypto';

export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

/**
 * JWT 黑名單管理服務
 * 
 * 負責管理已失效的 JWT token，防止登出後的 token 被重複使用
 */
export class JwtBlacklistService {
    private redisClient: RedisClientType;
    private readonly keyPrefix = 'jwt_blacklist:';
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://aiot-redis:6379'
        });
        
        this.setupRedisConnection();
    }

    /**
     * 設置 Redis 連線
     */
    private async setupRedisConnection(): Promise<void> {
        try {
            this.redisClient.on('error', (err) => {
                this.logger.error('Redis Client Error:', err);
            });

            this.redisClient.on('connect', () => {
                this.logger.info('Redis Client Connected for JWT Blacklist');
            });

            await this.redisClient.connect();
        } catch (error) {
            this.logger.error('Failed to connect to Redis for JWT blacklist:', error);
            throw error;
        }
    }

    /**
     * 將 JWT token 加入黑名單
     * 
     * @param token JWT token 字串
     * @param expiresAt token 的過期時間（Unix timestamp）
     * @param reason 加入黑名單的原因
     * @returns Promise<void>
     */
    async addToBlacklist(token: string, expiresAt: number, reason: string = 'logout'): Promise<void> {
        try {
            // 以 token 的 hash 作為 redis key，避免在儲存層暴露完整 token
            const key = this.getRedisKey(token);
            const currentTime = Math.floor(Date.now() / 1000);
            const ttl = Math.max(expiresAt - currentTime, 1); // 至少保留 1 秒

            const blacklistData = {
                reason,
                blacklistedAt: new Date().toISOString(),
                expiresAt: new Date(expiresAt * 1000).toISOString()
            };

            await this.redisClient.setEx(key, ttl, JSON.stringify(blacklistData));
            
            this.logger.info(`JWT token added to blacklist: reason=${reason}, ttl=${ttl}s`);
        } catch (error) {
            this.logger.error('Failed to add JWT token to blacklist:', error);
            throw error;
        }
    }

    /**
     * 檢查 JWT token 是否在黑名單中
     * 
     * @param token JWT token 字串
     * @returns Promise<boolean> true 表示在黑名單中，false 表示不在
     */
    async isBlacklisted(token: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(token);
            const result = await this.redisClient.get(key);
            
            if (result) {
                this.logger.debug('JWT token found in blacklist');
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error('Failed to check JWT blacklist:', error);
            // 在錯誤情況下，為了安全起見，假設 token 有效
            return false;
        }
    }

    /**
     * 從黑名單中移除 JWT token（通常用於測試）
     * 
     * @param token JWT token 字串
     * @returns Promise<boolean> true 表示成功移除，false 表示不存在
     */
    async removeFromBlacklist(token: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(token);
            const result = await this.redisClient.del(key);
            
            this.logger.info(`JWT token removed from blacklist: success=${result > 0}`);
            return result > 0;
        } catch (error) {
            this.logger.error('Failed to remove JWT token from blacklist:', error);
            throw error;
        }
    }

    /**
     * 獲取黑名單統計信息
     * 
     * @returns Promise<{count: number, keys: string[]}> 黑名單統計
     */
    async getBlacklistStats(): Promise<{count: number, keys: string[]}> {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redisClient.keys(pattern);
            
            return {
                count: keys.length,
                keys: keys.map(key => key.replace(this.keyPrefix, ''))
            };
        } catch (error) {
            this.logger.error('Failed to get blacklist stats:', error);
            throw error;
        }
    }

    /**
     * 清理所有過期的黑名單項目（手動觸發，Redis 會自動清理）
     * 
     * @returns Promise<number> 清理的項目數量
     */
    async cleanupExpiredTokens(): Promise<number> {
        try {
            const pattern = `${this.keyPrefix}*`;
            const keys = await this.redisClient.keys(pattern);
            let cleanedCount = 0;

            for (const key of keys) {
                const ttl = await this.redisClient.ttl(key);
                if (ttl <= 0) {
                    await this.redisClient.del(key);
                    cleanedCount++;
                }
            }

            this.logger.info(`Cleaned up ${cleanedCount} expired JWT blacklist entries`);
            return cleanedCount;
        } catch (error) {
            this.logger.error('Failed to cleanup expired JWT blacklist entries:', error);
            throw error;
        }
    }

    /**
     * 生成 Redis key
     * 
     * @param token JWT token 字串
     * @returns Redis key
     */
    private getRedisKey(token: string): string {
        // 使用 token 的 hash 作為 key，避免存儲完整 token
        const tokenHash = createHash('sha256').update(token).digest('hex');
        return `${this.keyPrefix}${tokenHash}`;
    }

    /**
     * 關閉 Redis 連線
     */
    async close(): Promise<void> {
        try {
            await this.redisClient.quit();
            this.logger.info('JWT Blacklist Redis connection closed');
        } catch (error) {
            this.logger.error('Failed to close JWT Blacklist Redis connection:', error);
        }
    }
}
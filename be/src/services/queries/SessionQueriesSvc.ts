/**
 * @fileoverview 會話查詢服務實現
 *
 * 此文件實作了會話查詢業務邏輯層，
 * 專注於處理所有讀取相關的會話業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 會話資料擷取和驗證
 * - 會話存在性檢查
 * - 使用者活躍會話統計
 * - 會話過期時間查詢
 *
 * Redis 鍵值設計：
 * - 會話資料：session:{token}
 * - 使用者會話集合：user_sessions:{userId}
 *
 * @module SessionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('SessionQueriesSvc');

/**
 * 使用者會話資料介面
 */
export interface UserSessionData {
    /** 使用者 ID */
    userId: number;
    /** 使用者名稱 */
    username: string;
    /** 登入時間（Unix 時間戳） */
    loginTime: number;
    /** 最後活動時間（Unix 時間戳） */
    lastActiveTime: number;
    /** 使用者代理字串（可選） */
    userAgent?: string;
    /** IP 位址（可選） */
    ipAddress?: string;
}

/**
 * 會話查詢服務類別
 * 
 * 提供會話的所有查詢功能，
 * 包含會話資料取得、存在性檢查和統計資訊。
 */
@injectable()
export class SessionQueriesSvc {
    /** 會話資料鍵值前綴 */
    private static readonly SESSION_PREFIX = 'session:';
    /** 使用者會話集合鍵值前綴 */
    private static readonly USER_SESSIONS_PREFIX = 'user_sessions:';

    /**
     * 取得 Redis 客戶端
     * 嘗試建立 Redis 連線，若失敗則拋出錯誤
     *
     * @returns Redis 客戶端實例
     * @throws Error 當 Redis 連線不可用時拋出錯誤
     * @private
     */
    private getRedisClient(): RedisClientType {
        try {
            return getRedisClient();
        } catch (error) {
            logger.error('Redis connection is not available');
            throw new Error('Redis connection is not available. Please ensure Redis is connected.');
        }
    }

    /**
     * 生成會話鍵值
     * @param token JWT Token
     * @private
     */
    private getSessionKey(token: string): string {
        return `${SessionQueriesSvc.SESSION_PREFIX}${token}`;
    }

    /**
     * 生成使用者會話集合鍵值
     * @param userId 使用者 ID
     * @private
     */
    private getUserSessionsKey(userId: number): string {
        return `${SessionQueriesSvc.USER_SESSIONS_PREFIX}${userId}`;
    }

    /**
     * 取得使用者會話資料
     * 
     * 從 Redis 取得指定 Token 對應的使用者會話資料
     *
     * @param token JWT Token
     * @returns Promise<UserSessionData | null> 使用者會話資料或 null
     *
     * @example
     * ```typescript
     * const sessionQueriesSvc = new SessionQueriesSvc();
     * const sessionData = await sessionQueriesSvc.getUserSession(token);
     * 
     * if (sessionData) {
     *   console.log(`使用者：${sessionData.username} (ID: ${sessionData.userId})`);
     *   console.log(`登入時間：${new Date(sessionData.loginTime * 1000)}`);
     * } else {
     *   console.log('會話不存在或已過期');
     * }
     * ```
     */
    public async getUserSession(token: string): Promise<UserSessionData | null> {
        try {
            logger.debug(`Getting user session for token`);

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Invalid token provided for getUserSession');
                return null;
            }

            const redis = this.getRedisClient();
            const sessionKey = this.getSessionKey(token);

            // 從 Redis 取得會話資料
            const sessionDataString = await redis.get(sessionKey);
            if (!sessionDataString) {
                logger.debug('Session not found in Redis');
                return null;
            }

            // 解析會話資料
            const sessionData: UserSessionData = JSON.parse(sessionDataString);
            
            // 更新最後活動時間（這裡只是記錄，實際更新由命令服務處理）
            logger.debug(`Session found for user: ${sessionData.username} (ID: ${sessionData.userId})`);
            return sessionData;

        } catch (error) {
            logger.error('Error getting user session:', error);
            return null;
        }
    }

    /**
     * 檢查會話是否存在
     * 
     * 驗證指定的 Token 是否對應有效的會話
     *
     * @param token JWT Token
     * @returns Promise<boolean> 會話是否存在
     *
     * @example
     * ```typescript
     * const sessionQueriesSvc = new SessionQueriesSvc();
     * const exists = await sessionQueriesSvc.sessionExists(token);
     * 
     * if (exists) {
     *   console.log('會話有效');
     * } else {
     *   console.log('會話無效或已過期');
     * }
     * ```
     */
    public async sessionExists(token: string): Promise<boolean> {
        try {
            logger.debug('Checking if session exists');

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                return false;
            }

            const redis = this.getRedisClient();
            const sessionKey = this.getSessionKey(token);

            // 檢查 Redis 中是否存在會話鍵值
            const exists = await redis.exists(sessionKey);
            const sessionExists = exists > 0;

            logger.debug(`Session existence check result: ${sessionExists}`);
            return sessionExists;

        } catch (error) {
            logger.error('Error checking session existence:', error);
            return false;
        }
    }

    /**
     * 取得使用者活躍會話數量
     * 
     * 統計指定使用者目前有效的會話數量
     *
     * @param userId 使用者 ID
     * @returns Promise<number> 活躍會話數量
     *
     * @example
     * ```typescript
     * const sessionQueriesSvc = new SessionQueriesSvc();
     * const count = await sessionQueriesSvc.getUserActiveSessionCount(1);
     * console.log(`使用者有 ${count} 個活躍會話`);
     * ```
     */
    public async getUserActiveSessionCount(userId: number): Promise<number> {
        try {
            logger.debug(`Getting active session count for user: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                return 0;
            }

            const redis = this.getRedisClient();
            const userSessionsKey = this.getUserSessionsKey(userId);

            // 取得使用者會話集合的成員數量
            const count = await redis.sCard(userSessionsKey);

            logger.debug(`User ${userId} has ${count} active sessions`);
            return count;

        } catch (error) {
            logger.error(`Error getting user active session count for user ${userId}:`, error);
            return 0;
        }
    }

    /**
     * 取得會話剩餘時間
     * 
     * 查詢指定會話的剩餘存活時間（秒）
     *
     * @param token JWT Token
     * @returns Promise<number> 剩餘時間（秒），-1 表示永不過期，-2 表示鍵值不存在
     *
     * @example
     * ```typescript
     * const sessionQueriesSvc = new SessionQueriesSvc();
     * const ttl = await sessionQueriesSvc.getSessionTTL(token);
     * 
     * if (ttl > 0) {
     *   console.log(`會話將在 ${ttl} 秒後過期`);
     * } else if (ttl === -1) {
     *   console.log('會話永不過期');
     * } else {
     *   console.log('會話不存在');
     * }
     * ```
     */
    public async getSessionTTL(token: string): Promise<number> {
        try {
            logger.debug('Getting session TTL');

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                return -2;
            }

            const redis = this.getRedisClient();
            const sessionKey = this.getSessionKey(token);

            // 取得鍵值的 TTL
            const ttl = await redis.ttl(sessionKey);

            logger.debug(`Session TTL: ${ttl} seconds`);
            return ttl;

        } catch (error) {
            logger.error('Error getting session TTL:', error);
            return -2;
        }
    }

    /**
     * 取得使用者的所有會話 Token
     * 
     * 查詢指定使用者目前所有活躍的會話 Token
     *
     * @param userId 使用者 ID
     * @returns Promise<string[]> 會話 Token 陣列
     *
     * @example
     * ```typescript
     * const sessionQueriesSvc = new SessionQueriesSvc();
     * const tokens = await sessionQueriesSvc.getUserSessionTokens(1);
     * console.log(`使用者有 ${tokens.length} 個會話 Token`);
     * ```
     */
    public async getUserSessionTokens(userId: number): Promise<string[]> {
        try {
            logger.debug(`Getting session tokens for user: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                return [];
            }

            const redis = this.getRedisClient();
            const userSessionsKey = this.getUserSessionsKey(userId);

            // 取得使用者會話集合的所有成員
            const tokens = await redis.sMembers(userSessionsKey);

            logger.debug(`User ${userId} has ${tokens.length} session tokens`);
            return tokens;

        } catch (error) {
            logger.error(`Error getting user session tokens for user ${userId}:`, error);
            return [];
        }
    }

    /**
     * 批次檢查會話是否存在
     * 
     * 檢查多個 Token 的會話存在性
     *
     * @param tokens JWT Token 陣列
     * @returns Promise<Map<string, boolean>> Token 和存在性的對應表
     */
    public async batchCheckSessionExists(tokens: string[]): Promise<Map<string, boolean>> {
        try {
            logger.debug(`Batch checking ${tokens.length} sessions`);

            const result = new Map<string, boolean>();

            // 驗證輸入
            if (!tokens || tokens.length === 0) {
                return result;
            }

            const redis = this.getRedisClient();

            // 批次檢查會話存在性
            const pipeline = redis.multi();
            const sessionKeys = tokens.map(token => this.getSessionKey(token));
            
            for (const sessionKey of sessionKeys) {
                pipeline.exists(sessionKey);
            }

            const results = await pipeline.exec();
            
            // 處理結果
            for (let i = 0; i < tokens.length; i++) {
                const exists = results && results[i] ? (results[i] as number) > 0 : false;
                result.set(tokens[i], exists);
            }

            logger.debug(`Batch session check completed for ${tokens.length} tokens`);
            return result;

        } catch (error) {
            logger.error('Error in batch session check:', error);
            return new Map<string, boolean>();
        }
    }
}
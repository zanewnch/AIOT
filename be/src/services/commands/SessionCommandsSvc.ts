/**
 * @fileoverview 會話命令服務實現
 *
 * 此文件實作了會話命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的會話業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含會話建立、更新、刪除等寫入邏輯。
 *
 * 功能特點：
 * - 會話建立和設定
 * - 會話刪除和清理
 * - 會話延長和更新
 * - 使用者多會話管理
 *
 * Redis 鍵值設計：
 * - 會話資料：session:{token}
 * - 使用者會話集合：user_sessions:{userId}
 * - 預設 TTL：3600 秒（1 小時）
 *
 * 安全特性：
 * - 支援單一裝置登入限制
 * - 自動清理過期會話
 * - 會話活動時間追蹤
 * - 支援 IP 位址和 User-Agent 記錄
 *
 * @module SessionCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';
import { SessionQueriesSvc, UserSessionData } from '../queries/SessionQueriesSvc.js';

const logger = createLogger('SessionCommandsSvc');

/**
 * 會話選項介面
 */
export interface SessionOptions {
    /** 會話存活時間（秒），預設 1 小時 */
    ttl?: number;
    /** 使用者代理字串（可選） */
    userAgent?: string;
    /** IP 位址（可選） */
    ipAddress?: string;
}

/**
 * 會話建立請求物件
 */
export interface CreateSessionRequest {
    userId: number;
    username: string;
    token: string;
    options?: SessionOptions;
}

/**
 * 會話刪除請求物件
 */
export interface DeleteSessionRequest {
    token: string;
    userId?: number;
}

/**
 * 會話命令服務類別
 * 
 * 提供會話的所有命令功能，
 * 包含會話建立、刪除、延長和清理操作。
 */
@injectable()
export class SessionCommandsSvc {
    private sessionQueriesSvc: SessionQueriesSvc;
    
    /** 會話資料鍵值前綴 */
    private static readonly SESSION_PREFIX = 'session:';
    /** 使用者會話集合鍵值前綴 */
    private static readonly USER_SESSIONS_PREFIX = 'user_sessions:';
    /** 預設會話存活時間（秒） */
    private static readonly DEFAULT_TTL = 3600;

    constructor(
        sessionQueriesSvc: SessionQueriesSvc = new SessionQueriesSvc()
    ) {
        this.sessionQueriesSvc = sessionQueriesSvc;
    }

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
        return `${SessionCommandsSvc.SESSION_PREFIX}${token}`;
    }

    /**
     * 生成使用者會話集合鍵值
     * @param userId 使用者 ID
     * @private
     */
    private getUserSessionsKey(userId: number): string {
        return `${SessionCommandsSvc.USER_SESSIONS_PREFIX}${userId}`;
    }

    /**
     * 設置使用者會話
     * 
     * 在 Redis 中建立使用者會話資料，包括會話資料和使用者會話集合
     *
     * @param request 會話建立請求物件
     * @returns Promise<void> 設置完成的 Promise
     *
     * @example
     * ```typescript
     * const sessionCommandsSvc = new SessionCommandsSvc();
     * await sessionCommandsSvc.setUserSession({
     *   userId: 1,
     *   username: 'alice',
     *   token: 'jwt-token-here',
     *   options: {
     *     ttl: 7200, // 2 小時
     *     userAgent: 'Mozilla/5.0...',
     *     ipAddress: '192.168.1.1'
     *   }
     * });
     * ```
     */
    public async setUserSession(request: CreateSessionRequest): Promise<void> {
        try {
            const { userId, username, token, options = {} } = request;
            logger.info(`Setting user session for user: ${username} (ID: ${userId})`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }
            if (!username || typeof username !== 'string' || username.trim().length === 0) {
                throw new Error('Invalid username');
            }
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                throw new Error('Invalid token');
            }

            const redis = this.getRedisClient();
            const sessionKey = this.getSessionKey(token);
            const userSessionsKey = this.getUserSessionsKey(userId);
            const ttl = options.ttl || SessionCommandsSvc.DEFAULT_TTL;

            // 建立會話資料物件
            const sessionData: UserSessionData = {
                userId,
                username,
                loginTime: Math.floor(Date.now() / 1000),
                lastActiveTime: Math.floor(Date.now() / 1000),
                userAgent: options.userAgent,
                ipAddress: options.ipAddress
            };

            // 使用 Redis 事務確保一致性
            const multi = redis.multi();
            
            // 設置會話資料，包含 TTL
            multi.setEx(sessionKey, ttl, JSON.stringify(sessionData));
            
            // 將 Token 加入使用者會話集合
            multi.sAdd(userSessionsKey, token);
            
            // 為使用者會話集合設置 TTL（比會話 TTL 稍長，確保清理）
            multi.expire(userSessionsKey, ttl + 300); // 額外 5 分鐘緩衝

            // 執行事務
            await multi.exec();

            logger.info(`Session created successfully for user: ${username} (ID: ${userId}), TTL: ${ttl}s`);

        } catch (error) {
            logger.error(`Error setting user session for user ${request.username}:`, error);
            throw error;
        }
    }

    /**
     * 刪除使用者會話
     * 
     * 從 Redis 清除指定的使用者會話資料
     *
     * @param request 會話刪除請求物件
     * @returns Promise<void> 刪除完成的 Promise
     *
     * @example
     * ```typescript
     * const sessionCommandsSvc = new SessionCommandsSvc();
     * await sessionCommandsSvc.deleteUserSession({
     *   token: 'jwt-token-here',
     *   userId: 1
     * });
     * ```
     */
    public async deleteUserSession(request: DeleteSessionRequest): Promise<void> {
        try {
            const { token, userId } = request;
            logger.info(`Deleting user session for token, userId: ${userId}`);

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                throw new Error('Invalid token');
            }

            const redis = this.getRedisClient();
            const sessionKey = this.getSessionKey(token);

            // 如果沒有提供 userId，嘗試從會話資料中取得
            let actualUserId = userId;
            if (!actualUserId) {
                const sessionData = await this.sessionQueriesSvc.getUserSession(token);
                if (sessionData) {
                    actualUserId = sessionData.userId;
                }
            }

            // 使用 Redis 事務確保一致性
            const multi = redis.multi();
            
            // 刪除會話資料
            multi.del(sessionKey);

            // 如果有使用者 ID，從使用者會話集合中移除 Token
            if (actualUserId && actualUserId > 0) {
                const userSessionsKey = this.getUserSessionsKey(actualUserId);
                multi.sRem(userSessionsKey, token);
            }

            // 執行事務
            await multi.exec();

            logger.info(`Session deleted successfully for userId: ${actualUserId}`);

        } catch (error) {
            logger.error(`Error deleting user session:`, error);
            throw error;
        }
    }

    /**
     * 延長會話有效期
     * 
     * 延長指定會話的存活時間，並更新最後活動時間
     *
     * @param token JWT Token
     * @param ttl 新的存活時間（秒），預設為預設 TTL
     * @returns Promise<boolean> 延長是否成功
     *
     * @example
     * ```typescript
     * const sessionCommandsSvc = new SessionCommandsSvc();
     * const success = await sessionCommandsSvc.extendSession('jwt-token-here', 7200);
     * 
     * if (success) {
     *   console.log('會話延長成功');
     * } else {
     *   console.log('會話不存在或延長失敗');
     * }
     * ```
     */
    public async extendSession(token: string, ttl: number = SessionCommandsSvc.DEFAULT_TTL): Promise<boolean> {
        try {
            logger.debug(`Extending session TTL to ${ttl} seconds`);

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Invalid token provided for extendSession');
                return false;
            }
            if (ttl <= 0) {
                logger.warn(`Invalid TTL: ${ttl}`);
                return false;
            }

            // 先檢查會話是否存在
            const sessionExists = await this.sessionQueriesSvc.sessionExists(token);
            if (!sessionExists) {
                logger.warn('Attempted to extend non-existent session');
                return false;
            }

            const redis = this.getRedisClient();
            const sessionKey = this.getSessionKey(token);

            // 取得現有的會話資料
            const sessionData = await this.sessionQueriesSvc.getUserSession(token);
            if (!sessionData) {
                return false;
            }

            // 更新最後活動時間
            const updatedSessionData = {
                ...sessionData,
                lastActiveTime: Math.floor(Date.now() / 1000)
            };

            // 使用 Redis 事務更新會話資料和 TTL
            const multi = redis.multi();
            
            // 更新會話資料和 TTL
            multi.setEx(sessionKey, ttl, JSON.stringify(updatedSessionData));
            
            // 同時更新使用者會話集合的 TTL
            const userSessionsKey = this.getUserSessionsKey(sessionData.userId);
            multi.expire(userSessionsKey, ttl + 300); // 額外 5 分鐘緩衝

            // 執行事務
            await multi.exec();

            logger.debug(`Session extended successfully with TTL: ${ttl}s`);
            return true;

        } catch (error) {
            logger.error('Error extending session:', error);
            return false;
        }
    }

    /**
     * 清除使用者所有會話
     * 
     * 刪除指定使用者的所有活躍會話（強制登出所有裝置）
     *
     * @param userId 使用者 ID
     * @returns Promise<number> 清除的會話數量
     *
     * @example
     * ```typescript
     * const sessionCommandsSvc = new SessionCommandsSvc();
     * const clearedCount = await sessionCommandsSvc.clearAllUserSessions(1);
     * console.log(`清除了 ${clearedCount} 個會話`);
     * ```
     */
    public async clearAllUserSessions(userId: number): Promise<number> {
        try {
            logger.info(`Clearing all sessions for user: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            // 先取得使用者的所有會話 Token
            const sessionTokens = await this.sessionQueriesSvc.getUserSessionTokens(userId);
            if (sessionTokens.length === 0) {
                logger.debug(`No active sessions found for user: ${userId}`);
                return 0;
            }

            const redis = this.getRedisClient();
            const userSessionsKey = this.getUserSessionsKey(userId);

            // 使用 Redis 事務批次刪除所有會話
            const multi = redis.multi();

            // 刪除所有會話資料
            for (const token of sessionTokens) {
                const sessionKey = this.getSessionKey(token);
                multi.del(sessionKey);
            }

            // 清除使用者會話集合
            multi.del(userSessionsKey);

            // 執行事務
            await multi.exec();

            logger.info(`Successfully cleared ${sessionTokens.length} sessions for user: ${userId}`);
            return sessionTokens.length;

        } catch (error) {
            logger.error(`Error clearing all user sessions for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * 批次刪除會話
     * 
     * 刪除多個會話 Token
     *
     * @param tokens JWT Token 陣列
     * @returns Promise<number> 成功刪除的會話數量
     *
     * @example
     * ```typescript
     * const sessionCommandsSvc = new SessionCommandsSvc();
     * const deletedCount = await sessionCommandsSvc.batchDeleteSessions(['token1', 'token2', 'token3']);
     * console.log(`成功刪除 ${deletedCount} 個會話`);
     * ```
     */
    public async batchDeleteSessions(tokens: string[]): Promise<number> {
        try {
            logger.info(`Batch deleting ${tokens.length} sessions`);

            // 驗證輸入
            if (!tokens || tokens.length === 0) {
                return 0;
            }

            // 過濾有效的 Token
            const validTokens = tokens.filter(token => 
                token && typeof token === 'string' && token.trim().length > 0
            );

            if (validTokens.length === 0) {
                return 0;
            }

            const redis = this.getRedisClient();
            const multi = redis.multi();

            // 批次刪除會話
            let deletedCount = 0;
            for (const token of validTokens) {
                // 先取得會話資料以獲取 userId
                const sessionData = await this.sessionQueriesSvc.getUserSession(token);
                
                const sessionKey = this.getSessionKey(token);
                multi.del(sessionKey);

                // 如果有使用者 ID，從使用者會話集合中移除
                if (sessionData && sessionData.userId) {
                    const userSessionsKey = this.getUserSessionsKey(sessionData.userId);
                    multi.sRem(userSessionsKey, token);
                }

                deletedCount++;
            }

            // 執行事務
            await multi.exec();

            logger.info(`Successfully batch deleted ${deletedCount} sessions`);
            return deletedCount;

        } catch (error) {
            logger.error('Error in batch session deletion:', error);
            throw error;
        }
    }

    /**
     * 清理過期的使用者會話集合
     * 
     * 清理不再有效的會話 Token 從使用者會話集合中
     *
     * @param userId 使用者 ID
     * @returns Promise<number> 清理的無效 Token 數量
     */
    public async cleanupUserSessionTokens(userId: number): Promise<number> {
        try {
            logger.debug(`Cleaning up session tokens for user: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                return 0;
            }

            // 取得使用者的所有會話 Token
            const sessionTokens = await this.sessionQueriesSvc.getUserSessionTokens(userId);
            if (sessionTokens.length === 0) {
                return 0;
            }

            // 批次檢查會話存在性
            const existenceMap = await this.sessionQueriesSvc.batchCheckSessionExists(sessionTokens);
            
            // 找出不存在的 Token
            const invalidTokens = sessionTokens.filter(token => !existenceMap.get(token));
            
            if (invalidTokens.length === 0) {
                return 0;
            }

            // 從使用者會話集合中移除無效的 Token
            const redis = this.getRedisClient();
            const userSessionsKey = this.getUserSessionsKey(userId);
            const multi = redis.multi();

            for (const token of invalidTokens) {
                multi.sRem(userSessionsKey, token);
            }

            await multi.exec();

            logger.debug(`Cleaned up ${invalidTokens.length} invalid session tokens for user: ${userId}`);
            return invalidTokens.length;

        } catch (error) {
            logger.error(`Error cleaning up session tokens for user ${userId}:`, error);
            return 0;
        }
    }
}
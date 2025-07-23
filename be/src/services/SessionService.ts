/**
 * @fileoverview 會話管理服務
 * 
 * 使用 Redis 管理使用者登入會話狀態，提供完整的會話生命週期管理。
 * 此服務負責處理使用者登入後的會話狀態追蹤、會話驗證和會話清理。
 * 
 * 功能包括：
 * - 設置使用者會話
 * - 取得使用者會話資料
 * - 刪除使用者會話
 * - 延長會話有效期
 * - 清理使用者所有會話
 * - 會話存在性檢查
 * - 會話統計和監控
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
 * 使用場景：
 * - 使用者登入後的會話管理
 * - API 認證和授權
 * - 多裝置登入控制
 * - 會話安全監控
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-18
 */

// 匯入 Redis 客戶端配置，用於會話資料的儲存和管理
import { getRedisClient } from '../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('SessionService');

/**
 * 使用者會話資料介面
 * 定義儲存在 Redis 中的使用者會話資料結構
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
 * 會話選項介面
 * 定義建立會話時可設定的選項
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
 * 會話管理服務類別
 * 提供完整的 Redis 會話管理功能，包括會話建立、驗證、刪除和監控
 */
export class SessionService {
  /** 會話資料鍵值前綴 */
  private static readonly SESSION_PREFIX = 'session:';
  /** 使用者會話集合鍵值前綴 */
  private static readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  /** 預設會話存活時間（秒） */
  private static readonly DEFAULT_TTL = 3600; // 1 小時

  /**
   * 取得 Redis 客戶端
   * 嘗試建立 Redis 連線，若失敗則拋出錯誤
   * 
   * @returns Redis 客戶端實例
   * @throws Error 當 Redis 連線不可用時拋出錯誤
   * 
   * @private
   * @static
   */
  private static getRedisClient(): RedisClientType {
    try {
      // 嘗試取得 Redis 客戶端實例
      return getRedisClient();
    } catch (error) {
      // 拋出更具體的錯誤訊息
      logger.error('Redis connection is not available');
      throw new Error('Redis connection is not available. Please ensure Redis is connected.');
    }
  }

  /**
   * 生成會話鍵值
   * 建立特定 Token 的會話資料鍵值，格式為 "session:{token}"
   * 
   * @param token JWT Token
   * @returns 會話鍵值
   * 
   * @private
   * @static
   */
  private static getSessionKey(token: string): string {
    // 組合會話鍵值前綴和 Token
    return `${SessionService.SESSION_PREFIX}${token}`;
  }

  /**
   * 生成使用者會話集合鍵值
   * 建立特定使用者的會話集合鍵值，格式為 "user_sessions:{userId}"
   * 
   * @param userId 使用者 ID
   * @returns 使用者會話集合鍵值
   * 
   * @private
   * @static
   */
  private static getUserSessionsKey(userId: number): string {
    // 組合使用者會話集合鍵值前綴和使用者 ID
    return `${SessionService.USER_SESSIONS_PREFIX}${userId}`;
  }

  /**
   * 設置使用者會話
   * 在 Redis 中建立使用者會話資料，包括會話資料和使用者會話集合
   * 
   * @param userId 使用者 ID
   * @param username 使用者名稱
   * @param token JWT Token
   * @param options 會話選項（TTL、User-Agent、IP 位址）
   * @returns Promise<void>
   * @throws Error 當 Redis 操作失敗時拋出錯誤
   * 
   * @example
   * ```typescript
   * await SessionService.setUserSession(123, 'alice', 'jwt-token', {
   *   ttl: 3600,
   *   userAgent: 'Mozilla/5.0...',
   *   ipAddress: '192.168.1.1'
   * });
   * ```
   * 
   * @static
   * @public
   */
  public static async setUserSession(
    userId: number,
    username: string,
    token: string,
    options: SessionOptions = {}
  ): Promise<void> {
    // 取得 Redis 客戶端
    const redis = SessionService.getRedisClient();
    // 解構設定選項，設定預設值
    const { ttl = SessionService.DEFAULT_TTL, userAgent, ipAddress } = options;

    // 建立會話資料物件
    const sessionData: UserSessionData = {
      userId,
      username,
      loginTime: Date.now(),
      lastActiveTime: Date.now(),
      userAgent,
      ipAddress,
    };

    // 生成 Redis 鍵值
    const sessionKey = SessionService.getSessionKey(token);
    const userSessionsKey = SessionService.getUserSessionsKey(userId);

    try {
      // 使用管道批量執行操作，提高效能
      const pipeline = redis.multi();
      
      // 設置會話資料，包含 TTL
      pipeline.setEx(sessionKey, ttl, JSON.stringify(sessionData));
      
      // 將 token 加入使用者會話集合
      pipeline.sAdd(userSessionsKey, token);
      
      // 設置使用者會話集合的過期時間（比會話稍長，確保清理）
      pipeline.expire(userSessionsKey, ttl + 300);
      
      // 執行所有 Redis 操作
      await pipeline.exec();
      logger.debug(`Session created for user ${userId} with TTL ${ttl} seconds`);
    } catch (error) {
      // 拋出具體的錯誤訊息
      logger.error('Failed to set user session:', error);
      throw new Error(`Failed to set user session: ${error}`);
    }
  }

  /**
   * 取得使用者會話資料
   * @param token JWT Token
   * @returns 會話資料或 null
   */
  public static async getUserSession(token: string): Promise<UserSessionData | null> {
    const redis = SessionService.getRedisClient();
    const sessionKey = SessionService.getSessionKey(token);

    try {
      const sessionDataStr = await redis.get(sessionKey);
      
      if (!sessionDataStr) {
        return null;
      }

      const sessionData: UserSessionData = JSON.parse(sessionDataStr);
      
      // 更新最後活動時間
      sessionData.lastActiveTime = Date.now();
      await redis.set(sessionKey, JSON.stringify(sessionData), { KEEPTTL: true });
      
      logger.debug(`Session retrieved and updated for token`);
      return sessionData;
    } catch (error) {
      logger.error('Failed to get user session:', error);
      return null;
    }
  }

  /**
   * 刪除使用者會話
   * @param token JWT Token
   * @param userId 使用者 ID（可選，用於同時清理使用者會話集合）
   */
  public static async deleteUserSession(token: string, userId?: number): Promise<void> {
    const redis = SessionService.getRedisClient();
    const sessionKey = SessionService.getSessionKey(token);

    try {
      if (userId) {
        const userSessionsKey = SessionService.getUserSessionsKey(userId);
        const pipeline = redis.multi();
        
        pipeline.del(sessionKey);
        pipeline.sRem(userSessionsKey, token);
        
        await pipeline.exec();
        logger.debug(`Session deleted for user ${userId}`);
      } else {
        await redis.del(sessionKey);
        logger.debug('Session deleted');
      }
    } catch (error) {
      logger.error('Failed to delete user session:', error);
      throw new Error(`Failed to delete user session: ${error}`);
    }
  }

  /**
   * 延長會話有效期
   * @param token JWT Token
   * @param ttl 延長的時間（秒）
   */
  public static async extendSession(token: string, ttl: number = SessionService.DEFAULT_TTL): Promise<boolean> {
    const redis = SessionService.getRedisClient();
    const sessionKey = SessionService.getSessionKey(token);

    try {
      const result = await redis.expire(sessionKey, ttl);
      if (result === 1) {
        logger.debug(`Session extended with TTL ${ttl} seconds`);
      } else {
        logger.warn('Failed to extend session - session may not exist');
      }
      return result === 1;
    } catch (error) {
      logger.error('Failed to extend session:', error);
      return false;
    }
  }

  /**
   * 清理使用者所有會話（登出所有裝置）
   * @param userId 使用者 ID
   */
  public static async clearAllUserSessions(userId: number): Promise<void> {
    const redis = SessionService.getRedisClient();
    const userSessionsKey = SessionService.getUserSessionsKey(userId);

    try {
      // 取得使用者所有會話 token
      const tokens = await redis.sMembers(userSessionsKey);
      
      if (tokens.length === 0) {
        return;
      }

      // 批量刪除會話
      const pipeline = redis.multi();
      
      tokens.forEach(token => {
        const sessionKey = SessionService.getSessionKey(token);
        pipeline.del(sessionKey);
      });
      
      // 刪除使用者會話集合
      pipeline.del(userSessionsKey);
      
      await pipeline.exec();
      logger.info(`Cleared ${tokens.length} sessions for user ${userId}`);
    } catch (error) {
      logger.error('Failed to clear all user sessions:', error);
      throw new Error(`Failed to clear all user sessions: ${error}`);
    }
  }

  /**
   * 取得使用者活躍會話數量
   * @param userId 使用者 ID
   */
  public static async getUserActiveSessionCount(userId: number): Promise<number> {
    const redis = SessionService.getRedisClient();
    const userSessionsKey = SessionService.getUserSessionsKey(userId);

    try {
      const count = await redis.sCard(userSessionsKey);
      logger.debug(`User ${userId} has ${count} active sessions`);
      return count;
    } catch (error) {
      logger.error('Failed to get user active session count:', error);
      return 0;
    }
  }

  /**
   * 檢查會話是否存在
   * @param token JWT Token
   */
  public static async sessionExists(token: string): Promise<boolean> {
    const redis = SessionService.getRedisClient();
    const sessionKey = SessionService.getSessionKey(token);

    try {
      const exists = await redis.exists(sessionKey);
      logger.debug(`Session existence check: ${exists === 1 ? 'exists' : 'not found'}`);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check session existence:', error);
      return false;
    }
  }

  /**
   * 取得會話剩餘時間（秒）
   * @param token JWT Token
   */
  public static async getSessionTTL(token: string): Promise<number> {
    const redis = SessionService.getRedisClient();
    const sessionKey = SessionService.getSessionKey(token);

    try {
      const ttl = await redis.ttl(sessionKey);
      logger.debug(`Session TTL: ${ttl} seconds`);
      return ttl;
    } catch (error) {
      logger.error('Failed to get session TTL:', error);
      return -1;
    }
  }
}
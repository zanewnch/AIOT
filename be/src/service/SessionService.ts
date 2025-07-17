import { getRedisClient } from '../configs/redisConfig.js';
import type { RedisClientType } from 'redis';

/**
 * 會話管理服務
 * ===============
 * 
 * 使用 Redis 管理使用者登入會話狀態
 * 功能包括：
 * - 設置使用者會話
 * - 取得使用者會話資料
 * - 刪除使用者會話
 * - 延長會話有效期
 * - 清理使用者所有會話
 */

export interface UserSessionData {
  userId: number;
  username: string;
  loginTime: number;
  lastActiveTime: number;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionOptions {
  ttl?: number; // 會話存活時間（秒），默認 1 小時
  userAgent?: string;
  ipAddress?: string;
}

export class SessionService {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private static readonly DEFAULT_TTL = 3600; // 1 小時

  /**
   * 取得 Redis 客戶端
   */
  private static getRedisClient(): RedisClientType {
    try {
      return getRedisClient();
    } catch (error) {
      throw new Error('Redis connection is not available. Please ensure Redis is connected.');
    }
  }

  /**
   * 生成會話鍵值
   */
  private static getSessionKey(token: string): string {
    return `${SessionService.SESSION_PREFIX}${token}`;
  }

  /**
   * 生成使用者會話集合鍵值
   */
  private static getUserSessionsKey(userId: number): string {
    return `${SessionService.USER_SESSIONS_PREFIX}${userId}`;
  }

  /**
   * 設置使用者會話
   * @param userId 使用者 ID
   * @param token JWT Token
   * @param options 會話選項
   */
  public static async setUserSession(
    userId: number,
    username: string,
    token: string,
    options: SessionOptions = {}
  ): Promise<void> {
    const redis = SessionService.getRedisClient();
    const { ttl = SessionService.DEFAULT_TTL, userAgent, ipAddress } = options;

    const sessionData: UserSessionData = {
      userId,
      username,
      loginTime: Date.now(),
      lastActiveTime: Date.now(),
      userAgent,
      ipAddress,
    };

    const sessionKey = SessionService.getSessionKey(token);
    const userSessionsKey = SessionService.getUserSessionsKey(userId);

    try {
      // 使用管道批量執行操作
      const pipeline = redis.multi();
      
      // 設置會話資料
      pipeline.setEx(sessionKey, ttl, JSON.stringify(sessionData));
      
      // 將 token 加入使用者會話集合
      pipeline.sAdd(userSessionsKey, token);
      
      // 設置使用者會話集合的過期時間（比會話稍長）
      pipeline.expire(userSessionsKey, ttl + 300);
      
      await pipeline.exec();
    } catch (error) {
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
      
      return sessionData;
    } catch (error) {
      console.error('Failed to get user session:', error);
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
      } else {
        await redis.del(sessionKey);
      }
    } catch (error) {
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
      return result;
    } catch (error) {
      console.error('Failed to extend session:', error);
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
    } catch (error) {
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
      return count;
    } catch (error) {
      console.error('Failed to get user active session count:', error);
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
      return exists === 1;
    } catch (error) {
      console.error('Failed to check session existence:', error);
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
      return ttl;
    } catch (error) {
      console.error('Failed to get session TTL:', error);
      return -1;
    }
  }
}
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
export class SessionService { // 會話管理服務類別，提供完整的 Redis 會話管理功能
  /** 會話資料鍵值前綴 */
  private static readonly SESSION_PREFIX = 'session:'; // Redis 中儲存個別會話資料的鍵值前綴
  /** 使用者會話集合鍵值前綴 */
  private static readonly USER_SESSIONS_PREFIX = 'user_sessions:'; // Redis 中儲存使用者所有會話集合的鍵值前綴
  /** 預設會話存活時間（秒） */
  private static readonly DEFAULT_TTL = 3600; // 預設會話過期時間，1 小時（3600 秒）

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
  private static getRedisClient(): RedisClientType { // 静態私有方法：取得 Redis 客戶端實例
    try { // 嘗試建立 Redis 連線
      // 嘗試取得 Redis 客戶端實例
      return getRedisClient(); // 調用 Redis 配置模組取得客戶端連線
    } catch (error) { // 捕獲 Redis 連線錯誤
      // 拋出更具體的錯誤訊息
      logger.error('Redis connection is not available'); // 記錄 Redis 連線不可用的錯誤日誌
      throw new Error('Redis connection is not available. Please ensure Redis is connected.'); // 拋出含有詳細訊息的錯誤
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
  private static getSessionKey(token: string): string { // 静態私有方法：生成會話鍵值
    // 組合會話鍵值前綴和 Token
    return `${SessionService.SESSION_PREFIX}${token}`; // 結合前綴和 JWT Token 產生唯一的 Redis 鍵值
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
  private static getUserSessionsKey(userId: number): string { // 静態私有方法：生成使用者會話集合鍵值
    // 組合使用者會話集合鍵值前綴和使用者 ID
    return `${SessionService.USER_SESSIONS_PREFIX}${userId}`; // 結合前綴和使用者 ID 產生使用者會話集合的 Redis 鍵值
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
  public static async setUserSession( // 静態公開異步方法：設置使用者會話
    userId: number, // 使用者 ID
    username: string, // 使用者名稱
    token: string, // JWT Token
    options: SessionOptions = {} // 會話選項（可選，預設為空物件）
  ): Promise<void> { // 無回傳值的 Promise
    // 取得 Redis 客戶端
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    // 解構設定選項，設定預設值
    const { ttl = SessionService.DEFAULT_TTL, userAgent, ipAddress } = options; // 解構選項並設定預設值

    // 建立會話資料物件
    const sessionData: UserSessionData = { // 建立符合 UserSessionData 介面的會話資料物件
      userId, // 使用者 ID
      username, // 使用者名稱
      loginTime: Date.now(), // 登入時間（當前 Unix 時間戳）
      lastActiveTime: Date.now(), // 最後活動時間（當前 Unix 時間戳）
      userAgent, // 使用者代理字串（可選）
      ipAddress, // IP 位址（可選）
    };

    // 生成 Redis 鍵值
    const sessionKey = SessionService.getSessionKey(token); // 生成會話資料的 Redis 鍵值
    const userSessionsKey = SessionService.getUserSessionsKey(userId); // 生成使用者會話集合的 Redis 鍵值

    try { // 嘗試執行 Redis 操作
      // 使用管道批量執行操作，提高效能
      const pipeline = redis.multi(); // 建立 Redis 交易管道，用於批量執行操作
      
      // 設置會話資料，包含 TTL
      pipeline.setEx(sessionKey, ttl, JSON.stringify(sessionData)); // 設定會話資料到 Redis，帶有過期時間
      
      // 將 token 加入使用者會話集合
      pipeline.sAdd(userSessionsKey, token); // 將 JWT Token 加入使用者會話集合（Set 類型）
      
      // 設置使用者會話集合的過期時間（比會話稍長，確保清理）
      pipeline.expire(userSessionsKey, ttl + 300); // 設定使用者會話集合的過期時間，比單一會話多 5 分鐘
      
      // 執行所有 Redis 操作
      await pipeline.exec(); // 執行管道中的所有操作，確保原子性
      logger.debug(`Session created for user ${userId} with TTL ${ttl} seconds`); // 記錄會話建立成功的除錯日誌
    } catch (error) { // 捕獲 Redis 操作錯誤
      // 拋出具體的錯誤訊息
      logger.error('Failed to set user session:', error); // 記錄設定會話失敗的錯誤日誌
      throw new Error(`Failed to set user session: ${error}`); // 拋出包含原始錯誤訊息的新錯誤
    }
  }

  /**
   * 取得使用者會話資料
   * @param token JWT Token
   * @returns 會話資料或 null
   */
  public static async getUserSession(token: string): Promise<UserSessionData | null> { // 静態公開異步方法：取得使用者會話資料
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const sessionKey = SessionService.getSessionKey(token); // 生成會話資料的 Redis 鍵值

    try { // 嘗試執行會話取得操作
      const sessionDataStr = await redis.get(sessionKey); // 從 Redis 取得會話資料的 JSON 字串
      
      if (!sessionDataStr) { // 如果會話資料不存在（可能已過期或被刪除）
        return null; // 回傳 null 表示會話不存在
      }

      const sessionData: UserSessionData = JSON.parse(sessionDataStr); // 解析 JSON 字串為會話資料物件
      
      // 更新最後活動時間
      sessionData.lastActiveTime = Date.now(); // 更新最後活動時間為當前時間
      await redis.set(sessionKey, JSON.stringify(sessionData), { KEEPTTL: true }); // 更新 Redis 中的會話資料，保持原有 TTL
      
      logger.debug(`Session retrieved and updated for token`); // 記錄會話取得和更新成功的除錯日誌
      return sessionData; // 回傳更新後的會話資料
    } catch (error) { // 捕獲任何錯誤
      logger.error('Failed to get user session:', error); // 記錄取得會話失敗的錯誤日誌
      return null; // 出現錯誤時回傳 null
    }
  }

  /**
   * 刪除使用者會話
   * @param token JWT Token
   * @param userId 使用者 ID（可選，用於同時清理使用者會話集合）
   */
  public static async deleteUserSession(token: string, userId?: number): Promise<void> { // 静態公開異步方法：刪除使用者會話
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const sessionKey = SessionService.getSessionKey(token); // 生成會話資料的 Redis 鍵值

    try { // 嘗試執行會話刪除操作
      if (userId) { // 如果提供了使用者 ID，同時清理使用者會話集合
        const userSessionsKey = SessionService.getUserSessionsKey(userId); // 生成使用者會話集合的 Redis 鍵值
        const pipeline = redis.multi(); // 建立 Redis 交易管道，用於批量執行操作
        
        pipeline.del(sessionKey); // 在管道中加入刪除會話資料的操作
        pipeline.sRem(userSessionsKey, token); // 在管道中加入從使用者會話集合中移除 Token 的操作
        
        await pipeline.exec(); // 執行管道中的所有操作，確保原子性
        logger.debug(`Session deleted for user ${userId}`); // 記錄特定使用者會話刪除成功的除錯日誌
      } else { // 如果沒有提供使用者 ID，只刪除會話資料
        await redis.del(sessionKey); // 直接刪除會話資料
        logger.debug('Session deleted'); // 記錄會話刪除成功的除錯日誌
      }
    } catch (error) { // 捕獲刪除過程中的錯誤
      logger.error('Failed to delete user session:', error); // 記錄刪除會話失敗的錯誤日誌
      throw new Error(`Failed to delete user session: ${error}`); // 拋出包含原始錯誤訊息的新錯誤
    }
  }

  /**
   * 延長會話有效期
   * @param token JWT Token
   * @param ttl 延長的時間（秒）
   */
  public static async extendSession(token: string, ttl: number = SessionService.DEFAULT_TTL): Promise<boolean> { // 静態公開異步方法：延長會話有效期
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const sessionKey = SessionService.getSessionKey(token); // 生成會話資料的 Redis 鍵值

    try { // 嘗試執行會話延長操作
      const result = await redis.expire(sessionKey, ttl); // 設定會話新的過期時間，回傳 1 表示成功，0 表示失敗
      if (result === 1) { // 如果延長成功
        logger.debug(`Session extended with TTL ${ttl} seconds`); // 記錄會話延長成功的除錯日誌
      } else { // 如果延長失敗（可能會話不存在）
        logger.warn('Failed to extend session - session may not exist'); // 記錄延長失敗的警告日誌
      }
      return result === 1; // 回傳延長操作是否成功的布林值
    } catch (error) { // 捕獲延長過程中的錯誤
      logger.error('Failed to extend session:', error); // 記錄延長會話失敗的錯誤日誌
      return false; // 出現錯誤時回傳 false
    }
  }

  /**
   * 清理使用者所有會話（登出所有裝置）
   * @param userId 使用者 ID
   */
  public static async clearAllUserSessions(userId: number): Promise<void> { // 静態公開異步方法：清理使用者所有會話（登出所有裝置）
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const userSessionsKey = SessionService.getUserSessionsKey(userId); // 生成使用者會話集合的 Redis 鍵值

    try { // 嘗試執行清理所有會話的操作
      // 取得使用者所有會話 token
      const tokens = await redis.sMembers(userSessionsKey); // 從 Redis Set 中取得使用者所有的 JWT Token
      
      if (tokens.length === 0) { // 如果使用者沒有任何活躍會話
        return; // 直接結束，不需要執行任何清理操作
      }

      // 批量刪除會話
      const pipeline = redis.multi(); // 建立 Redis 交易管道，用於批量執行操作
      
      tokens.forEach(token => { // 遍歷所有的 Token
        const sessionKey = SessionService.getSessionKey(token); // 為每個 Token 生成會話鍵值
        pipeline.del(sessionKey); // 在管道中加入刪除會話資料的操作
      });
      
      // 刪除使用者會話集合
      pipeline.del(userSessionsKey); // 在管道中加入刪除使用者會話集合的操作
      
      await pipeline.exec(); // 執行管道中的所有操作，確保原子性
      logger.info(`Cleared ${tokens.length} sessions for user ${userId}`); // 記錄清理成功的資訊日誌，包含清理的會話數量
    } catch (error) { // 捕獲清理過程中的錯誤
      logger.error('Failed to clear all user sessions:', error); // 記錄清理所有會話失敗的錯誤日誌
      throw new Error(`Failed to clear all user sessions: ${error}`); // 拋出包含原始錯誤訊息的新錯誤
    }
  }

  /**
   * 取得使用者活躍會話數量
   * @param userId 使用者 ID
   */
  public static async getUserActiveSessionCount(userId: number): Promise<number> { // 静態公開異步方法：取得使用者活躍會話數量
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const userSessionsKey = SessionService.getUserSessionsKey(userId); // 生成使用者會話集合的 Redis 鍵值

    try { // 嘗試執行取得會話數量的操作
      const count = await redis.sCard(userSessionsKey); // 取得 Redis Set 中的元素數量（即活躍會話數量）
      logger.debug(`User ${userId} has ${count} active sessions`); // 記錄使用者活躍會話數量的除錯日誌
      return count; // 回傳活躍會話數量
    } catch (error) { // 捕獲取得過程中的錯誤
      logger.error('Failed to get user active session count:', error); // 記錄取得活躍會話數量失敗的錯誤日誌
      return 0; // 出現錯誤時回傳 0
    }
  }

  /**
   * 檢查會話是否存在
   * @param token JWT Token
   */
  public static async sessionExists(token: string): Promise<boolean> { // 静態公開異步方法：檢查會話是否存在
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const sessionKey = SessionService.getSessionKey(token); // 生成會話資料的 Redis 鍵值

    try { // 嘗試執行會話存在性檢查
      const exists = await redis.exists(sessionKey); // 檢查 Redis 中是否存在指定的鍵值，回傳 1 表示存在，0 表示不存在
      logger.debug(`Session existence check: ${exists === 1 ? 'exists' : 'not found'}`); // 記錄會話存在性檢查結果的除錯日誌
      return exists === 1; // 回傳會話是否存在的布林值
    } catch (error) { // 捕獲檢查過程中的錯誤
      logger.error('Failed to check session existence:', error); // 記錄檢查會話存在性失敗的錯誤日誌
      return false; // 出現錯誤時預設回傳 false
    }
  }

  /**
   * 取得會話剩餘時間（秒）
   * @param token JWT Token
   */
  public static async getSessionTTL(token: string): Promise<number> { // 静態公開異步方法：取得會話剩餘時間（秒）
    const redis = SessionService.getRedisClient(); // 調用静態私有方法取得 Redis 客戶端實例
    const sessionKey = SessionService.getSessionKey(token); // 生成會話資料的 Redis 鍵值

    try { // 嘗試執行取得 TTL 的操作
      const ttl = await redis.ttl(sessionKey); // 取得指定鍵值的剩餘存活時間（秒），-1 表示沒有過期時間，-2 表示鍵不存在
      logger.debug(`Session TTL: ${ttl} seconds`); // 記錄會話 TTL 的除錯日誌
      return ttl; // 回傳會話剩餘時間（秒）
    } catch (error) { // 捕獲取得 TTL 過程中的錯誤
      logger.error('Failed to get session TTL:', error); // 記錄取得會話 TTL 失敗的錯誤日誌
      return -1; // 出現錯誤時回傳 -1
    }
  }
}
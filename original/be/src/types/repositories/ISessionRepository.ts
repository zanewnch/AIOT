/**
 * @fileoverview 會話資料存取層介面定義
 * 
 * 定義會話相關資料操作的標準介面，為會話資料存取層提供契約。
 * 此介面確保所有會話相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { Transaction } from 'sequelize';

/**
 * 會話資料結構（持久化版本）
 */
export interface SessionData {
  token: string;
  userId: number;
  username: string;
  loginTime: Date;
  lastActiveTime: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 會話建立屬性
 */
export interface SessionCreationData {
  token: string;
  userId: number;
  username: string;
  loginTime?: Date;
  lastActiveTime?: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isActive?: boolean;
}

/**
 * 會話資料存取層介面
 * 定義會話相關資料操作的標準介面
 */
export interface ISessionRepository {
  /**
   * 根據 Token 查詢會話
   * @param token JWT Token
   * @returns 會話資料或 null
   */
  findByToken(token: string): Promise<SessionData | null>;

  /**
   * 根據使用者 ID 查詢所有會話
   * @param userId 使用者 ID
   * @param activeOnly 是否只查詢活躍會話
   * @returns 會話列表
   */
  findByUserId(userId: number, activeOnly?: boolean): Promise<SessionData[]>;

  /**
   * 建立會話記錄
   * @param sessionData 會話資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的會話記錄
   */
  create(sessionData: SessionCreationData, transaction?: Transaction): Promise<SessionData>;

  /**
   * 更新會話資料
   * @param token JWT Token
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的會話記錄或 null
   */
  update(
    token: string,
    updateData: Partial<SessionCreationData>,
    transaction?: Transaction
  ): Promise<SessionData | null>;

  /**
   * 刪除會話記錄
   * @param token JWT Token
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete(token: string, transaction?: Transaction): Promise<boolean>;

  /**
   * 刪除使用者的所有會話
   * @param userId 使用者 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的會話數量
   */
  deleteByUserId(userId: number, transaction?: Transaction): Promise<number>;

  /**
   * 更新會話活躍時間
   * @param token JWT Token
   * @param transaction 資料庫交易（可選）
   * @returns 是否更新成功
   */
  updateLastActiveTime(token: string, transaction?: Transaction): Promise<boolean>;

  /**
   * 延長會話有效期
   * @param token JWT Token
   * @param expiresAt 新的過期時間
   * @param transaction 資料庫交易（可選）
   * @returns 是否更新成功
   */
  extendExpiry(token: string, expiresAt: Date, transaction?: Transaction): Promise<boolean>;

  /**
   * 標記會話為非活躍
   * @param token JWT Token
   * @param transaction 資料庫交易（可選）
   * @returns 是否更新成功
   */
  deactivateSession(token: string, transaction?: Transaction): Promise<boolean>;

  /**
   * 清理過期的會話記錄
   * @param transaction 資料庫交易（可選）
   * @returns 清理的記錄數量
   */
  cleanupExpiredSessions(transaction?: Transaction): Promise<number>;

  /**
   * 檢查會話是否存在且有效
   * @param token JWT Token
   * @returns 會話是否有效
   */
  isSessionValid(token: string): Promise<boolean>;

  /**
   * 計算會話記錄總數
   * @param activeOnly 是否只計算活躍會話
   * @returns 記錄總數
   */
  count(activeOnly?: boolean): Promise<number>;

  /**
   * 計算使用者的活躍會話數量
   * @param userId 使用者 ID
   * @returns 活躍會話數量
   */
  countActiveSessionsByUserId(userId: number): Promise<number>;

  /**
   * 查詢即將過期的會話
   * @param withinMinutes 在指定分鐘內過期
   * @returns 即將過期的會話列表
   */
  findExpiringSessions(withinMinutes: number): Promise<SessionData[]>;
}
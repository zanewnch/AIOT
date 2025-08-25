/**
 * @fileoverview 會話相關類型定義
 * 
 * 定義用戶會話管理相關的類型介面
 * 包括會話資料、快取選項等
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

/**
 * 會話資料介面
 * 
 * 定義用戶會話的基本資料結構
 * 
 * @interface SessionData
 * @example
 * ```typescript
 * const session: SessionData = {
 *   userId: 1,
 *   username: 'admin',
 *   createdAt: new Date(),
 *   lastAccessedAt: new Date()
 * };
 * ```
 */
export interface SessionData {
    /** 用戶 ID */
    userId: number;
    
    /** 用戶名稱 */
    username: string;
    
    /** 會話創建時間 */
    createdAt: Date;
    
    /** 最後訪問時間 */
    lastAccessedAt: Date;
}

/**
 * 會話查詢服務介面
 * 
 * 定義會話查詢相關操作的標準介面
 * 
 * @interface ISessionQueriesService
 * @example
 * ```typescript
 * class SessionQueriesService implements ISessionQueriesService {
 *   async getSessionData(sessionId: string): Promise<SessionData | null> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface ISessionQueriesService {
    /**
     * 根據會話 ID 獲取會話資料
     * 
     * @param sessionId - 會話 ID
     * @returns Promise<SessionData | null> 會話資料或 null（如果不存在）
     * @throws {Error} 當會話 ID 無效或查詢失敗時
     */
    getSessionData(sessionId: string): Promise<SessionData | null>;
    
    /**
     * 檢查會話是否存在且有效
     * 
     * @param sessionId - 會話 ID
     * @returns Promise<boolean> 會話是否有效
     * @throws {Error} 當查詢失敗時
     */
    isSessionValid(sessionId: string): Promise<boolean>;
    
    /**
     * 更新會話的最後訪問時間
     * 
     * @param sessionId - 會話 ID
     * @returns Promise<boolean> 是否更新成功
     * @throws {Error} 當更新失敗時
     */
    updateLastAccessed(sessionId: string): Promise<boolean>;
}
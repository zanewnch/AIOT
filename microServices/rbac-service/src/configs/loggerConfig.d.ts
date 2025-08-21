/**
 * @fileoverview Winston 日誌配置 - RBAC 服務
 *
 * 提供 RBAC 服務的日誌記錄功能，支援多種輸出格式和日誌級別。
 * 包含檔案輪轉、彩色輸出和錯誤追蹤等功能。
 *
 * 環境配置策略：
 * - 開發環境 (NODE_ENV !== 'production'): 輸出到控制台 + 日誌檔案，級別 debug
 * - 生產環境 (NODE_ENV === 'production'): 僅輸出到日誌檔案，級別 info
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */
import winston from 'winston';
/**
 * 建立 Winston Logger 實例
 */
declare const logger: winston.Logger;
/**
 * 創建子記錄器的工廠函數
 *
 * @param service - 服務名稱
 * @returns 具有特定服務標籤的子記錄器
 */
export declare function createLogger(service: string): winston.Logger;
/**
 * 記錄 HTTP 請求的輔助函數
 *
 * @param req - Express 請求物件
 * @param message - 日誌訊息
 * @param level - 日誌級別
 */
export declare function logRequest(req: any, message: string, level?: string): void;
/**
 * 記錄權限檢查的輔助函數
 *
 * @param userId - 使用者 ID
 * @param permission - 權限名稱
 * @param result - 檢查結果
 * @param details - 額外詳情
 */
export declare function logPermissionCheck(userId: number, permission: string, result: boolean, details?: any): void;
/**
 * 記錄認證事件的輔助函數
 *
 * @param event - 認證事件類型
 * @param username - 使用者名稱
 * @param success - 是否成功
 * @param details - 額外詳情
 */
export declare function logAuthEvent(event: 'login' | 'logout' | 'token_refresh', username: string, success: boolean, details?: any): void;
/**
 * 匯出預設 logger 實例
 */
export default logger;
//# sourceMappingURL=loggerConfig.d.ts.map
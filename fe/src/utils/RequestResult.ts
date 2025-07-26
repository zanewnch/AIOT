/**
 * @fileoverview 請求結果處理類別
 *
 * 為所有前端 API 請求提供統一的響應處理結構，確保響應處理的一致性。
 * 與後端的 ControllerResult 對應，提供類型安全的響應處理。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-07-26
 */

/**
 * API 響應的標準格式介面
 * 對應後端 ControllerResult 的結構
 */
export interface ApiResponseFormat<T = any> {
  /** HTTP 狀態碼 */
  status: number;
  /** 響應訊息 */
  message: string;
  /** 響應資料（可選） */
  data?: T;
}

/**
 * 請求結果處理類別
 *
 * @class RequestResult
 * @description 為所有前端 API 請求提供統一的響應處理結構
 * 包含 HTTP 狀態碼、訊息和資料，用於標準化 API 響應處理
 *
 * @template T - 資料的類型，預設為 any
 *
 * @example
 * ```typescript
 * // 處理成功響應
 * const result = new RequestResult<User[]>(response.status, response.message, response.data);
 * if (result.isSuccess()) {
 *   console.log('用戶列表:', result.data);
 * }
 *
 * // 處理錯誤響應
 * if (result.isError()) {
 *   console.error('API 錯誤:', result.message);
 * }
 * ```
 */
export class RequestResult<T = any> {
  /** HTTP 狀態碼 */
  public readonly status: number;
  /** 響應訊息 */

  public readonly message: string;
  /** 響應資料 */
  public readonly data?: T;
  /** 原始錯誤物件（如果有的話） */
  public readonly error?: Error;

  /**
   * 建構函式
   *
   * @param status HTTP 狀態碼
   * @param message 響應訊息
   * @param data 響應資料（可選）
   * @param error 原始錯誤物件（可選，用於除錯）
   */
  constructor(status: number, message: string, data?: T) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
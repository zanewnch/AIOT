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
  constructor(status: number, message: string, data?: T, error?: Error) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  /**
   * 從 API 響應創建 RequestResult
   * 嚴格驗證響應格式必須符合標準 API 格式：{status, message, data}
   */
  static fromResponse<T = any>(response: ApiResponseFormat<T>): RequestResult<T> {
    // 嚴格檢查是否為標準 API 響應格式
    if (!response || typeof response !== 'object') {
      throw new Error('API 響應格式錯誤：響應不是有效的物件');
    }
    
    if (typeof response.status !== 'number') {
      throw new Error('API 響應格式錯誤：缺少有效的 status 欄位');
    }
    
    if (typeof response.message !== 'string') {
      throw new Error('API 響應格式錯誤：缺少有效的 message 欄位');
    }
    
    // 標準格式：{status, message, data}
    return new RequestResult(response.status, response.message, response.data);
  }

  /**
   * 從 axios 錯誤創建 RequestResult
   */
  static fromAxiosError(error: any): RequestResult {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || '請求失敗';
    
    let responseData = error.response?.data?.data;
    
    return new RequestResult(status, message, responseData, error);
  }

  /**
   * 從一般錯誤創建 RequestResult
   */
  static fromError(error: Error, defaultMessage: string = '發生未知錯誤'): RequestResult {
    return new RequestResult(500, error.message || defaultMessage, undefined, error);
  }

  /**
   * 檢查是否為成功結果
   */
  isSuccess(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  /**
   * 檢查是否為錯誤結果
   */
  isError(): boolean {
    return this.status >= 400;
  }

  /**
   * 獲取資料，如果沒有資料則拋出錯誤
   */
  unwrap(): T {
    if (this.isError()) {
      throw new Error(`請求失敗 (${this.status}): ${this.message}`);
    }
    if (this.data === undefined && this.status !== 304) {
      throw new Error('請求響應沒有資料');
    }
    return this.data as T;
  }

  /**
   * 獲取資料，如果沒有資料則返回預設值
   */
  unwrapOr(defaultValue: T): T {
    if (this.isError() || this.data === undefined) {
      return defaultValue;
    }
    return this.data;
  }
}
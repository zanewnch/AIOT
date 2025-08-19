/**
 * @fileoverview 請求結果處理類別
 *
 * 為所有前端 API 請求提供統一的響應處理結構，確保響應處理的一致性。
 * 與後端的 ResResult 對應，提供類型安全的響應處理。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-07-26
 */

/**
 * API 響應的標準格式介面
 * 對應後端 ResResult 的結構
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
 * @class ReqResult
 * @description 為所有前端 API 請求提供統一的響應處理結構
 * 包含 HTTP 狀態碼、訊息和資料，用於標準化 API 響應處理
 *
 * @template T - 資料的類型，預設為 any
 *
 * @example
 * ```typescript
 * // 處理成功響應
 * const result = new ReqResult<User[]>(response.status, response.message, response.data);
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
export class ReqResult<T = any> {
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
     * 從 API 響應創建 ReqResult
     * 嚴格驗證響應格式必須符合標準 API 格式：{status, message, data}
     * 
     * @template T - 資料的類型
     * @param {ApiResponseFormat<T>} response - 符合標準格式的 API 響應物件
     * @returns {ReqResult<T>} 包含響應資料的 ReqResult 實例
     * 
     * @throws {Error} 當響應格式不符合標準時拋出錯誤
     * 
     * @example
     * ```typescript
     * const apiResponse = { status: 200, message: '成功', data: users };
     * const result = ReqResult.fromResponse<User[]>(apiResponse);
     * if (result.isSuccess()) {
     *   console.log('用戶列表:', result.data);
     * }
     * ```
     */
    static fromResponse<T = any>(response: ApiResponseFormat<T>): ReqResult<T> {
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
        return new ReqResult(response.status, response.message, response.data);
    }

    /**
     * 從 axios 錯誤創建 ReqResult
     * 自動提取 HTTP 狀態碼、錯誤訊息和回應資料
     * 
     * @param {any} error - axios 錯誤物件
     * @returns {ReqResult} 包含錯誤資訊的 ReqResult 實例
     * 
     * @example
     * ```typescript
     * try {
     *   await axios.get('/api/users');
     * } catch (axiosError) {
     *   const result = ReqResult.fromAxiosError(axiosError);
     *   console.error('請求失敗:', result.message);
     *   console.log('狀態碼:', result.status);
     * }
     * ```
     */
    static fromAxiosError(error: any): ReqResult {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || '請求失敗';

        let responseData = error.response?.data?.data;

        return new ReqResult(status, message, responseData, error);
    }

    /**
     * 從一般錯誤創建 ReqResult
     * 用於處理非 axios 錯誤的情況
     * 
     * @param {Error} error - 一般錯誤物件
     * @param {string} [defaultMessage='發生未知錯誤'] - 預設錯誤訊息
     * @returns {ReqResult} 包含錯誤資訊的 ReqResult 實例
     * 
     * @example
     * ```typescript
     * try {
     *   const result = someComplexOperation();
     * } catch (error) {
     *   const reqResult = ReqResult.fromError(error, '操作執行失敗');
     *   console.error('錯誤:', reqResult.message);
     * }
     * ```
     */
    static fromError(error: Error, defaultMessage: string = '發生未知錯誤'): ReqResult {
        return new ReqResult(500, error.message || defaultMessage, undefined, error);
    }

    /**
     * 檢查是否為成功結果
     * HTTP 狀態碼在 200-299 範圍內視為成功
     * 
     * @returns {boolean} 如果請求成功則返回 true，否則返回 false
     * 
     * @example
     * ```typescript
     * const result = await apiCall();
     * if (result.isSuccess()) {
     *   // 處理成功情況
     *   processData(result.data);
     * }
     * ```
     */
    isSuccess(): boolean {
        return this.status >= 200 && this.status < 300;
    }

    /**
     * 檢查是否為錯誤結果
     * HTTP 狀態碼在 400 以上視為錯誤
     * 
     * @returns {boolean} 如果請求失敗則返回 true，否則返回 false
     * 
     * @example
     * ```typescript
     * const result = await apiCall();
     * if (result.isError()) {
     *   // 處理錯誤情況
     *   showErrorMessage(result.message);
     * }
     * ```
     */
    isError(): boolean {
        return this.status >= 400;
    }

    /**
     * 獲取資料，如果沒有資料則拋出錯誤
     * 類似 Rust 的 unwrap() 方法，用於取得成功結果的資料
     * 
     * @returns {T} 響應資料
     * 
     * @throws {Error} 當請求失敗或沒有資料時拋出錯誤
     * 
     * @example
     * ```typescript
     * try {
     *   const users = result.unwrap(); // 取得 User[] 資料
     *   console.log('用戶數量:', users.length);
     * } catch (error) {
     *   console.error('無法取得資料:', error.message);
     * }
     * ```
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
     * 提供安全的資料存取方式，不會拋出錯誤
     * 
     * @param {T} defaultValue - 當請求失敗或無資料時的預設值
     * @returns {T} 響應資料或預設值
     * 
     * @example
     * ```typescript
     * const users = result.unwrapOr([]); // 失敗時返回空陣列
     * const userName = result.unwrapOr({ name: '訪客' }).name;
     * console.log('用戶數量:', users.length); // 安全存取
     * ```
     */
    unwrapOr(defaultValue: T): T {
        if (this.isError() || this.data === undefined) {
            return defaultValue;
        }
        return this.data;
    }
}


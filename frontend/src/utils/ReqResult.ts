/**
 * @fileoverview 請求結果處理類別 - 前端專用
 */

import type { PaginationInfo } from '../types/PaginationTypes';
import type { ApiResponseFormat } from '../types/ApiResponseTypes';

/**
 * 請求結果處理類別
 */
export class ReqResult<T = any> {
    /** HTTP 狀態碼 */
    public readonly status: number;
    /** 響應訊息 */
    public readonly message: string;
    /** 響應資料 */
    public readonly data?: T;
    /** 分頁資訊（可選，用於分頁查詢） */
    public readonly pagination?: PaginationInfo;

    constructor(status: number, message: string, data?: T, pagination?: PaginationInfo) {
        this.status = status;
        this.message = message;
        this.data = data;
        this.pagination = pagination;
    }

    static fromResponse<T = any>(response: ApiResponseFormat<T>): ReqResult<T> {
        if (!response || typeof response !== 'object') {
            throw new Error('API 響應格式錯誤：響應不是有效的物件');
        }

        if (typeof response.status !== 'number') {
            throw new Error('API 響應格式錯誤：缺少有效的 status 欄位');
        }

        if (typeof response.message !== 'string') {
            throw new Error('API 響應格式錯誤：缺少有效的 message 欄位');
        }

        return new ReqResult(response.status, response.message, response.data, response.pagination);
    }

    static fromAxiosError(error: any): ReqResult {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || '請求失敗';
        let responseData = error.response?.data?.data;
        return new ReqResult(status, message, responseData, undefined);
    }

    static fromError(error: Error, defaultMessage: string = '發生未知錯誤'): ReqResult {
        return new ReqResult(500, error.message || defaultMessage, undefined, undefined);
    }

    static success<T = any>(message: string, data?: T, pagination?: PaginationInfo): ReqResult<T> {
        return new ReqResult(200, message, data, pagination);
    }

    static badRequest<T = any>(message: string, data?: T, pagination?: PaginationInfo): ReqResult<T> {
        return new ReqResult(400, message, data, pagination);
    }

    static unauthorized<T = any>(message: string = 'Unauthorized', data?: T, pagination?: PaginationInfo): ReqResult<T> {
        return new ReqResult(401, message, data, pagination);
    }

    static forbidden<T = any>(message: string = 'Forbidden', data?: T, pagination?: PaginationInfo): ReqResult<T> {
        return new ReqResult(403, message, data, pagination);
    }

    static notFound<T = any>(message: string = 'Not Found', data?: T, pagination?: PaginationInfo): ReqResult<T> {
        return new ReqResult(404, message, data, pagination);
    }

    static internalError<T = any>(message: string = 'Internal Server Error', data?: T, pagination?: PaginationInfo): ReqResult<T> {
        return new ReqResult(500, message, data, pagination);
    }

    isSuccess(): boolean {
        return this.status >= 200 && this.status < 300;
    }

    isError(): boolean {
        return this.status >= 400;
    }

    unwrap(): T {
        if (this.isError()) {
            throw new Error(`請求失敗 (${this.status}): ${this.message}`);
        }
        if (this.data === undefined && this.status !== 304) {
            throw new Error('請求響應沒有資料');
        }
        return this.data as T;
    }

    unwrapOr(defaultValue: T): T {
        if (this.isError() || this.data === undefined) {
            return defaultValue;
        }
        return this.data;
    }

    isPaginated(): boolean {
        return this.pagination !== undefined;
    }
}
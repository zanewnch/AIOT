/**
 * @fileoverview API 響應類型定義
 */

import type { PaginationInfo } from './PaginationTypes';

/**
 * API 響應的標準格式類型
 * 對應後端 ResResult 的結構，支援分頁功能
 */
export type ApiResponseFormat<T = any> = {
    /** HTTP 狀態碼 */
    status: number;
    /** 響應訊息 */
    message: string;
    /** 響應資料（可選） */
    data?: T;
    /** 分頁資訊（可選，用於分頁查詢） */
    pagination?: PaginationInfo;
};
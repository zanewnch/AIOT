/**
 * API 回應類型定義
 * 
 * 定義統一的 API 回應格式，確保所有 API 端點都使用一致的回應結構。
 * 提供泛型支援以適應不同的資料類型需求。
 * 
 * @module Types
 */

export type ApiResponseType<T = any> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
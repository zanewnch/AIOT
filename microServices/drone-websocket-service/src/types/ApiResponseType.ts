/**
 * @fileoverview API 回應類型定義
 * 
 * 統一定義所有 API 回應的標準格式和類型
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

/**
 * 標準 API 回應格式
 * 
 * @template T 資料類型
 */
export interface ApiResponse<T = any> {
    /** HTTP 狀態碼 */
    status: number;
    
    /** 操作成功狀態 */
    success: boolean;
    
    /** 回應訊息 */
    message: string;
    
    /** 回應資料（成功時） */
    data?: T;
    
    /** 錯誤訊息（失敗時） */
    error?: string;
    
    /** 時間戳記 */
    timestamp: string;
    
    /** 分頁資訊（分頁回應時） */
    pagination?: {
        currentPage: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    
    /** 請求追蹤 ID */
    traceId?: string;
    
    /** 額外的元數據 */
    metadata?: Record<string, any>;
}

/**
 * 成功回應格式
 * 
 * @template T 資料類型
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
    success: true;
    data: T;
}

/**
 * 錯誤回應格式
 */
export interface ErrorResponse extends ApiResponse<never> {
    success: false;
    error: string;
    errorCode?: string;
    details?: Record<string, any>;
}

/**
 * 分頁回應格式
 * 
 * @template T 資料項目類型
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
    data: T[];
    pagination: {
        currentPage: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    statistics?: {
        totalCount: number;
        [key: string]: any;
    };
}

/**
 * 批量操作回應格式
 */
export interface BatchOperationResponse extends ApiResponse {
    results: {
        successCount: number;
        failureCount: number;
        totalCount: number;
        failures?: Array<{
            id: string;
            error: string;
        }>;
    };
}

/**
 * 健康檢查回應格式
 */
export interface HealthCheckResponse extends ApiResponse {
    data: {
        status: 'healthy' | 'unhealthy' | 'degraded';
        version: string;
        uptime: number;
        dependencies: Record<string, {
            status: 'healthy' | 'unhealthy';
            responseTime?: number;
            error?: string;
        }>;
        metrics?: Record<string, any>;
    };
}

/**
 * 統計資訊回應格式
 */
export interface StatisticsResponse extends ApiResponse {
    data: {
        totalCount: number;
        activeCount?: number;
        inactiveCount?: number;
        distribution?: Record<string, number>;
        trends?: Record<string, any>;
        [key: string]: any;
    };
}

/**
 * 驗證錯誤回應格式
 */
export interface ValidationErrorResponse extends ErrorResponse {
    errorCode: 'VALIDATION_ERROR';
    details: {
        field: string;
        message: string;
        value?: any;
    }[];
}

/**
 * 授權錯誤回應格式
 */
export interface AuthorizationErrorResponse extends ErrorResponse {
    errorCode: 'AUTHORIZATION_ERROR';
    details: {
        resource: string;
        action: string;
        reason: string;
    };
}

/**
 * 資源未找到錯誤回應格式
 */
export interface NotFoundErrorResponse extends ErrorResponse {
    errorCode: 'RESOURCE_NOT_FOUND';
    details: {
        resource: string;
        identifier: string;
    };
}

/**
 * 業務邏輯錯誤回應格式
 */
export interface BusinessLogicErrorResponse extends ErrorResponse {
    errorCode: 'BUSINESS_LOGIC_ERROR';
    details: {
        operation: string;
        reason: string;
        suggestions?: string[];
    };
}

/**
 * 系統錯誤回應格式
 */
export interface SystemErrorResponse extends ErrorResponse {
    errorCode: 'SYSTEM_ERROR';
    details: {
        component: string;
        operation: string;
        timestamp: string;
    };
}

/**
 * API 回應建構器輔助類型
 */
export type ApiResponseBuilder = {
    success: <T>(data: T, message?: string) => SuccessResponse<T>;
    error: (message: string, status?: number, errorCode?: string) => ErrorResponse;
    paginated: <T>(data: T[], pagination: any, statistics?: any) => PaginatedApiResponse<T>;
    batch: (results: any) => BatchOperationResponse;
    health: (data: any) => HealthCheckResponse;
    statistics: (data: any) => StatisticsResponse;
};
/**
 * @fileoverview Documentation 相關的型別定義
 * @description 定義文檔系統中使用的介面和型別
 * @author AIOT Development Team
 * @version 1.0.0
 */

/**
 * 微服務配置介面
 */
export interface ServiceConfig {
    /** 服務名稱 */
    name: string;
    /** 服務描述 */
    description: string;
    /** 服務基礎 URL */
    baseUrl: string;
    /** 服務功能列表 */
    features: string[];
    /** 服務圖標 (emoji) */
    icon: string;
    /** 服務主題顏色 */
    color: string;
}

/**
 * 服務文檔狀態
 */
export interface ServiceDocStatus {
    /** 服務名稱 */
    name: string;
    /** 服務狀態 */
    status: 'available' | 'unavailable' | 'unknown';
    /** docs 端點是否可用 */
    docsAvailable: boolean;
    /** typedoc 端點是否可用 */
    typedocAvailable: boolean;
    /** 錯誤訊息 (如果有) */
    error?: string;
}

/**
 * 擴展的服務配置 (包含狀態)
 */
export interface ServiceConfigWithStatus extends ServiceConfig {
    /** 服務狀態 */
    status: 'available' | 'unavailable' | 'unknown';
    /** docs 端點是否可用 */
    docsAvailable: boolean;
    /** typedoc 端點是否可用 */
    typedocAvailable: boolean;
    /** 文檔端點配置 */
    endpoints: {
        /** 服務說明端點 */
        serviceInfo: string;
        /** 技術文檔端點 */
        technicalDocs: string;
    };
}

/**
 * 文檔統計資訊
 */
export interface DocumentationStats {
    /** 總服務數量 */
    totalServices: number;
    /** 可用服務數量 */
    availableServices: number;
    /** 提供服務說明的服務數量 */
    servicesWithDocs: number;
    /** 提供技術文檔的服務數量 */
    servicesWithTypedoc: number;
}

/**
 * 文檔類型定義
 */
export interface DocumentationType {
    /** 文檔類型 */
    type: string;
    /** 描述 */
    description: string;
    /** 路徑 */
    path: string;
}

/**
 * 文檔使用說明
 */
export interface DocumentationUsage {
    /** 存取模式 */
    accessPattern: string;
    /** 範例列表 */
    examples: string[];
}

/**
 * 文檔首頁資料結構
 */
export interface DocumentationHomeData {
    /** 標題 */
    title: string;
    /** 描述 */
    description: string;
    /** 版本 */
    version: string;
    /** 架構名稱 */
    architecture: string;
    /** 服務列表 */
    services: ServiceConfigWithStatus[];
    /** 文檔類型 */
    documentationTypes: DocumentationType[];
    /** 使用說明 */
    usage: DocumentationUsage;
    /** Gateway 功能 */
    gatewayFeatures: string[];
    /** 統計資訊 */
    stats?: DocumentationStats;
    /** 時間戳 */
    timestamp: string;
    /** 最後檢查時間 */
    lastCheck?: string;
    /** 錯誤訊息 */
    error?: string;
}
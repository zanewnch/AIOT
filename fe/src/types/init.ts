/**
 * @fileoverview 初始化相關的類型定義
 * 
 * 包含所有系統初始化功能相關的類型定義，
 * 從原本的 InitService 中提取出來，供各個模組共用。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

/**
 * 初始化回應介面
 * 
 * @interface InitResponse
 * @description 定義初始化 API 回應的資料結構
 */
export interface InitResponse {
  /** 操作是否成功 */
  ok: boolean;
  /** 成功訊息 */
  message?: string;
  /** 錯誤訊息 */
  error?: string;
  /** 其他動態屬性 */
  [key: string]: any;
}

/**
 * 壓力測試回應介面
 * 
 * @interface StressTestResponse
 * @description 定義壓力測試 API 回應的資料結構
 */
export interface StressTestResponse {
  /** 操作是否成功 */
  ok: boolean;
  /** 任務 ID */
  taskId: string;
  /** 任務狀態 */
  status: string;
  /** 回應訊息 */
  message: string;
  /** 進度追蹤 URL */
  progressUrl: string;
}

/**
 * 初始化所有示例資料的回應介面
 * 
 * @interface InitAllDemoResponse
 * @description 定義初始化所有示例資料的回應結構
 */
export interface InitAllDemoResponse {
  /** RBAC 初始化結果 */
  rbac: InitResponse;
  /** RTK 初始化結果 */
  rtk: InitResponse;
}

/**
 * 初始化錯誤介面
 * 
 * @interface InitError
 * @description 定義初始化相關錯誤的資料結構
 */
export interface InitError {
  /** 錯誤訊息 */
  message: string;
  /** HTTP 狀態碼 (可選) */
  status?: number;
  /** 錯誤詳情 (可選) */
  details?: any;
}
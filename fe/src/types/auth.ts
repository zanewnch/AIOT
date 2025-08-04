/**
 * @fileoverview 認證相關的類型定義
 * 
 * 包含所有認證功能相關的類型定義，
 * 從原本的 AuthService 中提取出來，供各個模組共用。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

/**
 * 登入請求介面
 * 
 * @interface LoginRequest
 * @description 定義使用者登入時需要提供的憑證資訊
 */
export interface LoginRequest {
  /** 使用者名稱 */
  username: string;
  /** 使用者密碼 */
  password: string;
  /** 記住我選項 */
  rememberMe?: boolean;
}

/**
 * 登入回應介面
 * 
 * @interface LoginResponse
 * @description 定義後端登入成功後回傳的資料格式
 */
export interface LoginResponse {
  /** JWT 認證令牌 */
  token: string;
  /** 回應訊息 */
  message: string;
}

/**
 * 使用者介面
 * 
 * @interface User
 * @description 定義使用者的基本資訊結構
 */
export interface User {
  /** 使用者 ID */
  id: number;
  /** 使用者名稱 */
  username: string;
}

/**
 * 認證錯誤介面
 * 
 * @interface AuthError
 * @description 定義認證相關錯誤的資料結構
 */
export interface AuthError {
  /** 錯誤訊息 */
  message: string;
  /** HTTP 狀態碼 (可選) */
  status?: number;
}

/**
 * 認證狀態介面
 * 
 * @interface AuthState
 * @description 定義應用程式中的認證狀態
 */
export interface AuthState {
  /** 是否已認證 */
  isAuthenticated: boolean;
  /** 當前使用者資訊 */
  user: User | null;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: string | null;
}

/**
 * 登出回應介面
 * 
 * @interface LogoutResponse
 * @description 定義後端登出成功後回傳的資料格式
 */
export interface LogoutResponse {
  /** 回應訊息 */
  message: string;
  /** 操作是否成功 */
  success: boolean;
}

/**
 * 擴展的登入回應介面
 * 
 * @interface ExtendedLoginResponse
 * @description 定義後端登入成功後回傳的擴展資料格式
 */
export interface ExtendedLoginResponse {
  /** JWT 認證令牌 */
  token: string;
  /** 使用者資訊 */
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  /** 令牌過期時間（秒） */
  expiresIn: number;
}
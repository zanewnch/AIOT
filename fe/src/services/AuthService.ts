/**
 * @fileoverview 認證服務模組
 * 
 * 提供使用者認證相關的 API 調用功能，包括登入、登出和狀態檢查。
 * 處理 JWT token 的管理和 HTTP 請求的錯誤處理。
 * 支援 localStorage 的 token 存儲和 JWT 過期檢查。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
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
 * 認證服務類別
 * 
 * @class AuthService
 * @description 提供使用者認證相關的 API 調用功能，包括登入、登出和狀態檢查
 * @example
 * ```typescript
 * const authService = new AuthService();
 * const result = await authService.login({ username: 'admin', password: 'password' });
 * ```
 */
export class AuthService {
  /** API 基礎 URL，只讀屬性 */
  private readonly baseUrl: string;

  /**
   * 認證服務建構子
   * 
   * @constructor
   * @description 初始化認證服務，設定 API 基礎 URL
   */
  constructor() {
    // 從環境變數取得 API URL，如果沒有則使用預設值
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8010';
  }

  /**
   * 使用者登入
   * 
   * @method login
   * @param {LoginRequest} credentials - 使用者登入憑證
   * @returns {Promise<LoginResponse>} 包含 token 和訊息的回應
   * @throws {AuthError} 當登入失敗時拋出錯誤
   * @example
   * ```typescript
   * const result = await authService.login({ username: 'admin', password: 'password' });
   * console.log(result.token); // JWT token
   * ```
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // 向後端發送 POST 請求進行使用者認證
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST', // 使用 POST 方法
        headers: {
          'Content-Type': 'application/json', // 設定內容類型為 JSON
        },
        credentials: 'include', // 包含 cookies 以支援會話管理
        body: JSON.stringify(credentials), // 將憑證轉換為 JSON 字串
      });

      // 檢查 HTTP 回應狀態是否成功
      if (!response.ok) {
        const errorData = await response.json(); // 解析錯誤回應
        throw new Error(errorData.message || 'Login failed'); // 拋出錯誤
      }

      // 解析成功回應的 JSON 資料
      const data: LoginResponse = await response.json();
      
      // 將 JWT token 存儲在 localStorage 中供後續請求使用
      localStorage.setItem('authToken', data.token);
      
      return data; // 回傳登入結果
    } catch (error) {
      // 處理錯誤情況
      if (error instanceof Error) {
        // 如果是 Error 實例，使用其訊息並設定狀態碼為 401
        throw { message: error.message, status: 401 } as AuthError;
      }
      // 處理未預期的錯誤，設定狀態碼為 500
      throw { message: 'An unexpected error occurred', status: 500 } as AuthError;
    }
  }

  /**
   * 使用者登出
   * 
   * @method logout
   * @returns {Promise<void>} 無回傳值的 Promise
   * @description 執行使用者登出操作，清除本地存儲的認證資訊
   * @example
   * ```typescript
   * await authService.logout();
   * ```
   */
  async logout(): Promise<void> {
    try {
      // 向後端發送 POST 請求執行登出操作
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST', // 使用 POST 方法
        credentials: 'include', // 包含 cookies 以確保會話正確結束
      });
    } catch (error) {
      // 記錄登出過程中的錯誤，但不阻止本地清理
      console.error('Logout error:', error);
    } finally {
      // 無論 API 調用是否成功，都清除本地存儲的 token
      // 這確保即使後端請求失敗，使用者仍能在前端登出
      localStorage.removeItem('authToken');
    }
  }

  /**
   * 檢查使用者是否已登入
   * 
   * @method isAuthenticated
   * @returns {boolean} 是否已登入
   * @description 檢查本地存儲的 JWT token 是否存在且未過期
   * @example
   * ```typescript
   * if (authService.isAuthenticated()) {
   *   // 使用者已登入，可以存取受保護的資源
   * }
   * ```
   */
  isAuthenticated(): boolean {
    // 從 localStorage 取得存儲的 JWT token
    const token = localStorage.getItem('authToken');
    if (!token) return false; // 如果沒有 token，直接回傳 false

    try {
      // 解析 JWT token 的 payload 部分（Base64 解碼）
      const payload = JSON.parse(atob(token.split('.')[1]));
      // 取得目前時間戳（秒）
      const currentTime = Date.now() / 1000;
      // 比較 token 的過期時間與目前時間
      return payload.exp > currentTime;
    } catch (error) {
      // 如果 token 格式不正確或解析失敗，清除無效的 token
      localStorage.removeItem('authToken');
      return false; // 回傳未認證狀態
    }
  }

  /**
   * 獲取存儲的 token
   * 
   * @method getToken
   * @returns {string | null} JWT token 或 null
   * @description 從 localStorage 中獲取存儲的 JWT token
   * @example
   * ```typescript
   * const token = authService.getToken();
   * if (token) {
   *   // 使用 token 進行 API 請求
   * }
   * ```
   */
  getToken(): string | null {
    // 直接從 localStorage 取得 JWT token
    return localStorage.getItem('authToken');
  }

  /**
   * 從 token 中獲取使用者資訊
   * 
   * @method getCurrentUser
   * @returns {User | null} 使用者資訊或 null
   * @description 解析 JWT token 中的使用者資訊
   * @example
   * ```typescript
   * const user = authService.getCurrentUser();
   * if (user) {
   *   console.log(user.username); // 使用者名稱
   * }
   * ```
   */
  getCurrentUser(): User | null {
    // 取得存儲的 JWT token
    const token = this.getToken();
    if (!token) return null; // 如果沒有 token，回傳 null

    try {
      // 解析 JWT token 的 payload 部分
      const payload = JSON.parse(atob(token.split('.')[1]));
      // 從 payload 中提取使用者資訊並建立 User 物件
      return {
        id: payload.sub, // 使用者 ID（subject）
        username: payload.username || `user_${payload.sub}`, // 使用者名稱，如果沒有則使用預設格式
      };
    } catch (error) {
      // 如果 token 解析失敗，記錄錯誤並回傳 null
      console.error('Failed to parse token:', error);
      return null;
    }
  }
}

/**
 * 認證服務實例
 * 
 * @constant {AuthService} authService
 * @description 預設的認證服務實例，採用單例模式
 * @example
 * ```typescript
 * import { authService } from './AuthService';
 * 
 * // 使用預設實例進行登入
 * await authService.login({ username: 'admin', password: 'password' });
 * ```
 */
export const authService = new AuthService();
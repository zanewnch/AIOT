/**
 * @fileoverview HTTP 請求工具類別模組，提供統一的 API 請求處理
 * 
 * 此模組封裝了 axios 的功能，提供了：
 * - 統一的 HTTP 請求方法 (GET, POST, PUT, DELETE, PATCH)
 * - 自動的認證 token 管理
 * - 統一的錯誤處理機制
 * - 請求和響應攔截器
 * - 預設的 axios 實例配置
 * 
 * @author AIOT Team
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'; // 引入 axios 核心模組和相關類型定義

/**
 * HTTP 請求工具類別
 * 
 * 提供統一的 API 請求介面，包含自動認證處理、錯誤管理和響應攔截
 * 
 * @class RequestUtils
 * @example
 * ```typescript
 * const requestUtils = new RequestUtils('https://api.example.com');
 * const data = await requestUtils.get<User>('/users/123');
 * ```
 */
export class RequestUtils {
  /**
   * axios 實例，用於發送 HTTP 請求
   * @private
   * @type {AxiosInstance}
   */
  private apiClient: AxiosInstance;

  /**
   * 建構函式，初始化 axios 實例和攔截器
   * 
   * @param {string} baseURL - API 的基礎 URL，預設為 'http://localhost:8010/'
   * @param {number} timeout - 請求超時時間（毫秒），預設為 10000ms
   * 
   * @example
   * ```typescript
   * const requestUtils = new RequestUtils('https://api.example.com', 5000);
   * ```
   */
  constructor(baseURL: string = 'http://localhost:8010/', timeout: number = 10000) {
    // 建立 axios 實例並設定基本配置
    this.apiClient = axios.create({
      baseURL, // 設定 API 基礎 URL
      timeout, // 設定請求超時時間
      headers: {
        'Content-Type': 'application/json', // 設定預設的內容類型為 JSON
      },
    });

    // 設定請求和響應攔截器
    this.setupInterceptors();
  }

  /**
   * 設定請求和響應攔截器
   * 
   * 請求攔截器：自動添加認證 token
   * 響應攔截器：處理認證錯誤和數據提取
   * 
   * @private
   * @returns {void}
   */
  private setupInterceptors(): void {
    // 設定請求攔截器，用於在每個請求中自動添加認證 token
    this.apiClient.interceptors.request.use(
      (config) => {
        // 從 localStorage 中獲取認證 token
        const token = localStorage.getItem('authToken');
        if (token) {
          // 如果 token 存在，則將其添加到請求標頭中
          config.headers.Authorization = `Bearer ${token}`;
        }
        // 返回修改後的配置
        return config;
      },
      (error) => {
        // 請求錯誤時，直接拋出 Promise 拒絕
        return Promise.reject(error);
      }
    );

    // 設定響應攔截器，用於統一處理響應數據和錯誤
    this.apiClient.interceptors.response.use(
      (response) => {
        // 成功響應時，直接返回響應數據，過濾掉 axios 的包裝
        return response.data;
      },
      (error) => {
        // 檢查是否為 401 未授權錯誤
        if (error.response?.status === 401) {
          // 清除本地儲存的認證 token
          localStorage.removeItem('authToken');
          // 重定向到登入頁面
          window.location.href = '/login';
        }
        // 拋出 Promise 拒絕，讓調用者處理錯誤
        return Promise.reject(error);
      }
    );
  }

  /**
   * 發送 GET 請求
   * 
   * @template T - 響應數據的類型
   * @param {string} url - 請求的 URL 路徑
   * @param {AxiosRequestConfig} [config] - 可選的 axios 請求配置
   * @returns {Promise<T>} 返回 Promise，包含響應數據
   * 
   * @example
   * ```typescript
   * const users = await requestUtils.get<User[]>('/users');
   * const user = await requestUtils.get<User>('/users/123');
   * ```
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // 使用 axios 實例發送 GET 請求
    return this.apiClient.get(url, config);
  }

  /**
   * 發送 POST 請求
   * 
   * @template T - 響應數據的類型
   * @param {string} url - 請求的 URL 路徑
   * @param {any} [data] - 請求主體數據
   * @param {AxiosRequestConfig} [config] - 可選的 axios 請求配置
   * @returns {Promise<T>} 返回 Promise，包含響應數據
   * 
   * @example
   * ```typescript
   * const newUser = await requestUtils.post<User>('/users', { name: 'John', email: 'john@example.com' });
   * ```
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // 使用 axios 實例發送 POST 請求
    return this.apiClient.post(url, data, config);
  }

  /**
   * 發送 PUT 請求
   * 
   * @template T - 響應數據的類型
   * @param {string} url - 請求的 URL 路徑
   * @param {any} [data] - 請求主體數據
   * @param {AxiosRequestConfig} [config] - 可選的 axios 請求配置
   * @returns {Promise<T>} 返回 Promise，包含響應數據
   * 
   * @example
   * ```typescript
   * const updatedUser = await requestUtils.put<User>('/users/123', { name: 'Jane' });
   * ```
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // 使用 axios 實例發送 PUT 請求
    return this.apiClient.put(url, data, config);
  }

  /**
   * 發送 DELETE 請求
   * 
   * @template T - 響應數據的類型
   * @param {string} url - 請求的 URL 路徑
   * @param {AxiosRequestConfig} [config] - 可選的 axios 請求配置
   * @returns {Promise<T>} 返回 Promise，包含響應數據
   * 
   * @example
   * ```typescript
   * await requestUtils.delete('/users/123');
   * ```
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // 使用 axios 實例發送 DELETE 請求
    return this.apiClient.delete(url, config);
  }

  /**
   * 發送 PATCH 請求
   * 
   * @template T - 響應數據的類型
   * @param {string} url - 請求的 URL 路徑
   * @param {any} [data] - 請求主體數據
   * @param {AxiosRequestConfig} [config] - 可選的 axios 請求配置
   * @returns {Promise<T>} 返回 Promise，包含響應數據
   * 
   * @example
   * ```typescript
   * const updatedUser = await requestUtils.patch<User>('/users/123', { email: 'newemail@example.com' });
   * ```
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // 使用 axios 實例發送 PATCH 請求
    return this.apiClient.patch(url, data, config);
  }

  /**
   * 設置認證 token
   * 
   * 將認證 token 儲存到 localStorage 中，後續的請求會自動攜帶此 token
   * 
   * @param {string} token - 認證 token
   * @returns {void}
   * 
   * @example
   * ```typescript
   * requestUtils.setAuthToken('your-jwt-token');
   * ```
   */
  setAuthToken(token: string): void {
    // 將認證 token 儲存到瀏覽器的本地儲存中
    localStorage.setItem('authToken', token);
  }

  /**
   * 清除認證 token
   * 
   * 從 localStorage 中移除認證 token，用於用戶登出
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * requestUtils.clearAuthToken();
   * ```
   */
  clearAuthToken(): void {
    // 從瀏覽器的本地儲存中移除認證 token
    localStorage.removeItem('authToken');
  }

  /**
   * 設置 API 基礎 URL
   * 
   * 動態修改 axios 實例的基礎 URL
   * 
   * @param {string} baseURL - 新的基礎 URL
   * @returns {void}
   * 
   * @example
   * ```typescript
   * requestUtils.setBaseURL('https://api.newdomain.com');
   * ```
   */
  setBaseURL(baseURL: string): void {
    // 更新 axios 實例的預設基礎 URL
    this.apiClient.defaults.baseURL = baseURL;
  }
}

/**
 * 預設的 RequestUtils 實例
 * 
 * 使用環境變數 VITE_API_BASE_URL 或預設值 'http://localhost:8010' 作為基礎 URL
 * 可以直接使用此實例進行 API 請求，無需重新建立 RequestUtils 實例
 * 
 * @example
 * ```typescript
 * import { apiClient } from './RequestUtils';
 * 
 * const users = await apiClient.get<User[]>('/users');
 * ```
 */
export const apiClient = new RequestUtils(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010' // 從環境變數獲取 API 基礎 URL，或使用預設值
);


/**
 * 認證服務類別
 * 
 * 提供使用者認證相關的 API 調用功能，包括登入、登出和狀態檢查。
 * 處理 JWT token 的管理和 HTTP 請求的錯誤處理。
 */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export class AuthService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8010';
  }

  /**
   * 使用者登入
   * 
   * @param credentials - 使用者登入憑證
   * @returns Promise<LoginResponse> - 包含 token 和訊息的回應
   * @throws AuthError - 當登入失敗時拋出錯誤
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 包含 cookies
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // 將 token 存儲在 localStorage 中
      localStorage.setItem('authToken', data.token);
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw { message: error.message, status: 401 } as AuthError;
      }
      throw { message: 'An unexpected error occurred', status: 500 } as AuthError;
    }
  }

  /**
   * 使用者登出
   * 
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // 包含 cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 無論 API 調用是否成功，都清除本地存儲的 token
      localStorage.removeItem('authToken');
    }
  }

  /**
   * 檢查使用者是否已登入
   * 
   * @returns boolean - 是否已登入
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      // 簡單的 token 過期檢查
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      // 如果 token 格式不正確，清除它
      localStorage.removeItem('authToken');
      return false;
    }
  }

  /**
   * 獲取存儲的 token
   * 
   * @returns string | null - JWT token 或 null
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * 從 token 中獲取使用者資訊
   * 
   * @returns User | null - 使用者資訊或 null
   */
  getCurrentUser(): User | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        username: payload.username || `user_${payload.sub}`,
      };
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
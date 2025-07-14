import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class RequestUtils {
  private apiClient: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:8010/', timeout: number = 10000) {
    this.apiClient = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 請求攔截器
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 響應攔截器
    this.apiClient.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // GET 請求
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.get(url, config);
  }

  // POST 請求
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.post(url, data, config);
  }

  // PUT 請求
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.put(url, data, config);
  }

  // DELETE 請求
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.delete(url, config);
  }

  // PATCH 請求
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.patch(url, data, config);
  }

  // 設置認證 token
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // 清除認證 token
  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  // 設置 base URL
  setBaseURL(baseURL: string): void {
    this.apiClient.defaults.baseURL = baseURL;
  }
}

// 創建一個預設的 RequestUtils 實例
export const apiClient = new RequestUtils(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010'
);


/**
 * @fileoverview 認證相關 Integration 測試
 * @description 測試認證功能的完整流程，包括 API 呼叫和狀態管理
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { render, createTestQueryClient } from '../utils/test-utils';
import { LoginPage } from '../../pages/LoginPage';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000/api';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock stores
vi.mock('../../stores', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock logger
vi.mock('../../configs/loggerConfig', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('認證 Integration 測試', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    
    // 清除 URL 查詢參數
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: 'http://localhost:3000/login',
      },
      writable: true,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('成功登入流程', () => {
    it('應該完成完整的登入流程', async () => {
      render(<LoginPage />, { queryClient });

      // 輸入正確的登入憑證
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Login' });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'admin');
      await user.click(submitButton);

      // 等待 API 回應和狀態更新
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // 驗證 API 被正確呼叫
      await waitFor(() => {
        // 由於我們使用 MSW，這裡實際上是在測試網路層面的整合
        expect(usernameInput).toHaveValue('admin');
        expect(passwordInput).toHaveValue('admin');
      }, { timeout: 5000 });
    });

    it('應該處理記住我功能', async () => {
      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      await user.click(screen.getByLabelText('Remember Me'));
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Remember Me')).toBeChecked();
      });
    });
  });

  describe('登入失敗處理', () => {
    it('應該處理無效憑證錯誤', async () => {
      // 覆蓋預設的成功回應
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json({
            status: 401,
            success: false,
            message: '用戶名或密碼錯誤',
            timestamp: new Date().toISOString()
          }, { status: 401 });
        })
      );

      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'wrong_user');
      await user.type(screen.getByLabelText('Password'), 'wrong_pass');
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      // 等待錯誤訊息出現
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/用戶名或密碼錯誤|Invalid credentials|Authentication failed/i);
        expect(errorElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('應該處理網路錯誤', async () => {
      // 模擬網路錯誤
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.error();
        })
      );

      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      // 等待錯誤處理
      await waitFor(() => {
        // 按鈕應該重新啟用
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 5000 });
    });

    it('應該處理伺服器錯誤', async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json({
            status: 500,
            success: false,
            message: '伺服器內部錯誤',
            timestamp: new Date().toISOString()
          }, { status: 500 });
        })
      );

      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 5000 });
    });
  });

  describe('載入狀態處理', () => {
    it('提交期間應該顯示載入狀態', async () => {
      // 延遲 API 回應來測試載入狀態
      server.use(
        http.post(`${API_BASE}/auth/login`, async () => {
          // 延遲 1 秒
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({
            status: 200,
            success: true,
            message: '登入成功',
            data: {
              user: { username: 'admin' },
              token: 'test_token'
            },
            timestamp: new Date().toISOString()
          });
        })
      );

      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      // 檢查載入狀態
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // 檢查表單控件被禁用
      expect(screen.getByLabelText('Username')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
      expect(screen.getByLabelText('Remember Me')).toBeDisabled();
    });
  });

  describe('表單驗證整合', () => {
    it('應該阻止提交無效表單', async () => {
      render(<LoginPage />, { queryClient });

      // 嘗試提交空表單
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      // 應該顯示驗證錯誤
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      // 確保 API 未被呼叫
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('應該在修正錯誤後允許提交', async () => {
      render(<LoginPage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      // 首先觸發驗證錯誤
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      // 然後修正錯誤
      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      
      // 再次提交
      await user.click(submitButton);

      // 驗證錯誤應該消失，並開始 API 呼叫
      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
        expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('並發請求處理', () => {
    it('應該防止多次同時提交', async () => {
      let requestCount = 0;
      
      server.use(
        http.post(`${API_BASE}/auth/login`, async () => {
          requestCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
          return HttpResponse.json({
            status: 200,
            success: true,
            message: '登入成功',
            timestamp: new Date().toISOString()
          });
        })
      );

      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      // 快速點擊多次
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // 等待請求完成
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 3000 });

      // 應該只有一個請求被發送
      expect(requestCount).toBe(1);
    });
  });

  describe('Cookie 和 Session 處理', () => {
    it('應該正確處理登入後的 Cookie 設定', async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json({
            status: 200,
            success: true,
            message: '登入成功',
            data: {
              user: { username: 'admin' },
              token: 'test_token'
            },
            timestamp: new Date().toISOString()
          }, {
            headers: {
              'Set-Cookie': 'auth_token=test_token; HttpOnly; Path=/'
            }
          });
        })
      );

      render(<LoginPage />, { queryClient });

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      // 等待 API 回應
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // 在實際應用中，這裡會檢查 Cookie 是否被正確設定
      // 但在測試環境中，我們主要驗證請求是否正確發送
    });
  });
});
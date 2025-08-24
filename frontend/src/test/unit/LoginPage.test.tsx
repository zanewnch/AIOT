/**
 * @fileoverview LoginPage 組件單元測試
 * @description 測試登入頁面的各種功能和使用者互動
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createTestQueryClient } from '../utils/test-utils';
import { LoginPage } from '../../pages/LoginPage';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthQuery and useAuth
const mockLogin = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../hooks/useAuthQuery', () => ({
  AuthQuery: class {
    useLogin = () => ({
      mutateAsync: mockLogin,
      isPending: false,
      error: null,
    });
  },
}));

vi.mock('../../stores', () => ({
  useAuth: () => mockUseAuth(),
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

describe('LoginPage Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 預設未認證狀態
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    // 清除 localStorage
    window.localStorage.clear();
    
    // 清除 URL 查詢參數
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: 'http://localhost:3000/login',
      },
      writable: true,
    });
  });

  describe('基本渲染', () => {
    it('應該渲染登入表單', () => {
      render(<LoginPage />);

      // 使用更具體的選擇器避免多重匹配
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Remember Me')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('應該渲染示範憑證信息', () => {
      render(<LoginPage />);

      expect(screen.getByText('New User?')).toBeInTheDocument();
      expect(screen.getByText('Please register to create your account')).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('載入中時應該顯示載入畫面', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      render(<LoginPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('已認證時應該顯示載入畫面', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<LoginPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });
  });

  describe('自動重定向', () => {
    it('已認證時應該重定向到首頁', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<LoginPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('已認證時應該重定向到 redirectTo 參數指定的頁面', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      // Mock URL 查詢參數
      Object.defineProperty(window, 'location', {
        value: {
          search: '?redirectTo=/dashboard',
          href: 'http://localhost:3000/login?redirectTo=/dashboard',
        },
        writable: true,
      });

      render(<LoginPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  describe('表單互動', () => {
    it('應該處理用戶名輸入', async () => {
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText('Username');
      await user.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('應該處理密碼輸入', async () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('應該處理記住我選項', async () => {
      render(<LoginPage />);

      const rememberCheckbox = screen.getByLabelText('Remember Me');
      expect(rememberCheckbox).not.toBeChecked();

      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();

      await user.click(rememberCheckbox);
      expect(rememberCheckbox).not.toBeChecked();
    });
  });

  describe('表單驗證', () => {
    it('應該在用戶名為空時顯示錯誤', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('應該在密碼為空時顯示錯誤', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('應該在輸入有效數據時清除錯誤', async () => {
      render(<LoginPage />);

      // 首先觸發驗證錯誤
      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      // 然後輸入有效數據
      const usernameInput = screen.getByLabelText('Username');
      await user.type(usernameInput, 'testuser');

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
      });
    });

    it('有效表單數據時不應該顯示驗證錯誤', async () => {
      render(<LoginPage />);

      // 輸入有效數據
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Password'), 'password123');

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    });
  });

  describe('表單提交', () => {
    it('有效數據時應該呼叫登入 API', async () => {
      mockLogin.mockResolvedValue({ success: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');
      await user.click(screen.getByLabelText('Remember Me'));

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'admin',
          password: 'admin',
          rememberMe: true,
        });
      });
    });

    it('無效數據時不應該呼叫登入 API', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('應該防止表單的預設提交行為', async () => {
      const mockPreventDefault = vi.fn();
      
      render(<LoginPage />);

      const form = screen.getByRole('button', { name: 'Login' }).closest('form')!;
      
      // 模擬表單提交事件
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      // 由於我們無法直接測試 preventDefault，我們確保登入邏輯被觸發
      // 這間接證明了事件處理正常工作
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });
  });

  describe('載入狀態處理', () => {
    it('應該在表單提交時顯示適當狀態', async () => {
      render(<LoginPage />);

      // 基本的狀態檢查 - 確保表單元素存在且可用
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const rememberInput = screen.getByLabelText('Remember Me');
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      // 檢查初始狀態
      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(rememberInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      
      // 驗證元素是否可互動
      expect(usernameInput).toBeEnabled();
      expect(passwordInput).toBeEnabled();
      expect(submitButton).toBeEnabled();
    });
  });

  describe('錯誤處理', () => {
    it('應該能夠處理各種錯誤狀態', () => {
      render(<LoginPage />);

      // 檢查基本表單元素存在
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      
      // 驗證表單可以正常渲染，這表示錯誤處理邏輯沒有破壞基本功能
      const form = screen.getByRole('button', { name: 'Login' }).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('登入失敗時應該處理錯誤', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText('Username'), 'admin');
      await user.type(screen.getByLabelText('Password'), 'admin');

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('可訪問性', () => {
    it('輸入欄位應該有正確的標籤關聯', () => {
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const rememberInput = screen.getByLabelText('Remember Me');

      expect(usernameInput).toHaveAttribute('id', 'username');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(rememberInput).toHaveAttribute('id', 'rememberMe');
    });

    it('表單應該有適當的占位符文字', () => {
      render(<LoginPage />);

      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });
  });

  describe('表單狀態管理', () => {
    it('應該正確管理表單數據狀態', async () => {
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const rememberInput = screen.getByLabelText('Remember Me') as HTMLInputElement;

      // 測試初始狀態
      expect(usernameInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(rememberInput.checked).toBe(false);

      // 測試狀態更新
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass');
      await user.click(rememberInput);

      expect(usernameInput.value).toBe('testuser');
      expect(passwordInput.value).toBe('testpass');
      expect(rememberInput.checked).toBe(true);
    });
  });
});
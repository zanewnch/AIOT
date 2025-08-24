/**
 * @fileoverview LoginPage 簡化單元測試
 * @description 專注於核心功能的穩定測試
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
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

// Mock 簡化版的認證 hooks
vi.mock('../../hooks/useAuthQuery', () => ({
  AuthQuery: class {
    useLogin = () => ({
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
      error: null,
    });
  },
}));

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

describe('LoginPage 簡化測試', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: 'http://localhost:3000/login',
      },
      writable: true,
    });
  });

  describe('頁面渲染', () => {
    it('應該渲染基本登入表單元素', () => {
      render(<LoginPage />);

      // 檢查表單標題 - 使用更具體的選擇器
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      
      // 檢查輸入欄位
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      
      // 檢查提交按鈕
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('應該渲染額外的 UI 元素', () => {
      render(<LoginPage />);

      expect(screen.getByText(/new user/i)).toBeInTheDocument();
      expect(screen.getByText(/please register/i)).toBeInTheDocument();
    });
  });

  describe('表單互動', () => {
    it('應該能夠輸入用戶資料', async () => {
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'testpass');

      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('testpass');
    });

    it('應該能夠切換記住我選項', async () => {
      render(<LoginPage />);

      const rememberCheckbox = screen.getByLabelText(/remember me/i);
      
      expect(rememberCheckbox).not.toBeChecked();
      
      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();
    });
  });

  describe('表單驗證', () => {
    it('應該在空表單提交時顯示錯誤', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // 等待驗證訊息出現
      await waitFor(() => {
        const usernameError = screen.queryByText(/username.*required/i);
        const passwordError = screen.queryByText(/password.*required/i);
        
        expect(usernameError || passwordError).toBeInTheDocument();
      });
    });

    it('應該在輸入資料後清除錯誤', async () => {
      render(<LoginPage />);

      // 先觸發驗證錯誤
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username.*required/i)).toBeInTheDocument();
      });

      // 輸入資料應該清除錯誤
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      await waitFor(() => {
        expect(screen.queryByText(/username.*required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('可訪問性', () => {
    it('應該有正確的表單標籤', () => {
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberInput = screen.getByLabelText(/remember me/i);

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(rememberInput).toHaveAttribute('type', 'checkbox');
    });

    it('應該有適當的佔位符', () => {
      render(<LoginPage />);

      expect(screen.getByPlaceholderText(/enter.*username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter.*password/i)).toBeInTheDocument();
    });
  });

  describe('表單提交', () => {
    it('應該在有效資料時嘗試提交', async () => {
      render(<LoginPage />);

      // 填寫表單
      await user.type(screen.getByLabelText(/username/i), 'admin');
      await user.type(screen.getByLabelText(/password/i), 'admin');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // 表單應該被提交（不會有驗證錯誤）
      await waitFor(() => {
        expect(screen.queryByText(/username.*required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/password.*required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('響應性', () => {
    it('表單元素應該是響應式的', () => {
      render(<LoginPage />);

      const form = screen.getByRole('button', { name: /login/i }).closest('form');
      expect(form).toBeInTheDocument();
      
      // 檢查表單結構
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
/**
 * @fileoverview 登入頁面組件
 * 
 * 此文件提供完整的登入頁面功能，包含自動重定向邏輯、載入狀態管理和完整的登入表單。
 * 使用 Redux 進行狀態管理，並整合 React Router 進行頁面導航。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-07-18
 */

import React, { useEffect, useState } from 'react'; // 引入 React 核心庫和 Hooks
import { useNavigate } from 'react-router-dom'; // 引入 React Router 的導航 Hook
import { useAuthQuery } from '../hooks/useAuthQuery'; // 引入認證 Hook
import { useAuth } from '../stores'; // 引入認證狀態
import { LoginRequest } from '../types/auth'; // 引入登入請求的類型定義
import styles from '../styles/LoginForm.module.scss'; // 引入登入表單的 SCSS 模組樣式
import { createLogger } from '../configs/loggerConfig'; // 引入日誌配置

// 創建 LoginPage 專用的 logger 實例
const logger = createLogger('LoginPage');

/**
 * 登入頁面組件
 * 
 * 提供完整的登入頁面功能，包含以下特性：
 * - 自動重定向邏輯：已登入用戶自動跳轉
 * - 載入狀態管理：顯示載入畫面
 * - URL 參數處理：支援 redirectTo 參數
 * - 響應式設計：適配不同螢幕尺寸
 * - 狀態管理：使用 Redux 管理認證狀態
 * - 表單驗證和錯誤處理
 * 
 * 組件邏輯流程：
 * 1. 監聽認證狀態變化
 * 2. 如果已登入且未載入，執行重定向
 * 3. 如果正在載入或已登入，顯示載入畫面
 * 4. 否則顯示登入表單
 * 
 * @returns {JSX.Element} 登入頁面的 JSX 元素
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <LoginPage />
 * 
 * // 在路由中使用
 * <Route path="/login" element={<LoginPage />} />
 * 
 * // 使用重定向參數
 * // URL: /login?redirectTo=/dashboard
 * // 登入成功後會自動跳轉到 /dashboard
 * ```
 */
export const LoginPage: React.FC = () => {
  // 從認證 Hook 中取得狀態
  const { isAuthenticated, isLoading } = useAuth();
  const authQuery = useAuthQuery();
  const loginMutation = authQuery.useLogin();
  // 取得 React Router 的導航函數
  const navigate = useNavigate();

  // 表單資料狀態
  const [formData, setFormData] = useState<LoginRequest>({
    username: "", // 使用者名稱
    password: "", // 密碼
    rememberMe: false, // 記住我選項
  });
  // 表單驗證錯誤狀態
  const [formErrors, setFormErrors] = useState<Partial<LoginRequest>>({});

  /**
   * 認證狀態監聽 Effect
   * 
   * 監聽認證狀態變化，如果用戶已登入且未處於載入狀態，
   * 則自動重定向到指定頁面或首頁。
   * 
   * 重定向邏輯：
   * 1. 從 URL 查詢參數中獲取 redirectTo 值
   * 2. 如果沒有 redirectTo 參數，默認重定向到首頁 '/'
   * 3. 使用 replace: true 替換當前歷史記錄
   * 
   * @param {boolean} isAuthenticated - 認證狀態
   * @param {boolean} isLoading - 載入狀態
   * @param {Function} navigate - 導航函數
   */
  useEffect(() => {
    // 檢查是否已認證且未處於載入狀態
    if (isAuthenticated && !isLoading) {
      // 解析 URL 查詢參數
      const urlParams = new URLSearchParams(window.location.search);
      // 獲取重定向目標路徑，如果沒有則使用首頁
      const redirectTo = urlParams.get('redirectTo') || '/';
      // 執行重定向，使用 replace 避免在瀏覽器歷史中留下登入頁面
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]); // 依賴項陣列

  /**
   * 處理輸入欄位變化
   *
   * 當使用者在輸入欄位中輸入時更新表單資料，同時清除相關的錯誤訊息
   *
   * @param e - 輸入變化事件
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target; // 解構取得欄位名稱、值、類型和選中狀態
    const newValue = type === 'checkbox' ? checked : value;
    
    // 記錄輸入欄位變化
    logger.debug(`Form field changed: ${name}`, {
      fieldName: name,
      fieldType: type,
      hasValue: type === 'checkbox' ? checked : !!value
    });
    
    // 更新表單資料
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // 清除該欄位的驗證錯誤
    if (formErrors[name as keyof LoginRequest]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // 錯誤會由 React Query 自動清除
  };

  /**
   * 驗證表單資料
   *
   * 檢查表單欄位是否填寫完整，並設置相應的錯誤訊息
   *
   * @returns 表單是否有效
   */
  const validateForm = (): boolean => {
    const errors: Partial<LoginRequest> = {};

    // 驗證使用者名稱是否為空string
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }

    // 驗證密碼是否為空string
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }

    const isValid = Object.keys(errors).length === 0;
    
    // 記錄表單驗證結果
    logger.info(`Form validation completed`, {
      isValid,
      errorCount: Object.keys(errors).length,
      hasUsername: !!formData.username.trim(),
      hasPassword: !!formData.password.trim(),
      rememberMe: formData.rememberMe
    });

    setFormErrors(errors); // 設置驗證錯誤
    return isValid; // 返回是否有錯誤
  };

  /**
   * 處理表單提交
   *
   * 驗證表單資料並觸發登入流程
   *
   * @param e - 表單提交事件
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表單預設提交行為

    // 記錄登入嘗試
    logger.info('Login attempt started', {
      username: formData.username,
      rememberMe: formData.rememberMe,
      timestamp: new Date().toISOString()
    });


    // 驗證表單，如果無效則停止執行
    if (!validateForm()) {
      logger.warn('Login attempt failed: form validation failed');
      return;
    }

    try {
      // 觸發登入並等待結果
      await loginMutation.mutateAsync(formData);
      logger.info('Login successful', { username: formData.username });
    } catch (error) {
      // 記錄登入失敗
      logger.error("Login failed", { error: error instanceof Error ? error.message : String(error) });
    }
  };

  /**
   * 載入狀態渲染
   * 
   * 當正在載入或已經登入時，顯示載入畫面。
   * 使用內聯樣式創建漸變背景和旋轉動畫。
   */
  if (isLoading || isAuthenticated) {
    return (
      // 載入畫面容器，使用 flexbox 居中對齊
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', // 全螢幕高度
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' // 漸變背景
      }}>
        {/* 載入指示器容器 */}
        <div style={{ 
          color: 'white', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px' // 文字和圖示之間的間距
        }}>
          {/* 旋轉載入圖示 */}
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ffffff', // 白色邊框
            borderTop: '2px solid transparent', // 透明上邊框創建旋轉效果
            borderRadius: '50%', // 圓形
            animation: 'spin 1s linear infinite' // CSS 動畫
          }}></div>
          Loading...
        </div>
      </div>
    );
  }

  // 渲染登入表單
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.title}>Login</h2>

        {loginMutation.error && <div className={styles.errorMessage}>{loginMutation.error.message}</div>}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            {/* htmlFor 是 React 中用來替代 HTML 的 for 屬性的屬性名稱。它的用途是將 <label> 元素與表單中的輸入欄位（如 <input>）關聯起來，這樣當使用者點擊 <label> 時，對應的輸入欄位會自動獲得焦點（focus）。*/}
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className={`${styles.input} ${
                formErrors.username ? styles.inputError : ""
              }`}
              disabled={loginMutation.isPending}
              placeholder="Enter your username"
            />
            {formErrors.username && (
              <span className={styles.fieldError}>{formErrors.username}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`${styles.input} ${
                formErrors.password ? styles.inputError : ""
              }`}
              disabled={loginMutation.isPending}
              placeholder="Enter your password"
            />
            {formErrors.password && (
              <span className={styles.fieldError}>{formErrors.password}</span>
            )}
          </div>

          <div className={styles.checkboxGroup}>
            <label htmlFor="rememberMe" className={styles.checkboxLabel}>
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className={styles.checkbox}
                disabled={loginMutation.isPending}
              />
              <span className={styles.checkboxText}>Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className={`${styles.submitButton} ${
              isLoading ? styles.loading : ""
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className={styles.demoCredentials}>
          <h4>New User?</h4>
          <p>Please register to create your account</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
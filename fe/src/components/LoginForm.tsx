/**
 * @fileoverview 使用者登入表單組件
 *
 * 此檔案提供了一個完整的使用者登入表單組件，包含表單驗證、錯誤處理和載入狀態管理。
 * 組件整合了 Redux 狀態管理，支援使用者認證流程和即時表單驗證。
 * 包含完整的 TypeScript 類型定義和無障礙功能支援。
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React, { useState } from "react"; // 引入 React 庫和 useState Hook
import { useAuth, useLogin } from "../hooks/useAuthQuery"; // 引入認證 Hook
import { LoginRequest } from "../types/auth"; // 引入登入請求的類型定義
import styles from "../styles/LoginForm.module.scss"; // 引入登入表單的 SCSS 模組樣式
import { createLogger, logUserAction, logError } from "../configs/loggerConfig"; // 引入日誌配置

/**
 * 使用者登入表單組件
 *
 * 提供一個完整的使用者登入介面，包含表單驗證和錯誤處理。
 * 與 Redux 認證系統整合，處理登入邏輯和狀態管理。
 * 支援即時表單驗證、載入狀態顯示和使用者友好的錯誤提示。
 *
 * @returns 渲染後的登入表單 JSX 元素
 *
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */

// 創建 LoginForm 專用的 logger 實例
const logger = createLogger('LoginForm');

export const LoginForm: React.FC = () => {
  // 從認證 Hook 獲取狀態和方法
  const { isLoading } = useAuth();
  const loginMutation = useLogin();
  // 表單資料狀態
  const [formData, setFormData] = useState<LoginRequest>({
    username: "", // 使用者名稱
    password: "", // 密碼
    rememberMe: false, // 記住我選項
  });
  // 表單驗證錯誤狀態
  const [formErrors, setFormErrors] = useState<Partial<LoginRequest>>({});

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

    // 記錄用戶操作
    logUserAction('login_attempt', {
      username: formData.username,
      rememberMe: formData.rememberMe
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
      logUserAction('login_success', { username: formData.username });
    } catch (error) {
      // 記錄登入失敗
      logError(error as Error, 'LoginForm.handleSubmit', {
        username: formData.username,
        rememberMe: formData.rememberMe
      });
      logger.error("Login failed", { error: error instanceof Error ? error.message : String(error) });
    }
  };

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

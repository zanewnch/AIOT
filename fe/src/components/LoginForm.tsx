import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginRequest } from '../services/AuthService';
import styles from '../styles/LoginForm.module.scss';

/**
 * 登入表單組件
 * 
 * 提供使用者登入介面，包含表單驗證和錯誤處理。
 * 與認證上下文整合，處理登入邏輯。
 */
export const LoginForm: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<LoginRequest>>({});

  /**
   * 處理輸入欄位變化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 清除欄位錯誤
    if (formErrors[name as keyof LoginRequest]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // 清除全域錯誤
    if (error) {
      clearError();
    }
  };

  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const errors: Partial<LoginRequest> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * 處理表單提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
    } catch (error) {
      // 錯誤已經在 AuthContext 中處理
      console.error('Login failed:', error);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.title}>Login</h2>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className={`${styles.input} ${formErrors.username ? styles.inputError : ''}`}
              disabled={isLoading}
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
              className={`${styles.input} ${formErrors.password ? styles.inputError : ''}`}
              disabled={isLoading}
              placeholder="Enter your password"
            />
            {formErrors.password && (
              <span className={styles.fieldError}>{formErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.demoCredentials}>
          <h4>Demo Credentials:</h4>
          <p>Username: admin</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
};
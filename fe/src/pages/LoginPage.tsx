/**
 * @fileoverview 登入頁面組件
 * 
 * 此文件提供完整的登入頁面功能，包含自動重定向邏輯和載入狀態管理。
 * 使用 Redux 進行狀態管理，並整合 React Router 進行頁面導航。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-07-18
 */

import React, { useEffect } from 'react'; // 引入 React 核心庫和 useEffect Hook
import { useNavigate } from 'react-router-dom'; // 引入 React Router 的導航 Hook
import { LoginForm } from '../components/LoginForm'; // 引入登入表單組件
import { useSelector } from 'react-redux'; // 引入 Redux 的選擇器 Hook
import { selectIsAuthenticated, selectIsLoading } from '../stores/authSlice'; // 引入認證狀態選擇器

/**
 * 登入頁面組件
 * 
 * 提供完整的登入頁面功能，包含以下特性：
 * - 自動重定向邏輯：已登入用戶自動跳轉
 * - 載入狀態管理：顯示載入畫面
 * - URL 參數處理：支援 redirectTo 參數
 * - 響應式設計：適配不同螢幕尺寸
 * - 狀態管理：使用 Redux 管理認證狀態
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
  // 從 Redux store 中選擇認證狀態
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // 從 Redux store 中選擇載入狀態
  const isLoading = useSelector(selectIsLoading);
  // 取得 React Router 的導航函數
  const navigate = useNavigate();

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

  // 渲染登入表單組件
  return <LoginForm />;
};

export default LoginPage;
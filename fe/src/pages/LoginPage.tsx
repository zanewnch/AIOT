import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';

/**
 * 登入頁面組件
 * 
 * 提供使用者登入頁面，包含自動重定向邏輯。
 * 如果使用者已經登入，會自動重定向到首頁。
 */
export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  /**
   * 檢查認證狀態，如果已登入則重定向
   */
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // 可以從 URL 參數中獲取重定向路徑
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo') || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // 如果正在載入或已經登入，顯示載入畫面
  if (isLoading || isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #ffffff',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading...
        </div>
      </div>
    );
  }

  return <LoginForm />;
};

export default LoginPage;
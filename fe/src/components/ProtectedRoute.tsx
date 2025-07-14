import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * 受保護路由組件的 props
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 受保護路由組件
 * 
 * 用於保護需要認證的路由。如果使用者未登入，會重定向到登入頁面。
 * 支援自定義載入畫面和錯誤處理。
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在載入認證狀態，顯示載入畫面
  if (isLoading) {
    return (
      <>
        {fallback || (
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
              Checking authentication...
            </div>
          </div>
        )}
      </>
    );
  }

  // 如果未認證，重定向到登入頁面並保存當前路徑
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`} 
        state={{ from: location }}
        replace 
      />
    );
  }

  // 如果已認證，渲染子組件
  return <>{children}</>;
};

export default ProtectedRoute;
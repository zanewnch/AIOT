/**
 * @fileoverview 受保護路由組件
 * 
 * 此檔案提供了一個路由保護組件，用於確保只有已認證的使用者才能訪問特定頁面。
 * 組件整合了 Redux 狀態管理，支援自定義載入畫面，並在未認證時自動重定向到登入頁面。
 * 包含完整的 TypeScript 類型定義和無障礙功能支援。
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from 'react'; // 引入 React 庫，用於建立組件
import { Navigate, useLocation } from 'react-router-dom'; // 引入 React Router 的導航組件和路徑 Hook
import { useAuth } from '../stores'; // 引入認證 Hook
import { createLogger } from '../configs/loggerConfig'; // 引入日誌配置

/**
 * 受保護路由組件的屬性介面
 * 
 * 定義受保護路由組件可接受的所有屬性及其類型約束。
 * 此介面支援子組件傳遞和自定義載入畫面配置
 * 
 * @interface ProtectedRouteProps
 */
interface ProtectedRouteProps {
  /** 需要認證才能訪問的子組件內容 */
  children: React.ReactNode;
  /** 自定義載入畫面組件，當認證狀態檢查中時顯示，可選 */
  fallback?: React.ReactNode;
}

/**
 * 受保護路由組件
 * 
 * 用於保護需要認證的路由。如果使用者未登入，會重定向到登入頁面。
 * 支援自定義載入畫面和錯誤處理。組件會檢查使用者的認證狀態，
 * 並根據狀態決定是否允許訪問受保護的內容。
 * 
 * @param props - 受保護路由組件的屬性
 * @returns 根據認證狀態渲染的 JSX 元素
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // 帶自定義載入畫面
 * <ProtectedRoute fallback={<CustomLoader />}>
 *   <PrivateContent />
 * </ProtectedRoute>
 * ```
 */

/**
 * ProtectedRoute 組件專用的日誌記錄器
 * 
 * 用於記錄路由保護檢查、認證狀態變化和重定向操作的日誌資訊
 * 
 * @const
 */
const logger = createLogger('ProtectedRoute');

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, // 需要保護的子組件
  fallback // 自定義載入畫面組件
}) => {
  // 從認證 Hook 獲取狀態
  /** 當前用戶的認證狀態和載入狀態 */
  const { isAuthenticated, isLoading } = useAuth();
  /** 當前路由位置資訊，包含路徑和查詢參數 */
  const location = useLocation();

  /**
   * 記錄路由保護檢查的副作用
   * 
   * 當路徑或認證狀態發生變化時，記錄相關日誌資訊以便監控和除錯
   */
  React.useEffect(() => {
    logger.info('Route protection check', {
      path: location.pathname,
      search: location.search,
      isAuthenticated,
      isLoading
    });
  }, [location.pathname, location.search, isAuthenticated, isLoading]);

  // 如果正在載入認證狀態，顯示載入畫面
  if (isLoading) {
    logger.debug('Showing authentication loading state', { path: location.pathname });
    return (
      <>
        {/** 優先使用自定義的 fallback 組件，否則使用預設的載入畫面 */}
        {fallback || (
          <div style={{ 
            display: 'flex', // 使用 flexbox 布局
            justifyContent: 'center', // 水平居中
            alignItems: 'center', // 垂直居中
            height: '100vh', // 全螢幕高度
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' // 漸變背景
          }}>
            <div style={{ 
              color: 'white', // 白色文字
              fontSize: '18px', // 字體大小
              display: 'flex', // 使用 flexbox 布局
              alignItems: 'center', // 垂直居中對齊
              gap: '10px' // 元素間距
            }}>
              {/** 旋轉動畫載入指示器 */}
              <div style={{
                width: '20px', // 寬度
                height: '20px', // 高度
                border: '2px solid #ffffff', // 白色邊框
                borderTop: '2px solid transparent', // 頂部透明邊框創建缺口
                borderRadius: '50%', // 圓形
                animation: 'spin 1s linear infinite' // 旋轉動畫
              }}></div>
              Checking authentication... {/* 載入提示文字 */}
            </div>
          </div>
        )}
      </>
    );
  }

  // 如果未認證，重定向到登入頁面並保存當前路徑
  if (!isAuthenticated) {
    /** 建構登入頁面的重定向路徑，包含原始路徑作為查詢參數 */
    const redirectPath = `/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`;
    
    logger.warn('Access denied - redirecting to login', {
      attemptedPath: location.pathname,
      search: location.search,
      redirectPath
    });


    return (
      <Navigate 
        to={redirectPath} // 重定向到登入頁面並保存當前路徑
        state={{ from: location }} // 在導航狀態中保存來源路徑
        replace // 替換當前歷史記錄，而不是推入新記錄
      />
    );
  }

  // 如果已認證，渲染子組件
  logger.info('Access granted - rendering protected content', {
    path: location.pathname,
    search: location.search
  });


  return <>{children}</>;
};

/**
 * 預設匯出受保護路由組件
 * 
 * 提供替代的匯入方式，支援 import ProtectedRoute from './ProtectedRoute' 語法
 */
export default ProtectedRoute;
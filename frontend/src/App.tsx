/**
 * @fileoverview 主要的 React 應用程式組件
 *
 * 此文件包含應用程式的核心架構和路由配置，負責：
 * - 設定 React Router 的路由結構
 * - 管理用戶認證狀態的初始化
 * - 定義公開路由和受保護路由
 * - 整合通知系統
 *
 * @author AIOT Team
 * @version 1.0.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom"; // 引入 React Router 相關組件進行路由管理
import { Suspense, lazy, useEffect } from "react"; // 引入 React 懶加載相關組件
import { useAuth, useAuthActions } from "./stores"; // 引入認證 Hook
import { NotificationContainer } from "./components/Notification/NotificationContainer"; // 引入通知容器組件
import ProtectedRoute from "./components/ProtectedRoute"; // 引入受保護路由組件

// 使用動態導入來實現代碼分割和懶加載
const Homepage = lazy(() => import("./pages/Homepage").then(module => ({ default: module.Homepage })));
const TableViewer = lazy(() => import("./components/HomeContent/TableViewer").then(module => ({ default: module.TableViewer })));
const HomeContent = lazy(() => import("./components/HomeContent/HomeContent").then(module => ({ default: module.HomeContent })));
const InitPage = lazy(() => import("./pages/InitPage").then(module => ({ default: module.InitPage })));
const SwaggerDocPage = lazy(() => import("./pages/SwaggerDocPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const FlyingPage = lazy(() => import("./pages/FlyingPage"));
const CommandHistoryPage = lazy(() => import("./pages/CommandHistoryPage"));
const DroneFleetPage = lazy(() => import("./pages/DroneFleetPage"));
const CommandQueuePage = lazy(() => import("./pages/CommandQueuePage"));
const DataAnalyticsPage = lazy(() => import("./pages/DataAnalyticsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

/**
 * 主要的應用程式組件
 *
 * @description 這是應用程式的根組件，負責：
 * - 初始化用戶認證狀態
 * - 設定應用程式的路由結構
 * - 管理公開和受保護的路由
 * - 整合全域通知系統
 *
 * @returns {JSX.Element} 返回包含完整路由配置的應用程式 JSX 元素
 */
function App() {
  /**
   * 認證狀態管理
   *
   * @description 使用 Zustand 和自定義 Hook 來管理認證狀態
   * 自動處理認證狀態的初始化、載入和錯誤狀態
   */
  const { isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();

  // 在應用程式啟動時初始化認證狀態
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * 返回應用程式的 JSX 結構
   *
   * @description 包含以下主要部分：
   * - BrowserRouter: 提供瀏覽器路由功能
   * - Routes: 定義路由規則
   * - 公開路由：不需要認證即可訪問
   * - 受保護路由：需要認證才能訪問
   * - NotificationContainer: 全域通知系統
   */

  // 如果正在初始化認證狀態，顯示載入畫面
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '18px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{
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
          正在初始化應用程式...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* 啟用瀏覽器路由，支援 HTML5 history API */}
      <Suspense fallback={<div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '18px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>載入中...</div>}>
        <Routes>
          {/* 定義路由規則容器 */}
          {/* 公開路由 - 無需認證即可訪問 */}
          <Route path="/login" element={<LoginPage />} /> {/* 登入頁面路由 */}
          <Route path="/" element={<InitPage />} /> {/* 系統初始化頁面 */}
          {/* 受保護的路由 - 需要認證才能訪問 */}
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                {/* 包裝受保護路由組件，檢查認證狀態 */}
                <Homepage /> {/* 首頁布局組件 */}
              </ProtectedRoute>
            }
          >
            {/* 嵌套路由 - 在 Homepage 組件內部渲染 */}
            <Route index element={<HomeContent />} /> {/* 首頁預設內容 */}
            <Route path="tableviewer" element={<TableViewer />} /> 
            {/* 資料表檢視器頁面 */}
            <Route path="chat" element={<ChatPage />} /> 
            {/* AI 聊天頁面 */}
            <Route path="api-docs" element={<SwaggerDocPage />} /> 
            {/* API 文檔頁面 */}
            <Route path="mappage" element={<MapPage />} /> 
            {/* 地圖頁面 */}
            <Route path="flyingpage" element={<FlyingPage />} /> 
            {/* 飛行頁面 */}
            <Route path="command-history" element={<CommandHistoryPage />} /> 
            {/* 指令歷史頁面 */}
            <Route path="drone-fleet" element={<DroneFleetPage />} /> 
            {/* 無人機機隊管理頁面 */}
            <Route path="command-queue" element={<CommandQueuePage />} /> 
            {/* 智能指令佇列頁面 */}
            <Route path="data-analytics" element={<DataAnalyticsPage />} /> 
            {/* 資料分析頁面 */}
          </Route>
        </Routes>
      </Suspense>
      <NotificationContainer /> {/* 全域通知容器，顯示系統通知訊息 */}
    </BrowserRouter>
  );
}

export default App;

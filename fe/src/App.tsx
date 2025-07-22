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
import { Homepage } from "./pages/Homepage"; // 引入首頁組件
import { TableViewer } from "./components/HomeContent/TableViewer"; // 引入資料表檢視器組件
import { HomeContent } from "./components/HomeContent/HomeContent"; // 引入首頁內容組件
import SwaggerDocPage from "./pages/SwaggerDocPage"; // 引入 API 文檔頁面組件
import LoginPage from "./pages/LoginPage"; // 引入登入頁面組件
import { useEffect } from "react"; // 引入 React useEffect Hook
import { useDispatch } from "react-redux"; // 引入 Redux useDispatch Hook
import { AppDispatch } from "./stores"; // 引入 Redux store 的 dispatch 型別
import { initializeAuth } from "./stores/authSlice"; // 引入認證狀態初始化 action
import { NotificationContainer } from "./components/Notification/NotificationContainer"; // 引入通知容器組件
import ProtectedRoute from "./components/ProtectedRoute"; // 引入受保護路由組件

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
     * Redux dispatch 函數
     * 
     * @description 使用 TypeScript 型別安全的 dispatch，確保 action 型別正確
     */
    const dispatch = useDispatch<AppDispatch>();

    /**
     * 初始化認證狀態的副作用
     * 
     * @description 在組件掛載時執行認證狀態的初始化
     * 這會檢查 localStorage 中是否存在有效的認證令牌
     * 並相應地設定用戶的登入狀態
     */
    useEffect(() => {
        dispatch(initializeAuth()); // 派發認證初始化 action
    }, [dispatch]); // 依賴項：dispatch 函數

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
    return (
        <BrowserRouter> {/* 啟用瀏覽器路由，支援 HTML5 history API */}
                    <Routes> {/* 定義路由規則容器 */}
                        {/* 公開路由 - 無需認證即可訪問 */}
                        <Route path="/login" element={<LoginPage />} /> {/* 登入頁面路由 */}
                        
                        {/* 受保護的路由 - 需要認證才能訪問 */}
                        <Route path="/" element={
                            <ProtectedRoute> {/* 包裝受保護路由組件，檢查認證狀態 */}
                                <Homepage /> {/* 首頁布局組件 */}
                            </ProtectedRoute>
                        }>
                            {/* 嵌套路由 - 在 Homepage 組件內部渲染 */}
                            <Route index element={<HomeContent />} /> {/* 首頁預設內容 */}
                            <Route path="tableviewer" element={<TableViewer />} /> {/* 資料表檢視器頁面 */}
                            <Route path="api-docs" element={<SwaggerDocPage />} /> {/* API 文檔頁面 */}
                        </Route>
                    </Routes>
                    <NotificationContainer /> {/* 全域通知容器，顯示系統通知訊息 */}
                </BrowserRouter>
    );
}

export default App;

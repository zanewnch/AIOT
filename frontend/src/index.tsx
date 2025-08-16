/**
 * @fileoverview React 應用程式的入口點文件
 * 
 * 此文件負責初始化 React 應用程式，包括：
 * - 設定 Redux 全域狀態管理
 * - 將 React 應用程式渲染到 DOM 中
 * - 啟用嚴格模式以確保程式碼品質
 * 
 * @author AIOT Team
 * @version 1.0.0
 */

import React from 'react'; // 引入 React 核心庫
import ReactDOM from 'react-dom/client'; // 引入 React DOM 客戶端渲染 API
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 引入 React Query
import './styles/index.scss'; // 引入全域樣式表
import App from './App'; // 引入主要的應用程式組件

// 創建 React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});


/**
 * 取得 HTML 中的 root 元素並建立 React 根元素
 * 
 * @description 尋找 HTML 文件中 id 為 'root' 的元素作為 React 應用程式的掛載點
 * 如果找不到該元素，則拋出錯誤
 */
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found'); // 確保根元素存在，若不存在則拋出錯誤

/**
 * 建立 React 18 的根元素
 * 
 * @description 使用 createRoot API 建立新的根元素，這是 React 18 的新特性
 * 提供更好的並發渲染支持和性能優化
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * 渲染 React 應用程式到 DOM 中
 * 
 * @description 使用以下包裝組件進行渲染：
 * - React.StrictMode: 啟用嚴格模式，幫助檢測潛在問題
 * - QueryClientProvider: 提供 React Query Client 給整個應用程式
 * - App: 主要的應用程式組件
 */
root.render(
  <React.StrictMode> {/* 啟用 React 嚴格模式，檢測副作用和過時的 API */}
    <QueryClientProvider client={queryClient}> {/* 提供 React Query Client 給所有子組件 */}
      <App /> {/* 渲染主要的應用程式組件 */}
    </QueryClientProvider>
  </React.StrictMode>
);

/**
 * 性能監控設定說明
 * 
 * @description 如果需要開始測量應用程式性能，可以傳遞一個函數
 * 來記錄結果（例如：reportWebVitals(console.log)）
 * 或發送到分析端點。了解更多：https://bit.ly/CRA-vitals
 */


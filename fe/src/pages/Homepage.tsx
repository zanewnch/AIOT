/**
 * @fileoverview 主頁組件
 * 
 * 此文件包含應用程式的主要頁面佈局，提供整體的導航結構和內容區域。
 * 使用 React Router 的 Outlet 組件來渲染子路由內容。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from 'react'; // 引入 React 核心庫
import { Outlet } from 'react-router-dom'; // 引入 React Router 的 Outlet 組件，用於渲染子路由
import { Navbar, Sidebar } from '../components'; // 引入導航欄和側邊欄組件
import styles from '../styles/homepage.module.scss'; // 引入 SCSS 模組樣式

/**
 * 主頁組件
 * 
 * 提供應用程式的主要佈局結構，包括：
 * - 頂部導航欄 (Navbar)
 * - 左側導航欄 (Sidebar)
 * - 主要內容區域 (Content Area)
 * 
 * 此組件作為路由的容器，透過 React Router 的 Outlet 組件
 * 來渲染不同路由對應的子組件。
 * 
 * @returns {JSX.Element} 主頁的 JSX 元素
 * 
 * @example
 * ```tsx
 * // 在路由配置中使用
 * <Route path="/" element={<Homepage />}>
 *   <Route path="dashboard" element={<Dashboard />} />
 *   <Route path="settings" element={<Settings />} />
 * </Route>
 * ```
 */
export function Homepage(): JSX.Element {
  return (
    // 主頁面容器，應用整體佈局樣式
    <div className={styles.homeView}>
      {/* 頂部導航欄 - 包含用戶資訊、通知等功能 */}
      <Navbar />

      {/* 主要內容區域 - 包含側邊欄和動態內容 */}
      <main className={styles.mainContent}>
        {/* 左側導航欄 - 提供頁面間的導航功能 */}
        <Sidebar />

        {/* 動態內容區域 - 根據當前路由渲染對應的子組件 */}
        <div className={styles.contentArea}>
          {/* 
            Outlet 組件用於渲染子路由內容
            當 URL 匹配到子路由時，對應的組件會在此處渲染
          */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
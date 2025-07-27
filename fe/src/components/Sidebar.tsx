/**
 * @fileoverview 應用程式側邊欄導航組件
 *
 * 此檔案提供了一個響應式側邊欄導航組件，包含品牌標題和主要導航連結。
 * 組件使用 React Router 實現路由導航，並根據當前路徑高亮顯示活動連結。
 * 支援自定義樣式和完整的 TypeScript 類型定義。
 *
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from 'react'; // 引入 React 庫，用於建立組件
import { Link, useLocation } from 'react-router-dom'; // 引入 React Router 的 Link 組件和 useLocation Hook
import styles from '../styles/Sidebar.module.scss'; // 引入側邊欄的 SCSS 模組樣式
import { createLogger, logUserAction } from '../configs/loggerConfig'; // 引入日誌配置

/**
 * 側邊欄組件的屬性介面
 *
 * 定義側邊欄組件可接受的所有屬性及其類型約束
 */
interface SidebarProps {
  /** 額外的 CSS 類名，用於自定義樣式 */
  className?: string;
}

/**
 * 應用程式側邊欄導航組件
 *
 * 提供一個固定位置的側邊欄，包含品牌標題和主要導航連結。
 * 根據當前路徑自動高亮顯示活動連結，提供良好的用戶體驗。
 *
 * @param props - 側邊欄組件的屬性
 * @returns 渲染後的側邊欄 JSX 元素
 *
 * @example
 * ```tsx
 * // 基本使用
 * <Sidebar />
 *
 * // 帶自定義樣式
 * <Sidebar className="custom-sidebar" />
 * ```
 */

// 創建 Sidebar 專用的 logger 實例
const logger = createLogger('Sidebar');

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  // 使用 useLocation Hook 獲取當前路徑資訊，用於導航連結的活動狀態判斷
  const location = useLocation();

  /**
   * 處理導航連結點擊
   * 
   * @param path - 目標路徑
   * @param label - 連結標籤
   */
  const handleNavClick = (path: string, label: string) => {
    logger.info(`Sidebar navigation clicked`, {
      targetPath: path,
      label,
      currentPath: location.pathname
    });

    logUserAction('navigation', {
      source: 'sidebar',
      target: path,
      label,
      from: location.pathname
    });
  };

  return (
    <aside className={`${styles.sidebar} ${className || ''}`}>
      {/* 頂部品牌區域 - 顯示應用程式名稱或標誌 */}
      <div className={styles.sidebarHeader}>
        <h2 className={styles.brandTitle}>我的應用</h2>
      </div>

      {/* 導航區域 - 包含所有主要導航連結 */}
      <div className={styles.sidebarSection}>
        <h3>導航</h3>
        <nav className={styles.sidebarNav}>
          {/* 首頁導航連結 */}
          <Link
            to="/" // 路由路徑
            className={`${styles.sidebarLink} ${location.pathname === '/' ? styles.active : ''}`} // 動態應用活動狀態樣式
            onClick={() => handleNavClick('/', '首頁')}
          >
            <span className={styles.sidebarIcon}>🏠</span>
            首頁
          </Link>
          {/* 表格檢視器導航連結 */}
          <Link
            to="/content/tableviewer" // 路由路徑
            className={`${styles.sidebarLink} ${location.pathname === '/tableviewer' ? styles.active : ''}`} // 動態應用活動狀態樣式
            onClick={() => handleNavClick('/content/tableviewer', 'Table Viewer')}
          >
            <span className={styles.sidebarIcon}>📊</span>
            Table Viewer
          </Link>
          {/* API 文檔導航連結 */}
          <Link
            to="/content/api-docs" // 路由路徑
            className={`${styles.sidebarLink} ${location.pathname === '/api-docs' ? styles.active : ''}`} // 動態應用活動狀態樣式
            onClick={() => handleNavClick('/content/api-docs', 'API 文檔')}
          >
            <span className={styles.sidebarIcon}>📚</span>
            API 文檔
          </Link>
        </nav>
      </div>
    </aside>
  );
};
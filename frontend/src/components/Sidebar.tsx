/**
 * @fileoverview 應用程式側邊欄導航組件
 *
 * 此檔案提供了一個響應式側邊欄導航組件，包含品牌標題和主要導航連結。
 * 組件使用 React Router 實現路由導航，並根據當前路徑高亮顯示活動連結。
 * 支援自定義樣式和完整的 TypeScript 類型定義。
 *
 * @author AI Assistant
 * @version 2.0.0
 * @since 2025-08-04
 */

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Sidebar.module.scss';
import { createLogger } from '../configs/loggerConfig';

/**
 * 側邊欄組件的屬性介面
 */
interface SidebarProps {
  /** 額外的 CSS 類名，用於自定義樣式 */
  className?: string;
}

/**
 * 導航項目配置介面
 */
interface NavItem {
  path: string;
  label: string;
  icon: string;
  matchPath: string;
}

// 創建 Sidebar 專用的 logger 實例
const logger = createLogger('Sidebar');

// 導航項目配置陣列
const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '首頁', icon: '🏠', matchPath: '/' },
  { path: '/content/tableviewer', label: 'Table Viewer', icon: '📊', matchPath: '/tableviewer' },
  { path: '/content/api-docs', label: 'API 文檔', icon: '📚', matchPath: '/api-docs' },
  { path: '/content/docpage', label: 'Doc Page', icon: '📄', matchPath: '/docpage' },
  { path: '/content/mappage', label: '地圖頁面', icon: '🗺️', matchPath: '/mappage' },
  { path: '/content/flyingpage', label: '飛行頁面', icon: '✈️', matchPath: '/flyingpage' },
  { path: '/content/command-history', label: '指令歷史', icon: '📋', matchPath: '/command-history' },
  { path: '/content/drone-fleet', label: '機隊管理', icon: '🚁', matchPath: '/drone-fleet' },
  { path: '/content/command-queue', label: '指令佇列', icon: '⚡', matchPath: '/command-queue' },
  { path: '/content/data-analytics', label: '資料分析', icon: '📈', matchPath: '/data-analytics' }
];

/**
 * 導航連結項目組件
 */
const NavItem: React.FC<{ 
  item: NavItem; 
  currentPath: string;
  onItemClick: (item: NavItem) => void;
}> = ({ item, currentPath, onItemClick }) => {
  const isActive = currentPath === item.matchPath;
  const linkClass = `${styles.sidebarLink} ${isActive ? styles.active : ''}`;
  
  return (
    <Link
      to={item.path}
      className={linkClass}
      onClick={() => onItemClick(item)}
    >
      <span className={styles.sidebarIcon}>{item.icon}</span>
      {item.label}
    </Link>
  );
};

/**
 * 導航列表組件
 */
const NavigationList: React.FC<{
  items: NavItem[];
  currentPath: string;
  onItemClick: (item: NavItem) => void;
}> = ({ items, currentPath, onItemClick }) => (
  <nav className={styles.sidebarNav}>
    {items.map((item) => (
      <NavItem
        key={item.path}
        item={item}
        currentPath={currentPath}
        onItemClick={onItemClick}
      />
    ))}
  </nav>
);

/**
 * 側邊欄標題組件
 */
const SidebarHeader: React.FC = () => (
  <div className={styles.sidebarHeader}>
    <h2 className={styles.brandTitle}>我的應用</h2>
  </div>
);

/**
 * 導航區域組件
 */
const NavigationSection: React.FC<{
  currentPath: string;
  onItemClick: (item: NavItem) => void;
}> = ({ currentPath, onItemClick }) => (
  <div className={styles.sidebarSection}>
    <h3>導航</h3>
    <NavigationList
      items={NAV_ITEMS}
      currentPath={currentPath}
      onItemClick={onItemClick}
    />
  </div>
);

/**
 * 應用程式側邊欄導航組件
 *
 * 提供一個固定位置的側邊欄，包含品牌標題和主要導航連結。
 * 根據當前路徑自動高亮顯示活動連結，提供良好的用戶體驗。
 */
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  
  const handleItemClick = useMemo(() => (item: NavItem) => {
    logger.info('Sidebar navigation clicked', {
      targetPath: item.path,
      label: item.label,
      currentPath: location.pathname
    });
  }, [location.pathname]);

  const sidebarClass = `${styles.sidebar} ${className || ''}`;

  return (
    <aside className={sidebarClass}>
      <SidebarHeader />
      <NavigationSection
        currentPath={location.pathname}
        onItemClick={handleItemClick}
      />
    </aside>
  );
};
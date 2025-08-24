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
 * 
 * 定義側邊欄組件可接受的所有屬性及其類型約束
 * 
 * @interface SidebarProps
 */
interface SidebarProps {
  /** 額外的 CSS 類名，用於自定義外觀樣式，可選 */
  className?: string;
}

/**
 * 導航項目配置介面
 * 
 * 定義側邊欄導航項目的完整結構，包含路徑、標籤、圖示和配對規則
 * 
 * @interface NavItem
 */
interface NavItem {
  /** 導航目標路徑 */
  path: string;
  /** 顯示標籤文字 */
  label: string;
  /** 代表此項目的圖示符號 */
  icon: string;
  /** 用於檢查活動狀態的路徑配對規則 */
  matchPath: string;
}

/**
 * Sidebar 組件專用的日誌記錄器
 * 
 * 用於記錄導航操作、路徑切換等用戶互動行為的日誌資訊
 * 
 * @const
 */
const logger = createLogger('Sidebar');

/**
 * 導航項目配置陣列
 * 
 * 定義側邊欄中所有可用的導航項目，包含路徑、標籤、圖示和活動狀態配對規則
 * 
 * @const
 * @readonly
 */
const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '首頁', icon: '🏠', matchPath: '/' },
  { path: '/tableviewer', label: 'Table Viewer', icon: '📊', matchPath: '/tableviewer' },
  { path: '/chat', label: 'AI 聊天', icon: '🤖', matchPath: '/chat' },
  { path: '/mappage', label: '地圖頁面', icon: '🗺️', matchPath: '/mappage' },
  { path: '/flyingpage', label: '飛行頁面', icon: '✈️', matchPath: '/flyingpage' },
  { path: '/command-history', label: '指令歷史', icon: '📋', matchPath: '/command-history' },
  { path: '/drone-fleet', label: '機隊管理', icon: '🚁', matchPath: '/drone-fleet' },
  { path: '/command-queue', label: '指令佇列', icon: '⚡', matchPath: '/command-queue' },
  { path: '/data-analytics', label: '資料分析', icon: '📈', matchPath: '/data-analytics' }
];

/**
 * 導航連結項目組件的屬性介面
 * 
 * @interface NavItemComponentProps
 */
interface NavItemComponentProps {
  /** 導航項目的配置資訊 */
  item: NavItem;
  /** 當前活動的路徑 */
  currentPath: string;
  /** 項目點擊事件處理器 */
  onItemClick: (item: NavItem) => void;
}

/**
 * 導航連結項目組件
 * 
 * 渲柔單個導航項目，支援活動狀態高亮顯示和點擊事件處理
 * 
 * @param props - 組件屬性
 * @param props.item - 導航項目配置
 * @param props.currentPath - 當前路徑
 * @param props.onItemClick - 點擊事件處理器
 * @returns JSX 元素
 */
const NavItem: React.FC<NavItemComponentProps> = ({ item, currentPath, onItemClick }) => {
  /** 檢查當前項目是否為活動狀態 */
  const isActive = currentPath === item.matchPath;
  /** 動態組合 CSS 類名，支援活動狀態樣式 */
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
 * 導航列表組件的屬性介面
 * 
 * @interface NavigationListProps
 */
interface NavigationListProps {
  /** 導航項目陣列 */
  items: NavItem[];
  /** 當前活動的路徑 */
  currentPath: string;
  /** 項目點擊事件處理器 */
  onItemClick: (item: NavItem) => void;
}

/**
 * 導航列表組件
 * 
 * 渲柔所有導航項目的列表，管理多個 NavItem 組件的渲柔和事件傳遞
 * 
 * @param props - 組件屬性
 * @param props.items - 導航項目陣列
 * @param props.currentPath - 當前路徑
 * @param props.onItemClick - 點擊事件處理器
 * @returns JSX 元素
 */
const NavigationList: React.FC<NavigationListProps> = ({ items, currentPath, onItemClick }) => (
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
 * 
 * 渲柔側邊欄頂部的品牌標題區域，顯示應用程式名稱
 * 
 * @returns JSX 元素
 */
const SidebarHeader: React.FC = () => (
  <div className={styles.sidebarHeader}>
    <h2 className={styles.brandTitle}>我的應用</h2>
  </div>
);

/**
 * 導航區域組件的屬性介面
 * 
 * @interface NavigationSectionProps
 */
interface NavigationSectionProps {
  /** 當前活動的路徑 */
  currentPath: string;
  /** 項目點擊事件處理器 */
  onItemClick: (item: NavItem) => void;
}

/**
 * 導航區域組件
 * 
 * 包含導航標題和導航列表的完整區域，管理整個導航功能區塊
 * 
 * @param props - 組件屬性
 * @param props.currentPath - 當前路徑
 * @param props.onItemClick - 點擊事件處理器
 * @returns JSX 元素
 */
const NavigationSection: React.FC<NavigationSectionProps> = ({ currentPath, onItemClick }) => (
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
 * 支援響應式設計、自定義樣式和完整的用戶互動日誌記錄
 * 
 * @param props - 組件屬性
 * @param props.className - 自定義 CSS 類名
 * @returns JSX 元素
 */
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  /** 當前路由位置資訊 */
  const location = useLocation();
  
  /**
   * 導航項目點擊事件處理器
   * 
   * 使用 useMemo 優化性能，避免不必要的重新渲柔
   * 
   * @param item - 被點擊的導航項目
   */
  const handleItemClick = useMemo(() => (item: NavItem) => {
    logger.info('Sidebar navigation clicked', {
      targetPath: item.path,
      label: item.label,
      currentPath: location.pathname
    });
  }, [location.pathname]);

  /** 組合側邊欄的 CSS 類名，支援自定義樣式 */
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
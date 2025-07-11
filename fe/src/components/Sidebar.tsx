import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/Sidebar.module.scss';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();

  return (
    <aside className={`${styles.sidebar} ${className || ''}`}>
      {/* 頂部品牌區域 */}
      <div className={styles.sidebarHeader}>
        <h2 className={styles.brandTitle}>我的應用</h2>
      </div>

      {/* 導航區域 */}
      <div className={styles.sidebarSection}>
        <h3>導航</h3>
        <nav className={styles.sidebarNav}>
          <Link 
            to="/" 
            className={`${styles.sidebarLink} ${location.pathname === '/' ? styles.active : ''}`}
          >
            <span className={styles.sidebarIcon}>🏠</span>
            首頁
          </Link>
          <Link 
            to="/tableviewer" 
            className={`${styles.sidebarLink} ${location.pathname === '/tableviewer' ? styles.active : ''}`}
          >
            <span className={styles.sidebarIcon}>📊</span>
            Table Viewer
          </Link>
          <Link 
            to="/api-docs" 
            className={`${styles.sidebarLink} ${location.pathname === '/api-docs' ? styles.active : ''}`}
          >
            <span className={styles.sidebarIcon}>📚</span>
            API 文檔
          </Link>
        </nav>
      </div>
    </aside>
  );
}; 
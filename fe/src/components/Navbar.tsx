/**
 * @fileoverview 頂部導航欄組件
 * 
 * 此檔案提供了一個響應式的頂部導航欄組件，包含品牌標識、使用者資訊和主題切換功能。
 * 組件整合了 Redux 狀態管理，支援使用者認證狀態顯示和登出功能。
 * 包含完整的 TypeScript 類型定義和可訪問性支援。
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from 'react'; // 引入 React 庫，用於建立組件
import { Link } from 'react-router-dom'; // 引入 React Router 的 Link 組件
import { ThemeToggle } from './ThemeToggle'; // 引入主題切換組件
import { useSelector, useDispatch } from 'react-redux'; // 引入 Redux 的 Hook
import { AppDispatch } from '../stores'; // 引入 Redux store 的 dispatch 類型
import { logout, selectUser } from '../stores/authSlice'; // 引入認證相關的 action 和選擇器
import styles from '../styles/Navbar.module.scss'; // 引入導航欄的 SCSS 模組樣式

/**
 * 導航欄組件的屬性介面
 * 
 * 定義導航欄組件可接受的所有屬性及其類型約束
 */
interface NavbarProps {
  /** 品牌名稱，顯示在導航欄左側 */
  brandName?: string;
}

/**
 * 頂部導航欄組件
 * 
 * 提供一個固定在頁面頂部的導航欄，包含品牌標識、使用者資訊和功能按鈕。
 * 根據使用者的認證狀態動態顯示不同的內容和操作選項。
 * 
 * @param props - 導航欄組件的屬性
 * @returns 渲染後的導航欄 JSX 元素
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <Navbar />
 * 
 * // 自定義品牌名稱
 * <Navbar brandName="My App" />
 * ```
 */
export const Navbar: React.FC<NavbarProps> = ({ 
  brandName = "IOT" // 品牌名稱，默認為 "IOT"
}) => {
  // 獲取 Redux dispatch 函數，用於觸發 action
  const dispatch = useDispatch<AppDispatch>();
  // 從 Redux store 獲取當前使用者資訊
  const user = useSelector(selectUser);

  /**
   * 處理使用者登出
   * 
   * 觸發登出 action，並處理可能的錯誤
   */
  const handleLogout = async () => {
    try {
      // 觸發登出 action 並等待完成
      await dispatch(logout()).unwrap();
    } catch (error) {
      // 登出失敗時記錄錯誤
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        {/* 品牌標識區域 - 點擊可回到首頁 */}
        <Link to="/" className={styles.navBrand}>
          <h2>{brandName}</h2>
        </Link>
        
        {/* 導航欄右側功能區域 */}
        <div className={styles.navRight}>
          {user && ( // 只有在使用者已登入時才顯示使用者資訊
            <div className={styles.userInfo}>
              {/* 歡迎訊息，顯示使用者名稱 */}
              <span className={styles.username}>Welcome, {user.username}</span>
              {/* 登出按鈕 */}
              <button 
                onClick={handleLogout} // 綁定登出處理函數
                className={styles.logoutButton}
              >
                Logout
              </button>
            </div>
          )}
          {/* 主題切換組件 */}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}; 
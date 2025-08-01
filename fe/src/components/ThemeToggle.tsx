/**
 * @fileoverview 主題切換組件
 * 
 * 此檔案提供了一個主題切換按鈕組件，允許使用者在淺色和深色主題之間切換。
 * 組件整合了 Redux 狀態管理，使用 SVG 圖標來表示當前主題狀態。
 * 包含完整的可訪問性支援和 TypeScript 類型定義。
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from 'react'; // 引入 React 庫，用於建立組件
import { useThemeStore } from '../stores'; // 引入主題 Zustand store
import '../styles/ThemeToggle.scss'; // 引入主題切換組件的 SCSS 樣式
import { createLogger } from '../configs/loggerConfig'; // 引入日誌配置

/**
 * 主題切換組件
 * 
 * 提供一個按鈕來切換應用程式的主題模式（淺色/深色）。
 * 根據當前主題狀態顯示相應的圖標（月亮代表切換到深色，太陽代表切換到淺色）。
 * 包含完整的可訪問性屬性，為螢幕閱讀器提供適當的標籤。
 * 
 * @returns 渲染後的主題切換按鈕 JSX 元素
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <ThemeToggle />
 * ```
 */

// 創建 ThemeToggle 專用的 logger 實例
const logger = createLogger('ThemeToggle');

export function ThemeToggle() {
  // 從 Zustand store 獲取當前主題狀態和切換方法
  const { theme, toggleTheme } = useThemeStore();

  /**
   * 處理主題切換
   * 
   * 觸發主題切換，在淺色和深色主題之間切換
   */
  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // 記錄主題切換操作
    logger.info(`Theme switched`, {
      from: theme,
      to: newTheme,
      timestamp: new Date().toISOString()
    });


    toggleTheme(); // 觸發主題切換
  };

  return (
    <button
      className="theme-toggle" // 應用主題切換按鈕的樣式
      onClick={handleToggle} // 綁定點擊事件處理函數
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} // 無障礙標籤，描述按鈕功能
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} // 滑鼠懸停時的提示文字
    >
      {theme === 'light' ? ( // 根據當前主題顯示相應的圖標
        // 淺色主題時顯示月亮圖標（表示可切換到深色主題）
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
      ) : (
        // 深色主題時顯示太陽圖標（表示可切換到淺色主題）
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
      )}
    </button>
  );
} 
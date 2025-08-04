/**
 * @fileoverview 可重用的按鈕組件
 * 
 * 此檔案提供了一個功能豐富的按鈕組件，支援多種視覺風格、大小、狀態和互動功能。
 * 組件包含載入狀態、禁用狀態、可訪問性支援以及完整的 TypeScript 類型定義。
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from 'react'; // 引入 React 庫，用於建立組件
import '../styles/Button.module.scss'; // 引入按鈕組件的 SCSS 樣式檔案
import { createLogger } from '../configs/loggerConfig'; // 引入日誌配置

/**
 * 按鈕組件的屬性介面
 * 
 * 定義按鈕組件可接受的所有屬性及其類型約束
 */
interface ButtonProps {
  /** 按鈕內容，可以是文字或其他 React 元素 */
  children: React.ReactNode;
  /** 按鈕的視覺風格變體 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** 按鈕的大小規格 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用按鈕 */
  disabled?: boolean;
  /** 是否顯示載入狀態 */
  loading?: boolean;
  /** 點擊事件處理函數 */
  onClick?: () => void;
  /** HTML 按鈕類型 */
  type?: 'button' | 'submit' | 'reset';
  /** 額外的 CSS 類名 */
  className?: string;
}

// 創建 Button 專用的 logger 實例
const logger = createLogger('Button');

/**
 * 通用按鈕組件
 * 
 * 一個功能完整的按鈕組件，支援多種視覺風格、大小配置和互動狀態。
 * 內建載入動畫、禁用狀態處理和可訪問性支援。
 * 
 * @param props - 按鈕組件的屬性
 * @returns 渲染後的按鈕 JSX 元素
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <Button onClick={() => console.log('clicked')}>點擊我</Button>
 * 
 * // 帶載入狀態的主要按鈕
 * <Button variant="primary" loading={true}>載入中...</Button>
 * 
 * // 小尺寸的次要按鈕
 * <Button variant="secondary" size="sm">取消</Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children, // 按鈕內容
  variant = 'primary', // 視覺風格，默認為主要風格
  size = 'md', // 大小規格，默認為中等大小
  disabled = false, // 禁用狀態，默認為啟用
  loading = false, // 載入狀態，默認為非載入狀態
  onClick, // 點擊事件處理函數
  type = 'button', // HTML 按鈕類型，默認為普通按鈕
  className = '', // 額外的 CSS 類名，默認為空字串
}) => {
  // 構建基礎 CSS 類名
  const baseClass = 'btn'; // 按鈕基礎類名
  const variantClass = `btn--${variant}`; // 根據風格變體生成的類名
  const sizeClass = `btn--${size}`; // 根據大小規格生成的類名
  const loadingClass = loading ? 'btn--loading' : ''; // 載入狀態的類名
  
  // 組合所有 CSS 類名，過濾空值並用空格連接
  const buttonClass = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    className
  ].filter(Boolean).join(' '); // 過濾掉空值，避免多餘的空格

  /**
   * 處理按鈕點擊事件
   * 
   * 記錄按鈕點擊操作並執行原有的點擊處理函數
   */
  const handleClick = () => {
    // 記錄按鈕點擊操作
    logger.info(`Button clicked`, {
      variant,
      size,
      disabled,
      loading,
      type,
      className
    });
    
    
    // 執行原有的點擊處理函數
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type} // 設置按鈕的 HTML 類型
      className={buttonClass} // 應用組合後的 CSS 類名
      onClick={handleClick} // 綁定增強的點擊事件處理函數
      disabled={disabled || loading} // 禁用狀態或載入狀態時禁用按鈕
      aria-disabled={disabled || loading} // 無障礙屬性，告知螢幕閱讀器按鈕是否禁用
    >
      {loading && ( // 當載入狀態為 true 時顯示載入動畫
        <div className="btn__spinner">
          {/* SVG 載入動畫圖標 */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12" // 圓心 X 座標
              cy="12" // 圓心 Y 座標
              r="10" // 圓半徑
              stroke="currentColor" // 使用當前文字顏色作為描邊顏色
              strokeWidth="2" // 描邊寬度
              strokeLinecap="round" // 描邊端點樣式
              strokeDasharray="31.416" // 虛線模式的間隔
              strokeDashoffset="31.416" // 虛線的偏移量
            >
              {/* 虛線陣列動畫，創建旋轉載入效果 */}
              <animate
                attributeName="stroke-dasharray"
                dur="2s" // 動畫持續時間
                values="0 31.416;15.708 15.708;0 31.416" // 動畫關鍵幀值
                repeatCount="indefinite" // 無限重複
              />
              {/* 虛線偏移動畫，與虛線陣列動畫配合創建載入效果 */}
              <animate
                attributeName="stroke-dashoffset"
                dur="2s" // 動畫持續時間
                values="0;-15.708;-31.416" // 動畫關鍵幀值
                repeatCount="indefinite" // 無限重複
              />
            </circle>
          </svg>
        </div>
      )}
      {/* 按鈕內容容器，載入狀態時應用特殊樣式 */}
      <span className={loading ? 'btn__content--loading' : ''}>{children}</span>
    </button>
  );
};
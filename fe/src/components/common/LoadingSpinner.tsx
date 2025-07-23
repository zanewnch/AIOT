/**
 * @fileoverview 載入狀態顯示組件
 * 
 * 提供統一的載入狀態 UI，包括旋轉動畫和自定義訊息
 * 可在整個應用程式中重複使用
 * 
 * @author AIOT Development Team
 * @since 2024-01-01
 */

import React from 'react';
import styles from './LoadingSpinner.module.scss';

/**
 * 載入組件的屬性介面
 */
export interface LoadingSpinnerProps {
  /** 載入訊息文字 */
  message?: string;
  /** 載入器大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否顯示全螢幕載入 */
  fullScreen?: boolean;
  /** 自定義類名 */
  className?: string;
}

/**
 * 載入狀態顯示組件
 * 
 * 提供美觀的載入動畫和可自定義的載入訊息
 * 支援不同尺寸和全螢幕模式
 * 
 * @param props - 載入組件屬性
 * @returns 載入狀態的 JSX 元素
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <LoadingSpinner message="載入中..." />
 * 
 * // 小尺寸載入器
 * <LoadingSpinner size="small" message="載入數據中..." />
 * 
 * // 全螢幕載入
 * <LoadingSpinner fullScreen message="正在初始化..." />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '載入中...',
  size = 'medium',
  fullScreen = false,
  className = ''
}) => {
  const containerClasses = [
    styles.loadingContainer,
    styles[size],
    fullScreen ? styles.fullScreen : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.loadingContent}>
        {/* 旋轉載入動畫 */}
        <div className={styles.spinner}>
          <div className={styles.spinnerInner}></div>
        </div>
        
        {/* 載入訊息 */}
        {message && (
          <span className={styles.loadingMessage}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 預設匯出
 */
export default LoadingSpinner;
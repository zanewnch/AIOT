/**

/**
 * @fileoverview 鍵盤導航 Hook
 *
 * Intention:
 * 此檔案實作了一個 React Hook `useKeyboardNavigation`，目的是讓表格元件能夠支援鍵盤左右箭頭的導航操作。
 * 主要設計理念如下：
 *
 * 1. 鍵盤快捷鍵切換表格：
 *    監聽全域 `keydown` 事件，當使用者按下左右箭頭時，觸發 `onScrollLeft` 或 `onScrollRight` 回呼，讓表格能夠左右切換。
 * 2. 智能滾動檢測：
 *    透過 `checkScrollable` 函式判斷目前焦點元素或其父元素是否具備水平滾動能力。如果在可滾動區域內，則讓瀏覽器原生滾動行為優先，避免重複攔截。
 * 3. 避免與輸入元件衝突：
 *    當焦點在 `<input>`, `<textarea>`, `<select>` 等輸入元件時，不會攔截鍵盤事件，確保使用者輸入體驗不受影響。
 * 4. 表格元件專用：
 *    針對表格相關 DOM 結構（如 `TABLE`, `TD`, `TH` 等）做特殊判斷，確保導航行為只在合適的情境下觸發。
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

/**
 * 檢查目標元素或其父元素是否可滾動
 */
const checkScrollable = (element: HTMLElement): boolean => {
  let currentElement = element;
  
  while (currentElement && currentElement !== document.body) {
    const computedStyle = window.getComputedStyle(currentElement);
    const overflowX = computedStyle.overflowX;
    
    // 如果元素有水平滾動能力，且內容確實可以滾動
    if ((overflowX === 'auto' || overflowX === 'scroll') && 
        currentElement.scrollWidth > currentElement.clientWidth) {
      return true;
    }
    
    // 檢查表格相關元素
    if (currentElement.tagName && 
        ['TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH', 'DIV'].includes(currentElement.tagName) &&
        (currentElement.className.includes('table') || 
         currentElement.className.includes('cell') ||
         currentElement.getAttribute('role') === 'table' ||
         currentElement.getAttribute('role') === 'cell')) {
      
      if (currentElement.scrollWidth > currentElement.clientWidth) {
        return true;
      }
    }
    
    currentElement = currentElement.parentElement as HTMLElement;
  }
  
  return false;
};

/**
 * 鍵盤導航 Hook
 */
export const useKeyboardNavigation = ({ 
  onScrollLeft, 
  onScrollRight 
}: UseKeyboardNavigationProps) => {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    
    // 跳過輸入框元素
    if (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement) {
      return;
    }

    // 檢查是否在可滾動區域內
    if (checkScrollable(target)) {
      // 如果在可滾動區域內，讓瀏覽器處理滾動
      if (event.key === "ArrowLeft" && target.scrollLeft > 0) return;
      if (event.key === "ArrowRight" && 
          target.scrollLeft < target.scrollWidth - target.clientWidth) return;
    }

    // 處理表格切換快捷鍵
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        onScrollLeft();
        break;
      case "ArrowRight":
        event.preventDefault();
        onScrollRight();
        break;
    }
  }, [onScrollLeft, onScrollRight]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
/**
 * @fileoverview 主題管理 - 使用 Zustand
 * 
 * 純主題狀態管理：
 * - 主題切換（亮色/暗色）
 * - 自動持久化
 * - DOM 同步更新
 * 
 * @author AIOT Development Team
 * @version 3.0.0 (簡化版本)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * 主題類型定義
 */
export type Theme = 'light' | 'dark';

/**
 * 主題 Store
 */
interface ThemeStore {
  theme: Theme;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
  
  // Computed
  isDarkMode: () => boolean;
  isLightMode: () => boolean;
}

/**
 * 取得初始主題設定
 * 
 * 依照以下優先順序決定主題：
 * 1. localStorage 中儲存的主題設定
 * 2. 系統偏好設定（prefers-color-scheme）
 * 3. 預設為亮色主題
 * 
 * @returns 返回初始主題類型
 * 
 * @example
 * ```typescript
 * const theme = getInitialTheme(); // 'light' 或 'dark'
 * ```
 */
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

/**
 * 將主題應用到 DOM 元素
 * 
 * 更新 document.documentElement 的 data-theme 屬性和 class，
 * 確保 CSS 主題樣式正確應用
 * 
 * @param theme - 要應用的主題類型
 * 
 * @example
 * ```typescript
 * applyTheme('dark');  // 應用暗色主題
 * applyTheme('light'); // 應用亮色主題
 * ```
 */
const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  
  document.documentElement.setAttribute('data-theme', theme);
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};

/**
 * Zustand 主題 Store
 */
export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        theme: getInitialTheme(),

        // Actions
        /**
         * 設定主題
         * 
         * 更新 store 狀態並立即應用到 DOM
         * 
         * @param theme - 要設定的主題類型
         * 
         * @example
         * ```typescript
         * setTheme('dark');  // 切換到暗色主題
         * setTheme('light'); // 切換到亮色主題
         * ```
         */
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
          applyTheme(theme);
        },

        /**
         * 切換主題
         * 
         * 在亮色和暗色主題之間切換
         * 
         * @example
         * ```typescript
         * toggleTheme(); // 亮色 ↔ 暗色
         * ```
         */
        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme }, false, 'toggleTheme');
          applyTheme(newTheme);
        },

        /**
         * 初始化主題
         * 
         * 重新讀取初始主題設定並應用到 DOM，
         * 通常用於應用程式啟動時
         * 
         * @example
         * ```typescript
         * initializeTheme(); // 重新初始化主題
         * ```
         */
        initializeTheme: () => {
          const theme = getInitialTheme();
          set({ theme }, false, 'initializeTheme');
          applyTheme(theme);
        },

        // Computed
        /**
         * 檢查是否為暗色主題
         * 
         * @returns 暗色主題時返回 true，否則返回 false
         * 
         * @example
         * ```typescript
         * if (isDarkMode()) {
         *   console.log('目前是暗色主題');
         * }
         * ```
         */
        isDarkMode: () => get().theme === 'dark',
        /**
         * 檢查是否為亮色主題
         * 
         * @returns 亮色主題時返回 true，否則返回 false
         * 
         * @example
         * ```typescript
         * if (isLightMode()) {
         *   console.log('目前是亮色主題');
         * }
         * ```
         */
        isLightMode: () => get().theme === 'light',
      }),
      {
        name: 'theme-storage',
        onRehydrateStorage: () => (state) => {
          if (state?.theme) {
            applyTheme(state.theme);
          }
        },
      }
    ),
    { name: 'theme-store' }
  )
);

// 初始化時應用主題
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

// 監聽系統主題變更
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      const newTheme = e.matches ? 'dark' : 'light';
      useThemeStore.getState().setTheme(newTheme);
    }
  });
}


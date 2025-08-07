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
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
          applyTheme(theme);
        },

        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme }, false, 'toggleTheme');
          applyTheme(newTheme);
        },

        initializeTheme: () => {
          const theme = getInitialTheme();
          set({ theme }, false, 'initializeTheme');
          applyTheme(theme);
        },

        // Computed
        isDarkMode: () => get().theme === 'dark',
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


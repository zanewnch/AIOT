/**
 * @fileoverview 主題管理 Redux slice - 處理應用主題相關的狀態管理
 * 
 * 這個文件包含了主題系統的完整狀態管理邏輯，包括：
 * - 淺色和深色主題的切換
 * - 主題偏好設定的持久化存儲
 * - 系統主題偏好的自動檢測
 * - DOM 元素的主題屬性更新
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的核心功能
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * 主題類型的聯合類型定義
 * 
 * @typedef {'light' | 'dark'} Theme
 */
export type Theme = 'light' | 'dark';

/**
 * 主題狀態的類型定義
 * 
 * @interface ThemeState
 * @property {Theme} theme - 當前活動的主題
 */
interface ThemeState {
  theme: Theme;  // 當前主題設定
}

/**
 * 獲取初始主題設定的函數
 * 
 * 這個函數會按照以下優先順序決定初始主題：
 * 1. 檢查 localStorage 中的保存設定
 * 2. 檢查系統偏好設定（prefers-color-scheme）
 * 3. 默認使用淺色主題
 * 
 * @function getInitialTheme
 * @returns {Theme} 初始主題設定
 */
const getInitialTheme = (): Theme => {
  // 檢查 localStorage 中是否有保存的主題設定
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;  // 返回已保存的主題設定
  }
  
  // 檢查系統偏好設定，如果系統偏好深色模式則使用深色主題
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  // 默認返回淺色主題
  return 'light';
};

/**
 * 主題狀態的初始值
 * 
 * @constant {ThemeState} initialState - 主題狀態的初始設定
 */
const initialState: ThemeState = {
  theme: getInitialTheme(),  // 使用上面的函數獲取初始主題
};

/**
 * 將主題應用到 DOM 和 localStorage 的輔助函數
 * 
 * 這個函數負責：
 * 1. 更新 document 根元素的 data-theme 屬性
 * 2. 將主題設定保存到 localStorage 中
 * 
 * @function applyTheme
 * @param {Theme} theme - 要應用的主題
 */
const applyTheme = (theme: Theme) => {
  // 更新 document 的 data-theme 屬性，CSS 可以通過這個屬性應用對應的主題樣式
  document.documentElement.setAttribute('data-theme', theme);
  
  // 將主題設定保存到 localStorage，以便下次訪問時記住用戶的選擇
  localStorage.setItem('theme', theme);
};

/**
 * 應用初始主題到 DOM
 * 
 * 這確保了在 Redux store 創建之前，頁面就已經應用了正確的主題，
 * 避免了主題閃爍的問題。
 */
applyTheme(initialState.theme);

/**
 * 主題管理的 Redux slice
 * 
 * 這個 slice 包含了主題系統的所有狀態管理邏輯，
 * 包括設置主題、切換主題和初始化主題等操作。
 * 
 * @constant {Slice} themeSlice - 主題管理的 Redux slice
 */
const themeSlice = createSlice({
  name: 'theme',    // slice 的名稱，會作為 action type 的前綴
  initialState,     // 使用上面定義的初始狀態
  reducers: {
    /**
     * 同步 action - 設置特定主題
     * 
     * 這個 action 允許直接設置主題為 'light' 或 'dark'。
     * 
     * @function setTheme
     * @param {Draft<ThemeState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<Theme>} action - 包含要設置的主題的 action
     */
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;      // 更新 Redux 狀態中的主題
      applyTheme(action.payload);        // 應用主題到 DOM 和 localStorage
    },
    
    /**
     * 同步 action - 切換主題
     * 
     * 這個 action 會在淺色和深色主題之間切換。
     * 如果當前是淺色主題，則切換到深色主題，反之亦然。
     * 
     * @function toggleTheme
     * @param {Draft<ThemeState>} state - 當前狀態（由 Immer 包裝）
     */
    toggleTheme: (state) => {
      // 根據當前主題決定新主題（三元運算符）
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;            // 更新 Redux 狀態中的主題
      applyTheme(newTheme);              // 應用新主題到 DOM 和 localStorage
    },
    
    /**
     * 同步 action - 初始化主題
     * 
     * 這個 action 主要用於特殊情況，如 SSR（服務器端渲染）
     * 或需要重新檢測系統偏好設定的情況。
     * 
     * @function initializeTheme
     * @param {Draft<ThemeState>} state - 當前狀態（由 Immer 包裝）
     */
    initializeTheme: (state) => {
      const theme = getInitialTheme();   // 重新獲取初始主題
      state.theme = theme;               // 更新 Redux 狀態中的主題
      applyTheme(theme);                 // 應用主題到 DOM 和 localStorage
    },
  },
});

/**
 * 導出同步 actions
 * 
 * 這些 action creators 由 createSlice 自動生成，
 * 可以直接在組件中使用來觸發狀態更新。
 */
export const { setTheme, toggleTheme, initializeTheme } = themeSlice.actions;

/**
 * 導出 reducer
 * 
 * 這個 reducer 會被包含在 store 的配置中，
 * 用於處理所有與主題相關的狀態更新。
 */
export default themeSlice.reducer;

/**
 * Selectors - 用於從 Redux store 中選擇特定的狀態數據
 * 
 * 這些選擇器函數提供了一種類型安全的方式來訪問主題狀態，
 * 並可以在組件中與 useSelector hook 一起使用。
 */

/**
 * 選擇當前主題
 * 
 * @function selectTheme
 * @param {object} state - 包含 theme 屬性的根狀態
 * @returns {Theme} 當前主題設定
 */
export const selectTheme = (state: { theme: ThemeState }) => state.theme.theme;

/**
 * 選擇是否為深色模式
 * 
 * @function selectIsDarkMode
 * @param {object} state - 包含 theme 屬性的根狀態
 * @returns {boolean} 是否為深色模式
 */
export const selectIsDarkMode = (state: { theme: ThemeState }) => state.theme.theme === 'dark';

/**
 * 選擇是否為淺色模式
 * 
 * @function selectIsLightMode
 * @param {object} state - 包含 theme 屬性的根狀態
 * @returns {boolean} 是否為淺色模式
 */
export const selectIsLightMode = (state: { theme: ThemeState }) => state.theme.theme === 'light';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 主題類型
export type Theme = 'light' | 'dark';

// 主題狀態介面
interface ThemeState {
  theme: Theme;
}

// 獲取初始主題
const getInitialTheme = (): Theme => {
  // 檢查 localStorage 中是否有保存的主題設定
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  // 檢查系統偏好設定
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

// 初始狀態
const initialState: ThemeState = {
  theme: getInitialTheme(),
};

// 應用主題到 DOM 和 localStorage
const applyTheme = (theme: Theme) => {
  // 更新 document 的 data-theme 屬性
  document.documentElement.setAttribute('data-theme', theme);
  
  // 保存到 localStorage
  localStorage.setItem('theme', theme);
};

// 應用初始主題
applyTheme(initialState.theme);

// 創建 slice
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // 設置主題
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      applyTheme(action.payload);
    },
    
    // 切換主題
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      applyTheme(newTheme);
    },
    
    // 初始化主題（可用於 SSR 或特殊情況）
    initializeTheme: (state) => {
      const theme = getInitialTheme();
      state.theme = theme;
      applyTheme(theme);
    },
  },
});

// 導出 actions
export const { setTheme, toggleTheme, initializeTheme } = themeSlice.actions;

// 導出 reducer
export default themeSlice.reducer;

// Selectors
export const selectTheme = (state: { theme: ThemeState }) => state.theme.theme;
export const selectIsDarkMode = (state: { theme: ThemeState }) => state.theme.theme === 'dark';
export const selectIsLightMode = (state: { theme: ThemeState }) => state.theme.theme === 'light';
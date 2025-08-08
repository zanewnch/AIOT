/**
 * @fileoverview 自定義類型聲明文件
 * 
 * 此檔案包含了專案中使用的自定義類型聲明，包括模組聲明、
 * 環境變數介面定義以及第三方庫的類型擴展。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

/**
 * SVG 檔案模組聲明
 * 允許在 TypeScript 中直接 import SVG 檔案而不會產生類型錯誤
 */
declare module '*.svg';

/**
 * CSS 檔案模組聲明
 * 允許在 TypeScript 中直接 import 一般 CSS 檔案
 */
declare module '*.css';

/**
 * SCSS 檔案模組聲明
 * 
 * 聲明 SCSS 檔案的預設匯出類型為 CSS 類別名稱與字串的對應物件。
 * 適用於一般的 SCSS 檔案，不使用 CSS Modules 的情況。
 * 
 * @module *.scss
 * @example
 * ```typescript
 * import styles from './styles.scss';
 * // styles 的類型為 { [className: string]: string }
 * ```
 */
declare module '*.scss' {
  /** CSS 類別名稱到字串的對應物件 */
  const content: { [className: string]: string };
  /** 預設匯出樣式物件 */
  export default content;
}

/**
 * SCSS CSS Modules 檔案模組聲明
 * 
 * 專門為 CSS Modules 格式的 SCSS 檔案提供類型聲明。
 * CSS Modules 會將類別名稱進行雜湊處理，避免全域命名衝突。
 * 
 * @module *.module.scss
 * @example
 * ```typescript
 * import styles from './Component.module.scss';
 * // styles.className 會被編譯成唯一的類別名稱
 * ```
 */
declare module '*.module.scss' {
  /** CSS Modules 類別名稱到編譯後字串的對應物件 */
  const content: { [className: string]: string };
  /** 預設匯出 CSS Modules 樣式物件 */
  export default content;
}

/**
 * React JSX Runtime 模組聲明
 * 支援 React 17+ 的新 JSX 轉換機制，無需手動 import React
 */
declare module 'react/jsx-runtime';

/**
 * React JSX Development Runtime 模組聲明
 * 開發環境下使用的 JSX 轉換機制，提供更好的除錯體驗
 */
declare module 'react/jsx-dev-runtime';

/**
 * React DOM Client 模組聲明
 * 支援 React 18+ 的新 createRoot API
 */
declare module 'react-dom/client';

/**
 * Vite 環境變數介面
 * 
 * 定義了 Vite 建置工具中可用的環境變數類型。
 * 所有以 VITE_ 前綴的環境變數都會被 Vite 注入到客戶端程式碼中。
 * 
 * @interface ImportMetaEnv
 * @see {@link https://vitejs.dev/guide/env-and-mode.html | Vite 環境變數文檔}
 */
interface ImportMetaEnv {
  /** 
   * API 基礎 URL
   * 定義後端 API 服務的基礎網址，用於所有 API 請求的前綴
   */
  readonly VITE_API_BASE_URL: string;
  
  // 根據需要在此處添加更多環境變數
  // add more env variables here as needed
}

/**
 * Import Meta 介面擴展
 * 
 * 擴展 ES2020 的 import.meta 物件，添加 Vite 特有的環境變數支援。
 * 這讓我們可以在程式碼中使用 import.meta.env 來存取環境變數。
 * 
 * @interface ImportMeta
 * @example
 * ```typescript
 * // 在程式碼中使用環境變數
 * const apiUrl = import.meta.env.VITE_API_BASE_URL;
 * ```
 */
interface ImportMeta {
  /** 
   * 環境變數物件
   * 包含所有可用的 Vite 環境變數
   */
  readonly env: ImportMetaEnv;
}
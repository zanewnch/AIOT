/**
 * @fileoverview Vite 環境類型定義文件
 * 
 * 此檔案為 Vite 建置工具提供 TypeScript 類型支援，
 * 包含 Vite 客戶端類型引用和自定義環境變數介面定義。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-01-01
 * @see {@link https://vitejs.dev/guide/features.html#typescript | Vite TypeScript 支援}
 */

/**
 * Vite 客戶端類型引用
 * 
 * 這個三斜線指令引用了 Vite 的客戶端類型定義，
 * 提供 Vite 特有的功能如熱模組替換（HMR）、環境變數等的類型支援。
 * 
 * @see {@link https://vitejs.dev/guide/api-hmr.html | Vite HMR API}
 */
/// <reference types="vite/client" />

/**
 * Vite 環境變數介面
 * 
 * 定義了專案特定的環境變數類型。
 * 所有以 VITE_ 前綴的環境變數都會在建置時注入到客戶端程式碼中，
 * 並通過 import.meta.env 物件提供存取。
 * 
 * @interface ImportMetaEnv
 * @extends {ImportMetaEnv} 擴展 Vite 預設的環境變數介面
 * @example
 * ```typescript
 * // 在元件中使用環境變數
 * const apiUrl = import.meta.env.VITE_API_URL;
 * console.log('API URL:', apiUrl);
 * ```
 */
interface ImportMetaEnv {
  /** 
   * API 服務網址
   * 
   * 定義後端 API 服務的完整網址，用於前端應用程式與後端服務的通訊。
   * 這個變數應該在 .env 檔案中設定，例如：VITE_API_URL=https://api.example.com
   */
  readonly VITE_API_URL: string
}

/**
 * Import Meta 介面擴展
 * 
 * 擴展標準的 ImportMeta 介面，添加 Vite 特有的環境變數支援。
 * 這個介面讓 TypeScript 能夠正確識別 import.meta.env 的類型。
 * 
 * @interface ImportMeta
 * @example
 * ```typescript
 * // TypeScript 現在能夠正確推斷 env 的類型
 * const env = import.meta.env; // 類型為 ImportMetaEnv
 * const apiUrl = env.VITE_API_URL; // 類型為 string
 * ```
 */
interface ImportMeta {
  /** 
   * 環境變數物件
   * 
   * 包含所有 Vite 環境變數的唯讀物件，
   * 在建置時會被靜態替換為實際的環境變數值。
   */
  readonly env: ImportMetaEnv
}
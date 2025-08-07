/**
 * @fileoverview Express 型別擴展模組
 * 
 * 擴展 Express.js 框架的內建型別定義，添加自定義的使用者資訊結構。
 * 此模組使用 TypeScript 的宣告合併（Declaration Merging）功能，
 * 擴展 Express 命名空間中的 User 介面。
 * 
 * 主要功能：
 * - 擴展 Express.User 介面以包含應用程式特定的使用者屬性
 * - 提供類型安全的使用者認證和授權支援
 * - 整合 Passport.js 等認證中介軟體的使用者物件
 * - 確保 req.user 物件的類型安全性
 * 
 * 使用場景：
 * - 在認證中介軟體中設定使用者資訊
 * - 在路由處理器中存取已認證的使用者資料
 * - 提供統一的使用者物件結構
 * 
 * @module Types/Express
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 宣告全域型別擴展，擴展 Express 命名空間
declare global {
    // 擴展 Express 命名空間
    namespace Express {
        /**
         * 使用者介面擴展
         * 
         * 擴展 Express.js 的內建 User 介面，添加應用程式特定的使用者屬性。
         * 此介面將與 req.user 物件一起使用，提供類型安全的使用者資訊存取。
         * 
         * 設計考量：
         * - 使用 number 類型的 id 以兼容現有的資料庫主鍵設計
         * - 包含 username 欄位用於使用者識別和顯示
         * - 保持簡潔以避免在每個請求中傳遞過多資料
         * - 支援 Passport.js 等認證策略的整合
         * 
         * @example
         * ```typescript
         * // 在認證中介軟體中設定使用者
         * req.user = {
         *   id: 12345,
         *   username: 'john_doe'
         * };
         * 
         * // 在路由處理器中存取使用者資訊
         * app.get('/profile', (req, res) => {
         *   if (req.user) {
         *     const userId = req.user.id;       // number 類型
         *     const username = req.user.username; // string 類型
         *   }
         * });
         * ```
         * 
         * @since 1.0.0
         */
        interface User {
            /** 使用者的唯一識別碼，與資料庫主鍵對應 */
            id: number;
            /** 使用者名稱，用於識別和顯示 */
            username: string;
        }
    }
}

// 導出空物件以確保此檔案被視為模組，避免全域汙染
export {};
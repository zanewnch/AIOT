/**
 * @fileoverview 使用者控制器介面定義模組
 * 
 * 定義使用者控制器必須實現的方法簽名，包括所有使用者相關的 CRUD 操作方法。
 * 確保所有使用者控制器實現都遵循統一的介面規範，提供一致的 API 端點行為。
 * 
 * 此介面是 RBAC 系統的基礎組件，負責管理系統中的使用者實體。
 * 使用者是整個權限系統的核心，所有的權限控制都是基於使用者進行的。
 * 
 * 核心功能：
 * - 使用者資料的完整生命周期管理
 * - 支援使用者註冊、登入、資料更新等操作
 * - 整合身份驗證和授權機制
 * - 提供安全的使用者資料存取
 * 
 * @module Types/Controllers/IUserController
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 匯入 Express.js 的請求和回應類型，用於定義控制器方法參數
import { Request, Response } from 'express';

/**
 * 使用者控制器介面定義
 * 
 * 定義使用者管理控制器必須實現的所有方法簽名，確保使用者相關操作的一致性。
 * 此介面採用依賴倒置原則，使上層模組不依賴於具體的使用者控制器實現。
 * 
 * 使用者控制器的核心職責：
 * - 管理使用者帳戶的完整生命周期
 * - 處理使用者認證和授權相關業務
 * - 確保使用者資料的安全性和隱私性
 * - 提供使用者資料的 CRUD 操作介面
 * - 整合使用者與角色權限的關聯管理
 * 
 * @example
 * ```typescript
 * class UserController implements IUserController {
 *   async getUsers(req: Request, res: Response): Promise<void> {
 *     // 實現獲取使用者清單的邏輯
 *     const users = await this.userService.getAllUsers();
 *     res.json({ success: true, data: users });
 *   }
 *   
 *   async createUser(req: Request, res: Response): Promise<void> {
 *     // 實現建立新使用者的邏輯
 *     const userData = req.body;
 *     const newUser = await this.userService.createUser(userData);
 *     res.status(201).json({ success: true, data: newUser });
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface IUserController {
    /**
     * 獲取所有使用者清單
     * 
     * 處理 GET /users 請求，返回系統中所有使用者的資料。
     * 支援查詢參數過濾、分頁和排序等功能，確保大量使用者資料的有效管理。
     * 
     * @param req - Express 請求物件，可能包含查詢參數（如分頁、過濾條件、排序）
     * @param res - Express 回應物件，用於返回使用者清單
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getUsers(req: Request, res: Response): Promise<void>;

    /**
     * 根據 ID 獲取特定使用者
     * 
     * 處理 GET /users/:id 請求，返回指定 ID 的使用者詳細資料。
     * 需要考慮資料隱私，只返回適當的使用者資訊。
     * 
     * @param req - Express 請求物件，包含使用者 ID 參數
     * @param res - Express 回應物件，用於返回使用者資料或錯誤訊息
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getUserById(req: Request, res: Response): Promise<void>;

    /**
     * 建立新使用者
     * 
     * 處理 POST /users 請求，在系統中建立新的使用者帳戶。
     * 需要驗證使用者資料的有效性、唯一性（如電子郵件不重複）和密碼強度。
     * 
     * @param req - Express 請求物件，包含新使用者的資料
     * @param res - Express 回應物件，用於返回建立結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    createUser(req: Request, res: Response): Promise<void>;

    /**
     * 更新現有使用者
     * 
     * 處理 PUT /users/:id 請求，更新指定 ID 的使用者資料。
     * 需要驗證使用者存在性、更新權限和資料有效性。
     * 
     * @param req - Express 請求物件，包含使用者 ID 和更新資料
     * @param res - Express 回應物件，用於返回更新結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    updateUser(req: Request, res: Response): Promise<void>;

    /**
     * 刪除使用者
     * 
     * 處理 DELETE /users/:id 請求，從系統中刪除指定的使用者。
     * 需要檢查使用者是否可以被刪除，處理相關聯的資料清理。
     * 
     * @param req - Express 請求物件，包含要刪除的使用者 ID
     * @param res - Express 回應物件，用於返回刪除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    deleteUser(req: Request, res: Response): Promise<void>;
}
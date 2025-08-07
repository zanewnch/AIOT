/**
 * @fileoverview 權限控制器介面定義模組
 * 
 * 定義權限控制器必須實現的方法簽名，包括所有權限相關的 CRUD 操作方法。
 * 確保所有權限控制器實現都遵循統一的介面規範，提供一致的 API 端點行為。
 * 
 * 此介面遵循 RESTful API 設計原則，提供標準的 HTTP 動詞對應操作：
 * - GET: 查詢權限資料
 * - POST: 建立新權限
 * - PUT: 更新現有權限
 * - DELETE: 刪除權限
 * 
 * 設計模式：
 * - 使用 Promise<void> 返回類型支援異步操作
 * - 統一的 Express Request/Response 參數結構
 * - 符合依賴倒置原則的介面設計
 * 
 * @module Types/Controllers/IPermissionController
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 匯入 Express.js 的請求和回應類型，用於定義控制器方法參數
import { Request, Response } from 'express';

/**
 * 權限控制器介面定義
 * 
 * 定義權限管理控制器必須實現的所有方法簽名，確保權限相關操作的一致性。
 * 此介面採用依賴倒置原則，使上層模組不依賴於具體的權限控制器實現。
 * 
 * 介面設計原則：
 * - 每個方法都使用標準的 Express 請求/回應參數
 * - 所有操作都是異步的，返回 Promise<void>
 * - 方法名稱遵循 RESTful 命名慣例
 * - 提供完整的 CRUD 操作支援
 * 
 * @example
 * ```typescript
 * class PermissionController implements IPermissionController {
 *   async getPermissions(req: Request, res: Response): Promise<void> {
 *     // 實現獲取所有權限的邏輯
 *   }
 *   
 *   async createPermission(req: Request, res: Response): Promise<void> {
 *     // 實現建立新權限的邏輯
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface IPermissionController {
    /**
     * 獲取所有權限清單
     * 
     * 處理 GET /permissions 請求，返回系統中所有可用的權限資料。
     * 支援查詢參數過濾、分頁和排序等功能。
     * 
     * @param req - Express 請求物件，可能包含查詢參數
     * @param res - Express 回應物件，用於返回權限清單
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getPermissions(req: Request, res: Response): Promise<void>;

    /**
     * 根據 ID 獲取特定權限
     * 
     * 處理 GET /permissions/:id 請求，返回指定 ID 的權限詳細資料。
     * 如果權限不存在，應返回適當的 404 錯誤。
     * 
     * @param req - Express 請求物件，包含權限 ID 參數
     * @param res - Express 回應物件，用於返回權限資料或錯誤
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getPermissionById(req: Request, res: Response): Promise<void>;

    /**
     * 建立新權限
     * 
     * 處理 POST /permissions 請求，在系統中建立新的權限記錄。
     * 需要驗證權限資料的有效性和唯一性。
     * 
     * @param req - Express 請求物件，包含新權限的資料
     * @param res - Express 回應物件，用於返回建立結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    createPermission(req: Request, res: Response): Promise<void>;

    /**
     * 更新現有權限
     * 
     * 處理 PUT /permissions/:id 請求，更新指定 ID 的權限資料。
     * 需要驗證權限存在性和更新資料的有效性。
     * 
     * @param req - Express 請求物件，包含權限 ID 和更新資料
     * @param res - Express 回應物件，用於返回更新結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    updatePermission(req: Request, res: Response): Promise<void>;

    /**
     * 刪除權限
     * 
     * 處理 DELETE /permissions/:id 請求，從系統中刪除指定的權限。
     * 需要檢查權限是否被其他實體使用，確保資料完整性。
     * 
     * @param req - Express 請求物件，包含要刪除的權限 ID
     * @param res - Express 回應物件，用於返回刪除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    deletePermission(req: Request, res: Response): Promise<void>;
}
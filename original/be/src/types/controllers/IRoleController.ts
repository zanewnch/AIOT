/**
 * @fileoverview 角色控制器介面定義模組
 * 
 * 定義角色控制器必須實現的方法簽名，包括所有角色相關的 CRUD 操作方法。
 * 確保所有角色控制器實現都遵循統一的介面規範，提供一致的 API 端點行為。
 * 
 * 此介面是 RBAC 系統的核心組件之一，負責管理系統中的角色實體。
 * 角色是連接使用者和權限的重要橋樑，提供靈活的權限管理機制。
 * 
 * 設計特點：
 * - 遵循 RESTful API 設計原則
 * - 支援完整的 CRUD 操作
 * - 異步操作支援
 * - 統一的錯誤處理機制
 * 
 * @module Types/Controllers/IRoleController
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 匯入 Express.js 的請求和回應類型，用於定義控制器方法參數
import { Request, Response } from 'express';

/**
 * 角色控制器介面定義
 * 
 * 定義角色管理控制器必須實現的所有方法簽名，確保角色相關操作的一致性。
 * 此介面採用依賴倒置原則，使上層模組不依賴於具體的角色控制器實現。
 * 
 * 角色控制器的職責：
 * - 管理系統中的角色實體
 * - 提供角色的 CRUD 操作
 * - 處理角色相關的業務邏輯
 * - 確保角色資料的完整性和一致性
 * 
 * @example
 * ```typescript
 * class RoleController implements IRoleController {
 *   async getRoles(req: Request, res: Response): Promise<void> {
 *     // 實現獲取所有角色的邏輯
 *     const roles = await this.roleService.getAllRoles();
 *     res.json({ success: true, data: roles });
 *   }
 *   
 *   async createRole(req: Request, res: Response): Promise<void> {
 *     // 實現建立新角色的邏輯
 *     const roleData = req.body;
 *     const newRole = await this.roleService.createRole(roleData);
 *     res.status(201).json({ success: true, data: newRole });
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface IRoleController {
    /**
     * 獲取所有角色清單
     * 
     * 處理 GET /roles 請求，返回系統中所有可用的角色資料。
     * 支援查詢參數過濾、分頁和排序等功能。
     * 
     * @param req - Express 請求物件，可能包含查詢參數（如分頁、過濾條件）
     * @param res - Express 回應物件，用於返回角色清單
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getRoles(req: Request, res: Response): Promise<void>;

    /**
     * 根據 ID 獲取特定角色
     * 
     * 處理 GET /roles/:id 請求，返回指定 ID 的角色詳細資料。
     * 如果角色不存在，應返回適當的 404 錯誤。
     * 
     * @param req - Express 請求物件，包含角色 ID 參數
     * @param res - Express 回應物件，用於返回角色資料或錯誤訊息
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getRoleById(req: Request, res: Response): Promise<void>;

    /**
     * 建立新角色
     * 
     * 處理 POST /roles 請求，在系統中建立新的角色記錄。
     * 需要驗證角色資料的有效性和唯一性（如角色名稱不重複）。
     * 
     * @param req - Express 請求物件，包含新角色的資料
     * @param res - Express 回應物件，用於返回建立結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    createRole(req: Request, res: Response): Promise<void>;

    /**
     * 更新現有角色
     * 
     * 處理 PUT /roles/:id 請求，更新指定 ID 的角色資料。
     * 需要驗證角色存在性和更新資料的有效性。
     * 
     * @param req - Express 請求物件，包含角色 ID 和更新資料
     * @param res - Express 回應物件，用於返回更新結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    updateRole(req: Request, res: Response): Promise<void>;

    /**
     * 刪除角色
     * 
     * 處理 DELETE /roles/:id 請求，從系統中刪除指定的角色。
     * 需要檢查角色是否被使用者使用，確保資料完整性。
     * 
     * @param req - Express 請求物件，包含要刪除的角色 ID
     * @param res - Express 回應物件，用於返回刪除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    deleteRole(req: Request, res: Response): Promise<void>;
}
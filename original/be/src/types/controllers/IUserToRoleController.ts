/**
 * @fileoverview 使用者角色關聯控制器介面定義模組
 * 
 * 定義使用者角色關聯控制器必須實現的方法簽名，包括角色指派、查詢和移除等操作。
 * 管理 RBAC 系統中使用者與角色之間的多對多關係，是使用者權限管理的核心組件。
 * 
 * 此介面負責處理使用者與角色之間的複雜關聯關係，包括：
 * - 使用者角色的動態指派和撤銷
 * - 角色關聯的查詢和管理
 * - 使用者權限的間接管理
 * - 角色繼承和層級管理
 * - 臨時角色和權限的管理
 * 
 * 設計特色：
 * - 支援靈活的角色指派策略
 * - 確保使用者權限變更的即時性
 * - 提供詳細的操作審計追蹤
 * - 支援批量操作以提高管理效率
 * 
 * @module Types/Controllers/IUserToRoleController
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 匯入 Express.js 的請求和回應類型，用於定義控制器方法參數
import { Request, Response } from 'express';

/**
 * 使用者角色關聯控制器介面定義
 * 
 * 定義使用者角色關聯管理控制器必須實現的所有方法簽名，
 * 確保使用者與角色之間關聯操作的一致性和完整性。
 * 
 * 此介面的核心職責：
 * - 管理使用者與角色之間的多對多關係
 * - 提供靈活的角色指派和撤銷機制
 * - 支援批量角色操作以提高管理效率
 * - 確保角色變更的事務性和一致性
 * - 提供詳細的使用者角色關聯查詢功能
 * - 支援臨時角色和權限的管理
 * 
 * @example
 * ```typescript
 * class UserToRoleController implements IUserToRoleController {
 *   async assignRolesToUser(req: Request, res: Response): Promise<void> {
 *     // 實現批量指派角色到使用者的邏輯
 *     const { userId, roleIds } = req.body;
 *     await this.userRoleService.assignRoles(userId, roleIds);
 *     res.json({ success: true, message: '角色指派成功' });
 *   }
 * 
 *   async getUserRoles(req: Request, res: Response): Promise<void> {
 *     // 實現獲取使用者所有角色的邏輯
 *     const { userId } = req.params;
 *     const roles = await this.userRoleService.getUserRoles(userId);
 *     res.json({ success: true, data: roles });
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface IUserToRoleController {
    /**
     * 獲取使用者的所有角色
     * 
     * 處理 GET /users/:userId/roles 請求，返回指定使用者擁有的所有角色。
     * 支援角色的層級展示和詳細資訊查詢，包括直接角色和繼承角色。
     * 
     * @param req - Express 請求物件，包含使用者 ID 參數
     * @param res - Express 回應物件，用於返回使用者角色清單
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getUserRoles(req: Request, res: Response): Promise<void>;

    /**
     * 批量指派角色到使用者
     * 
     * 處理 POST /users/:userId/roles 請求，將多個角色指派給指定使用者。
     * 支援批量操作以提高管理效率，確保操作的原子性和一致性。
     * 
     * @param req - Express 請求物件，包含使用者 ID 和角色 ID 清單
     * @param res - Express 回應物件，用於返回指派結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    assignRolesToUser(req: Request, res: Response): Promise<void>;

    /**
     * 從使用者移除角色
     * 
     * 處理 DELETE /users/:userId/roles/:roleId 請求，
     * 從指定使用者移除特定角色，同時處理相關權限的變更。
     * 
     * @param req - Express 請求物件，包含使用者 ID 和角色 ID 參數
     * @param res - Express 回應物件，用於返回移除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    removeRoleFromUser(req: Request, res: Response): Promise<void>;

    /**
     * 建立新的使用者角色關聯
     * 
     * 處理 POST /user-roles 請求，建立新的使用者角色關聯記錄。
     * 通常用於精細化的角色管理和特殊關聯設定。
     * 
     * @param req - Express 請求物件，包含新使用者角色關聯的資料
     * @param res - Express 回應物件，用於返回建立結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    createUserRole(req: Request, res: Response): Promise<void>;

    /**
     * 根據 ID 獲取使用者角色關聯
     * 
     * 處理 GET /user-roles/:id 請求，返回指定 ID 的使用者角色關聯詳細資料。
     * 用於查詢特定關聯記錄的詳細資訊和元資料。
     * 
     * @param req - Express 請求物件，包含使用者角色關聯 ID 參數
     * @param res - Express 回應物件，用於返回關聯資料
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getUserRoleById(req: Request, res: Response): Promise<void>;

    /**
     * 更新使用者角色關聯
     * 
     * 處理 PUT /user-roles/:id 請求，更新指定使用者角色關聯的資料。
     * 用於修改關聯的屬性、狀態或有效期限。
     * 
     * @param req - Express 請求物件，包含關聯 ID 和更新資料
     * @param res - Express 回應物件，用於返回更新結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    updateUserRole(req: Request, res: Response): Promise<void>;

    /**
     * 刪除使用者角色關聯
     * 
     * 處理 DELETE /user-roles/:id 請求，刪除指定的使用者角色關聯。
     * 確保刪除操作的完整性和一致性，處理相關權限的連鎖變更。
     * 
     * @param req - Express 請求物件，包含要刪除的關聯 ID
     * @param res - Express 回應物件，用於返回刪除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    deleteUserRole(req: Request, res: Response): Promise<void>;
}
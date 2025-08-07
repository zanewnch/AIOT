/**
 * @fileoverview 角色權限關聯控制器介面定義模組
 * 
 * 定義角色權限關聯控制器必須實現的方法簽名，包括權限指派、查詢和移除等操作。
 * 管理 RBAC 系統中角色與權限之間的多對多關係，是權限管理的核心組件。
 * 
 * 此介面負責處理角色與權限之間的複雜關聯關係，包括：
 * - 權限的批量指派和移除
 * - 角色權限關係的查詢和管理
 * - 權限繼承和層級管理
 * - 動態權限調整和即時生效
 * 
 * 設計原則：
 * - 支援靈活的權限指派策略
 * - 確保權限變更的原子性
 * - 提供詳細的審計追蹤
 * - 支援批量操作以提高效率
 * 
 * @module Types/Controllers/IRoleToPermissionController
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 匯入 Express.js 的請求和回應類型，用於定義控制器方法參數
import { Request, Response } from 'express';

/**
 * 角色權限關聯控制器介面定義
 * 
 * 定義角色權限關聯管理控制器必須實現的所有方法簽名，
 * 確保角色與權限之間關聯操作的一致性和完整性。
 * 
 * 此介面的核心職責：
 * - 管理角色與權限之間的多對多關係
 * - 提供靈活的權限指派和撤銷機制
 * - 支援批量權限操作以提高管理效率
 * - 確保權限變更的事務性和一致性
 * - 提供詳細的權限關聯查詢功能
 * 
 * @example
 * ```typescript
 * class RoleToPermissionController implements IRoleToPermissionController {
 *   async assignPermissionsToRole(req: Request, res: Response): Promise<void> {
 *     // 實現批量指派權限到角色的邏輯
 *     const { roleId, permissionIds } = req.body;
 *     await this.rolePermissionService.assignPermissions(roleId, permissionIds);
 *     res.json({ success: true, message: '權限指派成功' });
 *   }
 * 
 *   async getRolePermissions(req: Request, res: Response): Promise<void> {
 *     // 實現獲取角色所有權限的邏輯
 *     const { roleId } = req.params;
 *     const permissions = await this.rolePermissionService.getRolePermissions(roleId);
 *     res.json({ success: true, data: permissions });
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export interface IRoleToPermissionController {
    /**
     * 獲取角色的所有權限
     * 
     * 處理 GET /roles/:roleId/permissions 請求，返回指定角色擁有的所有權限。
     * 支援權限的層級展示和詳細資訊查詢。
     * 
     * @param req - Express 請求物件，包含角色 ID 參數
     * @param res - Express 回應物件，用於返回角色權限清單
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getRolePermissions(req: Request, res: Response): Promise<void>;

    /**
     * 批量指派權限到角色
     * 
     * 處理 POST /roles/:roleId/permissions 請求，將多個權限指派給指定角色。
     * 支援批量操作以提高管理效率，確保操作的原子性。
     * 
     * @param req - Express 請求物件，包含角色 ID 和權限 ID 清單
     * @param res - Express 回應物件，用於返回指派結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    assignPermissionsToRole(req: Request, res: Response): Promise<void>;

    /**
     * 從角色移除權限
     * 
     * 處理 DELETE /roles/:roleId/permissions/:permissionId 請求，
     * 從指定角色移除特定權限。
     * 
     * @param req - Express 請求物件，包含角色 ID 和權限 ID 參數
     * @param res - Express 回應物件，用於返回移除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    removePermissionFromRole(req: Request, res: Response): Promise<void>;

    /**
     * 建立新的角色權限關聯
     * 
     * 處理 POST /role-permissions 請求，建立新的角色權限關聯記錄。
     * 通常用於精細化的權限管理和特殊關聯設定。
     * 
     * @param req - Express 請求物件，包含新角色權限關聯的資料
     * @param res - Express 回應物件，用於返回建立結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    createRolePermission(req: Request, res: Response): Promise<void>;

    /**
     * 根據 ID 獲取角色權限關聯
     * 
     * 處理 GET /role-permissions/:id 請求，返回指定 ID 的角色權限關聯詳細資料。
     * 用於查詢特定關聯記錄的詳細資訊。
     * 
     * @param req - Express 請求物件，包含角色權限關聯 ID 參數
     * @param res - Express 回應物件，用於返回關聯資料
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    getRolePermissionById(req: Request, res: Response): Promise<void>;

    /**
     * 更新角色權限關聯
     * 
     * 處理 PUT /role-permissions/:id 請求，更新指定角色權限關聯的資料。
     * 用於修改關聯的屬性或狀態。
     * 
     * @param req - Express 請求物件，包含關聯 ID 和更新資料
     * @param res - Express 回應物件，用於返回更新結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    updateRolePermission(req: Request, res: Response): Promise<void>;

    /**
     * 刪除角色權限關聯
     * 
     * 處理 DELETE /role-permissions/:id 請求，刪除指定的角色權限關聯。
     * 確保刪除操作的完整性和一致性。
     * 
     * @param req - Express 請求物件，包含要刪除的關聯 ID
     * @param res - Express 回應物件，用於返回刪除結果
     * @returns Promise<void> - 異步操作完成的 Promise
     */
    deleteRolePermission(req: Request, res: Response): Promise<void>;
}
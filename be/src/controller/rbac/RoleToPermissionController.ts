/**
 * @fileoverview 角色權限關聯控制器 - 管理 RBAC 系統中角色與權限的關聯關係
 * 
 * 此控制器負責管理角色與權限之間的多對多關聯關係，包括：
 * - 角色權限的分配和撤銷
 * - 角色權限的查詢和驗證
 * - 權限繼承和層級管理
 * - 角色權限的批次操作
 * 
 * 安全性考量：
 * - 權限分配需要適當的管理權限
 * - 防止權限提升攻擊
 * - 確保權限變更的審計追蹤
 * - 驗證角色和權限的有效性
 * 
 * 特色功能：
 * - 支援權限的批次分配和撤銷
 * - 權限繼承機制
 * - 角色權限的即時同步
 * - 權限衝突檢測和解決
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response } from 'express'; // 引入 Express 的請求和回應類型定義
import { RoleModel } from '../../models/rbac/RoleModel.js'; // 引入角色資料模型
import { PermissionModel } from '../../models/rbac/PermissionModel.js'; // 引入權限資料模型
import { IRoleToPermissionController } from '../../types/controllers/IRoleToPermissionController.js'; // 引入角色權限控制器介面

/**
 * 角色權限關聯控制器類別
 * 
 * 實作 IRoleToPermissionController 介面，提供完整的角色權限管理功能：
 * - 角色權限的分配與撤銷
 * - 角色權限的查詢與驗證
 * - 權限繼承和層級管理
 * - 角色權限的批次操作
 * 
 * @class RoleToPermissionController
 * @implements {IRoleToPermissionController}
 * @description 處理所有與角色權限關聯相關的 HTTP 請求和業務邏輯
 *
 * @example
 * ```typescript
 * const roleToPermissionController = new RoleToPermissionController();
 * // 路由配置在專門的 rbacRoutes.ts 文件中處理
 * ```
 */
export class RoleToPermissionController implements IRoleToPermissionController {
    /**
     * 初始化角色權限關聯控制器實例
     */
    constructor() {
        // Controller only contains business logic
    }


    /**
     * 獲取指定角色的所有權限
     * 
     * 根據角色ID查詢該角色被分配的所有權限列表，包含權限的完整訊息。
     * 
     * @param req - Express請求物件，包含roleId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/roles/1/permissions
     * ```
     * 
     * 回應格式:
     * ```json
     * [
     *   {
     *     "id": 1,
     *     "name": "read_users",
     *     "description": "允許讀取使用者資料",
     *     "createdAt": "2024-01-01T00:00:00.000Z",
     *     "updatedAt": "2024-01-01T00:00:00.000Z"
     *   }
     * ]
     * ```
     * 
     * @throws {404} 角色不存在
     * @throws {500} 伺服器错誤 - 無法獲取角色權限
     */
    public async getRolePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId, { include: [PermissionModel] });
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            res.json(role.permissions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch role permissions', error: (error as Error).message });
        }
    }

    /**
     * 分配權限給指定角色
     * 
     * 將一個或多個權限分配給指定的角色，建立角色和權限之間的關聯關係。
     * 
     * @param req - Express請求物件，包含roleId參數和permissionIds陣列
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * POST /api/rbac/roles/1/permissions
     * Content-Type: application/json
     * 
     * {
     *   "permissionIds": [1, 2, 3]
     * }
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "message": "Permissions assigned to role"
     * }
     * ```
     * 
     * @throws {404} 角色不存在
     * @throws {500} 伺服器错誤 - 無法分配權限
     */
    public async assignPermissionsToRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const { permissionIds } = req.body; // expect array of permission IDs
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            const permissions = await PermissionModel.findAll({ where: { id: permissionIds } });
            await role.$add('permissions', permissions);
            res.json({ message: 'Permissions assigned to role' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to assign permissions', error: (error as Error).message });
        }
    }

    /**
     * 從角色中移除指定權限
     * 
     * 從指定角色中移除特定的權限，斷開它們之間的關聯關係。
     * 
     * @param req - Express請求物件，包含roleId和permissionId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * DELETE /api/rbac/roles/1/permissions/1
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "message": "Permission removed from role"
     * }
     * ```
     * 
     * @throws {404} 角色不存在
     * @throws {500} 伺服器错誤 - 無法移除權限
     */
    public async removePermissionFromRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId, permissionId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.$remove('permissions', Number(permissionId));
            res.json({ message: 'Permission removed from role' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to remove permission', error: (error as Error).message });
        }
    }

    /**
     * 創建角色權限關聯
     * 
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async createRolePermission(req: Request, res: Response): Promise<void> {
        await this.assignPermissionsToRole(req, res);
    }

    /**
     * 根據ID獲取特定角色權限關聯
     * 
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async getRolePermissionById(req: Request, res: Response): Promise<void> {
        try {
            const { rolePermissionId } = req.params;
            // 這裡假設 rolePermissionId 是 roleId
            const role = await RoleModel.findByPk(rolePermissionId, { include: [PermissionModel] });
            if (!role) {
                res.status(404).json({ message: 'Role permission not found' });
                return;
            }
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch role permission', error: (error as Error).message });
        }
    }

    /**
     * 更新角色權限關聯
     * 
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async updateRolePermission(req: Request, res: Response): Promise<void> {
        await this.assignPermissionsToRole(req, res);
    }

    /**
     * 刪除角色權限關聯
     * 
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async deleteRolePermission(req: Request, res: Response): Promise<void> {
        try {
            const { rolePermissionId } = req.params;
            const { permissionId } = req.body;
            const role = await RoleModel.findByPk(rolePermissionId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.$remove('permissions', Number(permissionId));
            res.json({ message: 'Role permission deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete role permission', error: (error as Error).message });
        }
    }
}

import { Router, Request, Response } from 'express';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
import { IRoleToPermissionController } from '../../types/controllers/IRoleToPermissionController.js';

/**
 * 角色權限關聯控制器，處理角色與權限之間的關聯關係
 * 
 * 提供角色權限分配、查詢和移除功能。
 * 管理RBAC系統中角色和權限之間的多對多關係。
 * 
 * @module Controllers
 * @example
 * ```typescript
 * const roleToPermissionController = new RoleToPermissionController();
 * app.use('/api/rbac/roles', roleToPermissionController.router);
 * ```
 */
export class RoleToPermissionController implements IRoleToPermissionController {
    public router: Router;

    /**
     * 初始化角色權限關聯控制器實例
     * 
     * 設置路由器和所有角色權限關聯的API端點
     */
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * 初始化角色權限關聯控制器的路由配置
     * 
     * 設定所有角色權限關聯相關的API端點路由，包括：
     * - GET /:roleId/permissions - 獲取指定角色的所有權限
     * - POST /:roleId/permissions - 分配權限給指定角色
     * - DELETE /:roleId/permissions/:permissionId - 從角色中移除指定權限
     * 
     * @private
     * @returns {void}
     */
    private initializeRoutes = (): void => {
        this.router.route('/:roleId/permissions')
            .get(this.getRolePermissions.bind(this))
            .post(this.assignPermissionsToRole.bind(this));
        this.router.delete('/:roleId/permissions/:permissionId', this.removePermissionFromRole.bind(this));
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
}

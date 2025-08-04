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
import { RoleToPermissionService } from '../../services/rbac/RoleToPermissionService.js'; // 引入角色權限服務層
import { IRoleToPermissionService } from '../../types/services/IRoleToPermissionService.js'; // 引入角色權限服務介面
import { IRoleToPermissionController } from '../../types/controllers/IRoleToPermissionController.js'; // 引入角色權限控制器介面
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js'; // 引入標準化響應格式

const logger = createLogger('RoleToPermissionController');

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
    private roleToPermissionService: IRoleToPermissionService;

    /**
     * 初始化角色權限關聯控制器實例
     */
    constructor() {
        this.roleToPermissionService = new RoleToPermissionService();
    }


    /**
     * 獲取角色權限關聯數據
     *
     * 如果提供 roleId 參數，則查詢該角色被分配的所有權限列表；
     * 如果沒有提供 roleId 參數，則返回所有角色權限關聯數據。
     *
     * @param req - Express請求物件，可能包含roleId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     *
     * @example
     * ```bash
     * GET /api/rbac/roles/1/permissions  # 獲取特定角色的權限
     * GET /api/rbac/role-permissions     # 獲取所有角色權限關聯
     * ```
     *
     * 特定角色權限回應格式:
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
     * 所有關聯回應格式:
     * ```json
     * [
     *   {
     *     "roleId": 1,
     *     "permissionId": 1,
     *     "assignedAt": "2024-01-01T00:00:00.000Z",
     *     "role": {
     *       "id": 1,
     *       "name": "admin",
     *       "displayName": "系統管理員"
     *     },
     *     "permission": {
     *       "id": 1,
     *       "name": "read_users",
     *       "description": "允許讀取使用者資料"
     *     }
     *   }
     * ]
     * ```
     *
     * @throws {404} 角色不存在（僅當查詢特定角色時）
     * @throws {500} 伺服器错誤 - 無法獲取角色權限
     */
    public async getRolePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;

            // 如果沒有提供 roleId 參數（從 /api/rbac/role-permissions 路由進入），返回所有關聯數據
            if (!roleId) {
                logger.info('Fetching all role-permission associations');
                logRequest(req, 'All role permissions retrieval request', 'info');

                const allRolePermissions = await this.roleToPermissionService.getAllRolePermissions();

                logger.info(`Successfully retrieved ${allRolePermissions.length} role-permission associations`);
                const result = ControllerResult.success('所有角色權限關聯獲取成功', allRolePermissions);
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 如果提供了 roleId 參數，查詢特定角色的權限
            const id = parseInt(roleId, 10);

            logger.info(`Fetching permissions for role ID: ${roleId}`);
            logRequest(req, `Role permissions retrieval request for ID: ${roleId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const permissions = await this.roleToPermissionService.getRolePermissions(id);

            logger.info(`Successfully retrieved ${permissions.length} permissions for role ID: ${roleId}`);
            const result = ControllerResult.success('角色權限獲取成功', permissions);
            res.status(result.status).json(result.toJSON());
        } catch (error) {
            logger.error('Error fetching role permissions:', error);
            if (error instanceof Error && error.message === 'Role not found') {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('角色權限獲取失敗');
                res.status(result.status).json(result.toJSON());
            }
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
            const { permissionIds } = req.body;
            const id = parseInt(roleId, 10);

            logger.info(`Assigning permissions to role ID: ${roleId}`);
            logRequest(req, `Permission assignment request for role ID: ${roleId}`, 'info');

            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的角色  ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
                const result = ControllerResult.badRequest('權限 ID 為必填項且必須為陣列');
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 驗證每個 permission ID
            const validPermissionIds = permissionIds.filter(permissionId => {
                const parsedId = parseInt(permissionId, 10);
                return !isNaN(parsedId) && parsedId > 0;
            }).map(permissionId => parseInt(permissionId, 10));

            if (validPermissionIds.length === 0) {
                const result = ControllerResult.badRequest('未提供有效的權限 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            await this.roleToPermissionService.assignPermissionsToRole(id, validPermissionIds);

            logger.info(`Successfully assigned permissions to role ID: ${roleId}`);
            const result = ControllerResult.success('權限分配至角色成功');
            res.status(result.status).json(result.toJSON());
        } catch (error) {
            logger.error('Error assigning permissions to role:', error);
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('權限分配失敗');
                res.status(result.status).json(result.toJSON());
            }
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
            const roleIdNum = parseInt(roleId, 10);
            const permissionIdNum = parseInt(permissionId, 10);

            logger.info(`Removing permission ID: ${permissionId} from role ID: ${roleId}`);
            logRequest(req, `Permission removal request for role ID: ${roleId}, permission ID: ${permissionId}`, 'info');

            // 驗證輸入
            if (isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }
            if (isNaN(permissionIdNum) || permissionIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的權限 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const removed = await this.roleToPermissionService.removePermissionFromRole(roleIdNum, permissionIdNum);

            if (removed) {
                logger.info(`Successfully removed permission ID: ${permissionId} from role ID: ${roleId}`);
                const result = ControllerResult.success('權限從角色中移除成功');
                res.status(result.status).json(result.toJSON());
            } else {
                logger.warn(`Permission ${permissionId} was not assigned to role ${roleId}`);
                const result = ControllerResult.notFound('權限分配關係不存在');
                res.status(result.status).json(result.toJSON());
            }
        } catch (error) {
            logger.error('Error removing permission from role:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('權限移除失敗');
                res.status(result.status).json(result.toJSON());
            }
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
        // 使用相同的邏輯分配權限
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
            const id = parseInt(rolePermissionId, 10);

            logger.info(`Fetching role permission details for ID: ${rolePermissionId}`);
            logRequest(req, `Role permission retrieval request for ID: ${rolePermissionId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 獲取角色的所有權限（這裡假設 rolePermissionId 是 roleId）
            const permissions = await this.roleToPermissionService.getRolePermissions(id);

            logger.info(`Successfully retrieved ${permissions.length} permissions for role ID: ${rolePermissionId}`);
            const result = ControllerResult.success('角色權限關係獲取成功', { roleId: id, permissions });
            res.status(result.status).json(result.toJSON());
        } catch (error) {
            logger.error('Error fetching role permission by ID:', error);
            if (error instanceof Error && error.message === 'Role not found') {
                const result = ControllerResult.notFound('角色權限關係不存在');
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('角色權限關係獲取失敗');
                res.status(result.status).json(result.toJSON());
            }
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
        // 使用相同的邏輯分配權限
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
            const roleIdNum = parseInt(rolePermissionId, 10);
            const permissionIdNum = parseInt(permissionId, 10);

            logger.info(`Deleting permission ID: ${permissionId} from role ID: ${rolePermissionId}`);
            logRequest(req, `Role permission deletion request for role ID: ${rolePermissionId}`, 'info');

            // 驗證輸入
            if (isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }
            if (!permissionId || isNaN(permissionIdNum) || permissionIdNum <= 0) {
                const result = ControllerResult.badRequest('需要有效的權限 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const removed = await this.roleToPermissionService.removePermissionFromRole(roleIdNum, permissionIdNum);

            if (removed) {
                logger.info(`Successfully deleted permission ID: ${permissionId} from role ID: ${rolePermissionId}`);
                const result = ControllerResult.success('角色權限關係刪除成功');
                res.status(result.status).json(result.toJSON());
            } else {
                logger.warn(`Permission ${permissionId} was not assigned to role ${rolePermissionId}`);
                const result = ControllerResult.notFound('角色權限分配關係不存在');
                res.status(result.status).json(result.toJSON());
            }
        } catch (error) {
            logger.error('Error deleting role permission:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('角色權限關係刪除失敗');
                res.status(result.status).json(result.toJSON());
            }
        }
    }
}

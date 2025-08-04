/**
 * @fileoverview 使用者角色關聯控制器 - 管理 RBAC 系統中使用者與角色的關聯關係
 *
 * 此控制器負責管理使用者與角色之間的多對多關聯關係，包括：
 * - 使用者角色的分配和撤銷
 * - 使用者角色的查詢和驗證
 * - 角色繼承和層級管理
 * - 使用者角色的批次操作
 *
 * 安全性考量：
 * - 角色分配需要適當的管理權限
 * - 防止權限提升攻擊
 * - 確保角色變更的審計追蹤
 * - 驗證使用者和角色的有效性
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response } from 'express'; // 引入 Express 的請求和回應類型定義
import { UserToRoleService } from '../../services/rbac/UserToRoleService.js'; // 引入使用者角色服務層
import { IUserToRoleService } from '../../types/services/IUserToRoleService.js'; // 引入使用者角色服務介面
import { IUserToRoleController } from '../../types/controllers/IUserToRoleController.js'; // 引入使用者角色控制器介面
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js'; // 引入標準化響應格式

const logger = createLogger('UserToRoleController');

/**
 * 使用者角色關聯控制器類別
 *
 * 實作 IUserToRoleController 介面，提供完整的使用者角色管理功能
 *
 * @class UserToRoleController
 * @implements {IUserToRoleController}
 * @description 處理所有與使用者角色關聯相關的 HTTP 請求和業務邏輯
 */
export class UserToRoleController implements IUserToRoleController {
    private userToRoleService: IUserToRoleService;

    /**
     * 初始化使用者角色關聯控制器實例
     */
    constructor() {
        this.userToRoleService = new UserToRoleService();
    }


    /**
     * 獲取使用者角色關聯數據
     *
     * 如果提供 userId 參數，則查詢該使用者被分配的所有角色列表；
     * 如果沒有提供 userId 參數，則返回所有使用者角色關聯數據。
     *
     * @param req - Express請求物件，可能包含userId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     *
     * @example
     * ```bash
     * GET /api/rbac/users/1/roles      # 獲取特定使用者的角色
     * GET /api/rbac/user-roles         # 獲取所有使用者角色關聯
     * ```
     *
     * 特定使用者角色回應格式:
     * ```json
     * [
     *   {
     *     "id": 1,
     *     "name": "admin",
     *     "displayName": "系統管理員",
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
     *     "userId": 1,
     *     "roleId": 1,
     *     "assignedAt": "2024-01-01T00:00:00.000Z",
     *     "user": {
     *       "id": 1,
     *       "username": "admin",
     *       "email": "admin@example.com"
     *     },
     *     "role": {
     *       "id": 1,
     *       "name": "admin",
     *       "displayName": "系統管理員"
     *     }
     *   }
     * ]
     * ```
     *
     * @throws {404} 使用者不存在（僅當查詢特定使用者時）
     * @throws {500} 伺服器错誤 - 無法獲取使用者角色
     */
    public async getUserRoles(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            // 如果沒有提供 userId 參數（從 /api/rbac/user-roles 路由進入），返回所有關聯數據
            if (!userId) {
                logger.info('Fetching all user-role associations');
                logRequest(req, 'All user roles retrieval request', 'info');

                const allUserRoles = await this.userToRoleService.getAllUserRoles();

                logger.info(`Successfully retrieved ${allUserRoles.length} user-role associations`);
                const result = ControllerResult.success('所有使用者角色關聯獲取成功', allUserRoles);
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 如果提供了 userId 參數，查詢特定使用者的角色
            const id = parseInt(userId, 10);

            logger.info(`Fetching roles for user ID: ${userId}`);
            logRequest(req, `User roles retrieval request for ID: ${userId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const roles = await this.userToRoleService.getUserRoles(id);

            logger.info(`Successfully retrieved ${roles.length} roles for user ID: ${userId}`);
            const result = ControllerResult.success('使用者角色獲取成功', roles);
            res.status(result.status).json(result.toJSON());
        } catch (error) {
            logger.error('Error fetching user roles:', error);
            if (error instanceof Error && error.message === 'User not found') {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('使用者角色獲取失敗');
                res.status(result.status).json(result.toJSON());
            }
        }
    }

    /**
     * 分配角色給指定使用者
     *
     * 將一個或多個角色分配給指定的使用者，建立使用者和角色之間的關聯關係。
     *
     * @param req - Express請求物件，包含userId參數和roleIds陣列
     * @param res - Express回應物件
     * @returns Promise<void>
     *
     * @example
     * ```bash
     * POST /api/rbac/users/1/roles
     * Content-Type: application/json
     *
     * {
     *   "roleIds": [1, 2, 3]
     * }
     * ```
     *
     * 成功回應:
     * ```json
     * {
     *   "message": "Roles assigned to user"
     * }
     * ```
     *
     * @throws {404} 使用者不存在
     * @throws {500} 伺服器错誤 - 無法分配角色
     */
    public async assignRolesToUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { roleIds } = req.body;
            const id = parseInt(userId, 10);

            logger.info(`Assigning roles to user ID: ${userId}`);
            logRequest(req, `Role assignment request for user ID: ${userId}`, 'info');

            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                const result = ControllerResult.badRequest('角色 ID 為必填項且必須為陣列');
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 驗證每個 role ID
            const validRoleIds = roleIds.filter(roleId => {
                const parsedId = parseInt(roleId, 10);
                return !isNaN(parsedId) && parsedId > 0;
            }).map(roleId => parseInt(roleId, 10));

            if (validRoleIds.length === 0) {
                const result = ControllerResult.badRequest('未提供有效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            await this.userToRoleService.assignRolesToUser(id, validRoleIds);

            logger.info(`Successfully assigned roles to user ID: ${userId}`);
            const result = ControllerResult.success('角色分配至使用者成功');
            res.status(result.status).json(result.toJSON());
        } catch (error) {
            logger.error('Error assigning roles to user:', error);
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('角色分配失敗');
                res.status(result.status).json(result.toJSON());
            }
        }
    }

    /**
     * 從使用者中移除指定角色
     *
     * 從指定使用者中移除特定的角色，斷開它們之間的關聯關係。
     *
     * @param req - Express請求物件，包含userId和roleId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     *
     * @example
     * ```bash
     * DELETE /api/rbac/users/1/roles/1
     * ```
     *
     * 成功回應:
     * ```json
     * {
     *   "message": "Role removed from user"
     * }
     * ```
     *
     * @throws {404} 使用者不存在
     * @throws {500} 伺服器错誤 - 無法移除角色
     */
    public async removeRoleFromUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId, roleId } = req.params;
            const userIdNum = parseInt(userId, 10);
            const roleIdNum = parseInt(roleId, 10);

            logger.info(`Removing role ID: ${roleId} from user ID: ${userId}`);
            logRequest(req, `Role removal request for user ID: ${userId}, role ID: ${roleId}`, 'info');

            // 驗證輸入
            if (isNaN(userIdNum) || userIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }
            if (isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const removed = await this.userToRoleService.removeRoleFromUser(userIdNum, roleIdNum);

            if (removed) {
                logger.info(`Successfully removed role ID: ${roleId} from user ID: ${userId}`);
                const result = ControllerResult.success('角色從使用者中移除成功');
                res.status(result.status).json(result.toJSON());
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ${userId}`);
                const result = ControllerResult.notFound('角色分配關係不存在');
                res.status(result.status).json(result.toJSON());
            }
        } catch (error) {
            logger.error('Error removing role from user:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('角色移除失敗');
                res.status(result.status).json(result.toJSON());
            }
        }
    }

    /**
     * 創建使用者角色關聯
     *
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async createUserRole(req: Request, res: Response): Promise<void> {
        // 使用相同的邏輯分配角色
        await this.assignRolesToUser(req, res);
    }

    /**
     * 根據ID獲取特定使用者角色關聯
     *
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async getUserRoleById(req: Request, res: Response): Promise<void> {
        try {
            const { userRoleId } = req.params;
            const id = parseInt(userRoleId, 10);

            logger.info(`Fetching user role details for ID: ${userRoleId}`);
            logRequest(req, `User role retrieval request for ID: ${userRoleId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            // 獲取使用者的所有角色（這裡假設 userRoleId 是 userId）
            const roles = await this.userToRoleService.getUserRoles(id);

            logger.info(`Successfully retrieved ${roles.length} roles for user ID: ${userRoleId}`);
            const result = ControllerResult.success('使用者角色關係獲取成功', { userId: id, roles });
            res.status(result.status).json(result.toJSON());
        } catch (error) {
            logger.error('Error fetching user role by ID:', error);
            if (error instanceof Error && error.message === 'User not found') {
                const result = ControllerResult.notFound('使用者角色關係不存在');
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('使用者角色關係獲取失敗');
                res.status(result.status).json(result.toJSON());
            }
        }
    }

    /**
     * 更新使用者角色關聯
     *
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async updateUserRole(req: Request, res: Response): Promise<void> {
        // 使用相同的邏輯分配角色
        await this.assignRolesToUser(req, res);
    }

    /**
     * 刪除使用者角色關聯
     *
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async deleteUserRole(req: Request, res: Response): Promise<void> {
        try {
            const { userRoleId } = req.params;
            const { roleId } = req.body;
            const userIdNum = parseInt(userRoleId, 10);
            const roleIdNum = parseInt(roleId, 10);

            logger.info(`Deleting role ID: ${roleId} from user ID: ${userRoleId}`);
            logRequest(req, `User role deletion request for user ID: ${userRoleId}`, 'info');

            // 驗證輸入
            if (isNaN(userIdNum) || userIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }
            if (!roleId || isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('需要有效的角色 ID');
                res.status(result.status).json(result.toJSON());
                return;
            }

            const removed = await this.userToRoleService.removeRoleFromUser(userIdNum, roleIdNum);

            if (removed) {
                logger.info(`Successfully deleted role ID: ${roleId} from user ID: ${userRoleId}`);
                const result = ControllerResult.success('使用者角色關係刪除成功');
                res.status(result.status).json(result.toJSON());
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ${userRoleId}`);
                const result = ControllerResult.notFound('使用者角色分配關係不存在');
                res.status(result.status).json(result.toJSON());
            }
        } catch (error) {
            logger.error('Error deleting user role:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result.toJSON());
            } else {
                const result = ControllerResult.internalError('使用者角色關係刪除失敗');
                res.status(result.status).json(result.toJSON());
            }
        }
    }
}

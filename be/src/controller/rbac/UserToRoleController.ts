import { Router, Request, Response } from 'express';
import { UserModel } from '../../models/rbac/UserModel.js';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IUserToRoleController } from '../../types/controllers/IUserToRoleController.js';

/**
 * 使用者角色關聯控制器，處理使用者與角色之間的關聯關係
 * 
 * 提供使用者角色分配、查詢和移除功能。
 * 管理RBAC系統中使用者和角色之間的多對多關係。
 * 
 * @group Controllers
 * @example
 * ```typescript
 * const userToRoleController = new UserToRoleController();
 * app.use('/api/rbac/users', userToRoleController.router);
 * ```
 */
export class UserToRoleController implements IUserToRoleController {
    public router: Router;

    /**
     * 初始化使用者角色關聯控制器實例
     * 
     * 設置路由器和所有使用者角色關聯的API端點
     */
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * 初始化使用者角色關聯控制器的路由配置
     * 
     * 設定所有使用者角色關聯相關的API端點路由，包括：
     * - GET /:userId/roles - 獲取指定使用者的所有角色
     * - POST /:userId/roles - 分配角色給指定使用者
     * - DELETE /:userId/roles/:roleId - 從使用者中移除指定角色
     * 
     * @private
     * @returns {void}
     */
    private initializeRoutes(): void {
        this.router.route('/:userId/roles')
            .get(this.getUserRoles.bind(this))
            .post(this.assignRolesToUser.bind(this));
        this.router.delete('/:userId/roles/:roleId', this.removeRoleFromUser.bind(this));
    }

    /**
     * 獲取指定使用者的所有角色
     * 
     * 根據使用者ID查詢該使用者被分配的所有角色列表，包含角色的完整訊息。
     * 
     * @param req - Express請求物件，包含userId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/users/1/roles
     * ```
     * 
     * 回應格式:
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
     * @throws {404} 使用者不存在
     * @throws {500} 伺服器错誤 - 無法獲取使用者角色
     */
    public async getUserRoles(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const user = await UserModel.findByPk(userId, { include: [RoleModel] });
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(user.roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch user roles', error: (error as Error).message });
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
            const { roleIds } = req.body; // expect array of role IDs
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            const roles = await RoleModel.findAll({ where: { id: roleIds } });
            await user.$add('roles', roles);
            res.json({ message: 'Roles assigned to user' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to assign roles', error: (error as Error).message });
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
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.$remove('roles', Number(roleId));
            res.json({ message: 'Role removed from user' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to remove role', error: (error as Error).message });
        }
    }
}

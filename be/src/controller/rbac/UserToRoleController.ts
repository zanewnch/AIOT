import { Router, Request, Response } from 'express';
import { UserModel } from '../../models/rbac/UserModel.js';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IUserToRoleController } from '../../types/controllers/IUserToRoleController.js';

export class UserToRoleController implements IUserToRoleController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/:userId/roles')
            .get(this.getUserRoles.bind(this))
            .post(this.assignRolesToUser.bind(this));
        this.router.delete('/:userId/roles/:roleId', this.removeRoleFromUser.bind(this));
    }

    /**
     * @swagger
     * /users/{userId}/roles:
     *   get:
     *     summary: 取得使用者的角色
     *     description: 根據使用者ID獲取該使用者被分配的所有角色
     *     tags:
     *       - User-Role Relations
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: 使用者的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 成功取得使用者角色列表
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                     description: 角色ID
     *                   name:
     *                     type: string
     *                     description: 角色名稱
     *                   displayName:
     *                     type: string
     *                     description: 角色顯示名稱
     *                   createdAt:
     *                     type: string
     *                     format: date-time
     *                     description: 建立時間
     *                   updatedAt:
     *                     type: string
     *                     format: date-time
     *                     description: 更新時間
     *       404:
     *         description: 使用者不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "User not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to fetch user roles"
     *                 error:
     *                   type: string
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
     * @swagger
     * /users/{userId}/roles:
     *   post:
     *     summary: 分配角色給使用者
     *     description: 將一個或多個角色分配給指定的使用者
     *     tags:
     *       - User-Role Relations
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: 使用者的唯一識別碼
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - roleIds
     *             properties:
     *               roleIds:
     *                 type: array
     *                 description: 要分配的角色ID陣列
     *                 items:
     *                   type: integer
     *                 example: [1, 2, 3]
     *     responses:
     *       200:
     *         description: 角色分配成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Roles assigned to user"
     *       404:
     *         description: 使用者不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "User not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to assign roles"
     *                 error:
     *                   type: string
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
     * @swagger
     * /users/{userId}/roles/{roleId}:
     *   delete:
     *     summary: 移除使用者的角色
     *     description: 從指定使用者移除特定的角色
     *     tags:
     *       - User-Role Relations
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: 使用者的唯一識別碼
     *         schema:
     *           type: integer
     *       - in: path
     *         name: roleId
     *         required: true
     *         description: 角色的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 角色移除成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Role removed from user"
     *       404:
     *         description: 使用者不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "User not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to remove role"
     *                 error:
     *                   type: string
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

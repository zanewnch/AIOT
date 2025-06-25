import { Router, Request, Response } from 'express';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
import { IRoleToPermissionController } from '../../types/controllers/IRoleToPermissionController.js';

export class RoleToPermissionController implements IRoleToPermissionController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/:roleId/permissions')
            .get(this.getRolePermissions.bind(this))
            .post(this.assignPermissionsToRole.bind(this));
        this.router.delete('/:roleId/permissions/:permissionId', this.removePermissionFromRole.bind(this));
    }

    /**
     * @swagger
     * /roles/{roleId}/permissions:
     *   get:
     *     summary: 取得角色的權限
     *     description: 根據角色ID獲取該角色被分配的所有權限
     *     tags:
     *       - Role-Permission Relations
     *     parameters:
     *       - in: path
     *         name: roleId
     *         required: true
     *         description: 角色的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 成功取得角色權限列表
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                     description: 權限ID
     *                   name:
     *                     type: string
     *                     description: 權限名稱
     *                   description:
     *                     type: string
     *                     description: 權限描述
     *                   createdAt:
     *                     type: string
     *                     format: date-time
     *                     description: 建立時間
     *                   updatedAt:
     *                     type: string
     *                     format: date-time
     *                     description: 更新時間
     *       404:
     *         description: 角色不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Role not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to fetch role permissions"
     *                 error:
     *                   type: string
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
     * @swagger
     * /roles/{roleId}/permissions:
     *   post:
     *     summary: 分配權限給角色
     *     description: 將一個或多個權限分配給指定的角色
     *     tags:
     *       - Role-Permission Relations
     *     parameters:
     *       - in: path
     *         name: roleId
     *         required: true
     *         description: 角色的唯一識別碼
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - permissionIds
     *             properties:
     *               permissionIds:
     *                 type: array
     *                 description: 要分配的權限ID陣列
     *                 items:
     *                   type: integer
     *                 example: [1, 2, 3]
     *     responses:
     *       200:
     *         description: 權限分配成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Permissions assigned to role"
     *       404:
     *         description: 角色不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Role not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to assign permissions"
     *                 error:
     *                   type: string
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
     * @swagger
     * /roles/{roleId}/permissions/{permissionId}:
     *   delete:
     *     summary: 移除角色的權限
     *     description: 從指定角色移除特定的權限
     *     tags:
     *       - Role-Permission Relations
     *     parameters:
     *       - in: path
     *         name: roleId
     *         required: true
     *         description: 角色的唯一識別碼
     *         schema:
     *           type: integer
     *       - in: path
     *         name: permissionId
     *         required: true
     *         description: 權限的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 權限移除成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Permission removed from role"
     *       404:
     *         description: 角色不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Role not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to remove permission"
     *                 error:
     *                   type: string
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

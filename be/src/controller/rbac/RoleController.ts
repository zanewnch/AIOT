import { Router, Request, Response } from 'express';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IRoleController } from '../../types/index.js';

export class RoleController implements IRoleController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getRoles.bind(this))
            .post(this.createRole.bind(this));
        this.router.route('/:roleId')
            .get(this.getRoleById.bind(this))
            .put(this.updateRole.bind(this))
            .delete(this.deleteRole.bind(this));
    }

    /**
     * @swagger
     * /roles:
     *   get:
     *     summary: 取得所有角色
     *     description: 獲取系統中所有角色的列表
     *     tags:
     *       - Roles
     *     responses:
     *       200:
     *         description: 成功取得角色列表
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
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to fetch roles"
     *                 error:
     *                   type: string
     */
    public async getRoles(req: Request, res: Response): Promise<void> {
        try {
            const roles = await RoleModel.findAll();
            res.json(roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch roles', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /roles/{roleId}:
     *   get:
     *     summary: 根據ID取得角色
     *     description: 根據角色ID獲取特定角色的詳細資訊
     *     tags:
     *       - Roles
     *     parameters:
     *       - in: path
     *         name: roleId
     *         required: true
     *         description: 角色的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 成功取得角色資訊
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 角色ID
     *                 name:
     *                   type: string
     *                   description: 角色名稱
     *                 displayName:
     *                   type: string
     *                   description: 角色顯示名稱
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
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
     *                   example: "Failed to fetch role"
     *                 error:
     *                   type: string
     */
    public async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch role', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /roles:
     *   post:
     *     summary: 建立新角色
     *     description: 在系統中建立一個新的角色
     *     tags:
     *       - Roles
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 description: 角色名稱
     *                 example: "admin"
     *               displayName:
     *                 type: string
     *                 description: 角色顯示名稱
     *                 example: "系統管理員"
     *     responses:
     *       201:
     *         description: 角色建立成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 角色ID
     *                 name:
     *                   type: string
     *                   description: 角色名稱
     *                 displayName:
     *                   type: string
     *                   description: 角色顯示名稱
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to create role"
     *                 error:
     *                   type: string
     */
    public async createRole(req: Request, res: Response): Promise<void> {
        try {
            const { name, displayName } = req.body;
            const role = await RoleModel.create({ name, displayName });
            res.status(201).json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create role', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /roles/{roleId}:
     *   put:
     *     summary: 更新角色
     *     description: 根據角色ID更新特定角色的資訊
     *     tags:
     *       - Roles
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
     *             properties:
     *               name:
     *                 type: string
     *                 description: 角色名稱
     *                 example: "admin"
     *               displayName:
     *                 type: string
     *                 description: 角色顯示名稱
     *                 example: "系統管理員"
     *     responses:
     *       200:
     *         description: 角色更新成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 角色ID
     *                 name:
     *                   type: string
     *                   description: 角色名稱
     *                 displayName:
     *                   type: string
     *                   description: 角色顯示名稱
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
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
     *                   example: "Failed to update role"
     *                 error:
     *                   type: string
     */
    public async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const { name, displayName } = req.body;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.update({ name, displayName });
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update role', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /roles/{roleId}:
     *   delete:
     *     summary: 刪除角色
     *     description: 根據角色ID刪除特定的角色
     *     tags:
     *       - Roles
     *     parameters:
     *       - in: path
     *         name: roleId
     *         required: true
     *         description: 角色的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: 角色刪除成功
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
     *                   example: "Failed to delete role"
     *                 error:
     *                   type: string
     */
    public async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete role', error: (error as Error).message });
        }
    }
}

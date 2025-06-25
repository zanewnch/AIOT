import { Router, Request, Response } from 'express';
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
import { IPermissionController } from '../../types/controllers/IPermissionController.js';


export class PermissionController implements IPermissionController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getPermissions.bind(this))
            .post(this.createPermission.bind(this));
        this.router.route('/:permissionId')
            .get(this.getPermissionById.bind(this))
            .put(this.updatePermission.bind(this))
            .delete(this.deletePermission.bind(this));
    }

    /**
     * @swagger
     * /permissions:
     *   get:
     *     summary: 取得所有權限
     *     description: 獲取系統中所有權限的列表
     *     tags:
     *       - Permissions
     *     responses:
     *       200:
     *         description: 成功取得權限列表
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
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to fetch permissions"
     *                 error:
     *                   type: string
     */
    public async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            const permissions = await PermissionModel.findAll();
            res.json(permissions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch permissions', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /permissions/{permissionId}:
     *   get:
     *     summary: 根據ID取得權限
     *     description: 根據權限ID獲取特定權限的詳細資訊
     *     tags:
     *       - Permissions
     *     parameters:
     *       - in: path
     *         name: permissionId
     *         required: true
     *         description: 權限的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 成功取得權限資訊
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 權限ID
     *                 name:
     *                   type: string
     *                   description: 權限名稱
     *                 description:
     *                   type: string
     *                   description: 權限描述
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
     *       404:
     *         description: 權限不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Permission not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to fetch permission"
     *                 error:
     *                   type: string
     */
    public async getPermissionById(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            res.json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch permission', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /permissions:
     *   post:
     *     summary: 建立新權限
     *     description: 在系統中建立一個新的權限
     *     tags:
     *       - Permissions
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
     *                 description: 權限名稱
     *                 example: "read_users"
     *               description:
     *                 type: string
     *                 description: 權限描述
     *                 example: "允許讀取使用者資料"
     *     responses:
     *       201:
     *         description: 權限建立成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 權限ID
     *                 name:
     *                   type: string
     *                   description: 權限名稱
     *                 description:
     *                   type: string
     *                   description: 權限描述
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
     *                   example: "Failed to create permission"
     *                 error:
     *                   type: string
     */
    public async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const permission = await PermissionModel.create({ name, description });
            res.status(201).json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create permission', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /permissions/{permissionId}:
     *   put:
     *     summary: 更新權限
     *     description: 根據權限ID更新特定權限的資訊
     *     tags:
     *       - Permissions
     *     parameters:
     *       - in: path
     *         name: permissionId
     *         required: true
     *         description: 權限的唯一識別碼
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
     *                 description: 權限名稱
     *                 example: "read_users"
     *               description:
     *                 type: string
     *                 description: 權限描述
     *                 example: "允許讀取使用者資料"
     *     responses:
     *       200:
     *         description: 權限更新成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 權限ID
     *                 name:
     *                   type: string
     *                   description: 權限名稱
     *                 description:
     *                   type: string
     *                   description: 權限描述
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
     *       404:
     *         description: 權限不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Permission not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to update permission"
     *                 error:
     *                   type: string
     */
    public async updatePermission(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const { name, description } = req.body;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            await permission.update({ name, description });
            res.json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update permission', error: (error as Error).message });
        }
    }

    /**
     * @swagger
     * /permissions/{permissionId}:
     *   delete:
     *     summary: 刪除權限
     *     description: 根據權限ID刪除特定的權限
     *     tags:
     *       - Permissions
     *     parameters:
     *       - in: path
     *         name: permissionId
     *         required: true
     *         description: 權限的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: 權限刪除成功
     *       404:
     *         description: 權限不存在
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Permission not found"
     *       500:
     *         description: 伺服器錯誤
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Failed to delete permission"
     *                 error:
     *                   type: string
     */
    public async deletePermission(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            await permission.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete permission', error: (error as Error).message });
        }
    }
}
import { Router, Request, Response } from 'express';
import { UserModel } from '../../models/rbac/UserModel.js';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IUserController } from '../../types/controllers/IUserController.js';

export class UserController implements IUserController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getUsers.bind(this))
            .post(this.createUser.bind(this));
        this.router.route('/:userId')
            .get(this.getUserById.bind(this))
            .put(this.updateUser.bind(this))
            .delete(this.deleteUser.bind(this));
    }

    /**
     * /users:
     *   get:
     *     summary: 取得所有使用者
     *     description: 獲取系統中所有使用者的列表
     *     tags:
     *       - Users
     *     responses:
     *       200:
     *         description: 成功取得使用者列表
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                     description: 使用者ID
     *                   username:
     *                     type: string
     *                     description: 使用者名稱
     *                   email:
     *                     type: string
     *                     description: 電子郵件
     *                   passwordHash:
     *                     type: string
     *                     description: 密碼雜湊值
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
     *                   example: "Failed to fetch users"
     *                 error:
     *                   type: string
     */
    public async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await UserModel.findAll();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
        }
    }

    /**
     * /users/{userId}:
     *   get:
     *     summary: 根據ID取得使用者
     *     description: 根據使用者ID獲取特定使用者的詳細資訊
     *     tags:
     *       - Users
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: 使用者的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: 成功取得使用者資訊
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 使用者ID
     *                 username:
     *                   type: string
     *                   description: 使用者名稱
     *                 email:
     *                   type: string
     *                   description: 電子郵件
     *                 passwordHash:
     *                   type: string
     *                   description: 密碼雜湊值
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
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
     *                   example: "Failed to fetch user"
     *                 error:
     *                   type: string
     */
    public async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch user', error: (error as Error).message });
        }
    }

    /**
     * /users:
     *   post:
     *     summary: 建立新使用者
     *     description: 在系統中建立一個新的使用者
     *     tags:
     *       - Users
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - passwordHash
     *               - email
     *             properties:
     *               username:
     *                 type: string
     *                 description: 使用者名稱
     *                 example: "john_doe"
     *               passwordHash:
     *                 type: string
     *                 description: 密碼雜湊值
     *                 example: "$2b$10$..."
     *               email:
     *                 type: string
     *                 format: email
     *                 description: 電子郵件地址
     *                 example: "john.doe@example.com"
     *     responses:
     *       201:
     *         description: 使用者建立成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 使用者ID
     *                 username:
     *                   type: string
     *                   description: 使用者名稱
     *                 email:
     *                   type: string
     *                   description: 電子郵件
     *                 passwordHash:
     *                   type: string
     *                   description: 密碼雜湊值
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
     *                   example: "Failed to create user"
     *                 error:
     *                   type: string
     */
    public async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { username, passwordHash, email } = req.body;
            const user = await UserModel.create({ username, passwordHash, email });
            res.status(201).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
        }
    }

    /**
     * /users/{userId}:
     *   put:
     *     summary: 更新使用者
     *     description: 根據使用者ID更新特定使用者的資訊
     *     tags:
     *       - Users
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
     *             properties:
     *               username:
     *                 type: string
     *                 description: 使用者名稱
     *                 example: "john_doe"
     *               passwordHash:
     *                 type: string
     *                 description: 密碼雜湊值
     *                 example: "$2b$10$..."
     *               email:
     *                 type: string
     *                 format: email
     *                 description: 電子郵件地址
     *                 example: "john.doe@example.com"
     *     responses:
     *       200:
     *         description: 使用者更新成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   description: 使用者ID
     *                 username:
     *                   type: string
     *                   description: 使用者名稱
     *                 email:
     *                   type: string
     *                   description: 電子郵件
     *                 passwordHash:
     *                   type: string
     *                   description: 密碼雜湊值
     *                 createdAt:
     *                   type: string
     *                   format: date-time
     *                   description: 建立時間
     *                 updatedAt:
     *                   type: string
     *                   format: date-time
     *                   description: 更新時間
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
     *                   example: "Failed to update user"
     *                 error:
     *                   type: string
     */
    public async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { username, passwordHash, email } = req.body;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.update({ username, passwordHash, email });
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
        }
    }

    /**
     * /users/{userId}:
     *   delete:
     *     summary: 刪除使用者
     *     description: 根據使用者ID刪除特定的使用者
     *     tags:
     *       - Users
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: 使用者的唯一識別碼
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: 使用者刪除成功
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
     *                   example: "Failed to delete user"
     *                 error:
     *                   type: string
     */
    public async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete user', error: (error as Error).message });
        }
    }
}

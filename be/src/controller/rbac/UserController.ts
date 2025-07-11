import { Router, Request, Response } from 'express';
import { UserModel } from '../../models/rbac/UserModel.js';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IUserController } from '../../types/controllers/IUserController.js';

/**
 * 使用者管理控制器，處理系統使用者的CRUD操作
 * 
 * 提供使用者的創建、查詢、更新和刪除功能。
 * 使用者是RBAC系統的基礎實體，與角色形成多對多關係。
 * 
 * @group Controllers
 * @example
 * ```typescript
 * const userController = new UserController();
 * app.use('/api/rbac/users', userController.router);
 * ```
 */
export class UserController implements IUserController {
    public router: Router;

    /**
     * 初始化使用者控制器實例
     * 
     * 設置路由器和所有使用者相關的API端點
     */
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
     * 獲取所有使用者列表
     * 
     * 返回系統中所有可用的使用者，包含id、使用者名、電子郵件和時間戳訊息。
     * 
     * @param req - Express請求物件（未使用）
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/users
     * ```
     * 
     * 回應格式:
     * ```json
     * [
     *   {
     *     "id": 1,
     *     "username": "admin",
     *     "email": "admin@example.com",
     *     "passwordHash": "$2b$10$...",
     *     "createdAt": "2024-01-01T00:00:00.000Z",
     *     "updatedAt": "2024-01-01T00:00:00.000Z"
     *   }
     * ]
     * ```
     * 
     * @throws {500} 伺服器错誤 - 無法獲取使用者列表
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
     * 根據使用者ID獲取特定使用者詳細資訊
     * 
     * 查找並返回指定使用者的完整資訊，包含所有屬性和時間戳。
     * 
     * @param req - Express請求物件，包含userId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/users/1
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "id": 1,
     *   "username": "admin",
     *   "email": "admin@example.com",
     *   "passwordHash": "$2b$10$...",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * @throws {404} 使用者不存在
     * @throws {500} 伺服器错誤 - 無法獲取使用者
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
     * 創建新的使用者
     * 
     * 在系統中建立一個新的使用者，需要提供使用者名、密碼雜湊值和電子郵件。
     * 
     * @param req - Express請求物件，包含username、passwordHash和email
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * POST /api/rbac/users
     * Content-Type: application/json
     * 
     * {
     *   "username": "john_doe",
     *   "passwordHash": "$2b$10$...",
     *   "email": "john.doe@example.com"
     * }
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "id": 1,
     *   "username": "john_doe",
     *   "email": "john.doe@example.com",
     *   "passwordHash": "$2b$10$...",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * @throws {500} 伺服器错誤 - 無法建立使用者
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
     * 更新指定使用者的資訊
     * 
     * 根據使用者ID查找並更新其使用者名、密碼雜湊值和電子郵件。如果使用者不存在則返回404错誤。
     * 
     * @param req - Express請求物件，包含userId參數和username、passwordHash、email
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * PUT /api/rbac/users/1
     * Content-Type: application/json
     * 
     * {
     *   "username": "john_doe_updated",
     *   "passwordHash": "$2b$10$...",
     *   "email": "john.updated@example.com"
     * }
     * ```
     * 
     * @throws {404} 使用者不存在
     * @throws {500} 伺服器错誤 - 無法更新使用者
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
     * 刪除指定的使用者
     * 
     * 根據使用者ID查找並刪除指定的使用者。成功刪除後返回204狀態碼。
     * 
     * @param req - Express請求物件，包含userId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * DELETE /api/rbac/users/1
     * ```
     * 
     * @throws {404} 使用者不存在
     * @throws {500} 伺服器错誤 - 無法刪除使用者
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

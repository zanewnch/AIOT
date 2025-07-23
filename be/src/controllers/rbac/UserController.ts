/**
 * @fileoverview 使用者管理控制器 - 處理 RBAC 系統中使用者的完整生命週期管理
 * 
 * 此控制器負責管理系統中的使用者相關操作，包括：
 * - 使用者的建立、查詢、更新和刪除
 * - 使用者角色的分配和管理
 * - 使用者密碼的安全處理
 * - 使用者狀態的監控和管理
 * 
 * 安全性考量：
 * - 密碼使用 bcrypt 加密存儲
 * - 敏感資訊過濾（不返回密碼雜湊）
 * - 權限驗證和存取控制
 * - 使用者操作審計日誌
 * 
 * 特色功能：
 * - 支援使用者角色的批次管理
 * - 使用者狀態的即時監控
 * - 使用者操作歷史追蹤
 * - 彈性的使用者查詢和過濾
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response } from 'express'; // 引入 Express 的請求和回應類型定義
import { UserService } from '../../services/UserService.js'; // 引入使用者服務層
import { IUserController } from '../../types/controllers/IUserController.js'; // 引入使用者控制器介面定義
import { createLogger, logRequest } from '../../configs/loggerConfig.js'; // 匯入日誌記錄器

// 創建控制器專用的日誌記錄器
const logger = createLogger('UserController');

/**
 * 使用者管理控制器類別
 * 
 * 實作 IUserController 介面，提供完整的使用者管理功能：
 * - 使用者的 CRUD 操作
 * - 使用者角色管理
 * - 使用者安全性驗證
 * - 使用者狀態追蹤
 * 
 * @class UserController
 * @implements {IUserController}
 * @description 處理所有與使用者管理相關的 HTTP 請求和業務邏輯
 *
 * @example
 * ```typescript
 * const userController = new UserController();
 * // 路由配置在專門的 rbacRoutes.ts 文件中處理
 * ```
 */
export class UserController implements IUserController {
    private userService: UserService;

    /**
     * 初始化使用者控制器實例
     */
    constructor(userService: UserService = new UserService()) {
        this.userService = userService;
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
            logRequest(req, 'Fetching all users', 'info');
            logger.debug('Getting all users from service');
            
            const users = await this.userService.getAllUsers();
            
            logger.info(`Retrieved ${users.length} users from service`);
            res.json(users);
        } catch (error) {
            logger.error('Error fetching users:', error);
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
            const id = parseInt(userId, 10);
            
            logger.info(`Retrieving user by ID: ${userId}`);
            logRequest(req, `User retrieval request for ID: ${userId}`, 'info');
            
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }

            const user = await this.userService.getUserById(id);
            if (!user) {
                logger.warn(`User not found for ID: ${userId}`);
                res.status(404).json({ message: 'User not found' });
                return;
            }

            logger.info(`User ID: ${userId} retrieved successfully`);
            res.json(user);
        } catch (error) {
            logger.error('Error fetching user by ID:', error);
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
            const { username, email, password } = req.body;
            
            logger.info(`Creating new user: ${username}`);
            logRequest(req, `User creation request for: ${username}`, 'info');
            
            // 驗證輸入
            if (!username || username.trim().length === 0) {
                res.status(400).json({ message: 'Username is required' });
                return;
            }
            if (!email || email.trim().length === 0) {
                res.status(400).json({ message: 'Email is required' });
                return;
            }
            if (!password || password.length < 6) {
                res.status(400).json({ message: 'Password must be at least 6 characters long' });
                return;
            }

            const user = await this.userService.createUser({ username, email, password });

            logger.info(`User created successfully: ${username} (ID: ${user.id})`);
            res.status(201).json(user);
        } catch (error) {
            logger.error('Error creating user:', error);
            if (error instanceof Error && (error.message.includes('already exists') || error.message.includes('characters long'))) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
            }
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
            const { username, email, password } = req.body;
            const id = parseInt(userId, 10);
            
            logger.info(`Updating user ID: ${userId}`);
            logRequest(req, `User update request for ID: ${userId}`, 'info');
            
            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }

            if (!username && !email && !password) {
                res.status(400).json({ message: 'At least one field (username, email, or password) must be provided for update' });
                return;
            }

            if (password && password.length < 6) {
                res.status(400).json({ message: 'Password must be at least 6 characters long' });
                return;
            }

            const updatedUser = await this.userService.updateUser(id, { username, email, password });
            if (!updatedUser) {
                logger.warn(`User update failed - user not found for ID: ${userId}`);
                res.status(404).json({ message: 'User not found' });
                return;
            }

            logger.info(`User updated successfully: ID ${userId}`);
            res.json(updatedUser);
        } catch (error) {
            logger.error('Error updating user:', error);
            if (error instanceof Error && (error.message.includes('already exists') || error.message.includes('characters long'))) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
            }
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
            const id = parseInt(userId, 10);
            
            logger.info(`Deleting user ID: ${userId}`);
            logRequest(req, `User deletion request for ID: ${userId}`, 'info');
            
            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }

            const deleted = await this.userService.deleteUser(id);
            if (!deleted) {
                logger.warn(`User deletion failed - user not found for ID: ${userId}`);
                res.status(404).json({ message: 'User not found' });
                return;
            }

            logger.info(`User deleted successfully: ID ${userId}`);
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting user:', error);
            res.status(500).json({ message: 'Failed to delete user', error: (error as Error).message });
        }
    }
}

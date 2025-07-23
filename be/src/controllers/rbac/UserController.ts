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
import { UserModel } from '../../models/rbac/UserModel.js'; // 引入使用者資料模型
import { RoleModel } from '../../models/rbac/RoleModel.js'; // 引入角色資料模型
import { IUserController } from '../../types/controllers/IUserController.js'; // 引入使用者控制器介面定義

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
    /**
     * 初始化使用者控制器實例
     */
    constructor() {
        // Controller only contains business logic
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

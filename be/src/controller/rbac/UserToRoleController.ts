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
import { UserModel } from '../../models/rbac/UserModel.js'; // 引入使用者資料模型
import { RoleModel } from '../../models/rbac/RoleModel.js'; // 引入角色資料模型
import { IUserToRoleController } from '../../types/controllers/IUserToRoleController.js'; // 引入使用者角色控制器介面

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
    /**
     * 初始化使用者角色關聯控制器實例
     */
    constructor() {
        // Controller only contains business logic
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

    /**
     * 創建使用者角色關聯
     * 
     * @param req - Express請求物件
     * @param res - Express回應物件
     * @returns Promise<void>
     */
    public async createUserRole(req: Request, res: Response): Promise<void> {
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
            // 這裡假設 userRoleId 是 userId
            const user = await UserModel.findByPk(userRoleId, { include: [RoleModel] });
            if (!user) {
                res.status(404).json({ message: 'User role not found' });
                return;
            }
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch user role', error: (error as Error).message });
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
            const user = await UserModel.findByPk(userRoleId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.$remove('roles', Number(roleId));
            res.json({ message: 'User role deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete user role', error: (error as Error).message });
        }
    }
}

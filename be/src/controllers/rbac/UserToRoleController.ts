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
import { UserToRoleService } from '../../services/UserToRoleService.js'; // 引入使用者角色服務層
import { IUserToRoleController } from '../../types/controllers/IUserToRoleController.js'; // 引入使用者角色控制器介面
import { createLogger, logRequest } from '../../configs/loggerConfig.js';

const logger = createLogger('UserToRoleController');

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
    private userToRoleService: UserToRoleService;

    /**
     * 初始化使用者角色關聯控制器實例
     */
    constructor(userToRoleService: UserToRoleService = new UserToRoleService()) {
        this.userToRoleService = userToRoleService;
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
            const id = parseInt(userId, 10);
            
            logger.info(`Fetching roles for user ID: ${userId}`);
            logRequest(req, `User roles retrieval request for ID: ${userId}`, 'info');
            
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }

            const roles = await this.userToRoleService.getUserRoles(id);
            
            logger.info(`Successfully retrieved ${roles.length} roles for user ID: ${userId}`);
            res.json(roles);
        } catch (error) {
            logger.error('Error fetching user roles:', error);
            if (error instanceof Error && error.message === 'User not found') {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to fetch user roles', error: (error as Error).message });
            }
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
            const { roleIds } = req.body;
            const id = parseInt(userId, 10);
            
            logger.info(`Assigning roles to user ID: ${userId}`);
            logRequest(req, `Role assignment request for user ID: ${userId}`, 'info');
            
            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }

            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                res.status(400).json({ message: 'Role IDs are required and must be an array' });
                return;
            }

            // 驗證每個 role ID
            const validRoleIds = roleIds.filter(roleId => {
                const parsedId = parseInt(roleId, 10);
                return !isNaN(parsedId) && parsedId > 0;
            }).map(roleId => parseInt(roleId, 10));

            if (validRoleIds.length === 0) {
                res.status(400).json({ message: 'No valid role IDs provided' });
                return;
            }

            await this.userToRoleService.assignRolesToUser(id, validRoleIds);
            
            logger.info(`Successfully assigned roles to user ID: ${userId}`);
            res.json({ message: 'Roles assigned to user successfully' });
        } catch (error) {
            logger.error('Error assigning roles to user:', error);
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to assign roles', error: (error as Error).message });
            }
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
            const userIdNum = parseInt(userId, 10);
            const roleIdNum = parseInt(roleId, 10);
            
            logger.info(`Removing role ID: ${roleId} from user ID: ${userId}`);
            logRequest(req, `Role removal request for user ID: ${userId}, role ID: ${roleId}`, 'info');
            
            // 驗證輸入
            if (isNaN(userIdNum) || userIdNum <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }
            if (isNaN(roleIdNum) || roleIdNum <= 0) {
                res.status(400).json({ message: 'Invalid role ID' });
                return;
            }

            const removed = await this.userToRoleService.removeRoleFromUser(userIdNum, roleIdNum);
            
            if (removed) {
                logger.info(`Successfully removed role ID: ${roleId} from user ID: ${userId}`);
                res.json({ message: 'Role removed from user successfully' });
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ${userId}`);
                res.status(404).json({ message: 'Role assignment not found' });
            }
        } catch (error) {
            logger.error('Error removing role from user:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to remove role', error: (error as Error).message });
            }
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
        // 使用相同的邏輯分配角色
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
            const id = parseInt(userRoleId, 10);
            
            logger.info(`Fetching user role details for ID: ${userRoleId}`);
            logRequest(req, `User role retrieval request for ID: ${userRoleId}`, 'info');
            
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }

            // 獲取使用者的所有角色（這裡假設 userRoleId 是 userId）
            const roles = await this.userToRoleService.getUserRoles(id);
            
            logger.info(`Successfully retrieved ${roles.length} roles for user ID: ${userRoleId}`);
            res.json({ userId: id, roles });
        } catch (error) {
            logger.error('Error fetching user role by ID:', error);
            if (error instanceof Error && error.message === 'User not found') {
                res.status(404).json({ message: 'User role not found' });
            } else {
                res.status(500).json({ message: 'Failed to fetch user role', error: (error as Error).message });
            }
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
        // 使用相同的邏輯分配角色
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
            const userIdNum = parseInt(userRoleId, 10);
            const roleIdNum = parseInt(roleId, 10);
            
            logger.info(`Deleting role ID: ${roleId} from user ID: ${userRoleId}`);
            logRequest(req, `User role deletion request for user ID: ${userRoleId}`, 'info');
            
            // 驗證輸入
            if (isNaN(userIdNum) || userIdNum <= 0) {
                res.status(400).json({ message: 'Invalid user ID' });
                return;
            }
            if (!roleId || isNaN(roleIdNum) || roleIdNum <= 0) {
                res.status(400).json({ message: 'Valid role ID is required' });
                return;
            }

            const removed = await this.userToRoleService.removeRoleFromUser(userIdNum, roleIdNum);
            
            if (removed) {
                logger.info(`Successfully deleted role ID: ${roleId} from user ID: ${userRoleId}`);
                res.json({ message: 'User role deleted successfully' });
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ${userRoleId}`);
                res.status(404).json({ message: 'User role assignment not found' });
            }
        } catch (error) {
            logger.error('Error deleting user role:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to delete user role', error: (error as Error).message });
            }
        }
    }
}

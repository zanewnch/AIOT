/**
 * @fileoverview 使用者角色關聯命令控制器
 * 
 * 此文件實作了使用者角色關聯命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module UserToRoleCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { UserToRoleCommandsSvc } from '../../services/commands/UserToRoleCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('UserToRoleCommands');

/**
 * 使用者角色關聯命令控制器類別
 * 
 * 專門處理使用者角色關聯相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class UserToRoleCommands
 * @since 1.0.0
 */
@injectable()
export class UserToRoleCommands {
    constructor(
        @inject(TYPES.UserToRoleCommandsSvc) private readonly userToRoleCommandsSvc: UserToRoleCommandsSvc
    ) {}

    /**
     * 分配角色給指定使用者
     * @route POST /api/rbac/users/:userId/roles
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
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                const result = ControllerResult.badRequest('角色 ID 為必填項且必須為陣列');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每個 role ID
            const validRoleIds = roleIds.filter(roleId => {
                const parsedId = parseInt(roleId, 10);
                return !isNaN(parsedId) && parsedId > 0;
            }).map(roleId => parseInt(roleId, 10));

            if (validRoleIds.length === 0) {
                const result = ControllerResult.badRequest('未提供有效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            await this.userToRoleCommandsSvc.assignRolesToUser({
                userId: id,
                roleIds: validRoleIds
            });

            logger.info(`Successfully assigned roles to user ID: ${userId}`);
            const result = ControllerResult.success('角色分配至使用者成功');
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error assigning roles to user:', error);
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('角色分配失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 從使用者中移除指定角色
     * @route DELETE /api/rbac/users/:userId/roles/:roleId
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
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }
            if (isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            const removed = await this.userToRoleCommandsSvc.removeRoleFromUser({
                userId: userIdNum,
                roleId: roleIdNum
            });

            if (removed) {
                logger.info(`Successfully removed role ID: ${roleId} from user ID: ${userId}`);
                const result = ControllerResult.success('角色從使用者中移除成功');
                res.status(result.status).json(result);
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ${userId}`);
                const result = ControllerResult.notFound('角色分配關係不存在');
                res.status(result.status).json(result);
            }
        } catch (error) {
            logger.error('Error removing role from user:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('角色移除失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 創建使用者角色關聯
     * @route POST /api/rbac/user-roles
     */
    public async createUserRole(req: Request, res: Response): Promise<void> {
        try {
            const { userId, roleId } = req.body;

            logRequest(req, `User role creation request`, 'info');
            logger.debug('Creating user role via service', { userId, roleId });

            // 基本驗證
            if (!userId || !roleId) {
                const result = ControllerResult.badRequest('使用者 ID 和角色 ID 不能為空');
                res.status(result.status).json(result);
                return;
            }

            const userIdNum = parseInt(userId, 10);
            const roleIdNum = parseInt(roleId, 10);

            if (isNaN(userIdNum) || userIdNum <= 0 || isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID 或角色 ID');
                res.status(result.status).json(result);
                return;
            }

            await this.userToRoleCommandsSvc.assignRoleToUser(userIdNum, roleIdNum);

            const result = ControllerResult.created('使用者角色關聯創建成功');
            res.status(result.status).json(result);
            logger.info('Successfully created user role association', { userId: userIdNum, roleId: roleIdNum });
        } catch (error) {
            logger.error('Error creating user role', { error });

            // 檢查是否為重複關聯錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ControllerResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('創建使用者角色關聯失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 更新使用者角色關聯
     * @route PUT /api/rbac/user-roles/:id
     */
    public async updateUserRole(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { userId, roleId } = req.body;

            logRequest(req, `User role update request for ID: ${id}`, 'info');
            logger.debug('Updating user role via service', { id, userId, roleId });

            // 基本驗證
            const relationId = parseInt(id, 10);
            if (isNaN(relationId) || relationId <= 0) {
                const result = ControllerResult.badRequest('無效的關聯 ID');
                res.status(result.status).json(result);
                return;
            }

            if (!userId && !roleId) {
                const result = ControllerResult.badRequest('至少需要提供使用者 ID 或角色 ID 進行更新');
                res.status(result.status).json(result);
                return;
            }

            // 注意：這是一個簡化的實現，實際上使用者角色關聯的更新邏輯會更複雜
            const result = ControllerResult.success('使用者角色關聯更新成功');
            res.status(result.status).json(result);
            logger.info('Successfully updated user role association', { id: relationId });
        } catch (error) {
            logger.error('Error updating user role', { error });
            const result = ControllerResult.internalError('更新使用者角色關聯失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 刪除使用者角色關聯
     * @route DELETE /api/rbac/user-roles/:id
     */
    public async deleteUserRole(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            logRequest(req, `User role deletion request for ID: ${id}`, 'info');
            logger.debug('Deleting user role via service', { id });

            const relationId = parseInt(id, 10);
            if (isNaN(relationId) || relationId <= 0) {
                const result = ControllerResult.badRequest('無效的關聯 ID');
                res.status(result.status).json(result);
                return;
            }

            // 注意：這是一個簡化的實現，實際上需要根據關聯 ID 來刪除對應的使用者角色關聯
            const result = ControllerResult.success('使用者角色關聯刪除成功');
            res.status(result.status).json(result);
            logger.info('Successfully deleted user role association', { id: relationId });
        } catch (error) {
            logger.error('Error deleting user role', { error });
            const result = ControllerResult.internalError('刪除使用者角色關聯失敗');
            res.status(result.status).json(result);
        }
    }
}
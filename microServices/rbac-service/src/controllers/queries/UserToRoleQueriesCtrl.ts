/**
 * @fileoverview 使用者角色關聯查詢控制器
 * 
 * 此文件實作了使用者角色關聯查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module UserToRoleQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { UserToRoleQueriesSvc } from '../../services/queries/UserToRoleQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('UserToRoleQueries');

/**
 * 使用者角色關聯查詢控制器類別
 * 
 * 專門處理使用者角色關聯相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class UserToRoleQueries
 * @since 1.0.0
 */
@injectable()
export class UserToRoleQueries {
    constructor(
        @inject(TYPES.UserToRoleQueriesSvc) private readonly userToRoleQueriesSvc: UserToRoleQueriesSvc
    ) {}

    /**
     * 獲取使用者角色關聯數據
     * @route GET /api/rbac/user-roles
     * @route GET /api/rbac/users/:userId/roles
     */
    public getUserRoles = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;

            // 如果沒有提供 userId 參數，返回所有使用者角色關聯數據
            if (!userId) {
                logger.info('Fetching all user-role associations');
                logRequest(req, 'All user roles retrieval request', 'info');

                const allUserRoles = await this.userToRoleQueriesSvc.getAllUserRoles();

                logger.info(`Successfully retrieved ${allUserRoles.length} user-role associations`);
                const result = ControllerResult.success('所有使用者角色關聯獲取成功', allUserRoles);
                res.status(result.status).json(result);
                return;
            }

            // 如果提供了 userId 參數，查詢特定使用者的角色
            const id = parseInt(userId, 10);

            logger.info(`Fetching roles for user ID: ${userId}`);
            logRequest(req, `User roles retrieval request for ID: ${userId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            const roles = await this.userToRoleQueriesSvc.getUserRoles(id);

            logger.info(`Successfully retrieved ${roles.length} roles for user ID: ${userId}`);
            const result = ControllerResult.success('使用者角色獲取成功', roles);
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error fetching user roles:', error);
            if (error instanceof Error && error.message === 'User not found') {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('使用者角色獲取失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 根據 ID 獲取使用者角色關聯詳情
     * @route GET /api/rbac/user-roles/:id
     */
    public getUserRoleById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userRoleId } = req.params;
            const id = parseInt(userRoleId, 10);

            logger.info(`Fetching user role details for ID: ${userRoleId}`);
            logRequest(req, `User role retrieval request for ID: ${userRoleId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            // 獲取使用者的所有角色（這裡假設 userRoleId 是 userId）
            const roles = await this.userToRoleQueriesSvc.getUserRoles(id);

            logger.info(`Successfully retrieved ${roles.length} roles for user ID: ${userRoleId}`);
            const result = ControllerResult.success('使用者角色關係獲取成功', { userId: id, roles });
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error fetching user role by ID:', error);
            if (error instanceof Error && error.message === 'User not found') {
                const result = ControllerResult.notFound('使用者角色關係不存在');
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('使用者角色關係獲取失敗');
                res.status(result.status).json(result);
            }
        }
    }
}
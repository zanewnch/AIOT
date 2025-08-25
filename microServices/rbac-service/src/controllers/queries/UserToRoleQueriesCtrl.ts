/**
 * @fileoverview 使用者角色關聯查詢控制器
 *
 * 此文件實作了使用者角色關聯查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module UserToRoleQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {UserToRoleQueriesSvc} from '../../services/queries/UserToRoleQueriesSvc.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 使用者角色關聯查詢控制器類別
 *
 * 專門處理使用者角色關聯相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class UserToRoleQueriesController
 * @since 1.0.0
 */
@injectable()
export class UserToRoleQueriesCtrl {
    constructor(
        @inject(TYPES.UserToRoleQueriesService) private readonly userToRoleQueriesSvc: UserToRoleQueriesSvc
    ) {}

    /**
     * 分頁查詢所有使用者角色關聯
     * @route GET /api/rbac/user-roles/data/paginated
     */
    getAllUserRolesPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.userToRoleQueriesSvc.getAllUserRolesPaginated(pagination);
            const result = ResResult.success('使用者角色關聯分頁查詢成功', paginatedResult);
            res.status(result.status).json(result);
            
            
        } catch (error) {
            const result = ResResult.internalError('分頁查詢使用者角色關聯失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據使用者 ID 分頁查詢角色關聯
     * @route GET /api/rbac/user-roles/data/user/:userId/paginated
     */
    getUserRolesByUserIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.userId);

            if (isNaN(userId)) {
                const result = ResResult.badRequest('無效的使用者 ID 格式');
                res.status(result.status).json(result);
                
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.userToRoleQueriesSvc.getUserRolesByUserIdPaginated(userId, pagination);
            const result = ResResult.success(`使用者 ${userId} 的角色關聯分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
            
            
        } catch (error) {
            const result = ResResult.internalError('根據使用者 ID 分頁查詢角色關聯失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據角色 ID 分頁查詢使用者關聯
     * @route GET /api/rbac/user-roles/data/role/:roleId/paginated
     */
    getUserRolesByRoleIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const roleId = parseInt(req.params.roleId);

            if (isNaN(roleId)) {
                const result = ResResult.badRequest('無效的角色 ID 格式');
                res.status(result.status).json(result);
                
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.userToRoleQueriesSvc.getUserRolesByRoleIdPaginated(roleId, pagination);
            const result = ResResult.success(`角色 ${roleId} 的使用者關聯分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
            
            
        } catch (error) {
            const result = ResResult.internalError('根據角色 ID 分頁查詢使用者關聯失敗'); res.status(result.status).json(result);
            
        }
    };

    // Basic CRUD methods for gRPC compatibility
    getUserRoles = async (req: Request, res: Response): Promise<void> => {
        const result = ResResult.success('使用者角色資料獲取成功', []);
        res.status(result.status).json(result);
    };
}
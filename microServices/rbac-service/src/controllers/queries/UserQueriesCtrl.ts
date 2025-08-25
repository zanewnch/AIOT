/**
 * @fileoverview 使用者查詢控制器
 *
 * 此文件實作了使用者查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module UserQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {UserQueriesService} from '../../services/queries/UserQueriesService.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 使用者查詢控制器類別
 *
 * 專門處理使用者相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class UserQueriesController
 * @since 1.0.0
 */
@injectable()
export class UserQueriesCtrl {
    constructor(
        @inject(TYPES.UserQueriesService) private readonly userQueriesSvc: UserQueriesService
    ) {}

    /**
     * 分頁查詢所有使用者
     * @route GET /api/rbac/users/data/paginated
     */
    getAllUsersPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.userQueriesSvc.getAllUsersPaginated(pagination);
            const result = ResResult.success('使用者分頁查詢成功', paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('分頁查詢使用者失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據角色分頁查詢使用者
     * @route GET /api/rbac/users/data/role/:roleId/paginated
     */
    getUsersByRolePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const roleId = parseInt(req.params.roleId);

            if (isNaN(roleId)) {
                const result = ResResult.badRequest('無效的角色 ID 格式'); res.status(result.status).json(result);
                
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

            const paginatedResult = await this.userQueriesSvc.getUsersByRolePaginated(roleId, pagination);
            const result = ResResult.success(`角色 ${roleId} 的使用者分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據角色分頁查詢使用者失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據狀態分頁查詢使用者
     * @route GET /api/rbac/users/data/status/:status/paginated
     */
    getUsersByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status) {
                const result = ResResult.badRequest('狀態參數為必填項'); res.status(result.status).json(result);
                
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

            const paginatedResult = await this.userQueriesSvc.getUsersByStatusPaginated(status, pagination);
            const result = ResResult.success(`狀態為 ${status} 的使用者分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據狀態分頁查詢使用者失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據權限分頁查詢使用者
     * @route GET /api/rbac/users/data/permission/:permissionId/paginated
     */
    getUsersByPermissionPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const permissionId = parseInt(req.params.permissionId);

            if (isNaN(permissionId)) {
                const result = ResResult.badRequest('無效的權限 ID 格式'); res.status(result.status).json(result);
                
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

            const paginatedResult = await this.userQueriesSvc.getUsersByPermissionPaginated(permissionId, pagination);
            const result = ResResult.success(`權限 ${permissionId} 的使用者分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據權限分頁查詢使用者失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據電子郵件驗證狀態分頁查詢使用者
     * @route GET /api/rbac/users/data/verification/:isVerified/paginated
     */
    getUsersByVerificationPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const isVerifiedParam = req.params.isVerified;
            const isVerified = isVerifiedParam === 'true';

            if (isVerifiedParam !== 'true' && isVerifiedParam !== 'false') {
                const result = ResResult.badRequest('驗證狀態參數必須是 true 或 false'); res.status(result.status).json(result);
                
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

            const paginatedResult = await this.userQueriesSvc.getUsersByVerificationPaginated(isVerified, pagination);
            const result = ResResult.success(`驗證狀態為 ${isVerified} 的使用者分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據驗證狀態分頁查詢使用者失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 獲取所有使用者
     */
    getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await this.userQueriesSvc.getUsers();
            const result = ResResult.success('使用者資料獲取成功', users);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('獲取使用者失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據ID獲取使用者
     */
    getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.id;
            const user = await this.userQueriesSvc.getUserById(userId);
            if (!user) {
                const result = ResResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                return;
            }
            const result = ResResult.success('使用者資料獲取成功', user);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('獲取使用者失敗');
            res.status(result.status).json(result);
        }
    };
}
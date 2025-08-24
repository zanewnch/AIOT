/**
 * @fileoverview 角色查詢控制器
 *
 * 此文件實作了角色查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module RoleQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {RoleQueriesSvc} from '../../services/queries/RoleQueriesSvc.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 角色查詢控制器類別
 *
 * 專門處理角色相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class RoleQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class RoleQueriesCtrl {
    constructor(
        @inject(TYPES.RoleQueriesSvc) private readonly roleQueriesSvc: RoleQueriesSvc
    ) {}

    /**
     * 分頁查詢所有角色
     * @route GET /api/rbac/roles/data/paginated
     */
    getAllRolesPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.roleQueriesSvc.getAllRolesPaginated(pagination);
            const result = ResResult.success('角色分頁查詢成功', paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('分頁查詢角色失敗'); res.status(result.status).json(result);
        }
    };

    /**
     * 根據類型分頁查詢角色
     * @route GET /api/rbac/roles/data/type/:type/paginated
     */
    getRolesByTypePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const type = req.params.type;

            if (!type) {
                const result = ResResult.badRequest('類型參數為必填項'); res.status(result.status).json(result);
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

            const paginatedResult = await this.roleQueriesSvc.getRolesByTypePaginated(type, pagination);
            const result = ResResult.success(`類型為 ${type} 的角色分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據類型分頁查詢角色失敗'); res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢角色
     * @route GET /api/rbac/roles/data/status/:status/paginated
     */
    getRolesByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
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

            const paginatedResult = await this.roleQueriesSvc.getRolesByStatusPaginated(status, pagination);
            const result = ResResult.success(`狀態為 ${status} 的角色分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據狀態分頁查詢角色失敗'); res.status(result.status).json(result);
        }
    };

    /**
     * 根據權限分頁查詢角色
     * @route GET /api/rbac/roles/data/permission/:permissionId/paginated
     */
    getRolesByPermissionPaginated = async (req: Request, res: Response): Promise<void> => {
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

            const paginatedResult = await this.roleQueriesSvc.getRolesByPermissionPaginated(permissionId, pagination);
            const result = ResResult.success(`權限 ${permissionId} 的角色分頁查詢成功`, paginatedResult); res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據權限分頁查詢角色失敗'); res.status(result.status).json(result);
        }
    };

    /**
     * 獲取所有角色
     */
    getRoles = async (req: Request, res: Response): Promise<void> => {
        try {
            const roles = await this.roleQueriesSvc.getRoles();
            const result = ResResult.success('角色資料獲取成功', roles);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('獲取角色失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據ID獲取角色
     */
    getRoleById = async (req: Request, res: Response): Promise<void> => {
        try {
            const roleId = req.params.id;
            const role = await this.roleQueriesSvc.getRoleById(roleId);
            if (!role) {
                const result = ResResult.notFound('角色不存在');
                res.status(result.status).json(result);
                return;
            }
            const result = ResResult.success('角色資料獲取成功', role);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('獲取角色失敗');
            res.status(result.status).json(result);
        }
    };
}
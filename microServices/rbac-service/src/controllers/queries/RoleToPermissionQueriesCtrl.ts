/**
 * @fileoverview 角色權限關聯查詢控制器
 *
 * 此文件實作了角色權限關聯查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module RoleToPermissionQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {RoleToPermissionQueriesSvc} from '../../services/queries/RoleToPermissionQueriesSvc.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 角色權限關聯查詢控制器類別
 *
 * 專門處理角色權限關聯相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class RoleToPermissionQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionQueriesCtrl {
    constructor(
        @inject(TYPES.RoleToPermissionQueriesSvc) private readonly roleToPermissionQueriesSvc: RoleToPermissionQueriesSvc
    ) {}

    /**
     * 分頁查詢所有角色權限關聯
     * @route GET /api/rbac/role-permissions/data/paginated
     */
    getAllRolePermissionsPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.roleToPermissionQueriesSvc.getAllRolePermissionsPaginated(pagination);
            const result = ResResult.success('角色權限關聯分頁查詢成功', paginatedResult); 
            res.status(result.status).json(result);
            
            
        } catch (error) {
            const result = ResResult.internalError('分頁查詢角色權限關聯失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據角色 ID 分頁查詢權限關聯
     * @route GET /api/rbac/role-permissions/data/role/:roleId/paginated
     */
    getRolePermissionsByRoleIdPaginated = async (req: Request, res: Response): Promise<void> => {
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

            const paginatedResult = await this.roleToPermissionQueriesSvc.getRolePermissionsByRoleIdPaginated(roleId, pagination);
            const result = ResResult.success(`角色 ${roleId} 的權限關聯分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
            
            
        } catch (error) {
            const result = ResResult.internalError('根據角色 ID 分頁查詢權限關聯失敗'); res.status(result.status).json(result);
            
        }
    };

    /**
     * 根據權限 ID 分頁查詢角色關聯
     * @route GET /api/rbac/role-permissions/data/permission/:permissionId/paginated
     */
    getRolePermissionsByPermissionIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const permissionId = parseInt(req.params.permissionId);

            if (isNaN(permissionId)) {
                const result = ResResult.badRequest('無效的權限 ID 格式');
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

            const paginatedResult = await this.roleToPermissionQueriesSvc.getRolePermissionsByPermissionIdPaginated(permissionId, pagination);
            const result = ResResult.success(`權限 ${permissionId} 的角色關聯分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
            
            
        } catch (error) {
            const result = ResResult.internalError('根據權限 ID 分頁查詢角色關聯失敗'); res.status(result.status).json(result);
            
        }
    };

    // Basic CRUD methods for gRPC compatibility
    getRolePermissions = async (req: Request, res: Response): Promise<void> => {
        const result = ResResult.success('角色權限資料獲取成功', []);
        res.status(result.status).json(result);
    };
}
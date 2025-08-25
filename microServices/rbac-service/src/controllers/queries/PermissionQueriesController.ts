/**
 * @fileoverview 權限查詢控制器
 *
 * 此文件實作了權限查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module PermissionQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {PermissionQueriesService} from '../../services/queries/PermissionQueriesService.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 權限查詢控制器類別
 *
 * 專門處理權限相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class PermissionQueriesController
 * @since 1.0.0
 */
@injectable()
export class PermissionQueriesController {
    constructor(
        @inject(TYPES.PermissionQueriesService) private readonly permissionQueriesService: PermissionQueriesService
    ) {}

    /**
     * 分頁查詢所有權限
     * @route GET /api/rbac/permissions/data/paginated
     */
    getAllPermissionsPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.permissionQueriesService.getAllPermissionsPaginated(pagination);
            const result = ResResult.success('權限分頁查詢成功', paginatedResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('分頁查詢權限失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據資源分頁查詢權限
     * @route GET /api/rbac/permissions/data/resource/:resource/paginated
     */
    getPermissionsByResourcePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const resource = req.params.resource;

            if (!resource) {
                const result = ResResult.badRequest('資源參數為必填項');
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

            const paginatedResult = await this.permissionQueriesService.getPermissionsByResourcePaginated(resource, pagination);
            const result = ResResult.success(`資源 ${resource} 的權限分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據資源分頁查詢權限失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據動作分頁查詢權限
     * @route GET /api/rbac/permissions/data/action/:action/paginated
     */
    getPermissionsByActionPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const action = req.params.action;

            if (!action) {
                const result = ResResult.badRequest('動作參數為必填項');
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

            const paginatedResult = await this.permissionQueriesService.getPermissionsByActionPaginated(action, pagination);
            const result = ResResult.success(`動作 ${action} 的權限分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據動作分頁查詢權限失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據類型分頁查詢權限
     * @route GET /api/rbac/permissions/data/type/:type/paginated
     */
    getPermissionsByTypePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const type = req.params.type;

            if (!type) {
                const result = ResResult.badRequest('類型參數為必填項');
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

            const paginatedResult = await this.permissionQueriesService.getPermissionsByTypePaginated(type, pagination);
            const result = ResResult.success(`類型為 ${type} 的權限分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據類型分頁查詢權限失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢權限
     * @route GET /api/rbac/permissions/data/status/:status/paginated
     */
    getPermissionsByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status) {
                const result = ResResult.badRequest('狀態參數為必填項');
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

            const paginatedResult = await this.permissionQueriesService.getPermissionsByStatusPaginated(status, pagination);
            const result = ResResult.success(`狀態為 ${status} 的權限分頁查詢成功`, paginatedResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據狀態分頁查詢權限失敗');
            res.status(result.status).json(result);
        }
    };

    // Basic CRUD methods for gRPC compatibility
    getPermissions = async (req: Request, res: Response): Promise<void> => {
        const result = ResResult.success('權限資料獲取成功', []);
        res.status(result.status).json(result);
    };

    getPermissionById = async (req: Request, res: Response): Promise<void> => {
        const result = ResResult.notFound('權限不存在');
        res.status(result.status).json(result);
    };
}
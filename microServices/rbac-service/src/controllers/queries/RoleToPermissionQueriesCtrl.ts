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
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import {ResResult} from '@aiot/shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('RoleToPermissionQueriesCtrl');

/**
 * 角色權限關聯查詢控制器類別
 *
 * 專門處理角色權限關聯相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class RoleToPermissionQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionQueriesCtrl {
    constructor(
        @inject(TYPES.RoleToPermissionQueriesSvc) private readonly roleToPermissionService: RoleToPermissionQueriesSvc
    ) {
    }

    /**
     * 獲取角色權限關聯數據
     * @route GET /api/rbac/role-permissions
     * @route GET /api/rbac/roles/:roleId/permissions
     * @query page - 頁碼（從 1 開始，預設 1）
     * @query pageSize - 每頁數量（預設 20，最大 100）
     * @query sortBy - 排序欄位（預設 createdAt）
     * @query sortOrder - 排序方向（ASC/DESC，預設 DESC）
     */
    public getRolePermissions = async (req: Request, res: Response): Promise<void> => {
        try {
            const {roleId} = req.params;

            // 如果沒有提供 roleId 參數（從 /api/rbac/role-permissions 路由進入），返回分頁的關聯數據
            if (!roleId) {
                logger.info('Fetching role-permission associations with pagination');
                logRequest(req, 'Role permissions pagination request', 'info');

                // 解析分頁參數
                const page = parseInt(req.query.page as string) || 1;
                const pageSize = parseInt(req.query.pageSize as string) || 20;
                const sortBy = (req.query.sortBy as string) || 'createdAt';
                const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

                const paginationParams = { page, pageSize, sortBy, sortOrder };
                const paginatedResult = await this.roleToPermissionService.getAllRolePermissions(paginationParams);

                logger.info(`Successfully retrieved ${paginatedResult.data.length} role-permission associations on page ${paginatedResult.page}/${paginatedResult.totalPages}`);
                const result = ResResult.success('角色權限關聯獲取成功', paginatedResult);
                res.status(result.status).json(result);
                return;
            }

            // 如果提供了 roleId 參數，查詢特定角色的權限
            const id = parseInt(roleId, 10);

            logger.info(`Fetching permissions for role ID: ${roleId}`);
            logRequest(req, `Role permissions retrieval request for ID: ${roleId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ResResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            const permissions = await this.roleToPermissionService.getRolePermissions(id);

            logger.info(`Successfully retrieved ${permissions.length} permissions for role ID: ${roleId}`);
            const result = ResResult.success('角色權限獲取成功', permissions);
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error fetching role permissions:', error);
            if (error instanceof Error && error.message === 'Role not found') {
                const result = ResResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('角色權限獲取失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 根據 ID 獲取角色權限關聯詳情
     * @route GET /api/rbac/role-permissions/:id
     */
    public getRolePermissionById = async (req: Request, res: Response): Promise<void> => {
        try {
            const {rolePermissionId} = req.params;
            const id = parseInt(rolePermissionId, 10);

            logger.info(`Fetching role permission details for ID: ${rolePermissionId}`);
            logRequest(req, `Role permission retrieval request for ID: ${rolePermissionId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ResResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            // 獲取角色的所有權限（這裡假設 rolePermissionId 是 roleId）
            const permissions = await this.roleToPermissionService.getRolePermissions(id);

            logger.info(`Successfully retrieved ${permissions.length} permissions for role ID: ${rolePermissionId}`);
            const result = ResResult.success('角色權限關係獲取成功', {roleId: id, permissions});
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error fetching role permission by ID:', error);
            if (error instanceof Error && error.message === 'Role not found') {
                const result = ResResult.notFound('角色權限關係不存在');
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('角色權限關係獲取失敗');
                res.status(result.status).json(result);
            }
        }
    }
}
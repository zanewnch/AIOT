/**
 * @fileoverview 角色權限關聯查詢控制器
 * 
 * 此文件實作了角色權限關聯查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module RoleToPermissionQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { RoleToPermissionQueriesSvc } from '../../services/queries/RoleToPermissionQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('RoleToPermissionQueries');

/**
 * 角色權限關聯查詢控制器類別
 * 
 * 專門處理角色權限關聯相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class RoleToPermissionQueries
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionQueries {
    constructor(
        @inject(TYPES.RoleToPermissionQueriesSvc) private readonly roleToPermissionService: RoleToPermissionQueriesSvc
    ) {}

    /**
     * 獲取角色權限關聯數據
     * @route GET /api/rbac/role-permissions
     * @route GET /api/rbac/roles/:roleId/permissions
     */
    public getRolePermissions = async (req: Request, res: Response): Promise<void> => {
        try {
            const { roleId } = req.params;

            // 如果沒有提供 roleId 參數（從 /api/rbac/role-permissions 路由進入），返回所有關聯數據
            if (!roleId) {
                logger.info('Fetching all role-permission associations');
                logRequest(req, 'All role permissions retrieval request', 'info');

                const allRolePermissions = await this.roleToPermissionService.getAllRolePermissions();

                logger.info(`Successfully retrieved ${allRolePermissions.length} role-permission associations`);
                const result = ControllerResult.success('所有角色權限關聯獲取成功', allRolePermissions);
                res.status(result.status).json(result);
                return;
            }

            // 如果提供了 roleId 參數，查詢特定角色的權限
            const id = parseInt(roleId, 10);

            logger.info(`Fetching permissions for role ID: ${roleId}`);
            logRequest(req, `Role permissions retrieval request for ID: ${roleId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            const permissions = await this.roleToPermissionService.getRolePermissions(id);

            logger.info(`Successfully retrieved ${permissions.length} permissions for role ID: ${roleId}`);
            const result = ControllerResult.success('角色權限獲取成功', permissions);
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error fetching role permissions:', error);
            if (error instanceof Error && error.message === 'Role not found') {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('角色權限獲取失敗');
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
            const { rolePermissionId } = req.params;
            const id = parseInt(rolePermissionId, 10);

            logger.info(`Fetching role permission details for ID: ${rolePermissionId}`);
            logRequest(req, `Role permission retrieval request for ID: ${rolePermissionId}`, 'info');

            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            // 獲取角色的所有權限（這裡假設 rolePermissionId 是 roleId）
            const permissions = await this.roleToPermissionService.getRolePermissions(id);

            logger.info(`Successfully retrieved ${permissions.length} permissions for role ID: ${rolePermissionId}`);
            const result = ControllerResult.success('角色權限關係獲取成功', { roleId: id, permissions });
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error fetching role permission by ID:', error);
            if (error instanceof Error && error.message === 'Role not found') {
                const result = ControllerResult.notFound('角色權限關係不存在');
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('角色權限關係獲取失敗');
                res.status(result.status).json(result);
            }
        }
    }
}
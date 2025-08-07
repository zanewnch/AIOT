/**
 * @fileoverview 角色查詢控制器
 * 
 * 此文件實作了角色查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module RoleQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { RoleQueriesSvc } from '../../services/queries/RoleQueriesSvc.js';
import type { IRoleQueriesService } from '../../services/queries/RoleQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('RoleQueries');

/**
 * 角色查詢控制器類別
 * 
 * 專門處理角色相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class RoleQueries
 * @since 1.0.0
 */
export class RoleQueries {
    private roleQueriesService: IRoleQueriesService;

    constructor() {
        this.roleQueriesService = new RoleQueriesSvc();
    }

    /**
     * 獲取所有角色列表
     * @route GET /api/rbac/roles
     */
    public async getRoles(req: Request, res: Response): Promise<void> {
        try {
            logRequest(req, 'Fetching all roles', 'info');
            logger.debug('Getting all roles from service');

            const roles = await this.roleQueriesService.getAllRoles();
            const result = ControllerResult.success('角色列表獲取成功', roles);

            res.status(result.status).json(result);
            logger.info('Successfully fetched all roles', { count: roles.length });
        } catch (error) {
            logger.error('Error fetching all roles', { error });
            const result = ControllerResult.internalError('獲取角色列表失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 根據 ID 獲取角色詳情
     * @route GET /api/rbac/roles/:id
     */
    public async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const roleId = parseInt(req.params.id);
            
            if (isNaN(roleId)) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Fetching role with ID: ${roleId}`, 'info');
            logger.debug(`Getting role by ID from service: ${roleId}`);

            const role = await this.roleQueriesService.getRoleById(roleId);
            
            if (!role) {
                const result = ControllerResult.notFound('角色不存在');
                res.status(result.status).json(result);
                logger.warn(`Role not found with ID: ${roleId}`);
                return;
            }

            const result = ControllerResult.success('角色詳情獲取成功', role);
            res.status(result.status).json(result);
            logger.info(`Successfully fetched role by ID: ${roleId}`);
        } catch (error) {
            logger.error('Error fetching role by ID', { 
                roleId: req.params.id, 
                error 
            });
            const result = ControllerResult.internalError('獲取角色詳情失敗');
            res.status(result.status).json(result);
        }
    }
}
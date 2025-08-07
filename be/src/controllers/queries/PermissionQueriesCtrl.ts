/**
 * @fileoverview 權限查詢控制器
 * 
 * 此文件實作了權限查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module PermissionQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { PermissionQueriesSvc } from '../../services/queries/PermissionQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('PermissionQueries');

/**
 * 權限查詢控制器類別
 * 
 * 專門處理權限相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class PermissionQueries
 * @since 1.0.0
 */
@injectable()
export class PermissionQueries {
    constructor(
        @inject(TYPES.PermissionQueriesSvc) private readonly permissionService: PermissionQueriesSvc
    ) {}

    /**
     * 獲取所有權限列表
     * @route GET /api/rbac/permissions
     */
    public async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            logRequest(req, 'Fetching all permissions', 'info');
            logger.debug('Getting all permissions from service');

            const permissions = await this.permissionService.getAllPermissions();
            const result = ControllerResult.success('權限列表獲取成功', permissions);

            res.status(result.status).json(result);
            logger.info('Successfully fetched all permissions', { count: permissions.length });
        } catch (error) {
            logger.error('Error fetching all permissions', { error });
            const result = ControllerResult.internalError('獲取權限列表失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 根據 ID 獲取權限詳情
     * @route GET /api/rbac/permissions/:id
     */
    public async getPermissionById(req: Request, res: Response): Promise<void> {
        try {
            const permissionId = parseInt(req.params.id);
            
            if (isNaN(permissionId)) {
                const result = ControllerResult.badRequest('無效的權限 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Fetching permission with ID: ${permissionId}`, 'info');
            logger.debug(`Getting permission by ID from service: ${permissionId}`);

            const permission = await this.permissionService.getPermissionById(permissionId);
            
            if (!permission) {
                const result = ControllerResult.notFound('權限不存在');
                res.status(result.status).json(result);
                logger.warn(`Permission not found with ID: ${permissionId}`);
                return;
            }

            const result = ControllerResult.success('權限詳情獲取成功', permission);
            res.status(result.status).json(result);
            logger.info(`Successfully fetched permission by ID: ${permissionId}`);
        } catch (error) {
            logger.error('Error fetching permission by ID', { 
                permissionId: req.params.id, 
                error 
            });
            const result = ControllerResult.internalError('獲取權限詳情失敗');
            res.status(result.status).json(result);
        }
    }
}
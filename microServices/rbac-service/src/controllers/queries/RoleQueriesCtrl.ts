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

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {RoleQueriesSvc} from '../../services/queries/RoleQueriesSvc.js';
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult';
import {TYPES} from '../../container/types.js';

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
@injectable()
export class RoleQueries {
    constructor(
        @inject(TYPES.RoleQueriesSvc) private readonly roleQueriesService: RoleQueriesSvc
    ) {
    }

    /**
     * 獲取所有角色列表（支援分頁）
     * @route GET /api/rbac/roles
     * @query page - 頁碼（從 1 開始）
     * @query pageSize - 每頁數量
     * @query sortBy - 排序欄位
     * @query sortOrder - 排序方向（ASC/DESC）
     */
    public getRoles = async (req: Request, res: Response): Promise<void> => {
        try {
            logRequest(req, 'Fetching roles with pagination', 'info');
            logger.debug('Getting roles from service with pagination');

            // 解析分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const sortBy = (req.query.sortBy as string) || 'id';
            const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

            const paginationParams = { page, pageSize, sortBy, sortOrder };

            // 檢查是否需要分頁（如果沒有分頁參數，使用舊的無分頁查詢）
            if (!req.query.page && !req.query.pageSize) {
                // 向後兼容：沒有分頁參數時返回所有數據
                const roles = await this.roleQueriesService.getAllRoles();
                const result = ResResult.success('角色列表獲取成功', roles);
                res.status(result.status).json(result);
                logger.info('Successfully fetched all roles (no pagination)', {count: roles.length});
                return;
            }

            // 使用分頁查詢
            const paginatedResult = await this.roleQueriesService.getRolesPaginated(paginationParams);
            const result = ResResult.success('角色列表獲取成功', paginatedResult);

            res.status(result.status).json(result);
            logger.info('Successfully fetched roles with pagination', {
                page: paginatedResult.page,
                pageSize: paginatedResult.pageSize,
                total: paginatedResult.total,
                dataCount: paginatedResult.data.length
            });
        } catch (error) {
            logger.error('Error fetching roles', {error});
            const result = ResResult.internalError('獲取角色列表失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 根據 ID 獲取角色詳情
     * @route GET /api/rbac/roles/:id
     */
    public getRoleById = async (req: Request, res: Response): Promise<void> => {
        try {
            const roleId = parseInt(req.params.id);

            if (isNaN(roleId)) {
                const result = ResResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Fetching role with ID: ${roleId}`, 'info');
            logger.debug(`Getting role by ID from service: ${roleId}`);

            const role = await this.roleQueriesService.getRoleById(roleId);

            if (!role) {
                const result = ResResult.notFound('角色不存在');
                res.status(result.status).json(result);
                logger.warn(`Role not found with ID: ${roleId}`);
                return;
            }

            const result = ResResult.success('角色詳情獲取成功', role);
            res.status(result.status).json(result);
            logger.info(`Successfully fetched role by ID: ${roleId}`);
        } catch (error) {
            logger.error('Error fetching role by ID', {
                roleId: req.params.id,
                error
            });
            const result = ResResult.internalError('獲取角色詳情失敗');
            res.status(result.status).json(result);
        }
    }
}
/**
 * @fileoverview 權限查詢控制器
 *
 * 此文件實作了權限查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module PermissionQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {PermissionQueriesSvc} from '../../services/queries/PermissionQueriesSvc.js';
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import {ResResult} from '@aiot/shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('PermissionQueriesCtrl');

/**
 * 權限查詢控制器類別
 *
 * 專門處理權限相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class PermissionQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class PermissionQueriesCtrl {
    constructor(
        @inject(TYPES.PermissionQueriesSvc) private readonly permissionService: PermissionQueriesSvc
    ) {
    }

    /**
     * 獲取所有權限列表（支援分頁）
     * @route GET /api/rbac/permissions
     * @query page - 頁碼（從 1 開始）
     * @query pageSize - 每頁數量
     * @query sortBy - 排序欄位
     * @query sortOrder - 排序方向（ASC/DESC）
     */
    public getPermissions = async (req: Request, res: Response): Promise<void> => {
        try {
            logRequest(req, 'Fetching permissions with pagination', 'info');
            logger.debug('Getting permissions from service with pagination');

            // 解析分頁參數，設定合理預設值
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 20;
            const sortBy = (req.query.sortBy as string) || 'id';
            const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

            const paginationParams = { page, pageSize, sortBy, sortOrder };

            // 統一使用分頁查詢
            const paginatedResult = await this.permissionService.getAllPermissions(paginationParams);
            const result = ResResult.success('權限列表獲取成功', paginatedResult);

            res.status(result.status).json(result);
            logger.info('Successfully fetched permissions with pagination', {
                page: paginatedResult.page,
                pageSize: paginatedResult.pageSize,
                total: paginatedResult.total,
                dataCount: paginatedResult.data.length
            });
        } catch (error) {
            logger.error('Error fetching permissions', {error});
            const result = ResResult.internalError('獲取權限列表失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 根據 ID 獲取權限詳情
     * @route GET /api/rbac/permissions/:id
     */
    public getPermissionById = async (req: Request, res: Response): Promise<void> => {
        try {
            const permissionId = parseInt(req.params.id);

            if (isNaN(permissionId)) {
                const result = ResResult.badRequest('無效的權限 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Fetching permission with ID: ${permissionId}`, 'info');
            logger.debug(`Getting permission by ID from service: ${permissionId}`);

            const permission = await this.permissionService.getPermissionById(permissionId);

            if (!permission) {
                const result = ResResult.notFound('權限不存在');
                res.status(result.status).json(result);
                logger.warn(`Permission not found with ID: ${permissionId}`);
                return;
            }

            const result = ResResult.success('權限詳情獲取成功', permission);
            res.status(result.status).json(result);
            logger.info(`Successfully fetched permission by ID: ${permissionId}`);
        } catch (error) {
            logger.error('Error fetching permission by ID', {
                permissionId: req.params.id,
                error
            });
            const result = ResResult.internalError('獲取權限詳情失敗');
            res.status(result.status).json(result);
        }
    }
}
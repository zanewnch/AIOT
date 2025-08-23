/**
 * @fileoverview 使用者查詢控制器
 *
 * 此文件實作了使用者查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module UserQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {UserQueriesSvc} from '../../services/queries/UserQueriesSvc.js';
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import * as sharedPackages from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('UserQueriesCtrl');

/**
 * 使用者查詢控制器類別
 *
 * 專門處理使用者相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class UserQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class UserQueriesCtrl {
    constructor(
        @inject(TYPES.UserQueriesSvc) private readonly userQueriesSvc: UserQueriesSvc
    ) {
    }

    /**
     * 獲取所有使用者列表（支援分頁）
     * @route GET /api/rbac/users
     * @query page - 頁碼（從 1 開始）
     * @query pageSize - 每頁數量
     * @query sortBy - 排序欄位
     * @query sortOrder - 排序方向（ASC/DESC）
     */
    public getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            logRequest(req, 'Fetching users with pagination', 'info');
            logger.debug('Getting users from service with pagination');

            // 解析分頁參數，設定合理預設值
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 20;
            const sortBy = (req.query.sortBy as string) || 'id';
            const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

            const paginationParams = { page, pageSize, sortBy, sortOrder };

            // 統一使用分頁查詢
            const paginatedResult = await this.userQueriesSvc.getAllUsers(paginationParams);
            const result = sharedPackages.ResResult.success('使用者列表獲取成功', paginatedResult);

            res.status(result.status).json(result);
            logger.info('Successfully fetched users with pagination', {
                page: paginatedResult.page,
                pageSize: paginatedResult.pageSize,
                total: paginatedResult.total,
                dataCount: paginatedResult.data.length
            });
        } catch (error) {
            logger.error('Error fetching users', {error});
            const result = sharedPackages.ResResult.internalError('獲取使用者列表失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 根據 ID 獲取使用者詳情
     * @route GET /api/rbac/users/:id
     */
    public getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                const result = sharedPackages.ResResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Fetching user with ID: ${userId}`, 'info');
            logger.debug(`Getting user by ID from service: ${userId}`);

            const user = await this.userQueriesSvc.getUserById(userId);

            if (!user) {
                const result = sharedPackages.ResResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                logger.warn(`User not found with ID: ${userId}`);
                return;
            }

            const result = sharedPackages.ResResult.success('使用者詳情獲取成功', user);
            res.status(result.status).json(result);
            logger.info(`Successfully fetched user by ID: ${userId}`);
        } catch (error) {
            logger.error('Error fetching user by ID', {
                userId: req.params.id,
                error
            });
            const result = sharedPackages.ResResult.internalError('獲取使用者詳情失敗');
            res.status(result.status).json(result);
        }
    }
}
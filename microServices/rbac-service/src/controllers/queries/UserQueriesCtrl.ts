/**
 * @fileoverview 使用者查詢控制器
 * 
 * 此文件實作了使用者查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module UserQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { UserQueriesSvc } from '../../services/queries/UserQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('UserQueries');

/**
 * 使用者查詢控制器類別
 * 
 * 專門處理使用者相關的查詢請求，包含列表查詢、詳情查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class UserQueries
 * @since 1.0.0
 */
@injectable()
export class UserQueries {
    constructor(
        @inject(TYPES.UserQueriesSvc) private readonly userQueriesSvc: UserQueriesSvc
    ) {}

    /**
     * 獲取所有使用者列表
     * @route GET /api/rbac/users
     */
    public getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            logRequest(req, 'Fetching all users', 'info');
            logger.debug('Getting all users from service');

            const users = await this.userQueriesSvc.getAllUsers();
            const result = ControllerResult.success('使用者列表獲取成功', users);

            res.status(result.status).json(result);
            logger.info('Successfully fetched all users', { count: users.length });
        } catch (error) {
            logger.error('Error fetching all users', { error });
            const result = ControllerResult.internalError('獲取使用者列表失敗');
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
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Fetching user with ID: ${userId}`, 'info');
            logger.debug(`Getting user by ID from service: ${userId}`);

            const user = await this.userQueriesSvc.getUserById(userId);
            
            if (!user) {
                const result = ControllerResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                logger.warn(`User not found with ID: ${userId}`);
                return;
            }

            const result = ControllerResult.success('使用者詳情獲取成功', user);
            res.status(result.status).json(result);
            logger.info(`Successfully fetched user by ID: ${userId}`);
        } catch (error) {
            logger.error('Error fetching user by ID', { 
                userId: req.params.id, 
                error 
            });
            const result = ControllerResult.internalError('獲取使用者詳情失敗');
            res.status(result.status).json(result);
        }
    }
}
/**
 * @fileoverview 認證查詢控制器
 * 
 * 此文件實作了認證查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，包含身份驗證檢查等讀取邏輯。
 * 
 * @module AuthQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { AuthQueriesSvc } from '../../services/queries/AuthQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../container/types.js';

const logger = createLogger('AuthQueries');

/**
 * 認證查詢控制器類別
 * 
 * 專門處理認證相關的查詢請求，包含身份驗證檢查等功能。
 * 所有方法都是只讀的，遵循 CQRS 模式的查詢端原則。
 * 
 * @class AuthQueries
 * @since 1.0.0
 */
@injectable()
export class AuthQueries {
    constructor(
        @inject(TYPES.AuthQueriesSvc) private readonly authQueriesSvc: AuthQueriesSvc
    ) {}

    /**
     * 檢查當前使用者的認證狀態
     * @route GET /api/auth/me
     */
    public checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logRequest(req, 'Authentication check request', 'info');

            // 取得 JWT token，優先從 cookie 取得，其次從 Authorization header 取得
            const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                logger.warn(`Authentication check failed: No token provided from IP: ${req.ip}`);
                const response = ControllerResult.unauthorized('No authentication token provided');
                res.status(response.status).json(response.toJSON());
                return;
            }

            logger.debug(`Validating session for token from IP: ${req.ip}`);

            // 驗證會話並取得使用者資料
            const sessionResult = await this.authQueriesSvc.validateSession(token);

            if (!sessionResult.isValid || !sessionResult.user) {
                logger.warn(`Authentication check failed: ${sessionResult.message}, IP: ${req.ip}`);
                const response = ControllerResult.unauthorized(sessionResult.message || 'Invalid session');
                res.status(response.status).json(response.toJSON());
                return;
            }

            logger.info(`Authentication check successful for user: ${sessionResult.user.username}, ID: ${sessionResult.user.id}`);

            // 回傳認證成功的回應，包含使用者資料
            const response = ControllerResult.success('Authentication valid', {
                user: {
                    id: sessionResult.user.id,
                    username: sessionResult.user.username,
                    email: sessionResult.user.email,
                    isActive: sessionResult.user.isActive,
                    lastLoginAt: sessionResult.user.lastLoginAt,
                    createdAt: sessionResult.user.createdAt,
                    updatedAt: sessionResult.user.updatedAt
                },
                authenticated: true
            });
            res.status(response.status).json(response.toJSON());
        } catch (err) {
            logger.error('Authentication check error:', err);
            next(err);
        }
    }
}
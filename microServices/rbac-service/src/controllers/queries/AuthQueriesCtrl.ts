/**
 * @fileoverview 認證查詢控制器
 * 
 * 此文件實作了認證查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，包含身份驗證檢查等讀取邏輯。
 * 
 * 使用 Kong Headers 獲取用戶信息，認證和授權由 OPA 在 Kong 層處理。
 * 
 * @module AuthQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 2.0.0
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
 * 使用 Kong Headers 獲取用戶信息，認證由 OPA 處理。
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
     * 獲取當前使用者資訊 - 使用 Kong Headers
     * @route GET /api/auth/me
     */
    public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logRequest(req, 'Get current user info request', 'info');

            // 從 Kong headers 獲取用戶信息（由 KongHeadersMiddleware 設置）
            const user = req.kongUser || req.user;

            if (!user) {
                logger.warn(`User info request failed: No user info from Kong headers, IP: ${req.ip}`);
                const response = ControllerResult.unauthorized('User information not available');
                res.status(response.status).json(response.toJSON());
                return;
            }

            logger.info(`User info request successful for user: ${user.username}, ID: ${user.id}`);

            // 獲取更詳細的用戶資訊（如果需要從數據庫）
            let userDetails = {};
            try {
                userDetails = await this.authQueriesSvc.getUserDetails(user.id) || {};
            } catch (error) {
                logger.warn(`Failed to fetch user details from database for user ${user.id}:`, error);
                // 繼續執行，使用 Kong headers 的基本信息
            }

            // 回傳用戶資訊（結合 Kong headers 和數據庫資訊）
            const response = ControllerResult.success('User information retrieved successfully', {
                isAuthenticated: true,
                user: {
                    id: user.id,
                    username: user.username,
                    roles: user.roles,
                    permissions: user.permissions.slice(0, 20), // 限制返回權限數量
                    departmentId: user.departmentId,
                    level: user.level,
                    sessionId: user.sessionId,
                    // 添加數據庫中的詳細資訊（如果有）
                    ...userDetails,
                    // Kong 提供的額外信息
                    authMethod: 'kong-opa',
                    authenticatedAt: new Date().toISOString()
                }
            });
            res.status(response.status).json(response.toJSON());
        } catch (err) {
            logger.error('Get user info error:', err);
            next(err);
        }
    };

    /**
     * 檢查當前使用者的認證狀態 (保留方法作為備用)
     * @route GET /api/auth/check (如果需要)
     */
    public checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logRequest(req, 'Authentication check request', 'info');

            // 從 Kong headers 獲取用戶信息
            const user = req.kongUser || req.user;

            if (!user) {
                logger.warn(`Authentication check failed: No user info from Kong headers, IP: ${req.ip}`);
                const response = ControllerResult.unauthorized('Authentication required');
                res.status(response.status).json(response.toJSON());
                return;
            }

            logger.info(`Authentication check successful for user: ${user.username}, ID: ${user.id}`);

            // 回傳認證狀態
            const response = ControllerResult.success('User authenticated', {
                isAuthenticated: true,
                user: {
                    id: user.id,
                    username: user.username,
                    roles: user.roles,
                    departmentId: user.departmentId,
                    level: user.level
                },
                session: {
                    sessionId: user.sessionId,
                    ipAddress: user.ipAddress,
                    authMethod: 'kong-opa'
                }
            });
            res.status(response.status).json(response.toJSON());
        } catch (err) {
            logger.error('Authentication check error:', err);
            next(err);
        }
    };

    /**
     * 獲取用戶權限列表
     * @route GET /api/auth/permissions
     */
    public getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logRequest(req, 'Get user permissions request', 'info');

            const user = req.kongUser || req.user;

            if (!user) {
                const response = ControllerResult.unauthorized('Authentication required');
                res.status(response.status).json(response.toJSON());
                return;
            }

            logger.info(`Permissions request for user: ${user.username}, permissions count: ${user.permissions.length}`);

            // 回傳完整權限列表
            const response = ControllerResult.success('User permissions retrieved', {
                user: {
                    id: user.id,
                    username: user.username
                },
                permissions: user.permissions,
                roles: user.roles,
                permissionSummary: {
                    totalPermissions: user.permissions.length,
                    hasSuperPermission: user.permissions.includes('*'),
                    roles: user.roles,
                    level: user.level
                }
            });
            res.status(response.status).json(response.toJSON());
        } catch (err) {
            logger.error('Get permissions error:', err);
            next(err);
        }
    };
}
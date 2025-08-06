/**
 * @fileoverview 認證查詢控制器
 * 
 * 此文件實作了認證查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module AuthQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/AuthService.js';
import { IAuthService } from '../../types/services/IAuthService.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('AuthQueries');

/**
 * 認證查詢控制器類別
 * 
 * 專門處理認證相關的查詢請求，包含當前用戶信息查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class AuthQueries
 * @since 1.0.0
 */
export class AuthQueries {
    private authService: IAuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * 獲取當前使用者資訊
     * @route GET /api/auth/me
     */
    public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logRequest(req, `Get current user info for: ${req.user?.username}`, 'info');

            // 檢查使用者是否已經通過認證中間件驗證
            if (!req.user) {
                logger.warn('User authentication required for /me endpoint');
                const response = ControllerResult.unauthorized('Authentication required');
                res.status(response.status).json(response.toJSON());
                return;
            }

            const { username, id } = req.user;
            logger.info(`Returning user information for authenticated user: ${username} (ID: ${id})`);

            // 獲取 JWT token（從 cookie 或 header）
            const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');

            // 回傳使用者資訊
            const response = ControllerResult.success('User information retrieved successfully', {
                user: {
                    id,
                    username
                },
                token: token || null // 回傳 token 供前端使用（如果存在）
            });

            res.status(response.status).json(response.toJSON());
            logger.debug(`User info successfully returned for user: ${username}`);
        } catch (err) {
            logger.error('Get user info error:', err);
            // 將例外處理委派給 Express 錯誤處理中間件
            next(err);
        }
    }
}
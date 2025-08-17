/**
 * @fileoverview 錯誤處理中間件
 * @description 統一處理 Gateway Service 的錯誤回應
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * 錯誤回應介面
 */
interface ErrorResponse {
    status: number;
    message: string;
    error?: string;
    details?: any;
    timestamp: string;
    path: string;
}

/**
 * 自定義錯誤類別
 */
export class GatewayError extends Error {
    public statusCode: number;
    public details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.name = 'GatewayError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * 錯誤處理中間件類別
 */
export class ErrorHandleMiddleware {
    /**
     * 統一錯誤處理方法
     * @param error - 錯誤物件
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     * @param next - Express 下一個中間件函數
     */
    public static handle(
        error: any,
        req: Request,
        res: Response,
        next: NextFunction
    ): void {
        // 記錄錯誤到日誌
        loggerConfig.error('Gateway Error:', {
            message: error.message,
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        // 決定錯誤狀態碼
        let statusCode = 500;
        let message = 'Internal Server Error';

        if (error instanceof GatewayError) {
            statusCode = error.statusCode;
            message = error.message;
        } else if (error.name === 'ValidationError') {
            statusCode = 400;
            message = 'Validation Error';
        } else if (error.name === 'UnauthorizedError') {
            statusCode = 401;
            message = 'Unauthorized';
        } else if (error.code === 'ECONNREFUSED') {
            statusCode = 503;
            message = 'Service Unavailable';
        } else if (error.message) {
            message = error.message;
        }

        // 建立錯誤回應
        const errorResponse: ErrorResponse = {
            status: statusCode,
            message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        };

        // 在開發環境中包含更多錯誤詳情
        if (process.env.NODE_ENV !== 'production') {
            errorResponse.error = error.name;
            errorResponse.details = error.details || error.stack;
        }

        // 發送錯誤回應
        res.status(statusCode).json(errorResponse);
    }

    /**
     * 404 錯誤處理方法
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public static notFound(req: Request, res: Response): void {
        const errorResponse: ErrorResponse = {
            status: 404,
            message: 'Route not found',
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        };

        loggerConfig.warn('Route not found', {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });

        res.status(404).json(errorResponse);
    }

    /**
     * 服務無法連接錯誤
     * @param serviceName - 服務名稱
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public static serviceUnavailable(serviceName: string, req: Request, res: Response): void {
        const errorResponse: ErrorResponse = {
            status: 503,
            message: `Service ${serviceName} is currently unavailable`,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        };

        loggerConfig.error('Service unavailable', {
            serviceName,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });

        res.status(503).json(errorResponse);
    }
}
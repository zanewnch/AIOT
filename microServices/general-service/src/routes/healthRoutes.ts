/**
 * @fileoverview 健康檢查路由類別 - InversifyJS + Arrow Functions 版本
 * 
 * 使用 class 封裝路由邏輯，結合 InversifyJS 依賴注入和 arrow functions。
 * 提供服務健康檢查和基本資訊端點：
 * - 健康檢查端點
 * - 服務資訊端點
 * 
 * @module HealthRoutes
 * @author AIOT Team
 * @since 1.0.0
 * @version 2.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Router } from 'express';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';

/**
 * 健康檢查路由類別
 * 
 * 使用 arrow functions 避免 this 綁定問題並提供更清晰的代碼結構
 */
@injectable()
export class HealthRoutes {
    private readonly router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes = (): void => {
        this.setupHealthRoutes();
    }

    /**
     * 設定健康檢查路由
     */
    private setupHealthRoutes = (): void => {
        /**
         * 健康檢查路由
         * @route GET /health
         */
        this.router.get('/health', this.getHealthStatus);

        /**
         * 服務資訊路由
         * @route GET /info
         */
        this.router.get('/info', this.getServiceInfo);
    }

    // ==============================================
    // 路由處理器 (Arrow Functions)
    // ==============================================

    /**
     * 健康檢查處理器
     */
    private getHealthStatus = (_req: any, res: any) => {
        res.status(200).json({
            status: 'ok',
            service: 'general',
            message: 'general service is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    }

    /**
     * 服務資訊處理器
     */
    private getServiceInfo = (_req: any, res: any) => {
        res.status(200).json({
            service: 'general',
            description: 'General Setting Management Service',
            version: '1.0.0',
            author: 'AIOT Team',
            features: [
                'User Preference Management',
                'Dynamic Documentation System',
                'CQRS Architecture',
                'JWT-based Role Authorization',
                'RESTful API'
            ],
            endpoints: {
                health: '/api/health',
                info: '/api/info',
                docs: '/api/docs',
                userPreferences: '/api/user-preferences'
            }
        });
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}
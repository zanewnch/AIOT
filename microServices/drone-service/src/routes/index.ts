/**
 * @fileoverview Drone 微服務路由統一註冊中心
 * 
 * 此文件負責管理和註冊所有的 HTTP API 路由，採用 CQRS 架構和 IoC 容器：
 * - 使用 class-based 路由配置
 * - 透過依賴注入管理路由控制器
 * - 支援 Query/Command 分離模式
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Express, Router } from 'express';
import { ArchiveTaskRoutes } from './archiveTaskRoutes.js';
import { DronePositionRoutes } from './dronePositionRoutes.js';
import { DroneStatusRoutes } from './droneStatusRoutes.js';
import { DroneCommandRoutes } from './droneCommandRoutes.js';
import { DroneRealtimeRoutes } from './droneRealtimeRoutes.js';
import { TYPES } from '../types/dependency-injection.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';

/**
 * 路由管理器類別
 * 
 * 負責統一註冊所有 API 路由，使用 IoC 容器管理依賴
 * 
 * @class RouteManager
 */
@injectable()
export class RouteManager {
    constructor(
        @inject(TYPES.ArchiveTaskRoutes) private readonly archiveTaskRoutes: ArchiveTaskRoutes,
        @inject(TYPES.DronePositionRoutes) private readonly dronePositionRoutes: DronePositionRoutes,
        @inject(TYPES.DroneStatusRoutes) private readonly droneStatusRoutes: DroneStatusRoutes,
        @inject(TYPES.DroneCommandRoutes) private readonly droneCommandRoutes: DroneCommandRoutes,
        @inject(TYPES.DroneRealtimeRoutes) private readonly droneRealtimeRoutes: DroneRealtimeRoutes
    ) {}

    /**
     * 註冊所有 API 路由到 Express 應用程式
     * 
     * @param app Express 應用程式實例
     */
    registerAllRoutes(app: Express): void {
        console.log('🛣️  Registering all API routes...');

        try {
            // 註冊健康檢查路由 (直接定義，不需要額外的 class)
            this.registerHealthRoutes(app);
            console.log('✅ Health routes registered');

            // 註冊歸檔任務路由
            app.use('/archive-tasks', this.archiveTaskRoutes.getRouter());
            console.log('✅ Archive task routes registered');

            // 註冊無人機位置路由
            app.use('/positions', this.dronePositionRoutes.getRouter());
            console.log('✅ Drone position routes registered');

            // 註冊無人機狀態路由
            app.use('/statuses', this.droneStatusRoutes.getRouter());
            console.log('✅ Drone status routes registered');

            // 註冊無人機命令路由
            app.use('/commands', this.droneCommandRoutes.getRouter());
            console.log('✅ Drone command routes registered');

            // 註冊無人機即時狀態路由
            app.use('/realtime', this.droneRealtimeRoutes.getRouter());
            console.log('✅ Drone realtime routes registered');

            console.log('🚀 All routes registered successfully');
        } catch (error) {
            console.error('❌ Failed to register routes:', error);
            throw error;
        }
    }

    /**
     * 註冊健康檢查路由
     * 
     * @param app Express 應用程式實例
     */
    private registerHealthRoutes(app: Express): void {
        const healthRouter = Router();

        // 基本健康檢查
        healthRouter.get('/health', (req, res) => {
            const healthStatus = {
                status: 'healthy',
                service: 'drone-service',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0'
            };

            const result = ControllerResult.success('Service is healthy', healthStatus);
            res.status(result.status).json(result);
        });

        // 詳細健康檢查
        healthRouter.get('/health/detailed', (req, res) => {
            const healthStatus = {
                status: 'healthy',
                service: 'drone-service',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
                },
                environment: process.env.NODE_ENV || 'development'
            };

            const result = ControllerResult.success('Service is healthy', healthStatus);
            res.status(result.status).json(result);
        });

        app.use('/', healthRouter);
    }
}


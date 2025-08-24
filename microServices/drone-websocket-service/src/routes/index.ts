/**
 * @fileoverview Drone-Realtime 服務主路由管理器
 * 
 * 集中管理所有路由，提供統一的路由註冊和配置
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router } from 'express';
import { HealthRoutes } from './healthRoutes.js';
import readmeRoutes from './readmeRoutes.js';
import { TYPES } from '@/container';
import { createLogger } from '@/configs/loggerConfig.js';

const logger = createLogger('RouteRegistrar');

/**
 * 路由註冊器類別
 * 
 * 負責註冊和管理 WebSocket 服務的輔助 API 路由
 * 使用 arrow functions 避免 this 綁定問題
 */
@injectable()
export class RouteRegistrar {
    private readonly router: Router;

    constructor(
        @inject(TYPES.HealthRoutes) 
        private readonly healthRoutes: HealthRoutes
    ) {
        this.router = Router();
        this.setupRoutes();
        this.setupMiddleware();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes = (): void => {
        logger.info('Registering WebSocket service routes...');

        // 健康檢查路由 (無需 API 前綴)
        this.router.use('', this.healthRoutes.getRouter());

        // README 文檔路由
        this.router.use('', readmeRoutes);

        // WebSocket 相關路由 - 提供服務資訊和連線狀態
        this.setupWebSocketRoutes();

        // 404 處理器 - 必須放在所有路由之後
        this.setup404Handler();

        logger.info('WebSocket service routes registered successfully');
    }

    /**
     * 設定 WebSocket 相關的 HTTP 端點
     */
    private setupWebSocketRoutes = (): void => {
        // WebSocket 連線狀態查詢
        this.router.get('/api/websocket/status', this.getWebSocketStatus);

        // WebSocket 服務資訊
        this.router.get('/api/websocket/info', this.getWebSocketInfo);
    }

    /**
     * WebSocket 狀態端點
     */
    private getWebSocketStatus = (req: any, res: any) => {
        res.json({
            status: 'active',
            service: 'drone-websocket-service',
            timestamp: new Date().toISOString(),
            namespaces: {
                droneStatus: '/drone-status',
                dronePosition: '/drone-position',
                droneCommands: '/drone-commands',
                admin: '/admin'
            },
            endpoints: {
                connect: '/socket.io/',
                status: '/api/websocket/status',
                info: '/api/websocket/info'
            }
        });
    }

    /**
     * WebSocket 服務資訊端點
     */
    private getWebSocketInfo = (req: any, res: any) => {
        res.json({
            service: 'Drone WebSocket Service',
            version: '1.0.0',
            protocol: 'Socket.IO',
            features: [
                'Real-time status updates',
                'Position tracking',
                'Command broadcasting',
                'Admin monitoring'
            ],
            namespaces: [
                {
                    name: '/drone-status',
                    description: '無人機狀態更新',
                    events: ['status_update', 'battery_warning', 'connection_status']
                },
                {
                    name: '/drone-position',
                    description: '無人機位置追蹤',
                    events: ['position_update', 'trajectory_update']
                },
                {
                    name: '/drone-commands',
                    description: '無人機命令廣播',
                    events: ['command_received', 'command_executed']
                },
                {
                    name: '/admin',
                    description: '管理監控',
                    events: ['system_alert', 'performance_metrics']
                }
            ]
        });
    }

    /**
     * 設定中間件
     */
    private setupMiddleware = (): void => {
        // 請求日誌中間件
        this.router.use((req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.info('HTTP Request', {
                    method: req.method,
                    url: req.originalUrl,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip
                });
            });
            
            next();
        });

        // 錯誤處理中間件
        this.router.use((error: any, req: any, res: any, next: any) => {
            logger.error('Route error occurred', {
                error: error.message,
                stack: error.stack,
                method: req.method,
                url: req.originalUrl
            });

            // 如果已經發送了回應，就不能再發送
            if (res.headersSent) {
                return next(error);
            }

            // 根據錯誤類型返回適當的狀態碼
            let statusCode = 500;
            let message = '內部伺服器錯誤';

            if (error.name === 'ValidationError') {
                statusCode = 400;
                message = '資料驗證失敗';
            } else if (error.name === 'NotFoundError') {
                statusCode = 404;
                message = '資源不存在';
            } else if (error.name === 'UnauthorizedError') {
                statusCode = 401;
                message = '未授權存取';
            }

            res.status(statusCode).json({
                status: statusCode,
                message,
                error: process.env.NODE_ENV === 'development' ? error.message : '發生錯誤',
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method
            });
        });
    }

    /**
     * 設定 404 處理器
     */
    private setup404Handler = (): void => {
        this.router.use('*', (req, res, next) => {
            // 跳過 Socket.IO 相關路徑，這些由 Socket.IO 服務器處理
            if (req.originalUrl.startsWith('/socket.io')) {
                logger.debug('Skipping Socket.IO path in Express 404 handler', {
                    url: req.originalUrl
                });
                return next(); // 讓 Socket.IO 處理
            }
            
            logger.warn('Route not found', {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip
            });

            res.status(404).json({
                status: 404,
                message: '找不到請求的資源',
                error: 'ROUTE_NOT_FOUND',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString(),
                availableEndpoints: {
                    health: '/health',
                    info: '/info',
                    websocketStatus: '/api/websocket/status',
                    websocketInfo: '/api/websocket/info',
                    socketConnection: '/socket.io/'
                }
            });
        });
    }

    /**
     * 註冊路由到 Express 應用程式
     * 統一接口，符合其他微服務的 RouteRegistrar 模式
     * 
     * @param app Express 應用程式實例
     */
    registerRoutes(app: any): void {
        app.use('/', this.router);
        logger.info('🚀 WebSocket service routes registered to Express app');
    }

    /**
     * 獲取路由器實例
     * 向後兼容方法
     */
    getRouter(): Router {
        return this.router;
    }

    /**
     * 獲取路由統計資訊
     */
    getRouteStats(): any {
        return {
            totalRoutes: this.router.stack.length,
            routeGroups: {
                health: 'Health check and monitoring routes',
                websocket: 'WebSocket service information endpoints'
            },
            serviceType: 'WebSocket Real-time Communication Service',
            registeredAt: new Date().toISOString()
        };
    }
}
/**
 * @fileoverview AIOT 無人機即時通訊微服務應用程式主體配置檔案
 *
 * 此檔案定義了專注於 WebSocket 實時通信的微服務應用程式，負責：
 * - WebSocket 連線管理和實時通訊
 * - 無人機狀態實時廣播和訂閱
 * - 簡化的輔助 HTTP 端點（健康檢查和服務資訊）
 * - 與主 drone 微服務分離，專注於實時通信功能
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-12
 */

import 'reflect-metadata';
import express from 'express';
import { Server as HTTPServer } from 'http';
import cors from 'cors';
import { redisConfig } from 'aiot-shared-packages';
import { createSequelizeInstance } from './configs/dbConfig.js';
import { IntegratedWebSocketService as WebSocketService } from './configs/websocket/service.js';
// Legacy simple service import (if needed for backward compatibility)
// import { WebSocketService as SimpleWebSocketService } from './configs/websocket/service-simple.js';
import { container } from './container/container.js';
// Consul 服務註冊
import { ConsulConfig } from './configs/consulConfig.js';
import { TYPES } from './container/types.js';
import { RouteRegistrar } from './routes/index.js';
import { createLogger } from './configs/loggerConfig.js';
// 移除 JWT 認證 - 使用 Express.js Gateway 進行集中式權限管理

const logger = createLogger('App');

/**
 * 無人機實時通信微服務應用程式配置類別
 *
 * 此類別專注於 WebSocket 實時通訊功能：
 * - WebSocket 連線管理與實時廣播
 * - 無人機狀態訂閱與推送
 * - 輔助 HTTP 端點（健康檢查、服務資訊）
 * - 連線監控和統計
 *
 * @class App
 */
export class App {
    /**
     * Express 應用程式實例
     */
    public app: express.Application;

    /**
     * WebSocket 服務實例
     */
    private webSocketService: WebSocketService | null = null;

    /**
     * Sequelize 資料庫 ORM 實例
     */
    private sequelize: any;

    /**
     * 建構函式 - 初始化 Express 應用程式
     */
    constructor() {
        this.app = express();
        this.setupSequelize();
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * 初始化 Sequelize 資料庫連線
     */
    private setupSequelize(): void {
        this.sequelize = createSequelizeInstance();
    }

    /**
     * 設定基本中間件
     */
    private setupMiddleware(): void {
        // CORS 設定
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
        }));

        // 基本解析器
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));

        // 請求日誌
        this.app.use((req, res, next) => {
            console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
    }

    /**
     * 設定路由系統
     */
    private setupRoutes(): void {
        try {
            // 從 IoC 容器獲取路由註冊器
            const routeRegistrar = container.get<RouteRegistrar>(TYPES.RouteRegistrar);
            
            // 註冊所有路由
            routeRegistrar.registerRoutes(this.app);
            
            logger.info('Routes setup completed successfully');
            logger.info('Route statistics', routeRegistrar.getRouteStats());
            
        } catch (error) {
            logger.error('Failed to setup routes', { error });
            
            // 如果路由設定失敗，設定基本的備用路由
            this.setupFallbackRoutes();
        }
    }

    /**
     * 設定備用路由 (當主路由系統失敗時)
     */
    private setupFallbackRoutes(): void {
        logger.warn('Using fallback routes due to main route system failure');
        
        // 基本健康檢查
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'degraded',
                service: 'drone-websocket-service',
                message: 'Service running in fallback mode',
                timestamp: new Date().toISOString()
            });
        });

        // 服務資訊
        this.app.get('/info', (req, res) => {
            res.json({
                service: 'AIOT Drone Real-time Service',
                version: '1.0.0',
                description: '無人機即時通訊服務 (備用模式)',
                mode: 'fallback',
                timestamp: new Date().toISOString()
            });
        });

        // 404 處理
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Service in maintenance mode',
                message: 'Main API temporarily unavailable',
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * 初始化 Redis 連線
     */
    private async setupRedis(): Promise<void> {
        await redisConfig.connect();
    }

    /**
     * 初始化 WebSocket 服務
     */
    async initializeWebSocket(httpServer: HTTPServer): Promise<void> {
        try {
            logger.info('Initializing WebSocket service...');
            
            // 使用整合的 WebSocket 服務
            this.webSocketService = container.get<WebSocketService>(TYPES.IntegratedWebSocketService);
            await this.webSocketService.initialize(httpServer);

            logger.info('WebSocket service initialized successfully');
        } catch (error) {
            logger.error('WebSocket initialization failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    /**
     * 初始化應用程式
     */
    async initialize(): Promise<void> {
        try {
            // 同步資料庫結構
            await this.sequelize.sync();
            console.log('✅ Database synced');

            // 連線 Redis
            await this.setupRedis();
            console.log('✅ Redis connected');

            console.log('✅ Drone Real-time Service initialized successfully');
        } catch (err) {
            console.error('❌ App initialization failed', err);
            throw err;
        }
    }

    /**
     * 優雅關閉應用程式
     */
    async shutdown(): Promise<void> {
        try {
            // 關閉 WebSocket 服務
            if (this.webSocketService) {
                logger.info('Closing WebSocket service...');
                await this.webSocketService.shutdown();
            }

            // 關閉 Redis 連線
            logger.info('Closing Redis connection...');
            await redisConfig.disconnect();

            // 關閉資料庫連線
            logger.info('Closing database connection...');
            await this.sequelize.close();

            logger.info('Drone Real-time Service shutdown successfully');
        } catch (error) {
            logger.error('Error during app shutdown', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    /**
     * 獲取 WebSocket 服務實例
     */
    getWebSocketService(): WebSocketService | null {
        return this.webSocketService;
    }
}
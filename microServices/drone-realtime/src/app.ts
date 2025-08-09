/**
 * @fileoverview AIOT 無人機即時通訊服務應用程式主體配置檔案
 *
 * 此檔案定義了無人機即時通訊服務的核心應用程式類別 App，專注於：
 * - WebSocket 連線管理和即時通訊
 * - 無人機位置和狀態的即時廣播
 * - 簡化的依賴管理（專注於即時通訊功能）
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import express from 'express';
import { Server as HTTPServer } from 'http';
import cors from 'cors';
import { redisConfig } from './configs/redisConfig.js';
import { createSequelizeInstance } from './configs/dbConfig.js';
import { WebSocketService } from './configs/websocket/service-simple.js';
// 移除 JWT 認證 - 使用 OPA 進行集中式權限管理

/**
 * 無人機即時通訊服務應用程式配置類別
 *
 * 此類別專注於 WebSocket 即時通訊功能：
 * - WebSocket 連線管理
 * - 無人機資料即時廣播
 * - 認證和權限控制
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
     * 設定基本路由
     */
    private setupRoutes(): void {
        // 健康檢查
        this.app.get('/health', (req, res) => {
            const stats = this.webSocketService?.getConnectionStats() || {};
            res.json({
                status: 'healthy',
                service: 'drone-realtime-service',
                timestamp: new Date().toISOString(),
                websocket: {
                    enabled: !!this.webSocketService,
                    ...stats
                }
            });
        });

        // 服務資訊
        this.app.get('/', (req, res) => {
            res.json({
                service: 'AIOT Drone Real-time Service',
                version: '1.0.0',
                description: '無人機即時通訊 WebSocket 服務',
                endpoints: {
                    health: '/health',
                    websocket: '/socket.io'
                }
            });
        });

        // 404 處理
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'This is a WebSocket service. Connect via Socket.IO client.',
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
            console.log('🔧 Initializing WebSocket service...');
            
            // 創建 WebSocket 服務
            this.webSocketService = new WebSocketService(httpServer);

            // OPA 處理認證和授權，WebSocket 服務不需要額外認證

            // 設定事件處理器
            this.webSocketService.setupEventHandlers((socket, namespace) => {
                // 基本事件處理邏輯將在這裡添加
                console.log(`🔗 Socket connected to ${namespace}: ${socket.id}`);
            });

            console.log('✅ WebSocket service initialized');
        } catch (error) {
            console.error('❌ WebSocket initialization failed:', error);
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
                console.log('📡 Closing WebSocket connections...');
                await this.webSocketService.shutdown();
            }

            // 關閉 Redis 連線
            console.log('🔴 Closing Redis connection...');
            await redisConfig.disconnect();

            // 關閉資料庫連線
            console.log('🗃️ Closing database connection...');
            await this.sequelize.close();

            console.log('✅ Drone Real-time Service shutdown successfully');
        } catch (error) {
            console.error('❌ Error during app shutdown:', error);
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
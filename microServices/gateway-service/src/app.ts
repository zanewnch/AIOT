/**
 * @fileoverview AIOT Gateway Service Express Application
 * @description Express.js API Gateway 服務，整合 Consul 服務發現和微服務代理
 * @author AIOT Development Team
 * @version 1.0.0
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server, IncomingMessage } from 'http';
import { Socket } from 'net';
import 'reflect-metadata';

// Import configurations
import { loggerConfig } from './configs/loggerConfig.js';
import { serverConfig } from './configs/serverConfig.js';

// Import configs
import { ConsulConfig } from './configs/consulConfig.js';
import { HealthConfig } from './configs/healthConfig.js';

// Import middleware
import { ErrorHandleMiddleware } from './middleware/ErrorHandleMiddleware.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';

// Import routes
import { createMainRoutes } from './routes/index.js';
import { createApiRoutes, createWebSocketRoutes } from './routes/apiRoutes.js';


/**
 * Gateway Service Express Application Class
 * @description 創建和配置完整的 API Gateway 應用程式
 */
export class GatewayApp {
    public app: Application;
    private logger = loggerConfig;
    private consulConfig!: ConsulConfig;
    private healthConfig!: HealthConfig;

    constructor() {
        this.app = express();
        
        // 初始化服務
        this.initializeServices();
        
        // 初始化應用程式
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocketProxying(); // 嘗試將 WebSocket 代理放在路由之後
        this.initializeErrorHandling();
    }

    /**
     * 初始化服務實例
     */
    private initializeServices(): void {
        this.consulConfig = new ConsulConfig();
        this.healthConfig = new HealthConfig(this.consulConfig);
        
        // 初始化認證中間件
        AuthMiddleware.initialize();
    }

    /**
     * 初始化中間件
     * @description 設置 Express 應用程式的基礎中間件
     */
    private initializeMiddleware(): void {
        // 信任代理
        this.app.set('trust proxy', true);

        // 基礎中間件
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use(cookieParser());

        // CORS 配置
        this.app.use(cors({
            origin: [
                'http://localhost:3000',      // 前端開發環境
                'http://localhost:8000',      // Gateway 自身
                'http://aiot-frontend:3000',  // Docker 內部通訊
                'http://frontend-app:3000'    // Docker 服務名稱
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: [
                'Content-Type', 
                'Authorization', 
                'Cookie',
                'X-Requested-With',
                'Accept',
                'Origin',
                'Cache-Control',
                'X-File-Name'
            ]
        }));

        // 日誌中間件
        this.app.use(morgan('combined', {
            stream: {
                write: (message: string) => {
                    this.logger.info(message.trim());
                }
            }
        }));

        // 請求 ID 中間件（用於追蹤）
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            req.headers['x-request-id'] = req.headers['x-request-id'] || `gw-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            res.set('X-Request-ID', req.headers['x-request-id'] as string);
            next();
        });

        // 調試中間件 - 記錄所有請求
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            if (req.originalUrl.includes('socket.io')) {
                this.logger.info(`🔍 All requests debug: ${req.method} ${req.originalUrl} (path: ${req.path})`);
            }
            next();
        });

    }

    /**
     * 初始化路由
     * @description 設置完整的 API Gateway 路由配置
     */
    private initializeRoutes(): void {
        // 主要路由（根端點、健康檢查等）
        const mainRoutes = createMainRoutes();
        this.app.use('/', mainRoutes);

        // API 路由（包含微服務代理）
        const apiRoutes = createApiRoutes(this.healthConfig);
        this.app.use('/api', apiRoutes);

        // 404 處理
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            
            this.logger.warn(`🚫 Route not found: ${req.method} ${req.originalUrl}`);
            res.status(404).json({
                status: 404,
                message: '找不到請求的資源',
                error: 'ROUTE_NOT_FOUND',
                path: req.path,
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
     * 初始化 WebSocket 代理
     * @description 重新設計的 Socket.IO 代理，支援認證和完整的 Socket.IO 協議
     */
    private initializeWebSocketProxying(): void {
        try {
            this.logger.info('🔌 Initializing comprehensive WebSocket proxying...');
            
            // 使用正確的 Socket.IO 代理配置 (包含 WebSocket 支援)
            const socketIoProxy = createProxyMiddleware({
                target: 'http://aiot-drone-websocket-service:3004',
                changeOrigin: true,
                ws: true, // 🔑 關鍵！啟用 WebSocket 代理支援
                secure: false,
                logLevel: 'debug',
                onProxyReq: (proxyReq, req, res) => {
                    this.logger.info(`🔌 PROXY CALLED: ${req.method} ${req.url} -> ${proxyReq.path}`);
                },
                onProxyRes: (proxyRes, req, res) => {
                    this.logger.info(`📤 PROXY RESPONSE: ${proxyRes.statusCode} for ${req.url}`);
                },
                onError: (err, req, res) => {
                    this.logger.error('❌ PROXY ERROR:', {
                        error: err.message,
                        url: req.url,
                        method: req.method
                    });
                    
                    if (res && !res.headersSent) {
                        res.status(502).json({
                            error: 'Proxy error',
                            message: err.message
                        });
                    }
                }
            });

            // 直接註冊 Socket.IO 代理中間件
            this.app.use('/socket.io', socketIoProxy);
            
            this.logger.info('✅ Socket.IO proxy registered: /socket.io -> aiot-drone-websocket-service:3004');
            
        } catch (error) {
            this.logger.error('❌ WebSocket proxying initialization failed:', error);
            throw error;
        }
    }

    /**
     * 初始化錯誤處理
     * @description 設置全域錯誤處理中間件
     */
    private initializeErrorHandling(): void {
        this.app.use(ErrorHandleMiddleware.handle);
    }

    /**
     * 註冊 Gateway 到 Consul
     * @param port - Gateway 服務端口
     */
    public async registerWithConsul(port: number): Promise<void> {
        try {
            await this.consulConfig.registerService();
            this.logger.info('✅ Gateway service registered to Consul');
        } catch (error) {
            this.logger.error('❌ Failed to register Gateway with Consul:', error);
        }
    }

    /**
     * 優雅關閉
     */
    public async gracefulShutdown(): Promise<void> {
        try {
            this.logger.info('🔄 Starting graceful shutdown...');
            
            // 從 Consul 取消註冊
            await this.consulConfig.deregisterService();
            
            // TODO: 修復後恢復 HealthService 清理
            // this.healthService.cleanup();
            
            // 清理認證中間件
            await AuthMiddleware.cleanup();
            
        } catch (error) {
            this.logger.error('❌ Error during graceful shutdown:', error);
        }
    }

    /**
     * 取得 Express 應用程式實例
     * @returns Express Application 實例
     */
    public getApp(): Application {
        return this.app;
    }

    /**
     * 取得 Consul 配置實例
     * @returns ConsulConfig 實例
     */
    public getConsulConfig(): ConsulConfig {
        return this.consulConfig;
    }

    /**
     * 取得健康檢查配置實例
     * @returns HealthConfig 實例
     */
    public getHealthConfig(): HealthConfig {
        return this.healthConfig;
    }

    /**
     * 設置 WebSocket 升級處理
     * @param server - HTTP 伺服器實例
     */
    public async setupWebSocketUpgrade(server: Server): Promise<void> {
        // 🔑 關鍵！手動設置 WebSocket upgrade 事件處理
        server.on('upgrade', (request, socket, head) => {
            this.logger.info(`🔄 WebSocket upgrade request: ${request.url}`);
            
            // 檢查是否為 Socket.IO 請求
            if (request.url?.startsWith('/socket.io')) {
                this.logger.info('🎯 Handling Socket.IO WebSocket upgrade');
                // 找到對應的代理中間件並處理升級
                // 這會由 http-proxy-middleware 的 upgrade 方法處理
            }
        });
        
        this.logger.info('✅ WebSocket upgrade handling configured for Socket.IO');
    }
}

export default GatewayApp;
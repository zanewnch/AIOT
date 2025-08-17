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

// Import services
import { ConsulService } from './services/ConsulService.js';
import { HealthService } from './services/HealthService.js';

// Import middleware
import { ErrorHandleMiddleware } from './middleware/ErrorHandleMiddleware.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';

// Import routes
import { createMainRoutes } from './routes/index.js';
import { createApiRoutes, createWebSocketRoutes } from './routes/apiRoutes.js';

// Import patterns
import { LogClass } from './patterns/LoggerDecorator.js';

/**
 * Gateway Service Express Application Class
 * @description 創建和配置完整的 API Gateway 應用程式
 */
@LogClass('GatewayApp')
export class GatewayApp {
    public app: Application;
    private logger = loggerConfig;
    private consulService!: ConsulService;
    private healthService!: HealthService;

    constructor() {
        this.app = express();
        
        // 初始化服務
        this.initializeServices();
        
        // 初始化應用程式
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocketProxying();
        this.initializeErrorHandling();
    }

    /**
     * 初始化服務實例
     */
    private initializeServices(): void {
        this.consulService = new ConsulService();
        this.healthService = new HealthService(this.consulService);
        
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
        const apiRoutes = createApiRoutes(this.consulService, this.healthService);
        this.app.use('/api', apiRoutes);

        // 404 處理
        this.app.use('*', (req: Request, res: Response) => {
            this.logger.warn(`🚫 Route not found: ${req.method} ${req.originalUrl}`);
            res.status(404).json({
                status: 404,
                message: 'Route not found',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        });

    }

    /**
     * 初始化 WebSocket 代理
     * @description 設置 WebSocket 連接的代理配置
     */
    private initializeWebSocketProxying(): void {
        try {
            const wsRoutes = createWebSocketRoutes(this.consulService);
            
            // Socket.io 代理
            this.app.use('/socket.io', wsRoutes['/socket.io']);
            
        } catch (error) {
            this.logger.warn('⚠️ WebSocket proxying initialization failed:', error);
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
            await this.consulService.registerGatewayService(port);
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
            await this.consulService.cleanup();
            
            // 清理健康服務
            this.healthService.cleanup();
            
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
     * 取得 Consul 服務實例
     * @returns ConsulService 實例
     */
    public getConsulService(): ConsulService {
        return this.consulService;
    }

    /**
     * 取得健康檢查服務實例
     * @returns HealthService 實例
     */
    public getHealthService(): HealthService {
        return this.healthService;
    }

    /**
     * 設置 WebSocket 升級處理
     * @param server - HTTP 伺服器實例
     */
    public async setupWebSocketUpgrade(server: Server): Promise<void> {
        try {
            // 監聽 WebSocket 升級事件
            server.on('upgrade', async (request: any, socket: any, head: any) => {
                try {
                    this.logger.info('🔌 WebSocket upgrade request received', {
                        url: request.url,
                        headers: request.headers
                    });
                    
                    // 檢查是否為 Socket.io 連接
                    if (request.url?.startsWith('/socket.io/')) {
                        // 發現 drone-websocket-service
                        const serviceInstances = await this.consulService.getHealthyServices('drone-websocket-service');
                        
                        if (!serviceInstances || serviceInstances.length === 0) {
                            this.logger.error('❌ drone-websocket-service not found for WebSocket upgrade');
                            socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
                            socket.destroy();
                            return;
                        }
                        
                        // 選擇目標服務實例
                        const targetInstance = serviceInstances[0];
                        const targetHost = targetInstance.address;
                        const targetPort = targetInstance.port;
                        
                        this.logger.info(`🔌 Proxying WebSocket to drone-websocket-service at ${targetHost}:${targetPort}`);
                        
                        // 創建簡化的 WebSocket 代理
                        const proxy = createProxyMiddleware({
                            target: `http://${targetHost}:${targetPort}`,
                            changeOrigin: true,
                            ws: true
                        } as any);
                        
                        this.logger.debug('🔌 Creating WebSocket proxy to', {
                            target: `${targetHost}:${targetPort}`,
                            url: request.url
                        });
                        
                        // 處理 WebSocket 升級
                        try {
                            (proxy as any).upgrade(request, socket, head);
                        } catch (proxyError) {
                            this.logger.error('❌ WebSocket proxy upgrade failed:', {
                                error: proxyError,
                                target: `${targetHost}:${targetPort}`,
                                url: request.url
                            });
                            
                            if (socket && !socket.destroyed) {
                                socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                                socket.destroy();
                            }
                        }
                        
                    } else {
                        // 不支援的 WebSocket 路徑
                        this.logger.warn(`⚠️ Unsupported WebSocket path: ${request.url}`);
                        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                        socket.destroy();
                    }
                    
                } catch (error) {
                    this.logger.error('❌ WebSocket upgrade handling error:', error);
                    
                    if (socket && !socket.destroyed) {
                        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                        socket.destroy();
                    }
                }
            });
            
            this.logger.info('✅ WebSocket upgrade handling configured successfully');
            
        } catch (error) {
            this.logger.error('❌ Failed to setup WebSocket upgrade handling:', error);
            throw error;
        }
    }
}

export default GatewayApp;
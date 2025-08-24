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
import httpProxy from 'http-proxy';
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

// Import container and route registrar
import { container } from './container/container.js';
import { TYPES } from './container/types.js';
import { RouteRegistrar } from './routes/RouteRegistrar.js';


/**
 * Gateway Service Express Application Class
 * @description 創建和配置完整的 API Gateway 應用程式
 */
export class GatewayApp {
    public app: Application;
    private logger = loggerConfig;
    private consulConfig!: ConsulConfig;
    private healthConfig!: HealthConfig;
    private socketIoProxy: any;
    private llmWebSocketProxy: any; // 添加 node-http-proxy 實例

    constructor() {
        this.app = express();
        
        // 初始化服務
        this.initializeServices();
        
        // 初始化應用程式
        this.initializeMiddleware();
        this.initializeWebSocketProxying(); // 🔑 WebSocket 代理必須在其他路由之前
        this.initializeLLMWebSocketProxying(); // 🤖 LLM WebSocket 代理
        this.initializeRoutes();
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

        // 設置模板引擎和靜態文件服務
        this.app.set('view engine', 'ejs');
        this.app.set('views', './src/views');
        this.app.use('/static', express.static('./src/public'));

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
     * @description 使用 InversifyJS RouteRegistrar 設置完整的 API Gateway 路由配置
     */
    private initializeRoutes(): void {
        // 使用 InversifyJS 路由註冊器
        const routeRegistrar = container.get<RouteRegistrar>(TYPES.RouteRegistrar);
        routeRegistrar.registerRoutes(this.app);

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
     * @description 使用 node-http-proxy 實現 Socket.IO 代理，專門支援 WebSocket
     */
    private initializeWebSocketProxying(): void {
        try {
            this.logger.info('🔌 Initializing node-http-proxy for Socket.IO...');
            
            // 創建 node-http-proxy 實例，專門支援 WebSocket
            this.socketIoProxy = httpProxy.createProxyServer({
                target: 'http://aiot-drone-websocket-service:3004',
                changeOrigin: true,
                ws: true, // 🔑 啟用 WebSocket 支援
                secure: false
            });

            // 監聽代理事件
            this.socketIoProxy.on('proxyReq', (proxyReq, req, res) => {
                this.logger.info(`🔌 HTTP Proxy: ${req.method} ${req.url}`);
                
                // 添加認證 headers
                const authToken = (req as any).cookies?.auth_token || req.headers?.authorization;
                if (authToken) {
                    proxyReq.setHeader('X-Auth-Token', authToken);
                    this.logger.debug('🔐 Added auth token to HTTP request');
                }
            });

            this.socketIoProxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
                this.logger.info(`🔌 WebSocket Proxy: ${req.url}`);
                
                // 為 WebSocket 添加認證 headers
                const authToken = req.headers?.cookie?.match(/auth_token=([^;]+)/)?.[1];
                if (authToken) {
                    proxyReq.setHeader('X-Auth-Token', authToken);
                    this.logger.debug('🔐 Added auth token to WebSocket request');
                }
            });

            this.socketIoProxy.on('error', (err, req, res) => {
                this.logger.error('❌ HTTP Proxy Error:', {
                    error: err.message,
                    url: req.url,
                    method: req.method
                });
                
                // Check if res is an Express Response object before using Express methods
                if (res && typeof res.status === 'function' && !res.headersSent) {
                    res.status(502).json({
                        error: 'Socket.IO proxy error',
                        message: err.message
                    });
                } else if (res && typeof res.writeHead === 'function') {
                    // Handle WebSocket errors - res is a ServerResponse object
                    try {
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: 'Socket.IO proxy error',
                            message: err.message
                        }));
                    } catch (writeError) {
                        this.logger.error('❌ Failed to write error response:', writeError);
                    }
                }
            });

            // 代理 Socket.IO HTTP 請求 (GET/POST)
            this.app.all('/socket.io/*', (req: Request, res: Response) => {
                this.logger.info(`📡 Proxying Socket.IO HTTP request: ${req.method} ${req.url}`);
                this.socketIoProxy.web(req, res);
            });
            
            // 代理 Socket.IO namespace 請求 (如 /drone)
            this.app.all('/drone', (req: Request, res: Response) => {
                this.logger.info(`📡 Proxying Socket.IO namespace request: ${req.method} ${req.url}`);
                this.socketIoProxy.web(req, res);
            });
            
            this.app.all('/drone/*', (req: Request, res: Response) => {
                this.logger.info(`📡 Proxying Socket.IO namespace request: ${req.method} ${req.url}`);
                this.socketIoProxy.web(req, res);
            });
            
            this.logger.info('✅ node-http-proxy for Socket.IO initialized: /socket.io/* -> aiot-drone-websocket-service:3004');
            
        } catch (error) {
            this.logger.error('❌ Socket.IO proxy initialization failed:', error);
            throw error;
        }
    }

    /**
     * 初始化 LLM WebSocket 代理
     * @description 使用 node-http-proxy 實現 LLM AI Engine WebSocket 代理
     */
    private initializeLLMWebSocketProxying(): void {
        try {
            this.logger.info('🤖 Initializing node-http-proxy for LLM WebSocket...');
            
            // 創建 LLM WebSocket 代理實例
            this.llmWebSocketProxy = httpProxy.createProxyServer({
                target: 'http://aiot-llm-ai-engine:8021',
                changeOrigin: true,
                ws: true, // 🔑 啟用 WebSocket 支援
                secure: false,
                timeout: 120000, // 2 分鐘超時（AI 推理可能較慢）
                proxyTimeout: 120000
            });

            // 監聽代理事件
            this.llmWebSocketProxy.on('proxyReq', (proxyReq, req, res) => {
                this.logger.info(`🤖 LLM HTTP Proxy: ${req.method} ${req.url}`);
                
                // 添加認證 headers
                const authToken = (req as any).cookies?.auth_token || req.headers?.authorization;
                if (authToken) {
                    proxyReq.setHeader('X-Auth-Token', authToken);
                    this.logger.debug('🔐 Added auth token to LLM HTTP request');
                }
                
                // 添加用戶資訊
                const userId = (req as any).user?.id || req.headers['x-user-id'];
                if (userId) {
                    proxyReq.setHeader('X-User-ID', userId);
                }
            });

            this.llmWebSocketProxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
                this.logger.info(`🤖 LLM WebSocket Proxy: ${req.url}`);
                
                // 為 WebSocket 添加認證 headers
                const authToken = req.headers?.cookie?.match(/auth_token=([^;]+)/)?.[1];
                if (authToken) {
                    proxyReq.setHeader('X-Auth-Token', authToken);
                    this.logger.debug('🔐 Added auth token to LLM WebSocket request');
                }
                
                // 添加用戶資訊
                const userId = req.headers['x-user-id'];
                if (userId) {
                    proxyReq.setHeader('X-User-ID', userId);
                }
            });

            this.llmWebSocketProxy.on('error', (err, req, res) => {
                this.logger.error('❌ LLM WebSocket Proxy Error:', {
                    error: err.message,
                    url: req.url,
                    method: req.method
                });
                
                // 處理錯誤回應
                if (res && typeof res.status === 'function' && !res.headersSent) {
                    res.status(502).json({
                        error: 'LLM WebSocket proxy error',
                        message: err.message
                    });
                } else if (res && typeof res.writeHead === 'function') {
                    try {
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: 'LLM WebSocket proxy error',
                            message: err.message
                        }));
                    } catch (writeError) {
                        this.logger.error('❌ Failed to write LLM error response:', writeError);
                    }
                }
            });

            // 代理 LLM WebSocket 請求
            this.app.all('/ws', (req: Request, res: Response) => {
                this.logger.info(`🤖 Proxying LLM WebSocket HTTP request: ${req.method} ${req.url}`);
                this.llmWebSocketProxy.web(req, res);
            });
            
            this.app.all('/ws/*', (req: Request, res: Response) => {
                this.logger.info(`🤖 Proxying LLM WebSocket HTTP request: ${req.method} ${req.url}`);
                this.llmWebSocketProxy.web(req, res);
            });
            
            this.logger.info('✅ node-http-proxy for LLM WebSocket initialized: /ws/* -> aiot-llm-ai-engine:8021');
            
        } catch (error) {
            this.logger.error('❌ LLM WebSocket proxy initialization failed:', error);
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
        // 🔑 使用 node-http-proxy 處理 WebSocket 升級
        server.on('upgrade', (request, socket, head) => {
            this.logger.info(`🔄 WebSocket upgrade request: ${request.url}`);
            
            // 檢查是否為 Socket.IO WebSocket 請求
            if (request.url?.startsWith('/socket.io') || request.url?.startsWith('/drone')) {
                this.logger.info('🎯 Proxying Socket.IO WebSocket upgrade via node-http-proxy');
                
                // 使用 node-http-proxy 處理 WebSocket 升級
                this.socketIoProxy.ws(request, socket, head);
            } else if (request.url?.startsWith('/ws')) {
                this.logger.info('🤖 Proxying LLM WebSocket upgrade via node-http-proxy');
                
                // 使用 LLM WebSocket 代理處理升級
                this.llmWebSocketProxy.ws(request, socket, head);
            } else {
                this.logger.warn(`❌ Unsupported WebSocket upgrade rejected: ${request.url}`);
                socket.destroy();
            }
        });
        
        this.logger.info('✅ WebSocket upgrade handling configured with node-http-proxy');
    }
}

export default GatewayApp;
/**
 * @fileoverview 微服務代理中間件
 * @description 處理 HTTP 請求代理到各個微服務，支援 gRPC 和 HTTP 協議轉換
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import axios, { AxiosResponse } from 'axios';
import { loggerConfig, logProxyRequest, logRouteEvent } from '../configs/loggerConfig.js';
import { ConsulService, ServiceInstance } from '../services/ConsulService.js';
import { GatewayError } from './ErrorHandleMiddleware.js';
import { LogClass } from '../patterns/LoggerDecorator.js';

/**
 * 代理配置介面
 */
export interface ProxyConfig {
    /** 目標服務名稱 */
    target: string;
    /** 路徑前綴 */
    pathPrefix: string;
    /** 是否使用 gRPC */
    useGrpc: boolean;
    /** HTTP 備用端口 */
    httpPort?: number;
    /** 超時時間 */
    timeout?: number;
    /** 重試次數 */
    retries?: number;
}

/**
 * 微服務代理中間件類別
 */
@LogClass('ProxyMiddleware')
export class ProxyMiddleware {
    private consulService: ConsulService;
    private logger = loggerConfig;

    constructor(consulService: ConsulService) {
        this.consulService = consulService;
    }

    /**
     * 創建動態代理中間件
     * @param config - 代理配置
     * @returns Express 中間件函數
     */
    public createDynamicProxy(config: ProxyConfig) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();
            
            try {
                // 獲取健康的服務實例
                const serviceInstance = await this.consulService.getServiceInstance(config.target);
                
                if (!serviceInstance) {
                    throw new GatewayError(
                        `Service ${config.target} is currently unavailable`,
                        503
                    );
                }

                // 記錄代理請求
                logProxyRequest(req, config.target, `Proxying request to ${config.target}`);

                // 根據服務類型選擇代理方式
                if (config.useGrpc) {
                    await this.handleGrpcProxy(req, res, serviceInstance, config);
                } else {
                    await this.handleHttpProxy(req, res, serviceInstance, config);
                }

                // 記錄路由事件
                const responseTime = Date.now() - startTime;
                logRouteEvent(req.originalUrl, config.target, res.statusCode, responseTime);

            } catch (error) {
                this.logger.error(`❌ Proxy error for ${config.target}:`, error);
                
                if (error instanceof GatewayError) {
                    res.status(error.statusCode).json({
                        status: error.statusCode,
                        message: error.message,
                        service: config.target,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    next(error);
                }
            }
        };
    }

    /**
     * 處理 gRPC 代理（通過 HTTP 轉換）
     */
    private async handleGrpcProxy(
        req: Request,
        res: Response,
        serviceInstance: ServiceInstance,
        config: ProxyConfig
    ): Promise<void> {
        // 使用 HTTP 端口作為 gRPC-HTTP 轉換
        const httpPort = config.httpPort || (serviceInstance.port + 1000);
        const targetUrl = `http://${serviceInstance.address}:${httpPort}`;

        try {
            const response = await axios({
                method: req.method as any,
                url: `${targetUrl}${req.path}`,
                data: req.body,
                headers: {
                    ...req.headers,
                    host: undefined, // 移除原始 host 標頭
                    'x-forwarded-for': req.ip,
                    'x-forwarded-proto': req.protocol,
                    'x-gateway-service': 'aiot-gateway'
                },
                timeout: config.timeout || 30000,
                validateStatus: () => true // 接受所有狀態碼
            });

            // 轉發回應
            res.status(response.status);
            Object.keys(response.headers).forEach(key => {
                res.set(key, response.headers[key]);
            });
            res.send(response.data);

        } catch (error) {
            this.logger.error(`❌ gRPC proxy error:`, error);
            throw new GatewayError(
                `Failed to connect to ${config.target} service`,
                503,
                { originalError: error.message }
            );
        }
    }

    /**
     * 處理 HTTP 代理
     */
    private async handleHttpProxy(
        req: Request,
        res: Response,
        serviceInstance: ServiceInstance,
        config: ProxyConfig
    ): Promise<void> {
        const targetUrl = `http://${serviceInstance.address}:${serviceInstance.port}`;

        try {
            const response = await axios({
                method: req.method as any,
                url: `${targetUrl}${req.path}`,
                data: req.body,
                headers: {
                    ...req.headers,
                    host: undefined,
                    'x-forwarded-for': req.ip,
                    'x-forwarded-proto': req.protocol,
                    'x-gateway-service': 'aiot-gateway'
                },
                timeout: config.timeout || 30000,
                validateStatus: () => true
            });

            // 轉發回應
            res.status(response.status);
            Object.keys(response.headers).forEach(key => {
                res.set(key, response.headers[key]);
            });
            res.send(response.data);

        } catch (error) {
            this.logger.error(`❌ HTTP proxy error:`, error);
            throw new GatewayError(
                `Failed to connect to ${config.target} service`,
                503,
                { originalError: error.message }
            );
        }
    }

    /**
     * 創建 WebSocket 代理中間件
     * @param config - WebSocket 代理配置
     * @returns WebSocket 代理中間件
     */
    public createWebSocketProxy(config: ProxyConfig) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                // 為 WebSocket 連接發現目標服務
                const serviceInstances = await this.consulService.getHealthyServices(config.target);
                
                if (!serviceInstances || serviceInstances.length === 0) {
                    this.logger.error(`❌ WebSocket target service not found: ${config.target}`);
                    return res.status(503).json({
                        status: 503,
                        message: `WebSocket service ${config.target} unavailable`,
                        timestamp: new Date().toISOString()
                    });
                }

                // 選擇服務實例（簡單輪詢）
                const targetInstance = serviceInstances[0];
                const targetUrl = `http://${targetInstance.address}:${targetInstance.port}`;

                // 創建簡化的 WebSocket 代理
                const wsProxy = createProxyMiddleware({
                    target: targetUrl,
                    changeOrigin: true,
                    ws: true
                } as any);
                
                this.logger.info(`🔌 Creating WebSocket proxy to ${config.target}`, {
                    target: targetUrl,
                    url: req.url
                });

                // 執行代理
                wsProxy(req, res, next);
                
            } catch (error) {
                this.logger.error(`❌ WebSocket proxy setup failed for ${config.target}:`, error);
                res.status(500).json({
                    status: 500,
                    message: 'WebSocket proxy setup failed',
                    service: config.target,
                    timestamp: new Date().toISOString()
                });
            }
        };
    }

    /**
     * 創建靜態代理中間件（用於已知端點）
     */
    public createStaticProxy(targetHost: string, targetPort: number, pathRewrite?: Record<string, string>) {
        const proxyOptions: any = {
            target: `http://${targetHost}:${targetPort}`,
            changeOrigin: true,
            pathRewrite: pathRewrite || {},
            onError: (err: any, req: any, res: any) => {
                this.logger.error(`❌ Static proxy error:`, err);
                if (res && typeof res.writeHead === 'function') {
                    res.writeHead(503, {
                        'Content-Type': 'application/json',
                    });
                    res.end(JSON.stringify({
                        status: 503,
                        message: 'Service temporarily unavailable',
                        timestamp: new Date().toISOString()
                    }));
                }
            },
            onProxyReq: (proxyReq: any, req: any, res: any) => {
                // 添加 Gateway 標識標頭
                proxyReq.setHeader('x-gateway-service', 'aiot-gateway');
                proxyReq.setHeader('x-forwarded-for', (req as any).connection?.remoteAddress || req.ip);
                
                logProxyRequest(req, `${targetHost}:${targetPort}`, `Static proxy request`);
            }
        };

        return createProxyMiddleware(proxyOptions);
    }

    /**
     * 健康檢查代理
     */
    public async checkServiceHealth(serviceName: string): Promise<boolean> {
        try {
            const serviceInstance = await this.consulService.getServiceInstance(serviceName);
            if (!serviceInstance) {
                return false;
            }

            const response = await axios.get(
                `http://${serviceInstance.address}:${serviceInstance.port}/health`,
                { timeout: 5000 }
            );

            return response.status === 200;
        } catch (error) {
            this.logger.debug(`Service ${serviceName} health check failed:`, error.message);
            return false;
        }
    }
}

/**
 * 創建重試機制的代理中間件
 */
export function createRetryProxy(proxyMiddleware: any, maxRetries: number = 3) {
    return async (req: Request, res: Response, next: NextFunction) => {
        let attempt = 0;
        
        const tryProxy = () => {
            proxyMiddleware(req, res, (error: any) => {
                if (error && attempt < maxRetries) {
                    attempt++;
                    loggerConfig.warn(`Retrying request (attempt ${attempt}/${maxRetries}):`, error.message);
                    setTimeout(tryProxy, Math.pow(2, attempt) * 1000); // 指數退避
                } else {
                    next(error);
                }
            });
        };

        tryProxy();
    };
}
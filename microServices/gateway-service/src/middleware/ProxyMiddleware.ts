/**
 * @fileoverview 微服務代理中間件
 * @description 處理 HTTP 請求代理到各個微服務，支援 gRPC 和 HTTP 協議轉換
 * @author AIOT Development Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import axios, { AxiosResponse } from 'axios';
import { loggerConfig, logProxyRequest, logRouteEvent } from '../configs/loggerConfig.js';
import { GatewayError } from './ErrorHandleMiddleware.js';
import { LoadBalancerMiddleware, LoadBalancingAlgorithm } from './LoadBalancerMiddleware.js';

/**
 * 服務實例介面
 */
export interface ServiceInstance {
    address: string;
    port: number;
    service: string;
    id: string;
}

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
    /** 負載均衡算法 */
    loadBalancing?: LoadBalancingAlgorithm;
}

/**
 * 微服務代理中間件類別
 */
@injectable()
export class ProxyMiddleware {
    private consulUrl: string;
    private loadBalancer: LoadBalancerMiddleware;

    constructor() {
        this.consulUrl = `http://${process.env.CONSUL_HOST || 'consul'}:${process.env.CONSUL_PORT || '8500'}`;
        this.loadBalancer = new LoadBalancerMiddleware();
    }

    /**
     * 從 Consul 獲取所有健康的服務實例，然後使用負載均衡選擇
     */
    private async getServiceInstance(serviceName: string, clientIp?: string, loadBalancing?: LoadBalancingAlgorithm): Promise<ServiceInstance | null> {
        try {
            // 獲取所有健康實例
            const instances = await this.getAllHealthyInstances(serviceName);
            
            if (!instances || instances.length === 0) {
                loggerConfig.warn(`⚠️ No healthy instances found in Consul for service: ${serviceName}, trying fallback...`);
                const fallback = this.getFallbackServiceInstance(serviceName);
                return fallback;
            }

            // 使用負載均衡選擇實例
            const selectedInstance = this.loadBalancer.selectInstance(
                serviceName, 
                instances, 
                clientIp, 
                { algorithm: loadBalancing || 'health-aware' }
            );

            if (selectedInstance) {
                loggerConfig.info(`✅ Selected service instance: ${serviceName} at ${selectedInstance.address}:${selectedInstance.port}`, {
                    algorithm: loadBalancing || 'health-aware',
                    totalInstances: instances.length
                });
            }

            return selectedInstance;

        } catch (error) {
            loggerConfig.warn(`⚠️ Consul query failed for ${serviceName}, using fallback:`, error.message);
            const fallback = this.getFallbackServiceInstance(serviceName);
            return fallback;
        }
    }

    /**
     * 獲取所有健康實例
     */
    private async getAllHealthyInstances(serviceName: string): Promise<ServiceInstance[]> {
        try {
            const response = await axios.get(`${this.consulUrl}/v1/health/service/${serviceName}?passing=true`);
            const services = response.data;
            
            if (!services || services.length === 0) {
                return [];
            }

            return services.map((service: any) => ({
                address: service.Service.Address,
                port: service.Service.Port,
                service: service.Service.Service,
                id: service.Service.ID
            }));

        } catch (error) {
            loggerConfig.debug(`Failed to get all healthy instances for ${serviceName}:`, error.message);
            return [];
        }
    }

    /**
     * 回退服務實例配置（當 Consul 不可用時）
     */
    private getFallbackServiceInstance(serviceName: string): ServiceInstance | null {
        const fallbackConfig: Record<string, ServiceInstance> = {
            'rbac-service': {
                address: process.env.RBAC_SERVICE_HOST || 'aiot-rbac-service',
                port: parseInt(process.env.RBAC_SERVICE_PORT || '3051'),
                service: 'rbac-service',
                id: 'rbac-service-fallback'
            },
            'drone-service': {
                address: process.env.DRONE_SERVICE_HOST || 'aiot-drone-service',
                port: parseInt(process.env.DRONE_SERVICE_PORT || '3052'),
                service: 'drone-service',
                id: 'drone-service-fallback'
            },
            'general-service': {
                address: process.env.GENERAL_SERVICE_HOST || 'aiot-general-service',
                port: parseInt(process.env.GENERAL_SERVICE_PORT || '3053'),
                service: 'general-service',
                id: 'general-service-fallback'
            },
            'auth-service': {
                address: process.env.AUTH_SERVICE_HOST || 'aiot-auth-service',
                port: parseInt(process.env.AUTH_SERVICE_PORT || '3055'),
                service: 'auth-service',
                id: 'auth-service-fallback'
            },
            'drone-websocket-service': {
                address: process.env.DRONE_WS_SERVICE_HOST || 'aiot-drone-websocket-service',
                port: parseInt(process.env.DRONE_WS_SERVICE_PORT || '3004'),
                service: 'drone-websocket-service',
                id: 'drone-websocket-service-fallback'
            },
            'llm-service': {
                address: process.env.LLM_AI_ENGINE_HOST || 'aiot-llm-service',
                port: parseInt(process.env.LLM_AI_ENGINE_PORT || '8021'),
                service: 'llm-service',
                id: 'llm-service-fallback'
            }
        };

        const fallback = fallbackConfig[serviceName];
        if (fallback) {
            loggerConfig.info(`🔄 Using fallback configuration for ${serviceName}: ${fallback.address}:${fallback.port}`);
            return fallback;
        }

        loggerConfig.error(`❌ No fallback configuration found for service: ${serviceName}`);
        return null;
    }

    /**
     * 從 Consul 獲取所有健康的服務實例
     */
    private async getHealthyServices(serviceName: string): Promise<ServiceInstance[]> {
        try {
            const response = await axios.get(`${this.consulUrl}/v1/health/service/${serviceName}?passing=true`);
            const services = response.data;
            
            if (!services || services.length === 0) {
                return [];
            }

            return services.map((service: any) => ({
                address: service.Service.Address,
                port: service.Service.Port,
                service: service.Service.Service,
                id: service.Service.ID
            }));
        } catch (error) {
            loggerConfig.error(`❌ Failed to get healthy services for ${serviceName}:`, error.message);
            return [];
        }
    }

    /**
     * 創建動態代理中間件
     * @param config - 代理配置
     * @returns Express 中間件函數
     */
    public createDynamicProxy(config: ProxyConfig) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();
            let selectedInstance: ServiceInstance | null = null;
            
            try {
                // 獲取健康的服務實例（使用負載均衡）
                selectedInstance = await this.getServiceInstance(
                    config.target, 
                    req.ip, 
                    config.loadBalancing
                );
                
                if (!selectedInstance) {
                    throw new GatewayError(
                        `Service ${config.target} is currently unavailable`,
                        503
                    );
                }

                // 記錄代理請求
                logProxyRequest(req, config.target, `Proxying request to ${config.target} (${selectedInstance.address}:${selectedInstance.port})`);

                // 根據服務類型選擇代理方式
                if (config.useGrpc) {
                    await this.handleGrpcProxy(req, res, selectedInstance, config);
                } else {
                    await this.handleHttpProxy(req, res, selectedInstance, config);
                }

                // 記錄路由事件和負載均衡統計
                const responseTime = Date.now() - startTime;
                const success = res.statusCode < 400;
                
                logRouteEvent(req.originalUrl, config.target, res.statusCode, responseTime);
                
                // 更新負載均衡統計
                this.loadBalancer.recordRequestComplete(
                    config.target, 
                    selectedInstance.id, 
                    responseTime, 
                    success
                );

            } catch (error) {
                loggerConfig.error(`❌ Proxy error for ${config.target}:`, error);
                
                // 如果有選中的實例，記錄失敗
                if (selectedInstance) {
                    this.loadBalancer.recordRequestComplete(
                        config.target, 
                        selectedInstance.id, 
                        Date.now() - startTime, 
                        false
                    );
                }
                
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

        // 處理路徑重寫：移除 pathPrefix
        let targetPath = req.path;
        loggerConfig.debug(`🔍 Path rewriting debug`, {
            originalPath: req.path,
            pathPrefix: config.pathPrefix,
            startsWithPrefix: config.pathPrefix ? req.path.startsWith(config.pathPrefix) : false
        });
        
        if (config.pathPrefix && req.path.startsWith(config.pathPrefix)) {
            targetPath = req.path.substring(config.pathPrefix.length);
            // 確保路徑以 / 開頭
            if (!targetPath.startsWith('/')) {
                targetPath = '/' + targetPath;
            }
            loggerConfig.debug(`✅ Path rewritten`, {
                original: req.path,
                target: targetPath
            });
        } else {
            loggerConfig.debug(`⚠️ No path rewriting applied`, {
                path: req.path,
                prefix: config.pathPrefix
            });
        }

        try {
            const response = await axios({
                method: req.method as any,
                url: `${targetUrl}${targetPath}`,
                data: req.body,
                headers: {
                    ...req.headers,
                    host: undefined, // 移除原始 host 標頭
                    'x-forwarded-for': req.ip,
                    'x-forwarded-proto': req.protocol,
                    'x-gateway-service': 'aiot-gateway',
                    // 添加用戶信息 headers 給下游服務（API Gateway 格式）
                    ...(req.user && {
                        'x-consumer-id': req.user.id?.toString(),
                        'x-consumer-username': req.user.username,
                        'x-user-id': req.user.id?.toString(),
                        'x-user-username': req.user.username,
                        'x-user-roles': JSON.stringify(req.permissions?.roles || []),
                        'x-user-permissions': JSON.stringify(req.permissions?.permissions || []),
                        'x-user-session-id': req.session?.session_id
                    })
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
            loggerConfig.error(`❌ gRPC proxy error:`, error);
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

        // 處理路徑重寫：移除 pathPrefix
        let targetPath = req.path;
        loggerConfig.debug(`🔍 Path rewriting debug`, {
            originalPath: req.path,
            pathPrefix: config.pathPrefix,
            startsWithPrefix: config.pathPrefix ? req.path.startsWith(config.pathPrefix) : false
        });
        
        if (config.pathPrefix && req.path.startsWith(config.pathPrefix)) {
            targetPath = req.path.substring(config.pathPrefix.length);
            // 確保路徑以 / 開頭
            if (!targetPath.startsWith('/')) {
                targetPath = '/' + targetPath;
            }
            loggerConfig.debug(`✅ Path rewritten`, {
                original: req.path,
                target: targetPath
            });
        } else {
            loggerConfig.debug(`⚠️ No path rewriting applied`, {
                path: req.path,
                prefix: config.pathPrefix
            });
        }

        try {
            const response = await axios({
                method: req.method as any,
                url: `${targetUrl}${targetPath}`,
                data: req.body,
                headers: {
                    ...req.headers,
                    host: undefined,
                    'x-forwarded-for': req.ip,
                    'x-forwarded-proto': req.protocol,
                    'x-gateway-service': 'aiot-gateway',
                    // 添加用戶信息 headers 給下游服務（API Gateway 格式）
                    ...(req.user && {
                        'x-consumer-id': req.user.id?.toString(),
                        'x-consumer-username': req.user.username,
                        'x-user-id': req.user.id?.toString(),
                        'x-user-username': req.user.username,
                        'x-user-roles': JSON.stringify(req.permissions?.roles || []),
                        'x-user-permissions': JSON.stringify(req.permissions?.permissions || []),
                        'x-user-session-id': req.session?.session_id
                    })
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
            loggerConfig.error(`❌ HTTP proxy error:`, error);
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
        loggerConfig.info(`🔌 Creating WebSocket proxy middleware for: ${config.target}`);
        
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                loggerConfig.info(`🔌 WebSocket proxy middleware triggered for: ${req.url}`);
                
                // 為 WebSocket 連接發現目標服務
                const serviceInstances = await this.getHealthyServices(config.target);
                
                if (!serviceInstances || serviceInstances.length === 0) {
                    loggerConfig.error(`❌ WebSocket target service not found: ${config.target}`);
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
                
                loggerConfig.info(`🔌 Creating WebSocket proxy to ${config.target}`, {
                    target: targetUrl,
                    url: req.url
                });

                // 執行代理
                wsProxy(req, res, next);
                
            } catch (error) {
                loggerConfig.error(`❌ WebSocket proxy setup failed for ${config.target}:`, error);
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
                loggerConfig.error(`❌ Static proxy error:`, err);
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
            const serviceInstance = await this.getServiceInstance(serviceName);
            if (!serviceInstance) {
                return false;
            }

            const response = await axios.get(
                `http://${serviceInstance.address}:${serviceInstance.port}/health`,
                { timeout: 5000 }
            );

            return response.status === 200;
        } catch (error) {
            loggerConfig.debug(`Service ${serviceName} health check failed:`, error.message);
            return false;
        }
    }

    /**
     * 創建主要的代理中間件
     * 用於處理所有 API 路由的代理請求
     */
    public createProxy = () => {
        const proxyConfigs: ProxyConfig[] = [
            {
                target: 'rbac-service',
                pathPrefix: '/auth',
                useGrpc: true,
                httpPort: 3051,
                timeout: 30000,
                retries: 3
            },
            {
                target: 'rbac-service',
                pathPrefix: '/rbac',
                useGrpc: true,
                httpPort: 3051,
                timeout: 30000,
                retries: 3
            },
            {
                target: 'drone-service',
                pathPrefix: '/drone',
                useGrpc: true,
                httpPort: 3052,
                timeout: 30000,
                retries: 3
            },
            {
                target: 'general-service',
                pathPrefix: '/general',
                useGrpc: true,
                httpPort: 3053,
                timeout: 30000,
                retries: 3
            },
            {
                target: 'llm-service',
                pathPrefix: '/llm',
                useGrpc: false,
                timeout: 60000,
                retries: 2
            }
        ];

        return (req: Request, res: Response, next: NextFunction) => {
            // 找到匹配的代理配置
            const config = proxyConfigs.find(cfg => req.path.startsWith(cfg.pathPrefix));
            
            if (!config) {
                next();
                return;
            }

            // 使用動態代理中間件
            this.createDynamicProxy(config)(req, res, next);
        };
    };
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
/**
 * @fileoverview Gateway 路由轉發控制器
 * @description 處理 API Gateway 的路由轉發邏輯和微服務管理
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { ConsulService } from '../services/ConsulService.js';
import { ProxyMiddleware } from '../middleware/ProxyMiddleware.js';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';

/**
 * 服務路由配置介面
 */
interface ServiceRouteConfig {
    name: string;
    pathPrefix: string;
    stripPrefix: boolean;
    useGrpc: boolean;
    httpPort?: number;
    timeout?: number;
    retries?: number;
}

/**
 * Gateway 控制器類別
 */
export class GatewayController {
    private consulService: ConsulService;
    private proxyMiddleware: ProxyMiddleware;
    private logger = loggerConfig;

    // 微服務路由配置
    private readonly serviceConfigs: ServiceRouteConfig[] = [
        {
            name: 'rbac-service',
            pathPrefix: '/api/auth',
            stripPrefix: true,
            useGrpc: true,
            httpPort: 3051,
            timeout: 30000,
            retries: 3
        },
        {
            name: 'rbac-service',
            pathPrefix: '/api/rbac',
            stripPrefix: true,
            useGrpc: true,
            httpPort: 3051,
            timeout: 30000,
            retries: 3
        },
        {
            name: 'drone-service',
            pathPrefix: '/api/drone',
            stripPrefix: true,
            useGrpc: true,
            httpPort: 3052,
            timeout: 30000,
            retries: 3
        },
        {
            name: 'general-service',
            pathPrefix: '/api/general',
            stripPrefix: true,
            useGrpc: true,
            httpPort: 3053,
            timeout: 30000,
            retries: 3
        },
        {
            name: 'docs-service',
            pathPrefix: '/api/docs',
            stripPrefix: true,
            useGrpc: false,
            httpPort: 3054,
            timeout: 15000,
            retries: 2
        }
    ];

    constructor(consulService: ConsulService) {
        this.consulService = consulService;
        this.proxyMiddleware = new ProxyMiddleware(consulService);
    }

    /**
     * 獲取 Gateway 資訊
     */
    public getGatewayInfo = async (req: Request, res: Response): Promise<void> => {
        try {
            const servicesHealth = await this.consulService.getAllServicesHealth();
            
            const gatewayInfo = {
                service: 'AIOT API Gateway',
                version: '1.0.0',
                status: 'running',
                uptime: process.uptime(),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
                },
                routes: this.serviceConfigs.map(config => ({
                    path: config.pathPrefix,
                    target: config.name,
                    protocol: config.useGrpc ? 'gRPC' : 'HTTP'
                })),
                services: servicesHealth,
                timestamp: new Date().toISOString()
            };

            ResResult.success(res, gatewayInfo, 'Gateway information retrieved successfully');
        } catch (error) {
            this.logger.error('❌ Failed to get gateway info:', error);
            ResResult.fail(res, 'Failed to retrieve gateway information', 500);
        }
    };

    /**
     * 獲取所有微服務的健康狀態
     */
    public getServicesHealth = async (req: Request, res: Response): Promise<void> => {
        try {
            const servicesHealth = await this.consulService.getAllServicesHealth();
            const healthDetails: any = {};

            // 獲取詳細的服務實例資訊
            for (const serviceName of Object.keys(servicesHealth)) {
                try {
                    const instances = await this.consulService.getHealthyServices(serviceName);
                    healthDetails[serviceName] = {
                        healthy: servicesHealth[serviceName],
                        instances: instances.length,
                        endpoints: instances.map(instance => `${instance.address}:${instance.port}`)
                    };
                } catch (error) {
                    healthDetails[serviceName] = {
                        healthy: false,
                        instances: 0,
                        endpoints: [],
                        error: (error as Error).message
                    };
                }
            }

            ResResult.success(res, healthDetails, 'Services health status retrieved successfully');
        } catch (error) {
            this.logger.error('❌ Failed to get services health:', error);
            ResResult.fail(res, 'Failed to retrieve services health status', 500);
        }
    };

    /**
     * 獲取特定服務的詳細資訊
     */
    public getServiceDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const { serviceName } = req.params;
            
            if (!serviceName) {
                ResResult.validationError(res, 'Service name is required');
                return;
            }

            const instances = await this.consulService.getHealthyServices(serviceName);
            
            if (instances.length === 0) {
                ResResult.notFound(res, `Service ${serviceName} not found or unhealthy`);
                return;
            }

            const serviceDetails = {
                name: serviceName,
                instances: instances.map(instance => ({
                    id: instance.id,
                    address: instance.address,
                    port: instance.port,
                    tags: instance.tags,
                    healthy: instance.healthy,
                    meta: instance.meta
                })),
                configuration: this.serviceConfigs.find(config => config.name === serviceName),
                lastChecked: new Date().toISOString()
            };

            ResResult.success(res, serviceDetails, `Service ${serviceName} details retrieved successfully`);
        } catch (error) {
            this.logger.error(`❌ Failed to get service details for ${req.params.serviceName}:`, error);
            ResResult.fail(res, 'Failed to retrieve service details', 500);
        }
    };

    /**
     * 手動觸發服務發現刷新
     */
    public refreshServiceDiscovery = async (req: Request, res: Response): Promise<void> => {
        try {
            const servicesHealth = await this.consulService.getAllServicesHealth();
            
            ResResult.success(res, { 
                refreshed: true, 
                services: servicesHealth,
                timestamp: new Date().toISOString()
            }, 'Service discovery refreshed successfully');
            
            this.logger.info('🔄 Service discovery manually refreshed');
        } catch (error) {
            this.logger.error('❌ Failed to refresh service discovery:', error);
            ResResult.fail(res, 'Failed to refresh service discovery', 500);
        }
    };

    /**
     * 取得路由配置
     */
    public getRoutingConfig = async (req: Request, res: Response): Promise<void> => {
        try {
            const routingConfig = {
                routes: this.serviceConfigs.map(config => ({
                    path: config.pathPrefix,
                    target: config.name,
                    protocol: config.useGrpc ? 'gRPC→HTTP' : 'HTTP',
                    stripPrefix: config.stripPrefix,
                    timeout: config.timeout,
                    retries: config.retries,
                    httpPort: config.httpPort
                })),
                totalRoutes: this.serviceConfigs.length,
                loadBalancing: 'Round Robin',
                healthChecking: 'Consul-based',
                timestamp: new Date().toISOString()
            };

            ResResult.success(res, routingConfig, 'Routing configuration retrieved successfully');
        } catch (error) {
            this.logger.error('❌ Failed to get routing config:', error);
            ResResult.fail(res, 'Failed to retrieve routing configuration', 500);
        }
    };

    /**
     * 檢查特定服務的連通性
     */
    public checkServiceConnectivity = async (req: Request, res: Response): Promise<void> => {
        try {
            const { serviceName } = req.params;
            
            if (!serviceName) {
                ResResult.validationError(res, 'Service name is required');
                return;
            }

            const startTime = Date.now();
            const isHealthy = await this.proxyMiddleware.checkServiceHealth(serviceName);
            const responseTime = Date.now() - startTime;

            const connectivityResult = {
                serviceName,
                connected: isHealthy,
                responseTime,
                status: isHealthy ? 'healthy' : 'unhealthy',
                checkedAt: new Date().toISOString()
            };

            if (isHealthy) {
                ResResult.success(res, connectivityResult, `Service ${serviceName} is reachable`);
            } else {
                ResResult.serviceUnavailable(res, serviceName, `Service ${serviceName} is not reachable`);
            }
        } catch (error) {
            this.logger.error(`❌ Failed to check connectivity for ${req.params.serviceName}:`, error);
            ResResult.fail(res, 'Failed to check service connectivity', 500);
        }
    };

    /**
     * 取得服務路由配置（用於動態配置）
     */
    public getServiceConfigs(): ServiceRouteConfig[] {
        return [...this.serviceConfigs];
    }

    /**
     * 取得代理中間件實例
     */
    public getProxyMiddleware(): ProxyMiddleware {
        return this.proxyMiddleware;
    }
}
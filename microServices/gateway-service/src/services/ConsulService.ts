/**
 * @fileoverview Consul 服務發現客戶端
 * @description 整合 Consul 進行微服務發現、健康檢查和配置管理
 * @author AIOT Development Team
 * @version 1.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * 服務實例介面
 */
export interface ServiceInstance {
    /** 服務 ID */
    id: string;
    /** 服務名稱 */
    name: string;
    /** 服務地址 */
    address: string;
    /** 服務端口 */
    port: number;
    /** 服務標籤 */
    tags: string[];
    /** 健康狀態 */
    healthy: boolean;
    /** 服務元數據 */
    meta?: Record<string, string>;
}

/**
 * Consul 健康檢查回應
 */
interface ConsulHealthResponse {
    Node: {
        ID: string;
        Node: string;
        Address: string;
    };
    Service: {
        ID: string;
        Service: string;
        Tags: string[];
        Address: string;
        Port: number;
        Meta: Record<string, string>;
    };
    Checks: Array<{
        CheckID: string;
        Name: string;
        Status: string;
        Notes: string;
    }>;
}

/**
 * Consul 服務發現類別
 */
export class ConsulService {
    private consulClient: AxiosInstance;
    private logger = loggerConfig;
    private serviceCache: Map<string, ServiceInstance[]> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 30000; // 30 秒快取

    constructor(
        private consulHost: string = process.env.CONSUL_HOST || 'consul',
        private consulPort: number = parseInt(process.env.CONSUL_PORT || '8500')
    ) {
        this.consulClient = axios.create({
            baseURL: `http://${this.consulHost}:${this.consulPort}`,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.logger.info('🔍 Consul Service initialized', {
            host: this.consulHost,
            port: this.consulPort
        });

        // 啟動定期健康檢查
        this.startHealthChecking();
    }

    /**
     * 從 Consul 獲取健康的服務實例
     * @param serviceName - 服務名稱
     * @returns 健康的服務實例陣列
     */
    public async getHealthyServices(serviceName: string): Promise<ServiceInstance[]> {
        try {
            // 檢查快取
            const cached = this.getCachedServices(serviceName);
            if (cached) {
                return cached;
            }

            const response = await this.consulClient.get<ConsulHealthResponse[]>(
                `/v1/health/service/${serviceName}?passing=true`
            );

            const services: ServiceInstance[] = response.data.map(item => ({
                id: item.Service.ID,
                name: item.Service.Service,
                address: item.Service.Address || item.Node.Address,
                port: item.Service.Port,
                tags: item.Service.Tags || [],
                healthy: item.Checks.every(check => check.Status === 'passing'),
                meta: item.Service.Meta || {}
            }));

            // 更新快取
            this.updateServiceCache(serviceName, services);

            this.logger.debug(`📡 Found ${services.length} healthy instances for ${serviceName}`);
            return services;

        } catch (error) {
            this.logger.error(`❌ Failed to get services for ${serviceName}:`, error);
            
            // 返回快取中的服務（如果有）
            const cached = this.getCachedServices(serviceName, true);
            if (cached) {
                this.logger.warn(`⚠️  Using cached services for ${serviceName}`);
                return cached;
            }
            
            return [];
        }
    }

    /**
     * 獲取特定服務的單個實例（負載平衡）
     * @param serviceName - 服務名稱
     * @returns 選中的服務實例
     */
    public async getServiceInstance(serviceName: string): Promise<ServiceInstance | null> {
        const services = await this.getHealthyServices(serviceName);
        
        if (services.length === 0) {
            this.logger.warn(`⚠️  No healthy instances found for ${serviceName}`);
            return null;
        }

        // 簡單的輪詢負載平衡
        const selectedIndex = Math.floor(Math.random() * services.length);
        const selectedService = services[selectedIndex];

        this.logger.debug(`🎯 Selected service instance`, {
            service: serviceName,
            address: selectedService.address,
            port: selectedService.port,
            total: services.length
        });

        return selectedService;
    }

    /**
     * 註冊當前 Gateway 服務到 Consul
     * @param servicePort - Gateway 服務端口
     */
    public async registerGatewayService(servicePort: number): Promise<void> {
        const serviceId = `gateway-service-${process.env.HOSTNAME || 'local'}`;
        
        const serviceDefinition = {
            ID: serviceId,
            Name: 'gateway-service',
            Tags: ['api-gateway', 'express', 'nodejs'],
            Address: process.env.SERVICE_HOST || 'aiot-gateway-service',
            Port: servicePort,
            Meta: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            },
            Check: {
                HTTP: `http://${process.env.SERVICE_HOST || 'aiot-gateway-service'}:${servicePort}/health`,
                Interval: '10s',
                Timeout: '3s',
                DeregisterCriticalServiceAfter: '30s'
            }
        };

        try {
            await this.consulClient.put(`/v1/agent/service/register`, serviceDefinition);
            this.logger.info('✅ Gateway service registered with Consul', {
                serviceId,
                port: servicePort
            });
        } catch (error) {
            this.logger.error('❌ Failed to register Gateway service with Consul:', error);
        }
    }

    /**
     * 從 Consul 取消註冊 Gateway 服務
     */
    public async deregisterGatewayService(): Promise<void> {
        const serviceId = `gateway-service-${process.env.HOSTNAME || 'local'}`;
        
        try {
            await this.consulClient.put(`/v1/agent/service/deregister/${serviceId}`);
            this.logger.info('✅ Gateway service deregistered from Consul', { serviceId });
        } catch (error) {
            this.logger.error('❌ Failed to deregister Gateway service from Consul:', error);
        }
    }

    /**
     * 獲取所有服務的健康狀態
     */
    public async getAllServicesHealth(): Promise<Record<string, boolean>> {
        const serviceNames = ['rbac-service', 'drone-service', 'general-service', 'docs-service', 'drone-websocket-service'];
        const healthStatus: Record<string, boolean> = {};

        await Promise.all(
            serviceNames.map(async (serviceName) => {
                try {
                    const services = await this.getHealthyServices(serviceName);
                    healthStatus[serviceName] = services.length > 0;
                } catch (error) {
                    healthStatus[serviceName] = false;
                }
            })
        );

        return healthStatus;
    }

    /**
     * 檢查快取中的服務
     */
    private getCachedServices(serviceName: string, ignoreExpiry: boolean = false): ServiceInstance[] | null {
        const cached = this.serviceCache.get(serviceName);
        const expiry = this.cacheExpiry.get(serviceName);
        
        if (cached && expiry && (ignoreExpiry || Date.now() < expiry)) {
            return cached;
        }
        
        return null;
    }

    /**
     * 更新服務快取
     */
    private updateServiceCache(serviceName: string, services: ServiceInstance[]): void {
        this.serviceCache.set(serviceName, services);
        this.cacheExpiry.set(serviceName, Date.now() + this.CACHE_TTL);
    }

    /**
     * 啟動定期健康檢查
     */
    private startHealthChecking(): void {
        setInterval(async () => {
            try {
                const health = await this.getAllServicesHealth();
                this.logger.debug('🔍 Periodic health check completed', health);
            } catch (error) {
                this.logger.error('❌ Periodic health check failed:', error);
            }
        }, 60000); // 每分鐘檢查一次
    }

    /**
     * 清理資源
     */
    public async cleanup(): Promise<void> {
        await this.deregisterGatewayService();
        this.serviceCache.clear();
        this.cacheExpiry.clear();
    }
}
/**
 * @fileoverview Consul 配置和服務註冊
 * @author AIOT Team
 * @version 1.0.0
 */

import axios from 'axios';

export interface ServiceConfig {
    id: string;
    name: string;
    address: string;
    port: number;
    tags: string[];
    check: {
        http: string;
        interval: string;
        timeout: string;
        deregister_critical_service_after: string;
    };
}

export class ConsulConfig {
    private consulUrl: string;
    private serviceConfig: ServiceConfig;

    constructor() {
        this.consulUrl = `http://${process.env.CONSUL_HOST || 'consul'}:${process.env.CONSUL_PORT || '8500'}`;
        
        this.serviceConfig = {
            id: 'auth-service',
            name: 'auth-service',
            address: process.env.SERVICE_HOST || 'aiot-auth-service',
            port: parseInt(process.env.HTTP_PORT || '3055'),
            tags: ['auth', 'authentication', 'login', 'microservice', 'nodejs', 'express'],
            check: {
                http: `http://${process.env.SERVICE_HOST || 'aiot-auth-service'}:${process.env.HTTP_PORT || '3055'}/health`,
                interval: '10s',
                timeout: '3s',
                deregister_critical_service_after: '30s'
            }
        };
    }

    /**
     * 註冊服務到 Consul
     */
    async registerService(): Promise<void> {
        try {
            await axios.put(`${this.consulUrl}/v1/agent/service/register`, this.serviceConfig);
            console.log(`✅ Auth service registered to Consul: ${this.serviceConfig.name}@${this.serviceConfig.address}:${this.serviceConfig.port}`);
        } catch (error) {
            console.error('❌ Failed to register auth service to Consul:', (error as Error).message);
            // 不要因為 Consul 註冊失敗而停止服務
        }
    }

    /**
     * 從 Consul 註銷服務
     */
    async deregisterService(): Promise<void> {
        try {
            await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${this.serviceConfig.id}`);
            console.log(`✅ Auth service deregistered from Consul: ${this.serviceConfig.id}`);
        } catch (error) {
            console.error('❌ Failed to deregister auth service from Consul:', (error as Error).message);
        }
    }

    /**
     * 健康檢查
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.consulUrl}/v1/health/service/${this.serviceConfig.name}`);
            return response.data.length > 0;
        } catch (error) {
            console.error('❌ Consul health check failed:', (error as Error).message);
            return false;
        }
    }
}
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
            id: 'drone-service',
            name: 'drone-service',
            address: process.env.SERVICE_HOST || 'aiot-drone-service',
            port: parseInt(process.env.HTTP_PORT || '3052'),
            tags: ['drone', 'iot', 'telemetry', 'positions', 'microservice', 'nodejs', 'grpc'],
            check: {
                http: `http://${process.env.SERVICE_HOST || 'aiot-drone-service'}:${process.env.HTTP_PORT || '3052'}/health`,
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
            console.log(`✅ Drone service registered to Consul: ${this.serviceConfig.name}@${this.serviceConfig.address}:${this.serviceConfig.port}`);
        } catch (error) {
            console.error('❌ Failed to register drone service to Consul:', error instanceof Error ? error.message : error);
            // 不要因為 Consul 註冊失敗而停止服務
        }
    }

    /**
     * 從 Consul 註銷服務
     */
    async deregisterService(): Promise<void> {
        try {
            await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${this.serviceConfig.id}`);
            console.log(`✅ Drone service deregistered from Consul: ${this.serviceConfig.id}`);
        } catch (error) {
            console.error('❌ Failed to deregister drone service from Consul:', error instanceof Error ? error.message : error);
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
            console.error('❌ Consul health check failed:', error instanceof Error ? error.message : error);
            return false;
        }
    }
}
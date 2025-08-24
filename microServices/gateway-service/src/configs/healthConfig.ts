/**
 * @fileoverview 健康檢查和服務監控配置
 * @description 提供 Gateway 和微服務的健康監控功能
 * @author AIOT Development Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { ConsulConfig } from './consulConfig.js';
import { loggerConfig, logServiceHealth } from './loggerConfig.js';
import { TYPES } from '../container/types.js';

/**
 * 健康檢查結果介面
 */
export interface HealthCheckResult {
    /** 服務名稱 */
    service: string;
    /** 健康狀態 */
    healthy: boolean;
    /** 回應時間（毫秒） */
    responseTime: number;
    /** 檢查時間 */
    timestamp: string;
    /** 錯誤訊息（如果有） */
    error?: string;
    /** 額外詳情 */
    details?: any;
}

/**
 * 系統健康狀態介面
 */
export interface SystemHealth {
    /** Gateway 整體狀態 */
    status: 'healthy' | 'degraded' | 'unhealthy';
    /** 各服務健康狀態 */
    services: Record<string, HealthCheckResult>;
    /** 系統指標 */
    metrics: {
        uptime: number;
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu?: {
            usage: number;
        };
    };
    /** 檢查時間 */
    timestamp: string;
}

/**
 * 健康檢查配置類別
 */
@injectable()
export class HealthConfig {
    private consulConfig: ConsulConfig;
    private logger = loggerConfig;
    private healthHistory: Map<string, HealthCheckResult[]> = new Map();
    private readonly MAX_HISTORY = 100; // 保留最近 100 次檢查記錄

    constructor(@inject(TYPES.ConsulConfig) consulConfig: ConsulConfig) {
        this.consulConfig = consulConfig;
        this.startContinuousHealthChecking();
    }

    /**
     * 檢查單個服務的健康狀態
     * @param serviceName - 服務名稱
     * @returns 健康檢查結果
     */
    public async checkServiceHealth(serviceName: string): Promise<HealthCheckResult> {
        const startTime = Date.now();
        
        try {
            const services = await this.consulConfig.getHealthyServices(serviceName);
            const responseTime = Date.now() - startTime;
            const healthy = services.length > 0;

            const result: HealthCheckResult = {
                service: serviceName,
                healthy,
                responseTime,
                timestamp: new Date().toISOString(),
                details: {
                    instances: services.length,
                    endpoints: services.map((s: any) => `${s.address}:${s.port}`)
                }
            };

            if (!healthy) {
                result.error = 'No healthy instances available';
            }

            // 記錄健康檢查結果
            logServiceHealth(serviceName, healthy, responseTime);
            this.updateHealthHistory(serviceName, result);

            return result;

        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            const result: HealthCheckResult = {
                service: serviceName,
                healthy: false,
                responseTime,
                timestamp: new Date().toISOString(),
                error: error.message
            };

            logServiceHealth(serviceName, false, responseTime, { error: error.message });
            this.updateHealthHistory(serviceName, result);

            return result;
        }
    }

    /**
     * 檢查所有微服務的健康狀態
     * @returns 所有服務的健康檢查結果
     */
    public async checkAllServicesHealth(): Promise<Record<string, HealthCheckResult>> {
        const serviceNames = [
            'rbac-service',
            'drone-service', 
            'general-service',
            'drone-websocket-service'
        ];

        const healthResults: Record<string, HealthCheckResult> = {};

        // 並行檢查所有服務
        const checkPromises = serviceNames.map(async (serviceName) => {
            const result = await this.checkServiceHealth(serviceName);
            healthResults[serviceName] = result;
        });

        await Promise.all(checkPromises);
        return healthResults;
    }

    /**
     * 獲取系統整體健康狀態
     * @returns 系統健康狀態
     */
    public async getSystemHealth(): Promise<SystemHealth> {
        const servicesHealth = await this.checkAllServicesHealth();
        
        // 計算整體狀態
        const healthyServices = Object.values(servicesHealth).filter(s => s.healthy).length;
        const totalServices = Object.values(servicesHealth).length;
        const healthPercentage = totalServices > 0 ? healthyServices / totalServices : 0;

        let systemStatus: 'healthy' | 'degraded' | 'unhealthy';
        if (healthPercentage >= 1.0) {
            systemStatus = 'healthy';
        } else if (healthPercentage >= 0.5) {
            systemStatus = 'degraded';
        } else {
            systemStatus = 'unhealthy';
        }

        // 收集系統指標
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
        const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;

        const systemHealth: SystemHealth = {
            status: systemStatus,
            services: servicesHealth,
            metrics: {
                uptime: process.uptime(),
                memory: {
                    used: memoryUsedMB,
                    total: memoryTotalMB,
                    percentage: Math.round((memoryUsedMB / memoryTotalMB) * 100)
                }
            },
            timestamp: new Date().toISOString()
        };

        this.logger.info(`🏥 System health check completed`, {
            status: systemStatus,
            healthyServices,
            totalServices,
            healthPercentage: Math.round(healthPercentage * 100)
        });

        return systemHealth;
    }

    /**
     * 獲取服務健康歷史記錄
     * @param serviceName - 服務名稱
     * @param limit - 記錄數量限制
     * @returns 健康檢查歷史
     */
    public getServiceHealthHistory(serviceName: string, limit: number = 20): HealthCheckResult[] {
        const history = this.healthHistory.get(serviceName) || [];
        return history.slice(-limit);
    }

    /**
     * 獲取服務可用性統計
     * @param serviceName - 服務名稱
     * @param timeRange - 時間範圍（小時）
     * @returns 可用性統計
     */
    public getServiceAvailability(serviceName: string, timeRange: number = 24): any {
        const history = this.healthHistory.get(serviceName) || [];
        const cutoffTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
        
        const recentHistory = history.filter(record => 
            new Date(record.timestamp) > cutoffTime
        );

        if (recentHistory.length === 0) {
            return {
                availability: 0,
                totalChecks: 0,
                healthyChecks: 0,
                averageResponseTime: 0
            };
        }

        const healthyChecks = recentHistory.filter(record => record.healthy).length;
        const totalResponseTime = recentHistory.reduce((sum, record) => sum + record.responseTime, 0);

        return {
            availability: Math.round((healthyChecks / recentHistory.length) * 100 * 100) / 100,
            totalChecks: recentHistory.length,
            healthyChecks,
            averageResponseTime: Math.round(totalResponseTime / recentHistory.length * 100) / 100,
            timeRange: `${timeRange} hours`
        };
    }

    /**
     * 更新服務健康歷史記錄
     */
    private updateHealthHistory(serviceName: string, result: HealthCheckResult): void {
        let history = this.healthHistory.get(serviceName) || [];
        history.push(result);
        
        // 保持歷史記錄在限制範圍內
        if (history.length > this.MAX_HISTORY) {
            history = history.slice(-this.MAX_HISTORY);
        }
        
        this.healthHistory.set(serviceName, history);
    }

    /**
     * 啟動持續健康檢查
     */
    private startContinuousHealthChecking(): void {
        // 每 2 分鐘檢查一次所有服務
        setInterval(async () => {
            try {
                await this.checkAllServicesHealth();
            } catch (error) {
                this.logger.error('❌ Continuous health check failed:', error);
            }
        }, 120000); // 2 分鐘

        this.logger.info('🔄 Continuous health checking started (interval: 2 minutes)');
    }

    /**
     * 檢查 Gateway 自身的健康狀態
     */
    public getGatewayHealth(): any {
        const memoryUsage = process.memoryUsage();
        
        return {
            status: 'healthy',
            uptime: process.uptime(),
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
                external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
            },
            versions: {
                node: process.version,
                v8: process.versions.v8
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 清理資源
     */
    public cleanup(): void {
        this.healthHistory.clear();
        this.logger.info('🧹 Health config cleanup completed');
    }
}
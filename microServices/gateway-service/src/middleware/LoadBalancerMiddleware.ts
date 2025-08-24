/**
 * @fileoverview 負載均衡中間件
 * @description 實現多種負載均衡算法，提供高可用性和性能優化
 * @author AIOT Development Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { ServiceInstance } from './ProxyMiddleware.js';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * 負載均衡算法類型
 */
export type LoadBalancingAlgorithm = 
    | 'round-robin'
    | 'weighted-round-robin'
    | 'least-connections'
    | 'random'
    | 'ip-hash'
    | 'response-time'
    | 'health-aware';

/**
 * 服務實例健康狀態
 */
export interface ServiceHealth {
    /** 服務實例 */
    instance: ServiceInstance;
    /** 是否健康 */
    healthy: boolean;
    /** 當前連接數 */
    currentConnections: number;
    /** 權重 */
    weight: number;
    /** 平均響應時間（毫秒） */
    averageResponseTime: number;
    /** 最後健康檢查時間 */
    lastHealthCheck: Date;
    /** 連續失敗次數 */
    consecutiveFailures: number;
    /** 總請求數 */
    totalRequests: number;
    /** 成功請求數 */
    successfulRequests: number;
    /** 負載分數（越低越好） */
    loadScore: number;
}

/**
 * 負載均衡配置
 */
export interface LoadBalancerConfig {
    /** 負載均衡算法 */
    algorithm: LoadBalancingAlgorithm;
    /** 健康檢查間隔（毫秒） */
    healthCheckInterval: number;
    /** 健康檢查超時（毫秒） */
    healthCheckTimeout: number;
    /** 最大重試次數 */
    maxRetries: number;
    /** 失敗閾值（連續失敗多少次標記為不健康） */
    failureThreshold: number;
    /** 權重配置（用於加權輪詢） */
    weights?: Record<string, number>;
    /** 是否啟用粘性會話（基於 IP） */
    stickySession?: boolean;
}

/**
 * 負載均衡中間件類別
 */
@injectable()
export class LoadBalancerMiddleware {
    private serviceHealthMap = new Map<string, Map<string, ServiceHealth>>();
    private roundRobinCounters = new Map<string, number>();
    private weightedCounters = new Map<string, Map<string, number>>();
    private logger = loggerConfig.child({ service: 'LoadBalancer' });
    
    // 預設配置
    private defaultConfig: LoadBalancerConfig = {
        algorithm: 'health-aware',
        healthCheckInterval: 30000, // 30 秒
        healthCheckTimeout: 5000,   // 5 秒
        maxRetries: 3,
        failureThreshold: 3,
        stickySession: false
    };

    constructor() {
        this.startHealthCheckLoop();
        this.logger.info('✅ LoadBalancer middleware initialized');
    }

    /**
     * 選擇最佳服務實例
     */
    public selectInstance(
        serviceName: string,
        instances: ServiceInstance[],
        clientIp?: string,
        config: Partial<LoadBalancerConfig> = {}
    ): ServiceInstance | null {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        if (!instances || instances.length === 0) {
            this.logger.warn(`No instances available for service: ${serviceName}`);
            return null;
        }

        // 確保所有實例都在健康映射中
        this.ensureInstancesTracked(serviceName, instances, finalConfig);

        // 獲取健康的實例
        const healthyInstances = this.getHealthyInstances(serviceName);
        
        if (healthyInstances.length === 0) {
            this.logger.warn(`No healthy instances available for service: ${serviceName}`);
            // 如果沒有健康實例，回退到原始實例中選擇一個
            return instances[0];
        }

        let selectedInstance: ServiceInstance | null = null;

        switch (finalConfig.algorithm) {
            case 'round-robin':
                selectedInstance = this.roundRobinSelect(serviceName, healthyInstances);
                break;
            
            case 'weighted-round-robin':
                selectedInstance = this.weightedRoundRobinSelect(serviceName, healthyInstances, finalConfig.weights);
                break;
            
            case 'least-connections':
                selectedInstance = this.leastConnectionsSelect(healthyInstances);
                break;
            
            case 'random':
                selectedInstance = this.randomSelect(healthyInstances);
                break;
            
            case 'ip-hash':
                selectedInstance = this.ipHashSelect(healthyInstances, clientIp);
                break;
            
            case 'response-time':
                selectedInstance = this.responseTimeSelect(healthyInstances);
                break;
            
            case 'health-aware':
                selectedInstance = this.healthAwareSelect(healthyInstances);
                break;
            
            default:
                selectedInstance = this.healthAwareSelect(healthyInstances);
        }

        if (selectedInstance) {
            this.recordInstanceSelection(serviceName, selectedInstance.id);
            this.logger.debug(`Selected instance for ${serviceName}`, {
                algorithm: finalConfig.algorithm,
                instanceId: selectedInstance.id,
                address: `${selectedInstance.address}:${selectedInstance.port}`
            });
        }

        return selectedInstance;
    }

    /**
     * 輪詢選擇
     */
    private roundRobinSelect(serviceName: string, instances: ServiceHealth[]): ServiceInstance {
        const counter = this.roundRobinCounters.get(serviceName) || 0;
        const selected = instances[counter % instances.length];
        this.roundRobinCounters.set(serviceName, counter + 1);
        return selected.instance;
    }

    /**
     * 加權輪詢選擇
     */
    private weightedRoundRobinSelect(
        serviceName: string, 
        instances: ServiceHealth[], 
        weights?: Record<string, number>
    ): ServiceInstance {
        if (!weights || Object.keys(weights).length === 0) {
            // 如果沒有權重配置，回退到普通輪詢
            return this.roundRobinSelect(serviceName, instances);
        }

        // 初始化加權計數器
        if (!this.weightedCounters.has(serviceName)) {
            const counters = new Map<string, number>();
            instances.forEach(instance => {
                const weight = weights[instance.instance.id] || 1;
                counters.set(instance.instance.id, weight);
            });
            this.weightedCounters.set(serviceName, counters);
        }

        const counters = this.weightedCounters.get(serviceName)!;
        
        // 找到當前權重最高的實例
        let selectedInstance: ServiceHealth | null = null;
        let maxWeight = -1;
        
        instances.forEach(instance => {
            const currentWeight = counters.get(instance.instance.id) || 0;
            if (currentWeight > maxWeight) {
                maxWeight = currentWeight;
                selectedInstance = instance;
            }
        });

        if (selectedInstance) {
            // 減少所選實例的當前權重
            const currentWeight = counters.get(selectedInstance.instance.id) || 0;
            counters.set(selectedInstance.instance.id, currentWeight - 1);
            
            // 如果所有權重都為 0，重置權重
            const allWeightsZero = Array.from(counters.values()).every(w => w <= 0);
            if (allWeightsZero) {
                instances.forEach(instance => {
                    const originalWeight = weights[instance.instance.id] || 1;
                    counters.set(instance.instance.id, originalWeight);
                });
            }
        }

        return selectedInstance ? selectedInstance.instance : instances[0].instance;
    }

    /**
     * 最少連接選擇
     */
    private leastConnectionsSelect(instances: ServiceHealth[]): ServiceInstance {
        return instances.reduce((min, current) => 
            current.currentConnections < min.currentConnections ? current : min
        ).instance;
    }

    /**
     * 隨機選擇
     */
    private randomSelect(instances: ServiceHealth[]): ServiceInstance {
        const randomIndex = Math.floor(Math.random() * instances.length);
        return instances[randomIndex].instance;
    }

    /**
     * IP 雜湊選擇（粘性會話）
     */
    private ipHashSelect(instances: ServiceHealth[], clientIp?: string): ServiceInstance {
        if (!clientIp) {
            return this.randomSelect(instances);
        }

        // 簡單的雜湊函數
        let hash = 0;
        for (let i = 0; i < clientIp.length; i++) {
            const char = clientIp.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為 32 位整數
        }

        const index = Math.abs(hash) % instances.length;
        return instances[index].instance;
    }

    /**
     * 響應時間選擇（最快響應）
     */
    private responseTimeSelect(instances: ServiceHealth[]): ServiceInstance {
        return instances.reduce((fastest, current) => 
            current.averageResponseTime < fastest.averageResponseTime ? current : fastest
        ).instance;
    }

    /**
     * 健康感知選擇（綜合評分）
     */
    private healthAwareSelect(instances: ServiceHealth[]): ServiceInstance {
        // 計算每個實例的綜合負載分數
        instances.forEach(instance => {
            const connectionWeight = 0.3;
            const responseTimeWeight = 0.4;
            const errorRateWeight = 0.3;

            const connectionScore = instance.currentConnections;
            const responseTimeScore = instance.averageResponseTime / 100; // 正規化到相似範圍
            const errorRate = instance.totalRequests > 0 ? 
                1 - (instance.successfulRequests / instance.totalRequests) : 0;
            const errorScore = errorRate * 100;

            instance.loadScore = 
                (connectionScore * connectionWeight) +
                (responseTimeScore * responseTimeWeight) +
                (errorScore * errorRateWeight);
        });

        // 選擇負載分數最低的實例
        return instances.reduce((best, current) => 
            current.loadScore < best.loadScore ? current : best
        ).instance;
    }

    /**
     * 確保實例被追蹤
     */
    private ensureInstancesTracked(
        serviceName: string, 
        instances: ServiceInstance[], 
        config: LoadBalancerConfig
    ): void {
        if (!this.serviceHealthMap.has(serviceName)) {
            this.serviceHealthMap.set(serviceName, new Map());
        }

        const serviceMap = this.serviceHealthMap.get(serviceName)!;
        
        instances.forEach(instance => {
            if (!serviceMap.has(instance.id)) {
                serviceMap.set(instance.id, {
                    instance,
                    healthy: true,
                    currentConnections: 0,
                    weight: config.weights?.[instance.id] || 1,
                    averageResponseTime: 100, // 預設 100ms
                    lastHealthCheck: new Date(),
                    consecutiveFailures: 0,
                    totalRequests: 0,
                    successfulRequests: 0,
                    loadScore: 0
                });
            }
        });
    }

    /**
     * 獲取健康實例
     */
    private getHealthyInstances(serviceName: string): ServiceHealth[] {
        const serviceMap = this.serviceHealthMap.get(serviceName);
        if (!serviceMap) return [];

        return Array.from(serviceMap.values()).filter(health => health.healthy);
    }

    /**
     * 記錄實例選擇
     */
    private recordInstanceSelection(serviceName: string, instanceId: string): void {
        const serviceMap = this.serviceHealthMap.get(serviceName);
        if (!serviceMap) return;

        const health = serviceMap.get(instanceId);
        if (health) {
            health.currentConnections++;
            health.totalRequests++;
        }
    }

    /**
     * 記錄請求完成
     */
    public recordRequestComplete(
        serviceName: string, 
        instanceId: string, 
        responseTime: number, 
        success: boolean
    ): void {
        const serviceMap = this.serviceHealthMap.get(serviceName);
        if (!serviceMap) return;

        const health = serviceMap.get(instanceId);
        if (health) {
            health.currentConnections = Math.max(0, health.currentConnections - 1);
            
            if (success) {
                health.successfulRequests++;
                health.consecutiveFailures = 0;
            } else {
                health.consecutiveFailures++;
            }

            // 更新平均響應時間（指數移動平均）
            const alpha = 0.1; // 平滑因子
            health.averageResponseTime = 
                (alpha * responseTime) + ((1 - alpha) * health.averageResponseTime);

            // 檢查是否需要標記為不健康
            if (health.consecutiveFailures >= this.defaultConfig.failureThreshold) {
                health.healthy = false;
                this.logger.warn(`Instance marked as unhealthy`, {
                    serviceName,
                    instanceId,
                    consecutiveFailures: health.consecutiveFailures
                });
            }
        }
    }

    /**
     * 啟動健康檢查循環
     */
    private startHealthCheckLoop(): void {
        setInterval(async () => {
            await this.performHealthChecks();
        }, this.defaultConfig.healthCheckInterval);
    }

    /**
     * 執行健康檢查
     */
    private async performHealthChecks(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [serviceName, serviceMap] of this.serviceHealthMap) {
            for (const [instanceId, health] of serviceMap) {
                promises.push(this.checkInstanceHealth(serviceName, instanceId, health));
            }
        }

        await Promise.allSettled(promises);
    }

    /**
     * 檢查單個實例健康狀態
     */
    private async checkInstanceHealth(
        serviceName: string, 
        instanceId: string, 
        health: ServiceHealth
    ): Promise<void> {
        try {
            const startTime = Date.now();
            
            // 這裡應該實現實際的健康檢查邏輯
            // 可以是 HTTP 請求、TCP 連接等
            const isHealthy = await this.pingInstance(health.instance);
            const responseTime = Date.now() - startTime;

            health.lastHealthCheck = new Date();
            
            if (isHealthy) {
                health.healthy = true;
                health.consecutiveFailures = 0;
                
                // 更新響應時間（健康檢查的響應時間）
                const alpha = 0.05; // 較小的平滑因子，因為健康檢查頻率較低
                health.averageResponseTime = 
                    (alpha * responseTime) + ((1 - alpha) * health.averageResponseTime);
                
                this.logger.debug(`Health check passed`, {
                    serviceName,
                    instanceId,
                    responseTime
                });
            } else {
                health.consecutiveFailures++;
                if (health.consecutiveFailures >= this.defaultConfig.failureThreshold) {
                    health.healthy = false;
                }
                
                this.logger.warn(`Health check failed`, {
                    serviceName,
                    instanceId,
                    consecutiveFailures: health.consecutiveFailures
                });
            }
        } catch (error) {
            health.consecutiveFailures++;
            if (health.consecutiveFailures >= this.defaultConfig.failureThreshold) {
                health.healthy = false;
            }
            
            this.logger.error(`Health check error`, {
                serviceName,
                instanceId,
                error: error.message
            });
        }
    }

    /**
     * Ping 實例（簡化的健康檢查）
     */
    private async pingInstance(instance: ServiceInstance): Promise<boolean> {
        try {
            const response = await fetch(`http://${instance.address}:${instance.port}/health`, {
                method: 'GET',
                timeout: this.defaultConfig.healthCheckTimeout
            } as any);
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 獲取服務健康狀態報告
     */
    public getHealthReport(serviceName?: string): Record<string, ServiceHealth[]> {
        const report: Record<string, ServiceHealth[]> = {};
        
        const serviceNames = serviceName ? [serviceName] : Array.from(this.serviceHealthMap.keys());
        
        serviceNames.forEach(name => {
            const serviceMap = this.serviceHealthMap.get(name);
            if (serviceMap) {
                report[name] = Array.from(serviceMap.values());
            }
        });
        
        return report;
    }

    /**
     * 手動標記實例健康狀態
     */
    public setInstanceHealth(serviceName: string, instanceId: string, healthy: boolean): void {
        const serviceMap = this.serviceHealthMap.get(serviceName);
        if (serviceMap) {
            const health = serviceMap.get(instanceId);
            if (health) {
                health.healthy = healthy;
                health.consecutiveFailures = healthy ? 0 : health.consecutiveFailures;
                this.logger.info(`Instance health manually set`, {
                    serviceName,
                    instanceId,
                    healthy
                });
            }
        }
    }

    /**
     * 清理服務實例
     */
    public cleanupService(serviceName: string): void {
        this.serviceHealthMap.delete(serviceName);
        this.roundRobinCounters.delete(serviceName);
        this.weightedCounters.delete(serviceName);
        this.logger.info(`Service cleanup completed: ${serviceName}`);
    }
}
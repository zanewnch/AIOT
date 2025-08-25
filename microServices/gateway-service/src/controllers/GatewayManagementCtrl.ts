/**
 * @fileoverview Gateway 管理控制器
 * @description 提供 Gateway 監控、統計、健康檢查等管理功能的 API 端點
 * @author AIOT Development Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Request, Response } from 'express';
import { MonitoringMiddleware } from '../middleware/MonitoringMiddleware.js';
import { LoadBalancerMiddleware } from '../middleware/LoadBalancerMiddleware.js';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware.js';
import { ResResult } from '../utils/ResResult.js';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * Gateway 管理控制器類別
 */
@injectable()
export class class GatewayManagementCtrl {Ctrl {
    private logger = loggerConfig.child({ service: 'GatewayManagement' });
    
    constructor(
        private monitoringMiddleware: MonitoringMiddleware,
        private loadBalancerMiddleware: LoadBalancerMiddleware,
        private rateLimitMiddleware: RateLimitMiddleware
    ) {}

    /**
     * 獲取 Gateway 整體狀態
     */
    public getGatewayStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const realtimeMetrics = this.monitoringMiddleware.getRealtimeMetrics();
            const stats = this.monitoringMiddleware.getStats();
            const loadBalancerRepositorysitoryrt = this.loadBalancerMiddleware.getHealthRepositorysitoryrt();

            const gatewayStatus = {
                status: 'healthy',
                uptime: process.uptime(),
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                
                // 實時指標
                realtime: {
                    rps: realtimeMetrics.currentRPS,
                    activeConnections: realtimeMetrics.activeConnections,
                    avgResponseTime: Math.round(realtimeMetrics.currentAvgResponseTime),
                    memoryUsage: realtimeMetrics.memoryUsage,
                    cpuUsage: realtimeMetrics.cpuUsage
                },
                
                // 統計摘要
                statistics: {
                    totalRequests: stats.totalRequests,
                    successRate: stats.totalRequests > 0 ? 
                        Math.round((stats.successRequests / stats.totalRequests) * 100) : 0,
                    avgResponseTime: Math.round(stats.averageResponseTime),
                    minResponseTime: stats.minResponseTime,
                    maxResponseTime: stats.maxResponseTime
                },
                
                // 服務健康狀態
                services: Object.keys(loadBalancerRepositorysitoryrt).map(serviceName => {
                    const instances = loadBalancerRepositorysitoryrt[serviceName];
                    const healthyInstances = instances.filter(instance => instance.healthy).length;
                    return {
                        name: serviceName,
                        totalInstances: instances.length,
                        healthyInstances,
                        status: healthyInstances > 0 ? 'healthy' : 'unhealthy'
                    };
                })
            };

            ResResult.success(res, gatewayStatus, 'Gateway status retrieved successfully');
        } catch (error) {
            this.logger.error('Failed to get gateway status:', error);
            ResResult.fail(res, 'Failed to retrieve gateway status', 500);
        }
    };

    /**
     * 獲取詳細監控統計
     */
    public getMonitoringStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = this.monitoringMiddleware.getStats();
            const realtimeMetrics = this.monitoringMiddleware.getRealtimeMetrics();
            const performanceRepositorysitoryrt = this.monitoringMiddleware.getEndpointPerformanceRepositorysitoryrt();
            const topUsersRepositorysitoryrt = this.monitoringMiddleware.getTopUsersRepositorysitoryrt();

            const monitoringData = {
                overview: {
                    totalRequests: stats.totalRequests,
                    successRequests: stats.successRequests,
                    errorRequests: stats.errorRequests,
                    successRate: stats.totalRequests > 0 ? 
                        Math.round((stats.successRequests / stats.totalRequests) * 100) / 100 : 0,
                    averageResponseTime: Math.round(stats.averageResponseTime),
                    minResponseTime: stats.minResponseTime,
                    maxResponseTime: stats.maxResponseTime
                },
                
                realtime: realtimeMetrics,
                
                statusCodes: stats.statusCodes,
                
                endpoints: performanceRepositorysitoryrt,
                
                topUsers: topUsersRepositorysitoryrt,
                
                topIPs: Object.values(stats.ips)
                    .sort((a, b) => b.totalRequests - a.totalRequests)
                    .slice(0, 10)
                    .map(ipStat => ({
                        ip: ipStat.ip,
                        totalRequests: ipStat.totalRequests,
                        successRate: ipStat.totalRequests > 0 ? 
                            Math.round((ipStat.successRequests / ipStat.totalRequests) * 100) : 0,
                        avgResponseTime: Math.round(ipStat.averageResponseTime),
                        lastRequestTime: ipStat.lastRequestTime
                    }))
            };

            ResResult.success(res, monitoringData, 'Monitoring statistics retrieved successfully');
        } catch (error) {
            this.logger.error('Failed to get monitoring stats:', error);
            ResResult.fail(res, 'Failed to retrieve monitoring statistics', 500);
        }
    };

    /**
     * 獲取負載均衡狀態
     */
    public getLoadBalancerStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const serviceName = req.params.serviceName;
            const healthRepositorysitoryrt = this.loadBalancerMiddleware.getHealthRepositorysitoryrt(serviceName);

            const loadBalancerStatus = Object.entries(healthRepositorysitoryrt).map(([service, instances]) => ({
                serviceName: service,
                algorithm: 'health-aware', // 可以從配置中獲取
                totalInstances: instances.length,
                healthyInstances: instances.filter(instance => instance.healthy).length,
                instances: instances.map(instance => ({
                    id: instance.instance.id,
                    address: `${instance.instance.address}:${instance.instance.port}`,
                    healthy: instance.healthy,
                    currentConnections: instance.currentConnections,
                    weight: instance.weight,
                    averageResponseTime: Math.round(instance.averageResponseTime),
                    totalRequests: instance.totalRequests,
                    successRate: instance.totalRequests > 0 ? 
                        Math.round((instance.successfulRequests / instance.totalRequests) * 100) : 0,
                    consecutiveFailures: instance.consecutiveFailures,
                    lastHealthCheck: instance.lastHealthCheck,
                    loadScore: Math.round(instance.loadScore * 100) / 100
                }))
            }));

            ResResult.success(res, loadBalancerStatus, 'Load balancer status retrieved successfully');
        } catch (error) {
            this.logger.error('Failed to get load balancer status:', error);
            ResResult.fail(res, 'Failed to retrieve load balancer status', 500);
        }
    };

    /**
     * 手動設置服務實例健康狀態
     */
    public setInstanceHealth = async (req: Request, res: Response): Promise<void> => {
        try {
            const { serviceName, instanceId } = req.params;
            const { healthy } = req.body;

            if (typeof healthy !== 'boolean') {
                ResResult.fail(res, 'Invalid health status. Must be true or false.', 400);
                return;
            }

            this.loadBalancerMiddleware.setInstanceHealth(serviceName, instanceId, healthy);

            ResResult.success(res, {
                serviceName,
                instanceId,
                healthy,
                timestamp: new Date().toISOString()
            }, `Instance health status updated successfully`);
        } catch (error) {
            this.logger.error('Failed to set instance health:', error);
            ResResult.fail(res, 'Failed to update instance health status', 500);
        }
    };

    /**
     * 獲取端點性能報告
     */
    public getEndpointPerformance = async (req: Request, res: Response): Promise<void> => {
        try {
            const performanceRepositorysitoryrt = this.monitoringMiddleware.getEndpointPerformanceRepositorysitoryrt();
            
            ResResult.success(res, {
                endpoints: performanceRepositorysitoryrt,
                timestamp: new Date().toISOString(),
                summary: {
                    totalEndpoints: performanceRepositorysitoryrt.length,
                    excellentPerformance: performanceRepositorysitoryrt.filter(ep => ep.performance === 'excellent').length,
                    goodPerformance: performanceRepositorysitoryrt.filter(ep => ep.performance === 'good').length,
                    poorPerformance: performanceRepositorysitoryrt.filter(ep => ep.performance === 'poor').length,
                    criticalPerformance: performanceRepositorysitoryrt.filter(ep => ep.performance === 'critical').length
                }
            }, 'Endpoint performance report retrieved successfully');
        } catch (error) {
            this.logger.error('Failed to get endpoint performance:', error);
            ResResult.fail(res, 'Failed to retrieve endpoint performance report', 500);
        }
    };

    /**
     * 獲取用戶活動報告
     */
    public getUserActivity = async (req: Request, res: Response): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const topUsersRepositorysitoryrt = this.monitoringMiddleware.getTopUsersRepositorysitoryrt(limit);
            
            ResResult.success(res, {
                topUsers: topUsersRepositorysitoryrt,
                timestamp: new Date().toISOString(),
                summary: {
                    totalActiveUsers: topUsersRepositorysitoryrt.length,
                    totalRequests: topUsersRepositorysitoryrt.reduce((sum, user) => sum + user.requestCount, 0),
                    avgRequestsPerUser: topUsersRepositorysitoryrt.length > 0 ? 
                        Math.round(topUsersRepositorysitoryrt.reduce((sum, user) => sum + user.requestCount, 0) / topUsersRepositorysitoryrt.length) : 0
                }
            }, 'User activity report retrieved successfully');
        } catch (error) {
            this.logger.error('Failed to get user activity:', error);
            ResResult.fail(res, 'Failed to retrieve user activity report', 500);
        }
    };

    /**
     * 重置統計數據
     */
    public resetStats = async (req: Request, res: Response): Promise<void> => {
        try {
            this.monitoringMiddleware.resetStats();
            
            this.logger.info('Statistics reset by user', { 
                userId: req.user?.id, 
                userAgent: req.get('user-agent'),
                ip: req.ip 
            });
            
            ResResult.success(res, {
                message: 'All statistics have been reset',
                resetTime: new Date().toISOString(),
                resetBy: req.user?.username || 'Unknown'
            }, 'Statistics reset successfully');
        } catch (error) {
            this.logger.error('Failed to reset stats:', error);
            ResResult.fail(res, 'Failed to reset statistics', 500);
        }
    };

    /**
     * 獲取實時指標（用於實時監控界面）
     */
    public getRealtimeMetrics = async (req: Request, res: Response): Promise<void> => {
        try {
            const realtimeMetrics = this.monitoringMiddleware.getRealtimeMetrics();
            
            // 設置 Server-Sent Events 標頭
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            // 發送初始數據
            res.write(`data: ${JSON.stringify(realtimeMetrics)}\n\n`);

            // 設置定期更新
            const intervalId = setInterval(() => {
                const updatedMetrics = this.monitoringMiddleware.getRealtimeMetrics();
                res.write(`data: ${JSON.stringify(updatedMetrics)}\n\n`);
            }, 5000); // 每 5 秒更新一次

            // 處理客戶端斷開連接
            req.on('close', () => {
                clearInterval(intervalId);
            });

        } catch (error) {
            this.logger.error('Failed to start realtime metrics stream:', error);
            ResResult.fail(res, 'Failed to start realtime metrics stream', 500);
        }
    };

    /**
     * 獲取 Gateway 配置資訊
     */
    public getConfiguration = async (req: Request, res: Response): Promise<void> => {
        try {
            const configuration = {
                version: '1.0.0',
                features: {
                    rateLimit: true,
                    loadBalancing: true,
                    monitoring: true,
                    healthCheck: true,
                    authentication: true
                },
                services: [
                    'rbac-service',
                    'drone-service', 
                    'general-service',
                    'auth-service',
                    'drone-websocket-service',
                    'llm-service'
                ],
                loadBalancingAlgorithms: [
                    'round-robin',
                    'weighted-round-robin', 
                    'least-connections',
                    'random',
                    'ip-hash',
                    'response-time',
                    'health-aware'
                ],
                environment: process.env.NODE_ENV || 'development',
                startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
                uptime: Math.floor(process.uptime())
            };

            ResResult.success(res, configuration, 'Gateway configuration retrieved successfully');
        } catch (error) {
            this.logger.error('Failed to get configuration:', error);
            ResResult.fail(res, 'Failed to retrieve gateway configuration', 500);
        }
    };
}
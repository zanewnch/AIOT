/**
 * @fileoverview 健康檢查路由配置
 * 
 * 提供服務健康檢查和監控相關的 HTTP API 端點
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Router } from 'express';

/**
 * 健康檢查路由類別
 * 
 * 提供服務狀態監控和健康檢查端點
 * 使用 arrow functions 避免 this 綁定問題
 */
@injectable()
export class HealthRoutes {
    private readonly router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定健康檢查路由
     */
    private setupRoutes = (): void => {
        // 基本健康檢查
        this.router.get('/health', this.getHealth);
        
        // 詳細健康檢查
        this.router.get('/health/detailed', this.getDetailedHealth);
        
        // 就緒狀態檢查 (Kubernetes readiness probe)
        this.router.get('/ready', this.getReadiness);
        
        // 存活狀態檢查 (Kubernetes liveness probe)
        this.router.get('/live', this.getLiveness);
        
        // 服務資訊
        this.router.get('/info', this.getInfo);
        
        // 系統指標 (Prometheus 格式)
        this.router.get('/metrics', this.getMetrics);
    }

    /**
     * 基本健康檢查端點
     */
    private getHealth = (req: any, res: any) => {
        res.status(200).json({
            status: 'healthy',
            service: 'drone-realtime-service',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            features: [
                'Real-time Status Management',
                'WebSocket Communication',
                'CQRS Architecture',
                'IoC Container'
            ]
        });
    }

    /**
     * 詳細健康檢查端點
     */
    private getDetailedHealth = async (req: any, res: any) => {
        try {
            const healthData = {
                status: 'healthy',
                service: 'drone-realtime-service',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                
                // 系統資源
                system: {
                    platform: process.platform,
                    nodeVersion: process.version,
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                        external: Math.round(process.memoryUsage().external / 1024 / 1024)
                    },
                    cpu: {
                        usage: process.cpuUsage()
                    }
                },
                
                // 服務狀態
                services: {
                    database: 'connected', // 這裡可以添加實際的資料庫檢查
                    redis: 'connected',     // 這裡可以添加實際的 Redis 檢查
                    websocket: 'active'     // 這裡可以添加 WebSocket 狀態檢查
                },
                
                // 功能特性
                features: {
                    realTimeStatus: true,
                    websocketSupport: true,
                    cqrsPattern: true,
                    iocContainer: true
                }
            };

            res.status(200).json(healthData);
            
        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                service: 'drone-realtime-service',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 就緒狀態檢查端點
     */
    private getReadiness = (req: any, res: any) => {
        // 檢查服務是否準備好接受流量
        // 這裡可以添加資料庫連接、必要服務初始化等檢查
        
        try {
            res.status(200).json({
                status: 'ready',
                service: 'drone-realtime-service',
                timestamp: new Date().toISOString(),
                message: 'Service is ready to accept traffic'
            });
        } catch (error) {
            res.status(503).json({
                status: 'not ready',
                service: 'drone-realtime-service',
                timestamp: new Date().toISOString(),
                error: 'Service not ready'
            });
        }
    }

    /**
     * 存活狀態檢查端點
     */
    private getLiveness = (req: any, res: any) => {
        res.status(200).json({
            status: 'alive',
            service: 'drone-realtime-service',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid
        });
    }

    /**
     * 服務資訊端點
     */
    private getInfo = (req: any, res: any) => {
        res.status(200).json({
            service: 'AIOT Drone Real-time Service',
            version: '1.0.0',
            description: '無人機即時狀態管理和 WebSocket 通訊服務',
            author: 'AIOT Team',
            
            // API 端點資訊
            endpoints: {
                health: '/health',
                detailedHealth: '/health/detailed',
                ready: '/ready',
                live: '/live',
                info: '/info',
                websocketStatus: '/api/websocket/status',
                websocketInfo: '/api/websocket/info',
                websocket: '/socket.io'
            },
            
            // 支援的功能
            capabilities: {
                realTimeStatusTracking: true,
                websocketCommunication: true,
                healthMonitoring: true,
                connectionMonitoring: true
            },
            
            // 架構資訊
            architecture: {
                pattern: 'WebSocket Real-time Communication',
                containerType: 'InversifyJS',
                database: 'MySQL/Sequelize',
                cache: 'Redis',
                communication: 'Socket.IO'
            }
        });
    }

    /**
     * 系統指標端點 (Prometheus 格式)
     */
    private getMetrics = (req: any, res: any) => {
        const metrics = `
# HELP nodejs_heap_used_bytes Node.js heap memory used
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_heap_total_bytes Node.js heap memory total
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes ${process.memoryUsage().heapTotal}

# HELP nodejs_external_memory_bytes Node.js external memory
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${process.memoryUsage().external}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds counter
process_uptime_seconds ${process.uptime()}

# HELP process_start_time_seconds Start time of the process since unix epoch
# TYPE process_start_time_seconds gauge
process_start_time_seconds ${Date.now() / 1000 - process.uptime()}
        `.trim();

        res.set('Content-Type', 'text/plain');
        res.status(200).send(metrics);
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}
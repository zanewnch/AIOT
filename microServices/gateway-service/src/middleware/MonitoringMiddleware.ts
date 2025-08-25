/**
 * @fileoverview 請求監控和統計中間件
 * @description 實現請求響應時間監控、請求統計、性能分析等功能
 * @author AIOT Development Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * 請求統計數據介面
 */
export interface RequestStats {
    /** 總請求數 */
    totalRequests: number;
    /** 成功請求數 */
    successRequests: number;
    /** 錯誤請求數 */
    errorRequests: number;
    /** 平均響應時間（毫秒） */
    averageResponseTime: number;
    /** 最小響應時間（毫秒） */
    minResponseTime: number;
    /** 最大響應時間（毫秒） */
    maxResponseTime: number;
    /** 請求按狀態碼分組 */
    statusCodes: Record<number, number>;
    /** 請求按端點分組 */
    endpoints: Record<string, EndpointStats>;
    /** 請求按用戶分組 */
    users: Record<string, UserStats>;
    /** 請求按 IP 分組 */
    ips: Record<string, IpStats>;
}

/**
 * 端點統計數據介面
 */
export interface EndpointStats {
    /** 總請求數 */
    totalRequests: number;
    /** 成功請求數 */
    successRequests: number;
    /** 錯誤請求數 */
    errorRequests: number;
    /** 平均響應時間 */
    averageResponseTime: number;
    /** 最小響應時間 */
    minResponseTime: number;
    /** 最大響應時間 */
    maxResponseTime: number;
    /** 最後請求時間 */
    lastRequestTime: Date;
    /** HTTP 方法統計 */
    methods: Record<string, number>;
}

/**
 * 用戶統計數據介面
 */
export interface UserStats {
    /** 用戶 ID */
    userId: string;
    /** 用戶名 */
    username?: string;
    /** 總請求數 */
    totalRequests: number;
    /** 成功請求數 */
    successRequests: number;
    /** 錯誤請求數 */
    errorRequests: number;
    /** 平均響應時間 */
    averageResponseTime: number;
    /** 最後請求時間 */
    lastRequestTime: Date;
    /** 最常使用的端點 */
    topEndpoints: Record<string, number>;
}

/**
 * IP 統計數據介面
 */
export interface IpStats {
    /** IP 地址 */
    ip: string;
    /** 總請求數 */
    totalRequests: number;
    /** 成功請求數 */
    successRequests: number;
    /** 錯誤請求數 */
    errorRequests: number;
    /** 平均響應時間 */
    averageResponseTime: number;
    /** 最後請求時間 */
    lastRequestTime: Date;
    /** 地理位置（可選） */
    location?: string;
    /** User-Agent 統計 */
    userAgents: Record<string, number>;
}

/**
 * 實時監控數據介面
 */
export interface RealtimeMetrics {
    /** 當前 RPS（每秒請求數） */
    currentRPS: number;
    /** 當前活躍連接數 */
    activeConnections: number;
    /** 當前平均響應時間 */
    currentAvgResponseTime: number;
    /** CPU 使用率 */
    cpuUsage?: number;
    /** 記憶體使用率 */
    memoryUsage?: number;
    /** 最後更新時間 */
    lastUpdated: Date;
}

/**
 * 監控中間件類別
 */
@injectable()
export class MonitoringMiddleware {
    private stats: RequestStats;
    private realtimeMetrics: RealtimeMetrics;
    private logger = loggerConfig.child({ service: 'Monitoring' });
    
    // 實時數據追蹤
    private requestTimestamps: number[] = []; // 最近 60 秒的請求時間戳
    private responseTimeWindow: number[] = []; // 最近 100 個請求的響應時間
    private activeConnectionsCount = 0;

    constructor() {
        this.initializeStats();
        this.startPeriodicCleanup();
        this.startSystemMetricsCollection();
    }

    /**
     * 初始化統計數據
     */
    private initializeStats(): void {
        this.stats = {
            totalRequests: 0,
            successRequests: 0,
            errorRequests: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            statusCodes: {},
            endpoints: {},
            users: {},
            ips: {}
        };

        this.realtimeMetrics = {
            currentRPS: 0,
            activeConnections: 0,
            currentAvgResponseTime: 0,
            lastUpdated: new Date()
        };

        this.logger.info('✅ Monitoring statistics initialized');
    }

    /**
     * 主要監控中間件
     */
    public monitor() {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();
            const timestamp = startTime;
            
            // 增加活躍連接數
            this.activeConnectionsCount++;
            
            // 記錄請求開始
            this.recordRequestStart(req, timestamp);

            // 監聽響應結束事件
            res.on('finish', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                // 減少活躍連接數
                this.activeConnectionsCount--;
                
                // 記錄請求完成
                this.recordRequestEnd(req, res, responseTime, timestamp);
            });

            // 監聽響應關閉事件（用戶中斷連接）
            res.on('close', () => {
                this.activeConnectionsCount--;
            });

            next();
        };
    }

    /**
     * 記錄請求開始
     */
    private recordRequestStart(req: Request, timestamp: number): void {
        // 記錄請求時間戳用於 RPS 計算
        this.requestTimestamps.push(timestamp);
        
        // 只保留最近 60 秒的數據
        const cutoff = timestamp - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > cutoff);

        // 更新實時 RPS
        this.realtimeMetrics.currentRPS = this.requestTimestamps.length;
        this.realtimeMetrics.activeConnections = this.activeConnectionsCount;
    }

    /**
     * 記錄請求結束
     */
    private recordRequestEnd(req: Request, res: Response, responseTime: number, timestamp: number): void {
        const method = req.method;
        const endpoint = this.normalizeEndpoint(req.route?.path || req.path);
        const statusCode = res.statusCode;
        const ip = req.ip;
        const user = req.user;
        const isSuccess = statusCode < 400;

        // 更新全域統計
        this.updateGlobalStats(responseTime, statusCode, isSuccess);

        // 更新端點統計
        this.updateEndpointStats(endpoint, method, responseTime, isSuccess, timestamp);

        // 更新用戶統計
        if (user) {
            this.updateUserStats(user, endpoint, responseTime, isSuccess, timestamp);
        }

        // 更新 IP 統計
        this.updateIpStats(ip, req.get('user-agent'), responseTime, isSuccess, timestamp);

        // 更新實時指標
        this.updateRealtimeMetrics(responseTime);

        // 記錄詳細日誌
        this.logRequest(req, res, responseTime, endpoint);
    }

    /**
     * 更新全域統計
     */
    private updateGlobalStats(responseTime: number, statusCode: number, isSuccess: boolean): void {
        this.stats.totalRequests++;
        
        if (isSuccess) {
            this.stats.successRequests++;
        } else {
            this.stats.errorRequests++;
        }

        // 更新響應時間統計
        const total = this.stats.totalRequests;
        this.stats.averageResponseTime = 
            ((this.stats.averageResponseTime * (total - 1)) + responseTime) / total;
        
        this.stats.minResponseTime = Math.min(this.stats.minResponseTime, responseTime);
        this.stats.maxResponseTime = Math.max(this.stats.maxResponseTime, responseTime);

        // 更新狀態碼統計
        this.stats.statusCodes[statusCode] = (this.stats.statusCodes[statusCode] || 0) + 1;
    }

    /**
     * 更新端點統計
     */
    private updateEndpointStats(
        endpoint: string, 
        method: string, 
        responseTime: number, 
        isSuccess: boolean, 
        timestamp: number
    ): void {
        if (!this.stats.endpoints[endpoint]) {
            this.stats.endpoints[endpoint] = {
                totalRequests: 0,
                successRequests: 0,
                errorRequests: 0,
                averageResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                lastRequestTime: new Date(),
                methods: {}
            };
        }

        const endpointStats = this.stats.endpoints[endpoint];
        endpointStats.totalRequests++;
        
        if (isSuccess) {
            endpointStats.successRequests++;
        } else {
            endpointStats.errorRequests++;
        }

        // 更新響應時間
        const total = endpointStats.totalRequests;
        endpointStats.averageResponseTime = 
            ((endpointStats.averageResponseTime * (total - 1)) + responseTime) / total;
        
        endpointStats.minResponseTime = Math.min(endpointStats.minResponseTime, responseTime);
        endpointStats.maxResponseTime = Math.max(endpointStats.maxResponseTime, responseTime);
        endpointStats.lastRequestTime = new Date(timestamp);

        // 更新 HTTP 方法統計
        endpointStats.methods[method] = (endpointStats.methods[method] || 0) + 1;
    }

    /**
     * 更新用戶統計
     */
    private updateUserStats(
        user: any, 
        endpoint: string, 
        responseTime: number, 
        isSuccess: boolean, 
        timestamp: number
    ): void {
        const userId = user.id.toString();
        
        if (!this.stats.users[userId]) {
            this.stats.users[userId] = {
                userId,
                username: user.username,
                totalRequests: 0,
                successRequests: 0,
                errorRequests: 0,
                averageResponseTime: 0,
                lastRequestTime: new Date(),
                topEndpoints: {}
            };
        }

        const userStats = this.stats.users[userId];
        userStats.totalRequests++;
        
        if (isSuccess) {
            userStats.successRequests++;
        } else {
            userStats.errorRequests++;
        }

        // 更新響應時間
        const total = userStats.totalRequests;
        userStats.averageResponseTime = 
            ((userStats.averageResponseTime * (total - 1)) + responseTime) / total;
        
        userStats.lastRequestTime = new Date(timestamp);
        userStats.topEndpoints[endpoint] = (userStats.topEndpoints[endpoint] || 0) + 1;
    }

    /**
     * 更新 IP 統計
     */
    private updateIpStats(
        ip: string, 
        userAgent: string | undefined, 
        responseTime: number, 
        isSuccess: boolean, 
        timestamp: number
    ): void {
        if (!this.stats.ips[ip]) {
            this.stats.ips[ip] = {
                ip,
                totalRequests: 0,
                successRequests: 0,
                errorRequests: 0,
                averageResponseTime: 0,
                lastRequestTime: new Date(),
                userAgents: {}
            };
        }

        const ipStats = this.stats.ips[ip];
        ipStats.totalRequests++;
        
        if (isSuccess) {
            ipStats.successRequests++;
        } else {
            ipStats.errorRequests++;
        }

        // 更新響應時間
        const total = ipStats.totalRequests;
        ipStats.averageResponseTime = 
            ((ipStats.averageResponseTime * (total - 1)) + responseTime) / total;
        
        ipStats.lastRequestTime = new Date(timestamp);

        // 更新 User-Agent 統計
        if (userAgent) {
            const shortUA = userAgent.split(' ')[0]; // 簡化 User-Agent
            ipStats.userAgents[shortUA] = (ipStats.userAgents[shortUA] || 0) + 1;
        }
    }

    /**
     * 更新實時指標
     */
    private updateRealtimeMetrics(responseTime: number): void {
        // 維護響應時間窗口（最近 100 個請求）
        this.responseTimeWindow.push(responseTime);
        if (this.responseTimeWindow.length > 100) {
            this.responseTimeWindow.shift();
        }

        // 計算當前平均響應時間
        if (this.responseTimeWindow.length > 0) {
            this.realtimeMetrics.currentAvgResponseTime = 
                this.responseTimeWindow.reduce((a, b) => a + b, 0) / this.responseTimeWindow.length;
        }

        this.realtimeMetrics.lastUpdated = new Date();
    }

    /**
     * 正規化端點路徑（移除參數）
     */
    private normalizeEndpoint(path: string): string {
        return path.replace(/\/\d+/g, '/:id')
                  .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
                  .replace(/\/[a-f0-9-]{24}/g, '/:objectId');
    }

    /**
     * 記錄請求日誌
     */
    private logRequest(req: Request, res: Response, responseTime: number, endpoint: string): void {
        const logLevel = res.statusCode >= 500 ? 'error' : 
                        res.statusCode >= 400 ? 'warn' : 'info';

        this.logger.log(logLevel, `${req.method} ${endpoint} - ${res.statusCode} (${responseTime}ms)`, {
            method: req.method,
            endpoint,
            statusCode: res.statusCode,
            responseTime,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id,
            contentLength: res.get('content-length')
        });
    }

    /**
     * 獲取統計數據
     */
    public getStats(): RequestStats {
        return { ...this.stats };
    }

    /**
     * 獲取實時指標
     */
    public getRealtimeMetrics(): RealtimeMetrics {
        return { ...this.realtimeMetrics };
    }

    /**
     * 獲取端點性能報告
     */
    public getEndpointPerformanceRepositorysitoryrt(): Array<{
        endpoint: string;
        performance: 'excellent' | 'good' | 'poor' | 'critical';
        avgResponseTime: number;
        requestCount: number;
        errorRate: number;
    }> {
        return Object.entries(this.stats.endpoints).map(([endpoint, stats]) => {
            const errorRate = stats.totalRequests > 0 ? 
                (stats.errorRequests / stats.totalRequests) * 100 : 0;
            
            let performance: 'excellent' | 'good' | 'poor' | 'critical';
            if (stats.averageResponseTime < 100 && errorRate < 1) {
                performance = 'excellent';
            } else if (stats.averageResponseTime < 500 && errorRate < 5) {
                performance = 'good';
            } else if (stats.averageResponseTime < 2000 && errorRate < 10) {
                performance = 'poor';
            } else {
                performance = 'critical';
            }

            return {
                endpoint,
                performance,
                avgResponseTime: Math.round(stats.averageResponseTime),
                requestCount: stats.totalRequests,
                errorRate: Math.round(errorRate * 100) / 100
            };
        }).sort((a, b) => b.requestCount - a.requestCount);
    }

    /**
     * 獲取熱門用戶報告
     */
    public getTopUsersRepositorysitoryrt(limit: number = 10): Array<{
        userId: string;
        username?: string;
        requestCount: number;
        errorRate: number;
        avgResponseTime: number;
        lastActive: Date;
    }> {
        return Object.values(this.stats.users)
            .map(user => ({
                userId: user.userId,
                username: user.username,
                requestCount: user.totalRequests,
                errorRate: user.totalRequests > 0 ? 
                    (user.errorRequests / user.totalRequests) * 100 : 0,
                avgResponseTime: Math.round(user.averageResponseTime),
                lastActive: user.lastRequestTime
            }))
            .sort((a, b) => b.requestCount - a.requestCount)
            .slice(0, limit);
    }

    /**
     * 重置統計數據
     */
    public resetStats(): void {
        this.logger.info('🔄 Resetting monitoring statistics');
        this.initializeStats();
    }

    /**
     * 啟動定期清理
     */
    private startPeriodicCleanup(): void {
        // 每小時清理一次舊數據
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000);
    }

    /**
     * 清理舊數據
     */
    private cleanupOldData(): void {
        const now = Date.now();
        const cutoff = now - (24 * 60 * 60 * 1000); // 24 小時前

        // 清理舊的請求時間戳
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > cutoff);

        this.logger.info('🧹 Old monitoring data cleaned up');
    }

    /**
     * 啟動系統指標收集
     */
    private startSystemMetricsCollection(): void {
        setInterval(() => {
            try {
                const memUsage = process.memoryUsage();
                this.realtimeMetrics.memoryUsage = Math.round(
                    (memUsage.heapUsed / memUsage.heapTotal) * 100
                );

                // CPU 使用率需要額外的庫，這裡先設為 undefined
                // 在生產環境中可以使用 pidusage 等庫
                this.realtimeMetrics.cpuUsage = undefined;

            } catch (error) {
                this.logger.debug('Error collecting system metrics:', error);
            }
        }, 5000); // 每 5 秒收集一次
    }
}
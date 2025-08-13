/**
 * @fileoverview 動態文檔查詢控制器
 * 
 * 此文件實作了動態文檔控制器，專注於處理 microservice 架構的文檔展示。
 * 提供實時服務狀態、API 測試、架構展示等功能。
 * 遵循 CQRS 模式，主要處理查詢和展示操作。
 * 
 * @module DocsQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const logger = createLogger('DocsQueries');

/**
 * 動態文檔查詢控制器類別
 * 
 * 專門處理 microservice 架構文檔的動態展示，包含：
 * - 架構概覽和服務拓撲
 * - 實時服務狀態監控
 * - API 端點測試和驗證
 * - 服務間依賴關係圖表
 * 
 * @class DocsController
 * @since 1.0.0
 */
@injectable()
export class DocsController {
    
    private readonly microservices = [
        { name: 'general', url: 'http://aiot-fesetting:8000', description: '前端設定管理服務' },
        { name: 'rbac', url: 'http://aiot-rbac:8001', description: '角色權限管理服務' },
        { name: 'drone', url: 'http://aiot-drone:8002', description: '無人機管理服務' },
        { name: 'drone-realtime', url: 'http://aiot-drone-realtime:8003', description: '無人機即時數據服務' }
    ];

    private readonly externalServices = [
        { name: 'MySQL', url: 'mysql://aiot-mysql:3306', description: '主要資料庫' },
        { name: 'Redis', url: 'redis://aiot-redis:6379', description: '快取服務' },
        { name: 'RabbitMQ', url: 'amqp://aiot-rabbitmq:5672', description: '訊息佇列' },
        { name: 'Kong', url: 'http://aiot-kong:8000', description: 'API 閘道' }
    ];

    constructor() {}

    /**
     * 主文檔頁面 - 系統概覽
     * @route GET /docs
     */
    async getMainDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Rendering main documentation page');

            const servicesStatus = await this.checkAllServicesStatus();
            
            const data = {
                title: 'AIOT Microservices 架構文檔',
                currentPage: 'overview',
                microservices: this.microservices,
                externalServices: this.externalServices,
                servicesStatus,
                totalServices: this.microservices.length + this.externalServices.length,
                healthyServices: Object.values(servicesStatus).filter(status => status === 'healthy').length,
                timestamp: new Date().toISOString()
            };
            
            res.render('docs/index', data);

        } catch (error) {
            logger.error('Error rendering main docs page', { error });
            next(error);
        }
    }

    /**
     * 架構概覽頁面
     * @route GET /docs/architecture
     */
    async getArchitectureDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Rendering architecture documentation page');

            const architectureData = {
                layers: [
                    {
                        name: 'API Gateway Layer',
                        services: ['Kong Gateway'],
                        description: '統一 API 入口點，處理路由、認證、限流等'
                    },
                    {
                        name: 'Microservices Layer',
                        services: this.microservices.map(s => s.name),
                        description: '核心業務邏輯微服務群組'
                    },
                    {
                        name: 'Infrastructure Layer',
                        services: this.externalServices.map(s => s.name),
                        description: '基礎設施服務：資料庫、快取、訊息佇列'
                    }
                ],
                dataFlow: [
                    'Client → Kong Gateway → Microservices',
                    'Microservices ↔ Redis (Cache)',
                    'Microservices ↔ MySQL (Persistence)',
                    'Microservices → RabbitMQ (Async Processing)'
                ]
            };

            res.render('docs/architecture', {
                title: 'AIOT 系統架構',
                currentPage: 'architecture',
                architectureData,
                microservices: this.microservices,
                externalServices: this.externalServices
            });

        } catch (error) {
            logger.error('Error rendering architecture docs page', { error });
            next(error);
        }
    }

    /**
     * API 測試面板
     * @route GET /docs/api-testing
     */
    async getApiTestingDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Rendering API testing documentation page');

            const apiEndpoints = await this.getApiEndpoints();
            
            res.render('docs/api-testing', {
                title: 'API 測試面板',
                currentPage: 'api-testing',
                apiEndpoints,
                microservices: this.microservices
            });

        } catch (error) {
            logger.error('Error rendering API testing docs page', { error });
            next(error);
        }
    }

    /**
     * 服務監控面板
     * @route GET /docs/monitoring
     */
    async getMonitoringDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Rendering monitoring documentation page');

            const servicesStatus = await this.checkAllServicesStatus();
            const systemMetrics = await this.getSystemMetrics();
            
            res.render('docs/monitoring', {
                title: '服務監控面板',
                currentPage: 'monitoring',
                servicesStatus,
                systemMetrics,
                microservices: this.microservices,
                externalServices: this.externalServices
            });

        } catch (error) {
            logger.error('Error rendering monitoring docs page', { error });
            next(error);
        }
    }

    /**
     * 獲取所有服務狀態 (AJAX API)
     * @route GET /docs/api/services-status
     */
    async getServicesStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Fetching services status');

            const servicesStatus = await this.checkAllServicesStatus();
            
            return ControllerResult.success(res, {
                services: servicesStatus,
                timestamp: new Date().toISOString()
            }, '服務狀態獲取成功');

        } catch (error) {
            logger.error('Error fetching services status', { error });
            return ControllerResult.internalError(res, '服務狀態獲取失敗');
        }
    }

    /**
     * 測試 API 端點 (AJAX API)
     * @route POST /docs/api/test-endpoint
     */
    async testApiEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { service, endpoint, method = 'GET', headers = {}, body } = req.body;
            
            logRequest(req, `Testing API endpoint: ${method} ${service}${endpoint}`);

            if (!service || !endpoint) {
                const result = ControllerResult.badRequest(res, '請提供服務名稱和端點路徑');
                return result;
                return;
            }

            const serviceConfig = this.microservices.find(s => s.name === service);
            if (!serviceConfig) {
                const result = ControllerResult.notFound(res, '未找到指定的服務');
                return result;
                return;
            }

            const testResult = await this.performApiTest(
                serviceConfig.url,
                endpoint,
                method,
                headers,
                body
            );
            
            const result = ControllerResult.success(res,  testResult, 'API 測試完成');
            return result;

        } catch (error) {
            logger.error('Error testing API endpoint', { error });
            const result = ControllerResult.internalError('API 測試失敗');
            return result;
        }
    }

    /**
     * 檢查所有服務狀態
     */
    private async checkAllServicesStatus(): Promise<Record<string, string>> {
        const statusChecks = [
            ...this.microservices.map(service => this.checkServiceHealth(service.name, `${service.url}/api/health`)),
            // 外部服務的健康檢查需要不同的邏輯，這裡簡化處理
        ];

        const results = await Promise.allSettled(statusChecks);
        const servicesStatus: Record<string, string> = {};

        results.forEach((result, index) => {
            const serviceName = this.microservices[index]?.name;
            if (serviceName) {
                servicesStatus[serviceName] = result.status === 'fulfilled' ? 'healthy' : 'unhealthy';
            }
        });

        // 簡化的外部服務狀態
        this.externalServices.forEach(service => {
            servicesStatus[service.name] = 'unknown'; // 實際實作中需要各自的健康檢查
        });

        return servicesStatus;
    }

    /**
     * 檢查單個服務健康狀態
     */
    private async checkServiceHealth(serviceName: string, healthUrl: string): Promise<boolean> {
        try {
            const response = await axios.get(healthUrl, { timeout: 5000 });
            return response.status === 200;
        } catch (error: any) {
            logger.warn(`Service ${serviceName} health check failed`, { error: error.message });
            return false;
        }
    }

    /**
     * 獲取 API 端點清單
     */
    private async getApiEndpoints(): Promise<any[]> {
        return [
            {
                service: 'general',
                endpoints: [
                    { path: '/api/health', method: 'GET', description: '健康檢查' },
                    { path: '/api/info', method: 'GET', description: '服務資訊' },
                    { path: '/api/user-preferences', method: 'GET', description: '用戶偏好列表' }
                ]
            },
            {
                service: 'rbac',
                endpoints: [
                    { path: '/api/health', method: 'GET', description: '健康檢查' },
                    { path: '/api/rbac/roles', method: 'GET', description: '角色列表' },
                    { path: '/api/rbac/permissions', method: 'GET', description: '權限列表' }
                ]
            },
            {
                service: 'drone',
                endpoints: [
                    { path: '/api/health', method: 'GET', description: '健康檢查' },
                    { path: '/api/drone-status', method: 'GET', description: '無人機狀態' },
                    { path: '/api/drone-positions', method: 'GET', description: '無人機位置' }
                ]
            }
        ];
    }

    /**
     * 執行 API 測試
     */
    private async performApiTest(baseUrl: string, endpoint: string, method: string, headers: any, body: any): Promise<any> {
        try {
            const config: any = {
                method: method.toLowerCase(),
                url: `${baseUrl}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                timeout: 10000
            };

            if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
                config.data = body;
            }

            const startTime = Date.now();
            const response = await axios(config);
            const endTime = Date.now();

            return {
                success: true,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
                responseTime: endTime - startTime,
                timestamp: new Date().toISOString()
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 源代碼查看頁面
     * @route GET /docs/source-code
     */
    async getSourceCodeDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Rendering source code documentation page');

            const fileName = req.query.file as string || 'docker-compose.yml';
            const sourceCodeData = await this.getSourceCodeContent(fileName);
            
            res.render('docs/source-code', {
                title: '源代碼查看器',
                currentPage: 'source-code',
                sourceCodeData,
                availableFiles: this.getAvailableSourceFiles()
            });

        } catch (error) {
            logger.error('Error rendering source code docs page', { error });
            next(error);
        }
    }

    /**
     * 獲取源代碼內容 (AJAX API)
     * @route GET /docs/api/source-code/:fileName
     */
    async getSourceCodeContent(fileName: string): Promise<any> {
        try {
            const filePath = this.resolveSourceFilePath(fileName);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`文件不存在: ${fileName}`);
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            
            return {
                fileName,
                filePath,
                content,
                language: this.detectLanguage(fileName),
                size: stats.size,
                lastModified: stats.mtime.toISOString(),
                lines: content.split('\n').length,
                encoding: 'utf8'
            };

        } catch (error: any) {
            logger.error('Error reading source code file', { fileName, error: error.message });
            throw error;
        }
    }

    /**
     * 獲取源代碼內容 API 端點
     * @route GET /docs/api/source-code/:fileName
     */
    async getSourceCodeApi(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const fileName = req.params.fileName;
            logRequest(req, `Fetching source code for file: ${fileName}`);

            const sourceCodeData = await this.getSourceCodeContent(fileName);
            
            const result = ControllerResult.success(res,  sourceCodeData, '源代碼獲取成功');
            return result;

        } catch (error: any) {
            logger.error('Error fetching source code', { error: error.message });
            const result = ControllerResult.badRequest(res, error.message);
            return result;
        }
    }

    /**
     * 解析源文件路徑
     */
    private resolveSourceFilePath(fileName: string): string {
        // 定義允許訪問的文件路徑映射（安全考慮）
        const allowedFiles: Record<string, string> = {
            'docker-compose.yml': '/home/user/GitHub/AIOT/infrastructure/docker/docker-compose.yml',
            'kong.yaml': '/home/user/GitHub/AIOT/infrastructure/kong/kong.yaml',
            'prometheus.yml': '/home/user/GitHub/AIOT/infrastructure/monitoring/prometheus.yml',
            'nginx.conf': '/home/user/GitHub/AIOT/infrastructure/opa/server/nginx.conf',
            'package.json': '/home/user/GitHub/AIOT/microServices/general/package.json',
            'tsconfig.json': '/home/user/GitHub/AIOT/microServices/general/tsconfig.json',
            'Dockerfile': '/home/user/GitHub/AIOT/microServices/general/Dockerfile'
        };

        const filePath = allowedFiles[fileName];
        if (!filePath) {
            throw new Error(`不允許訪問的文件: ${fileName}`);
        }

        return filePath;
    }

    /**
     * 檢測文件語言類型
     */
    private detectLanguage(fileName: string): string {
        const extension = path.extname(fileName).toLowerCase();
        const baseName = path.basename(fileName).toLowerCase();
        
        const languageMap: Record<string, string> = {
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.json': 'json',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.conf': 'nginx',
            '.md': 'markdown',
            'dockerfile': 'dockerfile',
            'docker-compose.yml': 'yaml'
        };

        return languageMap[extension] || languageMap[baseName] || 'text';
    }

    /**
     * 獲取可用的源文件列表
     */
    private getAvailableSourceFiles(): Array<{name: string, description: string, category: string}> {
        return [
            {
                name: 'docker-compose.yml',
                description: 'Docker Compose 配置文件',
                category: 'Infrastructure'
            },
            {
                name: 'kong.yaml',
                description: 'Kong API Gateway 配置',
                category: 'Infrastructure'
            },
            {
                name: 'prometheus.yml',
                description: 'Prometheus 監控配置',
                category: 'Monitoring'
            },
            {
                name: 'nginx.conf',
                description: 'Nginx 配置文件',
                category: 'Infrastructure'
            },
            {
                name: 'package.json',
                description: 'Node.js 包配置文件',
                category: 'Microservice'
            },
            {
                name: 'tsconfig.json',
                description: 'TypeScript 編譯配置',
                category: 'Microservice'
            },
            {
                name: 'Dockerfile',
                description: 'Docker 鏡像構建文件',
                category: 'Microservice'
            }
        ];
    }

    /**
     * 獲取系統指標
     */
    private async getSystemMetrics(): Promise<any> {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            timestamp: new Date().toISOString()
        };
    }
}
/**
 * @fileoverview Archive Consumer Service RouteRegistrar
 * 
 * 使用 InversifyJS 依賴注入管理所有路由註冊
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Application, Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { ArchiveConsumer } from '../consumers/ArchiveConsumer';
import { DatabaseConnection, RabbitMQService } from '../types/processor.types';
import { createHealthRoutes } from './healthRoutes';
import { createStatusRoutes } from './statusRoutes';
import { createMetricsRoutes } from './metricsRoutes';
import { createReadmeRoutes } from './readmeRoutes';

/**
 * Archive Consumer Service 路由註冊器
 * 
 * 負責統一管理和註冊所有路由到 Express 應用程式
 */
@injectable()
export class RouteRegistrar {
    constructor(
        @inject(TYPES.Logger) private logger: Logger,
        @inject(TYPES.DatabaseConnection) private databaseConnection: DatabaseConnection,
        @inject(TYPES.RabbitMQService) private rabbitMQService: RabbitMQService,
        @inject(TYPES.ArchiveConsumer) private archiveConsumer: ArchiveConsumer
    ) {}

    /**
     * 註冊所有路由到 Express 應用程式
     * 
     * @param app Express 應用程式實例
     */
    public registerRoutes = (app: Application): void => {
        this.logger.info('🛣️  Registering Archive Consumer Service routes...');

        try {
            const router = Router();

            // 健康檢查路由
            router.use('/', createHealthRoutes(
                this.logger,
                this.databaseConnection,
                this.rabbitMQService,
                this.archiveConsumer
            ));
            this.logger.info('✅ Health routes registered');

            // 狀態資訊路由
            router.use('/', createStatusRoutes(this.archiveConsumer));
            this.logger.info('✅ Status routes registered');

            // 監控指標路由
            router.use('/', createMetricsRoutes(this.archiveConsumer));
            this.logger.info('✅ Metrics routes registered');

            // README 文檔路由
            router.use('/', createReadmeRoutes(this.logger));
            this.logger.info('✅ README routes registered');

            // 404 處理
            router.use('*', this.handle404);

            // 掛載到應用程式
            app.use('/', router);
            
            this.logger.info('🚀 All Archive Consumer Service routes registered successfully');
        } catch (error) {
            this.logger.error('❌ Failed to register routes:', error);
            throw error;
        }
    };

    /**
     * 404 處理器
     * 
     * 由於此服務主要通過 RabbitMQ 處理業務邏輯，
     * HTTP 端點僅限於監控用途，因此未定義的路由統一返回 404
     */
    private handle404 = (req: Request, res: Response): void => {
        this.logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
        
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.originalUrl} not found`,
            timestamp: new Date().toISOString(),
            service: 'archive-consumer-service',
            availableEndpoints: {
                health: '/health',
                status: '/status',
                metrics: '/metrics',
                readme: '/readme'
            }
        });
    };
}
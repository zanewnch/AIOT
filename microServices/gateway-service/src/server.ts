/**
 * @fileoverview AIOT Gateway Service Server Entry Point
 * @description 完整的 API Gateway 服務啟動文件，整合 Consul 和健康監控
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { GatewayApp } from './app.js';
import { serverConfig } from './configs/serverConfig.js';
import { loggerConfig } from './configs/loggerConfig.js';
import { Server } from 'http';

/**
 * 啟動 Gateway Service 服務器
 * @description 初始化並啟動完整的 Express.js API Gateway 服務
 */
async function startServer(): Promise<void> {
    const logger = loggerConfig;
    let gatewayApp: GatewayApp | null = null;
    
    try {
        logger.info('🚀 Starting AIOT Gateway Service...');
        
        // 創建 Gateway 應用程式實例
        gatewayApp = new GatewayApp();
        const app = gatewayApp.getApp();

        // 啟動 HTTP 服務器
        const server: Server = app.listen(serverConfig.port, async () => {
            logger.info(`✅ AIOT Gateway Service started successfully`);
            logger.info(`📍 Server running on port: ${serverConfig.port}`);
            logger.info(`🌐 Environment: ${serverConfig.nodeEnv}`);
            logger.info(`💡 Health check: http://localhost:${serverConfig.port}/health`);
            logger.info(`🔍 System health: http://localhost:${serverConfig.port}/api/health/system`);
            logger.info(`📊 Services status: http://localhost:${serverConfig.port}/api/health/services`);
            logger.info(`📖 API Documentation: http://localhost:${serverConfig.port}/api/docs`);
            logger.info(`⚡ Service ready to proxy requests to microservices`);

            // 註冊到 Consul
            try {
                await gatewayApp!.registerWithConsul(serverConfig.port);
            } catch (error) {
                logger.warn('⚠️ Failed to register with Consul, but continuing...', error);
            }

            // 啟動後的狀態檢查
            setTimeout(async () => {
                try {
                    const systemHealth = await gatewayApp!.getHealthConfig().getSystemHealth();
                    logger.info('🏥 Initial system health check:', {
                        status: systemHealth.status,
                        healthyServices: Object.values(systemHealth.services).filter(s => s.healthy).length,
                        totalServices: Object.keys(systemHealth.services).length
                    });
                } catch (error) {
                    logger.warn('⚠️ Initial health check failed:', error);
                }
            }, 5000); // 5 秒後檢查
        });

        // 設置 WebSocket 升級處理
        await gatewayApp!.setupWebSocketUpgrade(server);
        
        // 設置服務器超時
        server.timeout = 60000; // 60 秒
        server.keepAliveTimeout = 65000; // 65 秒
        server.headersTimeout = 66000; // 66 秒

        // 優雅關閉處理
        const gracefulShutdown = async (signal: string) => {
            logger.info(`📡 Received ${signal}, starting graceful shutdown...`);
            
            // 停止接受新連接
            server.close(async () => {
                try {
                    // Gateway 應用程式清理
                    if (gatewayApp) {
                        await gatewayApp.gracefulShutdown();
                    }
                    
                    logger.info('✅ HTTP server closed');
                    logger.info('👋 Gateway Service shutdown complete');
                    process.exit(0);
                } catch (error) {
                    logger.error('❌ Error during graceful shutdown:', error);
                    process.exit(1);
                }
            });

            // 強制關閉超時
            setTimeout(() => {
                logger.error('❌ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 15000); // 增加到 15 秒
        };

        // 監聽關閉信號
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // 處理未捕獲的異常
        process.on('uncaughtException', async (error: Error) => {
            logger.error('❌ Uncaught Exception:', error);
            
            if (gatewayApp) {
                try {
                    await gatewayApp.gracefulShutdown();
                } catch (cleanupError) {
                    logger.error('❌ Error during emergency cleanup:', cleanupError);
                }
            }
            
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            
            if (gatewayApp) {
                try {
                    await gatewayApp.gracefulShutdown();
                } catch (cleanupError) {
                    logger.error('❌ Error during emergency cleanup:', cleanupError);
                }
            }
            
            process.exit(1);
        });

        // 定期記錄服務狀態
        setInterval(async () => {
            try {
                if (gatewayApp) {
                    const healthConfig = gatewayApp.getHealthConfig();
                    const servicesHealth = await healthConfig.checkAllServicesHealth();
                    const healthyCount = Object.values(servicesHealth).filter(s => s.healthy).length;
                    const totalCount = Object.keys(servicesHealth).length;
                    
                    logger.debug(`📊 Periodic status: ${healthyCount}/${totalCount} services healthy`);
                }
            } catch (error) {
                logger.debug('Periodic status check failed:', error.message);
            }
        }, 300000); // 每 5 分鐘記錄一次

    } catch (error) {
        logger.error('❌ Failed to start Gateway Service:', error);
        
        if (gatewayApp) {
            try {
                await gatewayApp.gracefulShutdown();
            } catch (cleanupError) {
                logger.error('❌ Error during startup cleanup:', cleanupError);
            }
        }
        
        process.exit(1);
    }
}

// 啟動服務器
startServer().catch(async (error) => {
    console.error('❌ Fatal error during server startup:', error);
    process.exit(1);
});
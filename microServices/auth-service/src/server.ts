#!/usr/bin/env node

/**
 * @fileoverview RBAC HTTP 伺服器啟動程式
 *
 * 此檔案負責啟動 RBAC 服務的 HTTP 伺服器，用於與 API Gateway 通訊
 * 包括：
 * - 載入環境變數配置
 * - 創建 HTTP 伺服器實例
 * - 初始化資料庫連線
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 *
 * @version 2.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'dotenv/config'; // 載入環境變數配置檔案（.env）
import { App } from './app.js'; // 導入 HTTP Express 應用程式
import { createSequelizeInstance } from './configs/dbConfig.js'; // 資料庫連線配置
import { redisConfig } from './configs/redisConfig.js'; // Redis 快取配置
import http from 'http';

/**
 * HTTP 伺服器類別
 *
 * 此類別負責管理 RBAC 服務的 HTTP 伺服器生命週期，包括：
 * - HTTP 伺服器的啟動和關閉（API Gateway 通訊）
 * - 資料庫連線管理
 * - 優雅關閉機制的實現
 *
 * @class HttpServer
 * @since 2.0.0
 */
class HttpServer {
    /**
     * HTTP Express 應用程式實例
     * @private
     * @type {App}
     */
    private httpApp: App;

    /**
     * HTTP 服務器實例
     * @private
     * @type {http.Server}
     */
    private httpServer: http.Server;

    /**
     * Sequelize 資料庫實例
     * @private
     * @type {any}
     */
    private sequelize: any;

    /**
     * 建構函式 - 初始化 HTTP 伺服器實例
     */
    constructor() {
        this.httpApp = new App();
        this.sequelize = createSequelizeInstance();
        this.setupShutdownHandlers();
    }

    /**
     * 設定優雅關閉處理器
     */
    private setupShutdownHandlers(): void {
        process.on('SIGTERM', async () => {
            console.log('🔄 SIGTERM received, shutting down HTTP server gracefully...');
            await this.gracefulShutdown();
        });

        process.on('SIGINT', async () => {
            console.log('🔄 SIGINT received, shutting down HTTP server gracefully...');
            await this.gracefulShutdown();
        });
    }

    /**
     * 啟動 HTTP 伺服器
     */
    async start(): Promise<void> {
        try {
            // 初始化資料庫連線
            await this.sequelize.sync();
            console.log('✅ Database synced (HTTP server)');

            // 連線 Redis
            await redisConfig.connect();
            console.log('✅ Redis connected (HTTP server)');

            // 初始化 HTTP 應用程式
            await this.httpApp.initialize();
            console.log('✅ HTTP application initialized');

            // 啟動 HTTP 服務器（Gateway 通訊）
            const httpPort = process.env.HTTP_PORT || 3055;
            this.httpServer = http.createServer(this.httpApp.app);
            this.httpServer.listen(httpPort, '0.0.0.0', () => {
                console.log(`🌐 Auth HTTP server ready on port ${httpPort} (Gateway communication)`);
            });

        } catch (err) {
            console.error('❌ HTTP server startup failed', err);
            process.exit(1);
        }
    }

    /**
     * 優雅關閉 HTTP 伺服器
     */
    private async gracefulShutdown(): Promise<void> {
        try {
            // 關閉 HTTP 服務器
            if (this.httpServer) {
                console.log('🌐 Closing HTTP server...');
                this.httpServer.close();
            }

            // 關閉 HTTP 應用程式
            if (this.httpApp) {
                console.log('📱 Shutting down HTTP application...');
                await this.httpApp.shutdown();
            }

            // 關閉 Redis 連線
            console.log('🔴 Closing Redis connection...');
            await redisConfig.disconnect();

            // 關閉資料庫連線
            console.log('🗄️ Closing database connection...');
            await this.sequelize.close();

            console.log('✅ RBAC HTTP server graceful shutdown completed');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error during HTTP server shutdown:', err);
            process.exit(1);
        }
    }
}

// 創建並啟動 HTTP 伺服器
const httpServer = new HttpServer();
httpServer.start().catch((error) => {
    console.error('❌ Failed to start RBAC HTTP server:', error);
    process.exit(1);
});
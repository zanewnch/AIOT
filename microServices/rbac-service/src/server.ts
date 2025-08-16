#!/usr/bin/env node

/**
 * @fileoverview RBAC gRPC 伺服器啟動程式
 *
 * 此檔案負責啟動 RBAC 服務的 gRPC 伺服器，包括：
 * - 載入環境變數配置
 * - 創建 gRPC 伺服器實例
 * - 初始化資料庫連線
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 *
 * @version 2.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'dotenv/config'; // 載入環境變數配置檔案（.env）
import { RbacGrpcServer } from './grpc/rbacGrpcServer.js'; // 導入 gRPC 服務器
import { App } from './app.js'; // 導入 HTTP Express 應用程式
import { createSequelizeInstance } from './configs/dbConfig.js'; // 資料庫連線配置
import { redisConfig } from './configs/redisConfig.js'; // Redis 快取配置
import http from 'http';

/**
 * 雙協議伺服器類別
 *
 * 此類別負責管理 RBAC 服務的雙協議伺服器生命週期，包括：
 * - gRPC 伺服器的啟動和關閉（微服務間通訊）
 * - HTTP 伺服器的啟動和關閉（Kong 通訊）
 * - 資料庫連線管理
 * - 優雅關閉機制的實現
 *
 * @class Server
 * @since 2.0.0
 */
class Server {
    /**
     * gRPC 服務器實例
     * @private
     * @type {RbacGrpcServer}
     */
    private grpcServer: RbacGrpcServer;

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
     * 建構函式 - 初始化雙協議伺服器實例
     */
    constructor() {
        this.grpcServer = new RbacGrpcServer();
        this.httpApp = new App();
        this.sequelize = createSequelizeInstance();
        this.setupShutdownHandlers();
    }

    /**
     * 設定優雅關閉處理器
     */
    private setupShutdownHandlers(): void {
        process.on('SIGTERM', async () => {
            console.log('🔄 SIGTERM received, shutting down gracefully...');
            await this.gracefulShutdown();
        });

        process.on('SIGINT', async () => {
            console.log('🔄 SIGINT received, shutting down gracefully...');
            await this.gracefulShutdown();
        });
    }

    /**
     * 啟動雙協議伺服器
     */
    async start(): Promise<void> {
        try {
            // 初始化資料庫連線
            await this.sequelize.sync();
            console.log('✅ Database synced');

            // 連線 Redis
            await redisConfig.connect();
            console.log('✅ Redis connected');

            // 初始化 HTTP 應用程式
            await this.httpApp.initialize();
            console.log('✅ HTTP application initialized');

            // 啟動 HTTP 服務器（Kong 通訊）
            const httpPort = process.env.HTTP_PORT || 3051;
            this.httpServer = http.createServer(this.httpApp.app);
            this.httpServer.listen(httpPort, () => {
                console.log(`🌐 RBAC HTTP server ready on port ${httpPort} (Kong communication)`);
            });

            // 啟動 gRPC 服務器（微服務間通訊）
            const grpcPort = process.env.GRPC_PORT || 50051;
            this.grpcServer.start(Number(grpcPort));
            console.log(`🔗 RBAC gRPC server ready on port ${grpcPort} (inter-service communication)`);

        } catch (err) {
            console.error('❌ Server startup failed', err);
            process.exit(1);
        }
    }

    /**
     * 優雅關閉雙協議伺服器
     */
    private async gracefulShutdown(): Promise<void> {
        try {
            // 關閉 HTTP 服務器
            if (this.httpServer) {
                console.log('🌐 Closing HTTP server...');
                this.httpServer.close();
            }

            // 關閉 gRPC 服務器
            console.log('🔗 Closing gRPC server...');
            this.grpcServer.stop();

            // 關閉 HTTP 應用程式
            if (this.httpApp) {
                console.log('📱 Shutting down HTTP application...');
                await this.httpApp.shutdown();
            }

            // 關閉 Redis 連線
            console.log('🔴 Closing Redis connection...');
            await redisConfig.disconnect();

            // 關閉資料庫連線
            console.log('🗃️ Closing database connection...');
            await this.sequelize.close();

            console.log('✅ Server shut down successfully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// ============================================================================
// 應用程式進入點
// ============================================================================

/**
 * 建立並啟動 RBAC gRPC 伺服器
 */
const server = new Server();
server.start();
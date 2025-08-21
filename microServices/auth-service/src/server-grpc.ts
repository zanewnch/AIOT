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
import { createSequelizeInstance } from './configs/dbConfig.js'; // 資料庫連線配置
import { redisConfig } from '@aiot-shared-packages'; // Redis 快取配置

/**
 * gRPC 伺服器類別
 *
 * 此類別負責管理 RBAC 服務的 gRPC 伺服器生命週期，包括：
 * - gRPC 伺服器的啟動和關閉（微服務間通訊）
 * - 資料庫連線管理
 * - 優雅關閉機制的實現
 *
 * @class GrpcServer
 * @since 2.0.0
 */
class GrpcServer {
    /**
     * gRPC 服務器實例
     * @private
     * @type {RbacGrpcServer}
     */
    private grpcServer: RbacGrpcServer;

    /**
     * Sequelize 資料庫實例
     * @private
     * @type {any}
     */
    private sequelize: any;

    /**
     * 建構函式 - 初始化 gRPC 伺服器實例
     */
    constructor() {
        this.grpcServer = new RbacGrpcServer();
        this.sequelize = createSequelizeInstance();
        this.setupShutdownHandlers();
    }

    /**
     * 設定優雅關閉處理器
     */
    private setupShutdownHandlers(): void {
        process.on('SIGTERM', async () => {
            console.log('🔄 SIGTERM received, shutting down gRPC server gracefully...');
            await this.gracefulShutdown();
        });

        process.on('SIGINT', async () => {
            console.log('🔄 SIGINT received, shutting down gRPC server gracefully...');
            await this.gracefulShutdown();
        });
    }

    /**
     * 啟動 gRPC 伺服器
     */
    async start(): Promise<void> {
        try {
            // 初始化資料庫連線
            await this.sequelize.sync();
            console.log('✅ Database synced (gRPC server)');

            // 連線 Redis
            await redisConfig.connect();
            console.log('✅ Redis connected (gRPC server)');

            // 啟動 gRPC 服務器（微服務間通訊）
            const grpcPort = process.env.GRPC_PORT || 50055;
            this.grpcServer.start(Number(grpcPort));
            console.log(`🔗 Auth gRPC server ready on port ${grpcPort} (inter-service communication)`);

        } catch (err) {
            console.error('❌ gRPC server startup failed', err);
            process.exit(1);
        }
    }

    /**
     * 優雅關閉 gRPC 伺服器
     */
    private async gracefulShutdown(): Promise<void> {
        try {
            // 關閉 gRPC 服務器
            console.log('🔗 Closing gRPC server...');
            this.grpcServer.stop();

            // 關閉 Redis 連線
            console.log('🔴 Closing Redis connection...');
            await redisConfig.disconnect();

            // 關閉資料庫連線
            console.log('🗄️ Closing database connection...');
            await this.sequelize.close();

            console.log('✅ RBAC gRPC server graceful shutdown completed');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error during gRPC server shutdown:', err);
            process.exit(1);
        }
    }
}

// 創建並啟動 gRPC 伺服器
const grpcServer = new GrpcServer();
grpcServer.start().catch((error) => {
    console.error('❌ Failed to start RBAC gRPC server:', error);
    process.exit(1);
});
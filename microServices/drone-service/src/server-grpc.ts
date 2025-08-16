#!/usr/bin/env node

/**
 * @fileoverview Drone gRPC 伺服器啟動程式
 *
 * 此檔案負責啟動 Drone 服務的 gRPC 伺服器，包括：
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
import { DroneGrpcServer } from './grpc/droneGrpcServer.js'; // 導入 gRPC 服務器
import { createSequelizeInstance } from './configs/dbConfig.js'; // 資料庫連線配置
import { RabbitMQManager } from './configs/rabbitmqConfig.js'; // RabbitMQ 配置

/**
 * gRPC 伺服器類別
 *
 * 此類別負責管理 Drone 服務的 gRPC 伺服器生命週期，包括：
 * - gRPC 伺服器的啟動和關閉
 * - 資料庫連線管理
 * - RabbitMQ 連線管理
 * - 優雅關閉機制的實現
 *
 * @class Server
 * @since 2.0.0
 */
class Server {
    /**
     * gRPC 服務器實例
     * @private
     * @type {DroneGrpcServer}
     */
    private grpcServer: DroneGrpcServer;

    /**
     * Sequelize 資料庫實例
     * @private
     * @type {any}
     */
    private sequelize: any;

    /**
     * RabbitMQ 管理器實例
     * @private
     * @type {RabbitMQManager}
     */
    private rabbitMQManager: RabbitMQManager;

    /**
     * 建構函式 - 初始化 gRPC 伺服器實例
     */
    constructor() {
        this.grpcServer = new DroneGrpcServer();
        this.sequelize = createSequelizeInstance();
        this.rabbitMQManager = new RabbitMQManager();
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
     * 啟動伺服器
     */
    async start(): Promise<void> {
        try {
            // 初始化資料庫連線
            await this.sequelize.sync();
            console.log('✅ Database synced');

            // 連線 RabbitMQ
            await this.rabbitMQManager.connect();
            console.log('✅ RabbitMQ connected');

            // 啟動 gRPC 服務器
            this.grpcServer.start(50052);
            console.log('🚀 Drone gRPC server ready on port 50052');

        } catch (err) {
            console.error('❌ Server startup failed', err);
            process.exit(1);
        }
    }

    /**
     * 優雅關閉伺服器
     */
    private async gracefulShutdown(): Promise<void> {
        try {
            // 關閉 gRPC 服務器
            console.log('🖥️ Closing gRPC server...');
            this.grpcServer.stop();

            // 關閉 RabbitMQ 連線
            console.log('🔌 Closing RabbitMQ connection...');
            await this.rabbitMQManager.close();

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
 * 建立並啟動 Drone gRPC 伺服器
 */
const server = new Server();
server.start();
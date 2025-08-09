#!/usr/bin/env node

/**
 * @fileoverview FeSetting gRPC 伺服器啟動程式
 *
 * 此檔案負責啟動 FeSetting 服務的 gRPC 伺服器，包括：
 * - 載入環境變數配置
 * - 創建 gRPC 伺服器實例
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 *
 * @version 2.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'dotenv/config'; // 載入環境變數配置檔案（.env）
import { FeSettingGrpcServer } from './grpc/feSettingGrpcServer.js'; // 導入 gRPC 服務器

/**
 * gRPC 伺服器類別
 *
 * 此類別負責管理 FeSetting 服務的 gRPC 伺服器生命週期，包括：
 * - gRPC 伺服器的啟動和關閉
 * - 優雅關閉機制的實現
 *
 * @class Server
 * @since 2.0.0
 */
class Server {
    /**
     * gRPC 服務器實例
     * @private
     * @type {FeSettingGrpcServer}
     */
    private grpcServer: FeSettingGrpcServer;

    /**
     * 建構函式 - 初始化 gRPC 伺服器實例
     */
    constructor() {
        this.grpcServer = new FeSettingGrpcServer();
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
            // 啟動 gRPC 服務器
            this.grpcServer.start(50053);
            console.log('🚀 FeSetting gRPC server ready on port 50053');

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
 * 建立並啟動 FeSetting gRPC 伺服器
 */
const server = new Server();
server.start();
#!/usr/bin/env node

/**
 * @fileoverview AIOT 無人機即時通訊服務伺服器啟動程式
 *
 * 此檔案負責啟動專門處理無人機 WebSocket 連線的微服務，包括：
 * - 載入環境變數配置
 * - 創建 HTTP 伺服器實例
 * - 初始化 WebSocket 服務
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'dotenv/config';
import http from 'http';
import debug from 'debug';
import { App } from './app.js';

const debugLogger = debug('aiot:drone-realtime-server');

/**
 * 無人機即時通訊服務伺服器類別
 */
class Server {
    private server: http.Server;
    private port: number | string | false;
    private app: App;

    constructor() {
        this.app = new App();
        this.port = this.normalizePort(process.env.SERVICE_PORT || process.env.PORT || '3004');
        this.server = http.createServer(this.app.app);
        this.setupShutdownHandlers();
    }

    /**
     * 標準化端口號
     */
    private normalizePort(val: string): number | string | false {
        const port = parseInt(val, 10);
        if (isNaN(port)) return val; // named pipe
        if (port >= 0) return port; // port number
        return false;
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
            await this.app.initialize();

            if (typeof this.port === 'number') {
                this.server.listen(this.port);
            } else {
                console.error('❌ Invalid port configuration:', this.port);
                process.exit(1);
            }

            this.server.on('error', (error) => this.onError(error));
            this.server.on('listening', async () => {
                this.onListening();
                
                // 初始化 WebSocket 服務
                try {
                    await this.app.initializeWebSocket(this.server);
                    console.log('🚀 WebSocket services ready');
                } catch (wsError) {
                    console.error('❌ WebSocket initialization failed:', wsError);
                }
            });

        } catch (err) {
            console.error('❌ Server startup failed', err);
            process.exit(1);
        }
    }

    /**
     * 處理伺服器錯誤事件
     */
    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;

        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
            default:
                throw error;
        }
    }

    /**
     * 處理伺服器監聽事件
     */
    private onListening(): void {
        const addr = this.server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + (addr && typeof addr === 'object' && 'port' in addr ? addr.port : 'unknown');

        debugLogger('Listening on ' + bind);
        console.log('🚀 Drone Real-time Service listening on ' + bind);
    }

    /**
     * 優雅關閉伺服器
     */
    private async gracefulShutdown(): Promise<void> {
        try {
            await this.app.shutdown();
            
            console.log('🖥️ Closing HTTP server...');
            this.server.close(() => {
                console.log('✅ Server shut down successfully');
                process.exit(0);
            });
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// 啟動伺服器
const server = new Server();
server.start();
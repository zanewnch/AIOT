/**
 * @fileoverview 整合的 WebSocket 服務
 * 
 * 整合新的 IoC 容器和服務層架構的 WebSocket 服務：
 * - 使用 IoC 容器管理事件處理器
 * - 整合 CQRS 模式的業務邏輯
 * - 提供完整的實時通訊功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TYPES } from '@/container';
import { IntegratedDroneStatusEventHandler } from './handlers/DroneStatusEventHandler.js';
import { createLogger } from '@/configs/loggerConfig.js';
import { createSocketIOServer, setupSocketIONamespaces } from './factory.js';
import { WEBSOCKET_NAMESPACES } from './namespaces.js';
import { DRONE_EVENTS } from './events.js';

const logger = createLogger('IntegratedWebSocketService');

/**
 * 整合的 WebSocket 服務類別
 * 
 * 提供完整的 WebSocket 功能，整合：
 * - 事件處理器管理
 * - 房間和命名空間管理
 * - 服務層整合
 * - 連線監控和統計
 */
@injectable()
export class IntegratedWebSocketService {
    private io!: SocketIOServer;
    private connectedClients: Map<string, Socket> = new Map();
    private connectionStats = {
        totalConnections: 0,
        statusSubscriptions: 0,
        positionSubscriptions: 0,
        commandSubscriptions: 0
    };

    constructor(
        @inject(TYPES.DroneStatusEventHandler) 
        private readonly statusEventHandler: IntegratedDroneStatusEventHandler
    ) {}

    /**
     * 初始化 WebSocket 服務
     */
    async initialize(httpServer: HTTPServer): Promise<void> {
        try {
            logger.info('Initializing Integrated WebSocket Service...');

            // 創建 Socket.IO 伺服器
            this.io = createSocketIOServer(httpServer);
            
            // 設置命名空間
            setupSocketIONamespaces(this.io);

            // 設置事件處理器的 Socket.IO 實例
            this.statusEventHandler.setSocketIOInstance(this.io);

            // 設置中間件
            this.setupMiddleware();

            // 設置事件處理器
            this.setupEventHandlers();

            // 開始連線監控
            this.startConnectionMonitoring();

            logger.info('Integrated WebSocket Service initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize WebSocket service', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * 設置中間件
     */
    private setupMiddleware(): void {
        // 基本連線中間件
        this.io.use((socket: Socket, next) => {
            logger.debug('New WebSocket connection attempt', {
                socketId: socket.id,
                clientIP: socket.handshake.address,
                userAgent: socket.handshake.headers['user-agent']
            });
            next();
        });

        // 認證中間件 (簡化版，實際環境可能需要更複雜的認證)
        this.io.use((socket: Socket, next) => {
            // 這裡可以添加認證邏輯
            // 目前簡化處理，允許所有連線
            next();
        });
    }

    /**
     * 設置事件處理器
     */
    private setupEventHandlers(): void {
        // 設置狀態相關的命名空間
        this.setupStatusNamespace();
        
        // 設置位置相關的命名空間 (預留)
        this.setupPositionNamespace();
        
        // 設置命令相關的命名空間 (預留)
        this.setupCommandNamespace();
        
        // 設置管理命名空間 (預留)
        this.setupAdminNamespace();
    }

    /**
     * 設置狀態命名空間事件處理
     */
    private setupStatusNamespace(): void {
        const statusNamespace = this.io.of(WEBSOCKET_NAMESPACES.DRONE);
        
        statusNamespace.on('connection', (socket: Socket) => {
            this.handleConnection(socket, 'status');

            // 狀態訂閱事件
            socket.on('drone_status_subscribe', async (data) => {
                await this.statusEventHandler.handleEvent(socket, 'drone_status_subscribe', data);
            });

            // 狀態取消訂閱事件
            socket.on('drone_status_unsubscribe', async (data) => {
                await this.statusEventHandler.handleEvent(socket, 'drone_status_unsubscribe', data);
            });

            // 狀態更新事件
            socket.on('drone_status_update', async (data) => {
                await this.statusEventHandler.handleEvent(socket, 'drone_status_update', data);
            });

            // 健康摘要請求事件
            socket.on('get_drone_health_summary', async (data) => {
                await this.statusEventHandler.handleEvent(socket, 'get_drone_health_summary', data);
            });

            // 在線無人機列表請求
            socket.on('get_online_drones', async () => {
                await this.statusEventHandler.handleEvent(socket, 'get_online_drones', {});
            });

            // 斷線處理
            socket.on('disconnect', () => {
                this.handleDisconnection(socket, 'status');
            });
        });

        logger.info('Status namespace event handlers configured');
    }

    /**
     * 設置位置命名空間 (預留實現)
     */
    private setupPositionNamespace(): void {
        const positionNamespace = this.io.of('/drone-position');
        
        positionNamespace.on('connection', (socket: Socket) => {
            this.handleConnection(socket, 'position');

            // 位置相關事件處理 (預留)
            socket.on('drone_position_subscribe', (data) => {
                logger.info('Position subscription received', { socketId: socket.id, data });
                // TODO: 實現位置訂閱處理
            });

            socket.on('disconnect', () => {
                this.handleDisconnection(socket, 'position');
            });
        });

        logger.info('Position namespace event handlers configured');
    }

    /**
     * 設置命令命名空間 (預留實現)
     */
    private setupCommandNamespace(): void {
        const commandNamespace = this.io.of('/drone-commands');
        
        commandNamespace.on('connection', (socket: Socket) => {
            this.handleConnection(socket, 'command');

            // 命令相關事件處理 (預留)
            socket.on('drone_command_send', (data) => {
                logger.info('Command received', { socketId: socket.id, data });
                // TODO: 實現命令處理
            });

            socket.on('disconnect', () => {
                this.handleDisconnection(socket, 'command');
            });
        });

        logger.info('Command namespace event handlers configured');
    }

    /**
     * 設置管理命名空間 (預留實現)
     */
    private setupAdminNamespace(): void {
        const adminNamespace = this.io.of('/admin');
        
        adminNamespace.on('connection', (socket: Socket) => {
            this.handleConnection(socket, 'admin');

            // 管理相關事件處理 (預留)
            socket.on('get_system_stats', () => {
                socket.emit('system_stats', this.getSystemStats());
            });

            socket.on('disconnect', () => {
                this.handleDisconnection(socket, 'admin');
            });
        });

        logger.info('Admin namespace event handlers configured');
    }

    /**
     * 處理新連線
     */
    private handleConnection(socket: Socket, type: string): void {
        this.connectionStats.totalConnections++;
        this.connectedClients.set(socket.id, socket);

        logger.info('New WebSocket connection', {
            socketId: socket.id,
            type,
            clientIP: socket.handshake.address,
            timestamp: new Date().toISOString(),
            totalConnections: this.connectionStats.totalConnections
        });

        // 發送歡迎訊息
        socket.emit('connection_established', {
            socketId: socket.id,
            type,
            timestamp: new Date().toISOString(),
            message: `Connected to ${type} namespace successfully`
        });
    }

    /**
     * 處理斷線
     */
    private handleDisconnection(socket: Socket, type: string): void {
        this.connectionStats.totalConnections--;
        this.connectedClients.delete(socket.id);

        logger.info('WebSocket disconnection', {
            socketId: socket.id,
            type,
            timestamp: new Date().toISOString(),
            totalConnections: this.connectionStats.totalConnections
        });
    }

    /**
     * 開始連線監控
     */
    private startConnectionMonitoring(): void {
        setInterval(() => {
            const stats = this.getConnectionStats();
            logger.debug('WebSocket Connection Stats', stats);

            // 廣播系統狀態到管理員命名空間
            this.io.of('/admin').emit('system_stats_update', stats);
        }, 30000); // 每 30 秒記錄一次
    }

    /**
     * 獲取連線統計資訊
     */
    getConnectionStats(): object {
        return {
            ...this.connectionStats,
            connectedClients: this.connectedClients.size,
            timestamp: new Date().toISOString(),
            handlerStats: {
                status: this.statusEventHandler.getHandlerStats()
            }
        };
    }

    /**
     * 獲取系統統計資訊
     */
    private getSystemStats(): object {
        return {
            connections: this.getConnectionStats(),
            namespaces: {
                status: this.io.of('/drone-status').sockets.size,
                position: this.io.of('/drone-position').sockets.size,
                commands: this.io.of('/drone-commands').sockets.size,
                admin: this.io.of('/admin').sockets.size
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 廣播系統級別的訊息
     */
    broadcastSystemMessage(message: string, data?: any): void {
        this.io.emit('system_message', {
            message,
            data,
            timestamp: new Date().toISOString()
        });

        logger.info('System message broadcasted', { message, data });
    }

    /**
     * 獲取 Socket.IO 伺服器實例
     */
    getIO(): SocketIOServer {
        return this.io;
    }

    /**
     * 關閉服務
     */
    async shutdown(): Promise<void> {
        logger.info('Shutting down Integrated WebSocket Service...');

        try {
            // 清理連線
            this.connectedClients.clear();
            
            // 重置統計
            this.connectionStats = {
                totalConnections: 0,
                statusSubscriptions: 0,
                positionSubscriptions: 0,
                commandSubscriptions: 0
            };

            // 關閉 Socket.IO 伺服器
            if (this.io) {
                this.io.close();
            }

            logger.info('Integrated WebSocket Service shut down successfully');

        } catch (error) {
            logger.error('Error during WebSocket service shutdown', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
/**
 * @fileoverview 簡化的 WebSocket 服務
 * 
 * 此檔案實現專門用於無人機即時通訊的 Socket.IO 服務：
 * - Socket.IO 伺服器實例管理
 * - 無人機位置和狀態即時廣播
 * - 連線管理和監控
 * - 房間訂閱管理
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createSocketIOServer, setupSocketIONamespaces, setupSocketIOMiddleware } from './factory.js';
import { WEBSOCKET_NAMESPACES, SOCKET_ROOMS } from './namespaces.js';
import { DRONE_EVENTS } from './events.js';
// 簡化類型定義，移除認證相關
export interface SimpleSocket extends Socket {
    userId?: string;
    clientInfo?: any;
}

/**
 * 簡化的 WebSocket 服務類別
 * 
 * 專注於無人機即時通訊功能
 */
export class WebSocketService {
    private io: SocketIOServer;
    private connectedClients: Map<string, SimpleSocket> = new Map();
    private droneSubscriptions: Map<string, Set<string>> = new Map();
    private connectionStats = {
        totalConnections: 0,
        droneSubscriptions: 0
    };

    constructor(httpServer: HTTPServer) {
        this.io = createSocketIOServer(httpServer);
        setupSocketIONamespaces(this.io);
        this.setupBasicMiddleware();
        this.startConnectionMonitoring();
    }

    /**
     * 開始連線監控
     */
    private startConnectionMonitoring(): void {
        setInterval(() => {
            this.logConnectionStats();
        }, 30000);
    }

    /**
     * 記錄連線統計
     */
    private logConnectionStats(): void {
        const stats = this.getConnectionStats();
        console.log('📊 WebSocket Connection Stats:', {
            timestamp: new Date().toISOString(),
            ...stats
        });
    }

    /**
     * 設定基本中間件 (無需認證，由 OPA 處理)
     */
    private setupBasicMiddleware(): void {
        this.io.use((socket: Socket, next) => {
            // 基本連線日誌
            console.log(`🔗 New WebSocket connection attempt: ${socket.id}`);
            next();
        });
    }

    /**
     * 設定事件處理器
     */
    public setupEventHandlers(
        eventHandler: (socket: Socket, namespace: string) => void
    ): void {
        const namespace = WEBSOCKET_NAMESPACES.DRONE;
        
        this.io.of(namespace).on(DRONE_EVENTS.CONNECTION, (socket: Socket) => {
            const simpleSocket = socket as SimpleSocket;
            this.handleConnection(simpleSocket, namespace);
            eventHandler(socket, namespace);
            
            // 設定基本事件監聽
            this.setupBasicEventListeners(simpleSocket);
        });
        
        console.log('✅ WebSocket event handlers configured');
    }

    /**
     * 設定基本事件監聽器
     */
    private setupBasicEventListeners(socket: SimpleSocket): void {
        // 位置訂閱
        socket.on(DRONE_EVENTS.DRONE_POSITION_SUBSCRIBE, (data) => {
            if (data.droneId) {
                this.subscribeToDrone(socket.id, data.droneId, 'position');
                socket.emit('subscribed', { type: 'position', droneId: data.droneId });
            }
        });

        // 位置取消訂閱
        socket.on(DRONE_EVENTS.DRONE_POSITION_UNSUBSCRIBE, (data) => {
            if (data.droneId) {
                this.unsubscribeFromDrone(socket.id, data.droneId, 'position');
                socket.emit('unsubscribed', { type: 'position', droneId: data.droneId });
            }
        });

        // 狀態訂閱
        socket.on(DRONE_EVENTS.DRONE_STATUS_SUBSCRIBE, (data) => {
            if (data.droneId) {
                this.subscribeToDrone(socket.id, data.droneId, 'status');
                socket.emit('subscribed', { type: 'status', droneId: data.droneId });
            }
        });

        // 狀態取消訂閱
        socket.on(DRONE_EVENTS.DRONE_STATUS_UNSUBSCRIBE, (data) => {
            if (data.droneId) {
                this.unsubscribeFromDrone(socket.id, data.droneId, 'status');
                socket.emit('unsubscribed', { type: 'status', droneId: data.droneId });
            }
        });
    }

    /**
     * 處理新連線
     */
    private handleConnection(socket: SimpleSocket, namespace: string): void {
        this.connectionStats.totalConnections++;
        this.connectedClients.set(socket.id, socket);

        console.log(`🔌 New connection to ${namespace}:`, {
            socketId: socket.id,
            clientIP: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
        });

        socket.on(DRONE_EVENTS.DISCONNECT, () => {
            this.handleDisconnection(socket, namespace);
        });
    }

    /**
     * 處理斷線
     */
    private handleDisconnection(socket: SimpleSocket, namespace: string): void {
        this.connectionStats.totalConnections--;
        this.connectedClients.delete(socket.id);
        this.cleanupDroneSubscriptions(socket.id);

        console.log(`🔌 Disconnection from ${namespace}:`, {
            socketId: socket.id
        });
    }

    /**
     * 清理無人機訂閱
     */
    private cleanupDroneSubscriptions(socketId: string): void {
        this.droneSubscriptions.forEach((subscribers, droneId) => {
            if (subscribers.has(socketId)) {
                subscribers.delete(socketId);
                if (subscribers.size === 0) {
                    this.droneSubscriptions.delete(droneId);
                }
                this.connectionStats.droneSubscriptions--;
            }
        });
    }

    /**
     * 訂閱無人機數據
     */
    public subscribeToDrone(socketId: string, droneId: string, dataType: 'position' | 'status'): void {
        const socket = this.getSocketById(socketId);
        if (!socket) return;

        const roomName = dataType === 'position' 
            ? SOCKET_ROOMS.getDronePositionRoom(droneId)
            : SOCKET_ROOMS.getDroneStatusRoom(droneId);

        socket.join(roomName);

        if (!this.droneSubscriptions.has(droneId)) {
            this.droneSubscriptions.set(droneId, new Set());
        }
        this.droneSubscriptions.get(droneId)!.add(socketId);
        this.connectionStats.droneSubscriptions++;

        console.log(`📡 Subscribed to drone ${dataType}:`, {
            socketId,
            droneId,
            dataType,
            room: roomName
        });
    }

    /**
     * 取消訂閱無人機數據
     */
    public unsubscribeFromDrone(socketId: string, droneId: string, dataType: 'position' | 'status'): void {
        const socket = this.getSocketById(socketId);
        if (!socket) return;

        const roomName = dataType === 'position' 
            ? SOCKET_ROOMS.getDronePositionRoom(droneId)
            : SOCKET_ROOMS.getDroneStatusRoom(droneId);

        socket.leave(roomName);

        const subscribers = this.droneSubscriptions.get(droneId);
        if (subscribers?.has(socketId)) {
            subscribers.delete(socketId);
            this.connectionStats.droneSubscriptions--;
            
            if (subscribers.size === 0) {
                this.droneSubscriptions.delete(droneId);
            }
        }

        console.log(`📡 Unsubscribed from drone ${dataType}:`, {
            socketId,
            droneId,
            dataType,
            room: roomName
        });
    }

    /**
     * 廣播無人機位置更新
     */
    public broadcastDronePosition(droneId: string, positionData: any): void {
        const roomName = SOCKET_ROOMS.getDronePositionRoom(droneId);
        this.io.to(roomName).emit(DRONE_EVENTS.DRONE_POSITION_UPDATE, {
            droneId,
            data: positionData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 廣播無人機狀態更新
     */
    public broadcastDroneStatus(droneId: string, statusData: any): void {
        const roomName = SOCKET_ROOMS.getDroneStatusRoom(droneId);
        this.io.to(roomName).emit(DRONE_EVENTS.DRONE_STATUS_UPDATE, {
            droneId,
            data: statusData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 根據 Socket ID 獲取 Socket 實例
     */
    private getSocketById(socketId: string): Socket | null {
        for (const namespace of Object.values(WEBSOCKET_NAMESPACES)) {
            const socket = this.io.of(namespace).sockets.get(socketId);
            if (socket) return socket;
        }
        return null;
    }

    /**
     * 獲取連線統計
     */
    public getConnectionStats(): object {
        return {
            ...this.connectionStats,
            connectedClients: this.connectedClients.size,
            activeDroneSubscriptions: this.droneSubscriptions.size
        };
    }

    /**
     * 獲取 Socket.IO 伺服器實例
     */
    public getIO(): SocketIOServer {
        return this.io;
    }

    /**
     * 關閉服務
     */
    public async shutdown(): Promise<void> {
        console.log('🔄 Shutting down WebSocket service...');
        
        this.connectedClients.clear();
        this.droneSubscriptions.clear();
        
        this.io.close();
        
        console.log('✅ WebSocket service shut down successfully');
    }
}
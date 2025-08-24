/**
 * @fileoverview WebSocket 廣播服務
 * 
 * 專門負責 Socket.IO 房間管理和消息廣播：
 * - 房間的加入/離開管理
 * - 消息廣播到特定房間或用戶
 * - Socket.IO 底層操作的封裝
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createLogger } from '@/configs/loggerConfig.js';

const logger = createLogger('WebSocketBroadcaster');

/**
 * WebSocket 廣播服務
 * 
 * 封裝所有與 Socket.IO 房間和廣播相關的操作
 */
@injectable()
export class WebSocketBroadcaster {
    private io: SocketIOServer | null = null;
    private roomSubscriptions: Map<string, Set<string>> = new Map(); // roomName -> Set<socketId>

    /**
     * 設置 Socket.IO 實例
     */
    setSocketIOInstance(io: SocketIOServer): void {
        this.io = io;
        logger.info('Socket.IO instance set for broadcaster');
    }

    /**
     * 將 socket 加入房間
     */
    async joinRoom(socket: Socket, roomName: string): Promise<void> {
        try {
            await socket.join(roomName);
            
            // 記錄訂閱關係
            if (!this.roomSubscriptions.has(roomName)) {
                this.roomSubscriptions.set(roomName, new Set());
            }
            this.roomSubscriptions.get(roomName)!.add(socket.id);

            logger.debug('Socket joined room', {
                socketId: socket.id,
                roomName,
                roomSize: this.roomSubscriptions.get(roomName)!.size
            });
        } catch (error) {
            logger.error('Failed to join room', {
                socketId: socket.id,
                roomName,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * 將 socket 從房間移除
     */
    async leaveRoom(socket: Socket, roomName: string): Promise<void> {
        try {
            await socket.leave(roomName);
            
            // 更新訂閱關係
            const room = this.roomSubscriptions.get(roomName);
            if (room) {
                room.delete(socket.id);
                if (room.size === 0) {
                    this.roomSubscriptions.delete(roomName);
                }
            }

            logger.debug('Socket left room', {
                socketId: socket.id,
                roomName,
                roomSize: room ? room.size : 0
            });
        } catch (error) {
            logger.error('Failed to leave room', {
                socketId: socket.id,
                roomName,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * 廣播消息到指定房間
     */
    broadcastToRoom(roomName: string, event: string, data: any): void {
        if (!this.io) {
            logger.error('Socket.IO instance not set, cannot broadcast');
            return;
        }

        try {
            this.io.to(roomName).emit(event, {
                ...data,
                timestamp: new Date().toISOString(),
                broadcast: true
            });

            logger.debug('Message broadcasted to room', {
                roomName,
                event,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to broadcast to room', {
                roomName,
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 發送消息給特定 socket
     */
    sendToSocket(socketId: string, event: string, data: any): void {
        if (!this.io) {
            logger.error('Socket.IO instance not set, cannot send message');
            return;
        }

        try {
            this.io.to(socketId).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });

            logger.debug('Message sent to socket', {
                socketId,
                event,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to send message to socket', {
                socketId,
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 廣播消息到所有連線的客戶端
     */
    broadcastToAll(event: string, data: any): void {
        if (!this.io) {
            logger.error('Socket.IO instance not set, cannot broadcast');
            return;
        }

        try {
            this.io.emit(event, {
                ...data,
                timestamp: new Date().toISOString(),
                broadcast: true
            });

            logger.debug('Message broadcasted to all clients', {
                event,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to broadcast to all clients', {
                event,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 清理 socket 的所有房間訂閱
     */
    cleanupSocketSubscriptions(socketId: string): void {
        let cleanedRooms = 0;
        
        for (const [roomName, subscribers] of this.roomSubscriptions.entries()) {
            if (subscribers.has(socketId)) {
                subscribers.delete(socketId);
                cleanedRooms++;
                
                // 如果房間沒有訂閱者了，删除房間
                if (subscribers.size === 0) {
                    this.roomSubscriptions.delete(roomName);
                }
            }
        }

        if (cleanedRooms > 0) {
            logger.debug('Cleaned up socket subscriptions', {
                socketId,
                cleanedRooms,
                totalRooms: this.roomSubscriptions.size
            });
        }
    }

    /**
     * 獲取房間統計信息
     */
    getRoomStats(): { [roomName: string]: number } {
        const stats: { [roomName: string]: number } = {};
        
        for (const [roomName, subscribers] of this.roomSubscriptions.entries()) {
            stats[roomName] = subscribers.size;
        }

        return stats;
    }

    /**
     * 獲取總體統計信息
     */
    getStats(): {
        totalRooms: number;
        totalSubscriptions: number;
        roomStats: { [roomName: string]: number };
    } {
        let totalSubscriptions = 0;
        for (const subscribers of this.roomSubscriptions.values()) {
            totalSubscriptions += subscribers.size;
        }

        return {
            totalRooms: this.roomSubscriptions.size,
            totalSubscriptions,
            roomStats: this.getRoomStats()
        };
    }

    /**
     * 檢查房間是否存在
     */
    hasRoom(roomName: string): boolean {
        return this.roomSubscriptions.has(roomName);
    }

    /**
     * 獲取房間的訂閱者數量
     */
    getRoomSize(roomName: string): number {
        return this.roomSubscriptions.get(roomName)?.size || 0;
    }

    /**
     * 檢查 socket 是否在指定房間
     */
    isSocketInRoom(socketId: string, roomName: string): boolean {
        return this.roomSubscriptions.get(roomName)?.has(socketId) || false;
    }
}
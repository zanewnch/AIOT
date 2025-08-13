/**
 * @fileoverview Drone 服務 WebSocket 介面定義
 *
 * 定義 Drone 服務 WebSocket 相關的介面。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { Socket } from 'socket.io';
import { DroneEventType } from '@/container';

/**
 * Drone 事件處理器介面
 */
export interface IDroneEventHandler {
    handleEvent(socket: Socket, eventType: DroneEventType, data: any): Promise<void>;
}

/**
 * WebSocket 服務介面
 */
export interface IWebSocketService {
    initialize(): Promise<void>;
    broadcast(event: string, data: any): void;
    emitToRoom(room: string, event: string, data: any): void;
}

/**
 * WebSocket 認證中間件介面
 */
export interface IWebSocketAuthMiddleware {
    authenticate(socket: Socket, next: (err?: Error) => void): Promise<void>;
}
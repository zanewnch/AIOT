/**
 * @fileoverview 簡化的無人機 WebSocket 事件路由器
 * 
 * 使用 InversifyJS 後的簡化版本，只保留核心的事件路由功能
 * 
 * @version 5.0.0 (Simplified with InversifyJS)
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Socket } from 'socket.io';
import { TYPES } from '../container/types.js';
import { DRONE_EVENTS, WEBSOCKET_NAMESPACES, AuthenticatedSocket } from '../configs/websocket/index.js';
import { DronePositionEventHandler } from './DronePositionEventHandler.js';
import { DroneStatusEventHandler } from './DroneStatusEventHandler.js';
import { DroneCommandEventHandler } from './DroneCommandEventHandler.js';

/**
 * 簡化的無人機事件路由器
 * 
 * 專注於核心功能：
 * - 事件監聽和路由
 * - 統一的錯誤處理
 * - 最少的複雜性
 */
@injectable()
export class SimplifiedDroneEventRouter {
  
  constructor(
    @inject(TYPES.DronePositionEventHandler) private positionHandler: DronePositionEventHandler,
    @inject(TYPES.DroneStatusEventHandler) private statusHandler: DroneStatusEventHandler,
    @inject(TYPES.DroneCommandEventHandler) private commandHandler: DroneCommandEventHandler
  ) {}

  /**
   * 設定 Socket 事件監聽
   */
  public setupSocketHandlers(socket: AuthenticatedSocket, namespace: string): void {
    if (namespace !== WEBSOCKET_NAMESPACES.DRONE) {
      return;
    }

    // 位置事件
    socket.on(DRONE_EVENTS.DRONE_POSITION_SUBSCRIBE, (data) => 
      this.handlePositionEvent(socket, data, 'subscribe'));
    socket.on(DRONE_EVENTS.DRONE_POSITION_UNSUBSCRIBE, (data) => 
      this.handlePositionEvent(socket, data, 'unsubscribe'));

    // 狀態事件
    socket.on(DRONE_EVENTS.DRONE_STATUS_SUBSCRIBE, (data) => 
      this.handleStatusEvent(socket, data, 'subscribe'));
    socket.on(DRONE_EVENTS.DRONE_STATUS_UNSUBSCRIBE, (data) => 
      this.handleStatusEvent(socket, data, 'unsubscribe'));

    // 命令事件
    socket.on(DRONE_EVENTS.DRONE_COMMAND_SEND, (data) => 
      this.handleCommandEvent(socket, data));
  }

  private async handlePositionEvent(socket: AuthenticatedSocket, data: any, action: string): Promise<void> {
    try {
      await this.positionHandler.handle(socket, { ...data, action });
    } catch (error) {
      this.handleError(socket, 'position', error);
    }
  }

  private async handleStatusEvent(socket: AuthenticatedSocket, data: any, action: string): Promise<void> {
    try {
      await this.statusHandler.handle(socket, { ...data, action });
    } catch (error) {
      this.handleError(socket, 'status', error);
    }
  }

  private async handleCommandEvent(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      await this.commandHandler.handle(socket, data);
    } catch (error) {
      this.handleError(socket, 'command', error);
    }
  }

  private handleError(socket: AuthenticatedSocket, eventType: string, error: any): void {
    console.error(`❌ Error in ${eventType} handler:`, error);
    socket.emit('error', {
      type: `drone_${eventType}_error`,
      message: 'Event handling failed',
      timestamp: new Date().toISOString()
    });
  }
}
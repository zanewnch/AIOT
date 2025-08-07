/**
 * @fileoverview 無人機 WebSocket 事件設置器
 * 
 * 使用 InversifyJS Factory Provider 的簡化事件處理設置
 * 
 * @version 1.0.0 (Factory Provider)
 * @author AIOT Team  
 * @since 2024-01-01
 */

import { Socket } from 'socket.io';
import { DroneEventType } from '../types/container/dependency-injection.js';
import { DRONE_EVENTS, WEBSOCKET_NAMESPACES, AuthenticatedSocket } from '../configs/websocket/index.js';
import type { IDroneEventHandler } from '../types/container/websocket-interfaces.js';

/**
 * 無人機 WebSocket 事件設置器
 * 
 * 專注於事件監聽和路由，使用 Factory Provider 獲取處理器
 */
export class DroneEventSetup {
  
  constructor(
    private handlerFactory: (type: DroneEventType) => IDroneEventHandler
  ) {}

  /**
   * 設定 Socket 事件監聽
   * 
   * @param socket - WebSocket 連線實例
   * @param namespace - 命名空間
   */
  public setupSocketHandlers(socket: AuthenticatedSocket, namespace: string): void {
    // 只處理無人機命名空間
    if (namespace !== WEBSOCKET_NAMESPACES.DRONE) {
      return;
    }

    console.log(`🔗 Setting up drone event handlers for socket: ${socket.id}`);

    // 位置事件處理
    socket.on(DRONE_EVENTS.DRONE_POSITION_SUBSCRIBE, async (data) => {
      await this.handleEvent(socket, DroneEventType.POSITION, data, 'subscribe');
    });

    socket.on(DRONE_EVENTS.DRONE_POSITION_UNSUBSCRIBE, async (data) => {
      await this.handleEvent(socket, DroneEventType.POSITION, data, 'unsubscribe');
    });

    // 狀態事件處理  
    socket.on(DRONE_EVENTS.DRONE_STATUS_SUBSCRIBE, async (data) => {
      await this.handleEvent(socket, DroneEventType.STATUS, data, 'subscribe');
    });

    socket.on(DRONE_EVENTS.DRONE_STATUS_UNSUBSCRIBE, async (data) => {
      await this.handleEvent(socket, DroneEventType.STATUS, data, 'unsubscribe');
    });

    // 命令事件處理
    socket.on(DRONE_EVENTS.DRONE_COMMAND_SEND, async (data) => {
      await this.handleEvent(socket, DroneEventType.COMMAND, data, 'send');
    });

    // 斷線處理
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  }

  /**
   * 統一事件處理方法
   * 
   * @param socket - WebSocket 連線
   * @param eventType - 事件類型
   * @param data - 事件資料
   * @param action - 動作類型
   */
  private async handleEvent(
    socket: AuthenticatedSocket, 
    eventType: DroneEventType, 
    data: any, 
    action?: string
  ): Promise<void> {
    try {
      // 使用 Factory Provider 獲取對應的處理器
      const handler = this.handlerFactory(eventType);
      
      // 統一處理接口
      await handler.handle(socket, action ? { ...data, action } : data);
      
    } catch (error) {
      this.handleError(socket, eventType, error);
    }
  }

  /**
   * 統一錯誤處理
   * 
   * @param socket - WebSocket 連線
   * @param eventType - 事件類型  
   * @param error - 錯誤對象
   */
  private handleError(socket: AuthenticatedSocket, eventType: DroneEventType, error: any): void {
    console.error(`❌ Error in ${eventType} handler:`, error);
    
    socket.emit('error', {
      type: `drone_${eventType}_error`,
      message: 'Event handling failed',
      timestamp: new Date().toISOString(),
      eventType
    });
  }
}
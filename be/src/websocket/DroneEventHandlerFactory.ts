/**
 * @fileoverview 無人機 WebSocket 事件處理器工廠
 * 
 * 此檔案實現 Factory Pattern，負責：
 * - 根據事件類型創建/獲取對應的處理器
 * - 管理處理器的生命週期和註冊
 * - 提供統一的處理器訪問接口
 * - 聚合所有處理器的統計信息
 * 
 * ===== Factory Pattern 事件流程 =====
 * 
 * 1. 前端位置訂閱流程：
 *    FE: socket.emit('drone_position_subscribe', { droneId: '001' })
 *    → setupEventHandlers() 接收事件
 *    → getHandler('drone_position') 獲取處理器
 *    → handler.handle(socket, data) 統一處理接口
 * 
 * 2. 前端狀態訂閱流程：
 *    FE: socket.emit('drone_status_subscribe', { droneId: '001' })
 *    → setupEventHandlers() 接收事件
 *    → getHandler('drone_status') 獲取處理器
 *    → handler.handle(socket, data) 統一處理接口
 * 
 * 3. 前端命令發送流程：
 *    FE: socket.emit('drone_command_send', { droneId: '001', command: 'takeoff' })
 *    → setupEventHandlers() 接收事件
 *    → getHandler('drone_command') 獲取處理器
 *    → handler.handle(socket, data) 統一處理接口
 * 
 * @version 3.0.0 (Factory Pattern Refactor)
 * @author AIOT Team
 * @since 2024-01-01
 */

import { Socket } from 'socket.io';
import { WebSocketService, DRONE_EVENTS, WEBSOCKET_NAMESPACES, AuthenticatedSocket } from '../configs/websocket/index.js';
import { WebSocketAuthMiddleware } from '../middlewares/WebSocketAuthMiddleware.js';
import { DronePositionEventHandler } from './DronePositionEventHandler.js';
import { DroneStatusEventHandler } from './DroneStatusEventHandler.js';
import { DroneCommandEventHandler } from './DroneCommandEventHandler.js';
import { EventHandlerFactory, DroneEventHandler } from './interfaces/EventHandlerFactory.js';

/**
 * 無人機事件處理器工廠類別
 * 
 * 實現 Factory Pattern，作為處理器的創建和管理中心：
 * 
 * **Factory 職責：**
 * - 根據事件類型創建/獲取對應的處理器
 * - 管理處理器實例的生命週期
 * - 提供統一的處理器註冊和訪問接口
 * - 聚合所有處理器的統計信息
 * 
 * **Factory 優勢：**
 * - 解耦事件類型與處理器實例
 * - 支援動態註冊新的處理器類型
 * - 統一的處理器管理和訪問方式
 * - 為微服務和插件化架構做準備
 * 
 * @class DroneEventHandlerFactory
 */
export class DroneEventHandlerFactory implements EventHandlerFactory {
  /**
   * WebSocket 服務實例
   * @private
   */
  private wsService: WebSocketService;

  /**
   * 認證中間件實例
   * @private
   */
  private authMiddleware: WebSocketAuthMiddleware;

  /**
   * 事件處理器註冊表
   * Key: 事件類型, Value: 處理器實例
   * @private
   */
  private handlers: Map<string, DroneEventHandler> = new Map();

  /**
   * Factory 統計信息
   * @private
   */
  private factoryStats = {
    registeredHandlers: 0,
    totalRequests: 0,
    lastActivity: new Date().toISOString()
  };

  /**
   * 建構函式 - 初始化事件處理器工廠
   * 
   * @param {WebSocketService} wsService - WebSocket 服務實例
   */
  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.authMiddleware = new WebSocketAuthMiddleware();
    
    // 註冊預設的事件處理器
    this.initializeDefaultHandlers();
  }

  /**
   * 初始化預設的事件處理器
   * 
   * @private
   */
  private initializeDefaultHandlers(): void {
    // 註冊位置相關事件處理器
    const positionHandler = new DronePositionEventHandler(this.wsService, this.authMiddleware);
    this.registerHandler('drone_position', positionHandler);

    // 註冊狀態相關事件處理器  
    const statusHandler = new DroneStatusEventHandler(this.wsService, this.authMiddleware);
    this.registerHandler('drone_status', statusHandler);

    // 註冊命令相關事件處理器
    const commandHandler = new DroneCommandEventHandler(this.wsService, this.authMiddleware);
    this.registerHandler('drone_command', commandHandler);

    console.log('✅ Default drone event handlers registered');
  }

  /**
   * 根據事件類型獲取對應的處理器 (實現 EventHandlerFactory 接口)
   * 
   * @param {string} eventType - 事件類型
   * @returns {DroneEventHandler | null} 處理器實例或 null
   */
  public getHandler(eventType: string): DroneEventHandler | null {
    this.factoryStats.totalRequests++;
    this.factoryStats.lastActivity = new Date().toISOString();
    
    return this.handlers.get(eventType) || null;
  }

  /**
   * 註冊事件處理器 (實現 EventHandlerFactory 接口)
   * 
   * @param {string} eventType - 事件類型
   * @param {DroneEventHandler} handler - 處理器實例
   */
  public registerHandler(eventType: string, handler: DroneEventHandler): void {
    if (this.handlers.has(eventType)) {
      console.warn(`⚠️ Overriding existing handler for event type: ${eventType}`);
    }
    
    this.handlers.set(eventType, handler);
    this.factoryStats.registeredHandlers = this.handlers.size;
    
    console.log(`📝 Registered handler for event type: ${eventType}`);
  }

  /**
   * 取消註冊事件處理器 (實現 EventHandlerFactory 接口)
   * 
   * @param {string} eventType - 事件類型
   */
  public unregisterHandler(eventType: string): void {
    if (this.handlers.delete(eventType)) {
      this.factoryStats.registeredHandlers = this.handlers.size;
      console.log(`🗑️ Unregistered handler for event type: ${eventType}`);
    } else {
      console.warn(`⚠️ No handler found for event type: ${eventType}`);
    }
  }

  /**
   * 獲取所有已註冊的事件類型 (實現 EventHandlerFactory 接口)
   * 
   * @returns {string[]} 已註冊的事件類型列表
   */
  public getSupportedEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 獲取工廠統計信息 (實現 EventHandlerFactory 接口)
   * 
   * @returns {object} 工廠統計資訊
   */
  public getFactoryStats(): object {
    return {
      ...this.factoryStats,
      supportedEvents: this.getSupportedEvents()
    };
  }

  /**
   * 設定事件處理器
   * 
   * 為 WebSocket 管理器註冊事件處理邏輯
   */
  public setupEventHandlers(): void {
    this.wsService.setupEventHandlers((socket: Socket, namespace: string) => {
      const authSocket = socket as AuthenticatedSocket;
      this.handleSocketConnection(authSocket, namespace);
    });
  }

  /**
   * 處理 Socket 連線
   * 
   * 為新連線的 Socket 註冊所有必要的事件監聽器
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} namespace - 命名空間
   * @private
   */
  private handleSocketConnection(socket: AuthenticatedSocket, namespace: string): void {
    // 只處理無人機命名空間
    if (namespace === WEBSOCKET_NAMESPACES.DRONE) {
      this.setupDroneNamespaceHandlers(socket);
    }

    // 註冊通用事件處理器
    this.setupCommonHandlers(socket);
  }

  /**
   * 設定無人機命名空間事件處理 (使用 Factory Pattern)
   * 
   * ===== Factory Pattern 事件處理流程 =====
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @private
   */
  private setupDroneNamespaceHandlers(socket: AuthenticatedSocket): void {
    // 🏭 Factory Pattern: 位置事件處理
    // FE: socket.emit('drone_position_subscribe' | 'drone_position_unsubscribe')
    socket.on(DRONE_EVENTS.DRONE_POSITION_SUBSCRIBE, async (data) => {
      const handler = this.getHandler('drone_position');
      if (handler) {
        await handler.handle(socket, { ...data, action: 'subscribe' });
      } else {
        this.handleUnknownEvent(socket, 'drone_position', data);
      }
    });

    socket.on(DRONE_EVENTS.DRONE_POSITION_UNSUBSCRIBE, async (data) => {
      const handler = this.getHandler('drone_position');
      if (handler) {
        await handler.handle(socket, { ...data, action: 'unsubscribe' });
      } else {
        this.handleUnknownEvent(socket, 'drone_position', data);
      }
    });

    // 🏭 Factory Pattern: 狀態事件處理
    // FE: socket.emit('drone_status_subscribe' | 'drone_status_unsubscribe')
    socket.on(DRONE_EVENTS.DRONE_STATUS_SUBSCRIBE, async (data) => {
      const handler = this.getHandler('drone_status');
      if (handler) {
        await handler.handle(socket, { ...data, action: 'subscribe' });
      } else {
        this.handleUnknownEvent(socket, 'drone_status', data);
      }
    });

    socket.on(DRONE_EVENTS.DRONE_STATUS_UNSUBSCRIBE, async (data) => {
      const handler = this.getHandler('drone_status');
      if (handler) {
        await handler.handle(socket, { ...data, action: 'unsubscribe' });
      } else {
        this.handleUnknownEvent(socket, 'drone_status', data);
      }
    });

    // 🏭 Factory Pattern: 命令事件處理
    // FE: socket.emit('drone_command_send')
    socket.on(DRONE_EVENTS.DRONE_COMMAND_SEND, async (data) => {
      const handler = this.getHandler('drone_command');
      if (handler) {
        await handler.handle(socket, data);
      } else {
        this.handleUnknownEvent(socket, 'drone_command', data);
      }
    });

    console.log(`🏭 Drone namespace handlers (Factory Pattern) configured for socket: ${socket.id}`);
  }

  /**
   * 處理未知事件類型
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} eventType - 事件類型
   * @param {any} data - 事件數據
   * @private
   */
  private handleUnknownEvent(socket: AuthenticatedSocket, eventType: string, data: any): void {
    console.error(`❌ No handler registered for event type: ${eventType}`, { socketId: socket.id, data });
    socket.emit(DRONE_EVENTS.ERROR, {
      error: 'HANDLER_NOT_FOUND',
      message: `No handler registered for event type: ${eventType}`
    });
  }


  /**
   * 設定通用事件處理器
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @private
   */
  private setupCommonHandlers(socket: AuthenticatedSocket): void {
    // 處理認證事件
    socket.on(DRONE_EVENTS.AUTHENTICATE, (data) => {
      this.handleAuthentication(socket, data);
    });

    // 處理錯誤事件
    socket.on(DRONE_EVENTS.ERROR, (error) => {
      this.handleError(socket, error);
    });
  }



  /**
   * 處理認證事件
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {any} _data - 認證數據（未使用，認證邏輯在中間件中處理）
   * @private
   */
  private handleAuthentication(socket: AuthenticatedSocket, _data: any): void {
    // 認證邏輯已經在中間件中處理
    // 這裡可以處理額外的認證後邏輯
    if (socket.isAuthenticated) {
      this.wsService.registerAuthenticatedUser(socket.id, socket.user!);
    }
  }

  /**
   * 處理錯誤事件
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {any} error - 錯誤資訊
   * @private
   */
  private handleError(socket: AuthenticatedSocket, error: any): void {
    console.error(`Socket error from ${socket.id}:`, error);
  }

  /**
   * 獲取所有處理器的統計信息 (Factory 聚合模式)
   * 
   * @returns {object} 聚合的統計資訊
   */
  public getSubscriptionStats(): object {
    const aggregatedStats = {
      factoryStats: this.getFactoryStats(),
      handlerStats: {} as any,
      timestamp: new Date().toISOString()
    };

    // 聚合所有註冊處理器的統計信息
    this.handlers.forEach((handler, eventType) => {
      aggregatedStats.handlerStats[eventType] = handler.getHandlerStats();
    });

    return aggregatedStats;
  }

  /**
   * 根據事件類型獲取特定處理器 (Factory 方法)
   * 用於外部直接調用特定處理器的方法
   * 
   * @param {string} eventType - 事件類型
   * @returns {DroneEventHandler | null} 處理器實例或 null
   */
  public getSpecificHandler(eventType: string): DroneEventHandler | null {
    return this.getHandler(eventType);
  }

  /**
   * 獲取位置處理器實例 (保持向後兼容)
   * 
   * @returns {DroneEventHandler | null}
   */
  public getPositionHandler(): DroneEventHandler | null {
    return this.getHandler('drone_position');
  }

  /**
   * 獲取狀態處理器實例 (保持向後兼容)
   * 
   * @returns {DroneEventHandler | null}
   */
  public getStatusHandler(): DroneEventHandler | null {
    return this.getHandler('drone_status');
  }

  /**
   * 獲取命令處理器實例 (保持向後兼容)
   * 
   * @returns {DroneEventHandler | null}
   */
  public getCommandHandler(): DroneEventHandler | null {
    return this.getHandler('drone_command');
  }
}
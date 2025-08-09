/**
 * @fileoverview WebSocket 服務
 * 
 * 此檔案實現 Socket.IO 伺服器的核心服務功能，包括：
 * - Socket.IO 伺服器實例管理
 * - 命名空間和房間管理
 * - 連線狀態監控
 * - 訊息廣播和私人通訊
 * - 錯誤處理和日誌記錄
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createSocketIOServer, setupSocketIONamespaces, setupSocketIOMiddleware } from './factory.js';
import { WEBSOCKET_NAMESPACES, SOCKET_ROOMS } from './namespaces.js';
import { DRONE_EVENTS } from './events.js';
import { AuthenticatedSocket, AuthenticatedUser } from './types.js';

/**
 * WebSocket 服務類別
 * 
 * 負責管理整個 Socket.IO 伺服器的生命週期和功能，包括：
 * 
 * **核心功能：**
 * - Socket.IO 伺服器實例的建立和管理
 * - 多命名空間的設定和管理
 * - 房間訂閱和取消訂閱管理
 * - 連線狀態監控和統計
 * 
 * **無人機專用功能：**
 * - 無人機位置數據即時推送
 * - 無人機狀態監控和通知
 * - 無人機命令下發和回應處理
 * - 多無人機同時管理
 * 
 * **安全機制：**
 * - JWT 認證整合
 * - 權限驗證和存取控制
 * - 連線速率限制
 * 
 * @class WebSocketService
 */
@injectable()
export class WebSocketService {
  /**
   * Socket.IO 伺服器實例
   * @private
   */
  private io: SocketIOServer;

  /**
   * 已認證的連線映射表
   * Key: socket.id, Value: 用戶資訊
   * @private
   */
  private authenticatedConnections: Map<string, AuthenticatedUser> = new Map();

  /**
   * 無人機訂閱映射表
   * Key: droneId, Value: 訂閱此無人機的 socket.id 集合
   * @private
   */
  private droneSubscriptions: Map<string, Set<string>> = new Map();

  /**
   * 用戶連線統計
   * @private
   */
  private connectionStats = {
    totalConnections: 0,
    authenticatedConnections: 0,
    droneSubscriptions: 0
  };

  /**
   * 建構函式 - 初始化 WebSocket 管理器
   * 
   * @param {HTTPServer} httpServer - HTTP 伺服器實例
   */
  constructor(httpServer: HTTPServer) {
    this.io = createSocketIOServer(httpServer);
    setupSocketIONamespaces(this.io);
    this.startConnectionMonitoring();
  }

  /**
   * 開始連線監控
   * 
   * 設定定期統計和日誌記錄，監控系統健康狀態
   * 
   * @private
   */
  private startConnectionMonitoring(): void {
    // 每30秒記錄一次連線統計
    setInterval(() => {
      this.logConnectionStats();
    }, 30000);
  }

  /**
   * 記錄連線統計資訊
   * 
   * @private
   */
  private logConnectionStats(): void {
    const stats = this.getConnectionStats();
    console.log('📊 WebSocket Connection Stats:', {
      timestamp: new Date().toISOString(),
      ...stats
    });
  }

  /**
   * 設定 Socket.IO 中間件
   * 
   * 註冊認證中間件到指定命名空間
   * 
   * @param {Function} authMiddleware - JWT 認證中間件
   */
  public setupMiddleware(authMiddleware: (socket: Socket, next: (err?: Error) => void) => void): void {
    setupSocketIOMiddleware(this.io, authMiddleware);
  }

  /**
   * 設定事件處理器
   * 
   * 註冊各種 Socket.IO 事件的處理邏輯
   * 
   * @param {Function} eventHandler - 事件處理器函式
   */
  public setupEventHandlers(
    eventHandler: (socket: Socket, namespace: string) => void
  ): void {
    // 為無人機命名空間設定事件處理器
    const namespace = WEBSOCKET_NAMESPACES.DRONE;
    this.io.of(namespace).on(DRONE_EVENTS.CONNECTION, (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      this.handleConnection(authSocket, namespace);
      eventHandler(socket, namespace);
    });
    
    console.log('✅ WebSocket event handlers configured');
  }

  /**
   * 處理新連線
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} namespace - 命名空間
   * @private
   */
  private handleConnection(socket: AuthenticatedSocket, namespace: string): void {
    this.connectionStats.totalConnections++;
    
    if (socket.isAuthenticated) {
      this.connectionStats.authenticatedConnections++;
    }

    console.log(`🔌 New connection to ${namespace}:`, {
      socketId: socket.id,
      authenticated: socket.isAuthenticated,
      user: socket.user?.username || 'anonymous'
    });

    // 處理斷線
    socket.on(DRONE_EVENTS.DISCONNECT, () => {
      this.handleDisconnection(socket, namespace);
    });
  }

  /**
   * 處理連線斷線
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} namespace - 命名空間
   * @private
   */
  private handleDisconnection(socket: AuthenticatedSocket, namespace: string): void {
    this.connectionStats.totalConnections--;
    
    if (socket.isAuthenticated) {
      this.connectionStats.authenticatedConnections--;
      this.authenticatedConnections.delete(socket.id);
    }

    // 清理無人機訂閱
    this.cleanupDroneSubscriptions(socket.id);

    console.log(`🔌 Disconnection from ${namespace}:`, {
      socketId: socket.id,
      user: socket.user?.username || 'anonymous'
    });
  }

  /**
   * 清理無人機訂閱
   * 
   * @param {string} socketId - Socket ID
   * @private
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
   * 註冊已認證用戶
   * 
   * @param {string} socketId - Socket ID
   * @param {AuthenticatedUser} user - 用戶資訊
   */
  public registerAuthenticatedUser(socketId: string, user: AuthenticatedUser): void {
    this.authenticatedConnections.set(socketId, user);
    console.log(`✅ User authenticated: ${user.username} (${socketId})`);
  }

  /**
   * 訂閱無人機數據
   * 
   * @param {string} socketId - Socket ID
   * @param {string} droneId - 無人機 ID
   * @param {'position' | 'status'} dataType - 數據類型
   */
  public subscribeToDrone(socketId: string, droneId: string, dataType: 'position' | 'status'): void {
    const socket = this.getSocketById(socketId);
    if (!socket) return;

    const roomName = dataType === 'position' 
      ? SOCKET_ROOMS.getDronePositionRoom(droneId)
      : SOCKET_ROOMS.getDroneStatusRoom(droneId);

    socket.join(roomName);

    // 更新訂閱記錄
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
   * 
   * @param {string} socketId - Socket ID
   * @param {string} droneId - 無人機 ID
   * @param {'position' | 'status'} dataType - 數據類型
   */
  public unsubscribeFromDrone(socketId: string, droneId: string, dataType: 'position' | 'status'): void {
    const socket = this.getSocketById(socketId);
    if (!socket) return;

    const roomName = dataType === 'position' 
      ? SOCKET_ROOMS.getDronePositionRoom(droneId)
      : SOCKET_ROOMS.getDroneStatusRoom(droneId);

    socket.leave(roomName);

    // 更新訂閱記錄
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
   * 
   * @param {string} droneId - 無人機 ID
   * @param {any} positionData - 位置數據
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
   * 
   * @param {string} droneId - 無人機 ID
   * @param {any} statusData - 狀態數據
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
   * 發送無人機命令回應
   * 
   * @param {string} socketId - Socket ID
   * @param {any} commandResponse - 命令回應數據
   */
  public sendCommandResponse(socketId: string, commandResponse: any): void {
    const socket = this.getSocketById(socketId);
    if (socket) {
      socket.emit(DRONE_EVENTS.DRONE_COMMAND_RESPONSE, commandResponse);
    }
  }

  /**
   * 根據 Socket ID 獲取 Socket 實例
   * 
   * @param {string} socketId - Socket ID
   * @returns {Socket | null} Socket 實例或 null
   * @private
   */
  private getSocketById(socketId: string): Socket | null {
    // 遍歷所有命名空間尋找 Socket
    for (const namespace of Object.values(WEBSOCKET_NAMESPACES)) {
      const socket = this.io.of(namespace).sockets.get(socketId);
      if (socket) return socket;
    }
    return null;
  }

  /**
   * 獲取連線統計資訊
   * 
   * @returns {object} 連線統計資訊
   */
  public getConnectionStats(): object {
    return {
      ...this.connectionStats,
      authenticatedUsers: this.authenticatedConnections.size,
      activeDroneSubscriptions: this.droneSubscriptions.size
    };
  }

  /**
   * 獲取 Socket.IO 伺服器實例
   * 
   * @returns {SocketIOServer} Socket.IO 伺服器實例
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * 關閉 WebSocket 管理器
   * 
   * 清理所有連線和資源
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down WebSocket manager...');
    
    // 清理所有連線記錄
    this.authenticatedConnections.clear();
    this.droneSubscriptions.clear();
    
    // 關閉 Socket.IO 伺服器
    this.io.close();
    
    console.log('✅ WebSocket manager shut down successfully');
  }
}
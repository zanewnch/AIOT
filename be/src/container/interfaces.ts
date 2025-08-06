/**
 * @fileoverview IoC 容器接口定義
 * 
 * 定義依賴注入中使用的所有服務接口，
 * 實現 Interface Segregation Principle
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { AuthenticatedSocket } from '../configs/websocket/index.js';

/**
 * 無人機命令服務接口
 */
export interface IDroneCommandService {
  /**
   * 執行無人機命令
   * @param commandData 命令數據
   */
  executeCommand(commandData: any): Promise<any>;

  /**
   * 獲取命令執行歷史
   * @param droneId 無人機 ID
   */
  getCommandHistory(droneId: string): Promise<any[]>;

  /**
   * 取消命令執行
   * @param commandId 命令 ID
   */
  cancelCommand(commandId: string): Promise<boolean>;
}

/**
 * 無人機位置服務接口
 */
export interface IDronePositionService {
  /**
   * 獲取無人機當前位置
   * @param droneId 無人機 ID
   */
  getCurrentPosition(droneId: string): Promise<any>;

  /**
   * 獲取無人機位置歷史
   * @param droneId 無人機 ID
   */
  getPositionHistory(droneId: string): Promise<any[]>;

  /**
   * 更新無人機位置
   * @param droneId 無人機 ID
   * @param positionData 位置數據
   */
  updatePosition(droneId: string, positionData: any): Promise<any>;
}

/**
 * 無人機狀態服務接口
 */
export interface IDroneStatusService {
  /**
   * 獲取無人機當前狀態
   * @param droneId 無人機 ID
   */
  getCurrentStatus(droneId: string): Promise<any>;

  /**
   * 獲取無人機狀態歷史
   * @param droneId 無人機 ID
   */
  getStatusHistory(droneId: string): Promise<any[]>;

  /**
   * 更新無人機狀態
   * @param droneId 無人機 ID
   * @param statusData 狀態數據
   */
  updateStatus(droneId: string, statusData: any): Promise<any>;
}

/**
 * 無人機事件處理器接口
 */
export interface IDroneEventHandler {
  /**
   * 處理事件
   * @param socket WebSocket 連線
   * @param data 事件數據
   */
  handle(socket: AuthenticatedSocket, data: any): Promise<void>;

  /**
   * 獲取處理器統計信息
   */
  getHandlerStats(): object;
}

// 移除 IDroneEventHandlerFactory 接口，改用 InversifyJS Factory Provider

/**
 * WebSocket 服務接口
 */
export interface IWebSocketService {
  /**
   * 設定中間件
   * @param middleware 中間件函數
   */
  setupMiddleware(middleware: any): void;

  /**
   * 設定事件處理器
   * @param eventHandler 事件處理器函數
   */
  setupEventHandlers(eventHandler: any): void;

  /**
   * 訂閱無人機數據
   * @param socketId Socket ID
   * @param droneId 無人機 ID
   * @param dataType 數據類型
   */
  subscribeToDrone(socketId: string, droneId: string, dataType: string): void;

  /**
   * 廣播無人機位置
   * @param droneId 無人機 ID
   * @param positionData 位置數據
   */
  broadcastDronePosition(droneId: string, positionData: any): void;

  /**
   * 廣播無人機狀態
   * @param droneId 無人機 ID
   * @param statusData 狀態數據
   */
  broadcastDroneStatus(droneId: string, statusData: any): void;
}

/**
 * WebSocket 認證中間件接口
 */
export interface IWebSocketAuthMiddleware {
  /**
   * 創建中間件
   */
  createMiddleware(): any;

  /**
   * 檢查權限
   * @param socket WebSocket 連線
   * @param permission 權限字符串
   */
  hasPermission(socket: AuthenticatedSocket, permission: string): boolean;
}
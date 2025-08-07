/**
 * @fileoverview WebSocket 事件處理器接口定義
 * 
 * 定義 WebSocket 系統中所有事件處理器的共同接口，
 * 用於規範事件處理器的實現並確保類型安全
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import type { AuthenticatedSocket } from '../../configs/websocket/index.js';

/**
 * 無人機事件處理器接口
 * 
 * 定義所有無人機事件處理器必須實現的基礎方法，
 * 包括事件處理、統計信息獲取等功能
 */
export interface IDroneEventHandler {
  /**
   * 處理無人機事件
   * 
   * @param socket - 已認證的 WebSocket 連接
   * @param data - 事件數據
   * @returns Promise<void>
   */
  handle(socket: AuthenticatedSocket, data: any): Promise<void>;

  /**
   * 獲取事件處理器統計信息
   * 
   * @returns 處理器統計數據對象
   */
  getHandlerStats(): object;
}

/**
 * WebSocket 服務接口
 */
export interface IWebSocketService {
  /**
   * 設置中間件
   */
  setupMiddleware(authMiddleware: (socket: any, next: (err?: Error) => void) => void): void;

  /**
   * 設置事件處理器
   */
  setupEventHandlers(eventSetup: any): void;

  /**
   * 關閉 WebSocket 服務
   */
  shutdown(): Promise<void>;
}

/**
 * WebSocket 認證中間件接口
 */
export interface IWebSocketAuthMiddleware {
  /**
   * 創建認證中間件
   */
  createMiddleware(): (socket: any, next: (err?: Error) => void) => void;
}
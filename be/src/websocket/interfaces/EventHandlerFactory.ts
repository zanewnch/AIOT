/**
 * @fileoverview 事件處理器工廠介面定義
 * 
 * 定義事件處理器工廠的標準接口，用於：
 * - 根據事件類型獲取合適的處理器
 * - 管理處理器的生命週期
 * - 提供統一的處理器訪問方式
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { AuthenticatedSocket } from '../../configs/websocket/index.js';

/**
 * 事件處理器基礎接口
 */
export interface EventHandler {
  /**
   * 處理特定類型的事件
   * @param socket Socket 連線實例
   * @param data 事件數據
   */
  handle(socket: AuthenticatedSocket, data: any): Promise<void> | void;
}

/**
 * 事件處理器工廠接口
 */
export interface EventHandlerFactory {
  /**
   * 根據事件類型獲取對應的處理器
   * @param eventType 事件類型
   * @returns 事件處理器實例或 null
   */
  getHandler(eventType: string): EventHandler | null;

  /**
   * 註冊事件處理器
   * @param eventType 事件類型
   * @param handler 處理器實例
   */
  registerHandler(eventType: string, handler: EventHandler): void;

  /**
   * 取消註冊事件處理器
   * @param eventType 事件類型
   */
  unregisterHandler(eventType: string): void;

  /**
   * 獲取所有已註冊的事件類型
   */
  getSupportedEvents(): string[];

  /**
   * 獲取工廠統計信息
   */
  getFactoryStats(): object;
}

/**
 * 無人機特定事件處理器接口
 */
export interface DroneEventHandler extends EventHandler {
  /**
   * 處理無人機事件
   * @param socket Socket 連線實例  
   * @param data 無人機事件數據
   */
  handle(socket: AuthenticatedSocket, data: any): Promise<void> | void;

  /**
   * 獲取處理器統計信息
   */
  getHandlerStats(): object;
}
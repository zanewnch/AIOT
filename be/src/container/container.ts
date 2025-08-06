/**
 * @fileoverview IoC 容器配置
 * 
 * 配置 InversifyJS 容器，註冊所有服務依賴，
 * 實現自動依賴注入和生命週期管理
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { Container, type interfaces } from 'inversify';
import { TYPES, DroneEventType } from './types.js';
import {
  IDroneCommandService,
  IDronePositionService,
  IDroneStatusService,
  IDroneEventHandler,
  IWebSocketService,
  IWebSocketAuthMiddleware
} from './interfaces.js';

// 服務實現導入
import { DroneCommandService } from '../services/drone/DroneCommandService.js';
import { DronePositionService } from '../services/drone/DronePositionService.js';
import { DroneRealTimeStatusService } from '../services/drone/DroneRealTimeStatusService.js';
import { WebSocketService } from '../configs/websocket/service.js';
import { WebSocketAuthMiddleware } from '../middlewares/WebSocketAuthMiddleware.js';
import { DronePositionEventHandler } from '../websocket/DronePositionEventHandler.js';
import { DroneStatusEventHandler } from '../websocket/DroneStatusEventHandler.js';
import { DroneCommandEventHandler } from '../websocket/DroneCommandEventHandler.js';

/**
 * 創建並配置 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container();

  // ===== 業務服務註冊 =====
  
  /**
   * 無人機命令服務 - Singleton
   * 整個應用共享一個實例，確保命令狀態一致性
   */
  container.bind<IDroneCommandService>(TYPES.DroneCommandService)
    .to(DroneCommandService)
    .inSingletonScope();

  /**
   * 無人機位置服務 - Singleton  
   * 整個應用共享一個實例，確保位置數據一致性
   */
  container.bind<IDronePositionService>(TYPES.DronePositionService)
    .to(DronePositionService)
    .inSingletonScope();

  /**
   * 無人機狀態服務 - Singleton
   * 整個應用共享一個實例，確保狀態數據一致性
   */
  container.bind<IDroneStatusService>(TYPES.DroneStatusService)
    .to(DroneRealTimeStatusService)
    .inSingletonScope();

  // ===== WebSocket 基礎設施服務 =====

  /**
   * WebSocket 服務 - Singleton
   * 整個應用共享一個 WebSocket 服務實例
   */
  container.bind<IWebSocketService>(TYPES.WebSocketService)
    .to(WebSocketService)
    .inSingletonScope();

  /**
   * WebSocket 認證中間件 - Singleton
   * 共享認證邏輯和配置
   */
  container.bind<IWebSocketAuthMiddleware>(TYPES.WebSocketAuthMiddleware)
    .to(WebSocketAuthMiddleware)
    .inSingletonScope();

  // ===== 事件處理器註冊 =====

  /**
   * 無人機位置事件處理器 - Singleton
   * 共享訂閱狀態和統計信息
   */
  container.bind<IDroneEventHandler>(TYPES.DronePositionEventHandler)
    .to(DronePositionEventHandler)
    .inSingletonScope();

  /**
   * 無人機狀態事件處理器 - Singleton
   * 共享訂閱狀態和統計信息
   */
  container.bind<IDroneEventHandler>(TYPES.DroneStatusEventHandler)
    .to(DroneStatusEventHandler)
    .inSingletonScope();

  /**
   * 無人機命令事件處理器 - Singleton
   * 共享命令執行統計和狀態
   */
  container.bind<IDroneEventHandler>(TYPES.DroneCommandEventHandler)
    .to(DroneCommandEventHandler)
    .inSingletonScope();

  // ===== 工廠類別註冊 =====

  /**
   * 無人機事件處理器工廠提供者 - Factory Provider
   * 使用 InversifyJS 的 toFactory 方法創建事件處理器選擇邏輯
   */
  container.bind<interfaces.Factory<IDroneEventHandler>>(TYPES.DroneEventHandlerFactory)
    .toFactory((context: interfaces.Context) => {
      return (eventType: DroneEventType) => {
        switch (eventType) {
          case DroneEventType.POSITION:
            return context.container.get<IDroneEventHandler>(TYPES.DronePositionEventHandler);
          case DroneEventType.STATUS:
            return context.container.get<IDroneEventHandler>(TYPES.DroneStatusEventHandler);
          case DroneEventType.COMMAND:
            return context.container.get<IDroneEventHandler>(TYPES.DroneCommandEventHandler);
          default:
            throw new Error(`Unsupported drone event type: ${eventType}`);
        }
      };
    });

  console.log('✅ IoC Container configured with all services');
  
  return container;
}

/**
 * 全域容器實例
 * 整個應用使用同一個容器實例
 */
export const container = createContainer();

/**
 * 容器工具函數
 */
export class ContainerUtils {
  /**
   * 獲取服務實例
   * 
   * @template T 服務類型
   * @param {symbol} serviceId 服務識別符
   * @returns {T} 服務實例
   */
  static get<T>(serviceId: symbol): T {
    return container.get<T>(serviceId);
  }

  /**
   * 檢查服務是否已註冊
   * 
   * @param {symbol} serviceId 服務識別符
   * @returns {boolean} 是否已註冊
   */
  static isBound(serviceId: symbol): boolean {
    return container.isBound(serviceId);
  }

  /**
   * 重新綁定服務（主要用於測試）
   * 
   * @template T 服務類型
   * @param {symbol} serviceId 服務識別符
   * @param {T} instance 新的服務實例
   */
  static rebind<T>(serviceId: symbol, instance: T): void {
    if (container.isBound(serviceId)) {
      container.rebind<T>(serviceId).toConstantValue(instance);
    } else {
      container.bind<T>(serviceId).toConstantValue(instance);
    }
  }

  /**
   * 獲取容器統計信息
   * 
   * @returns {object} 容器統計信息
   */
  static getContainerStats(): object {
    // InversifyJS 沒有內建統計 API，這裡返回基本信息
    return {
      timestamp: new Date().toISOString(),
      registeredServices: Object.keys(TYPES).length,
      containerCreated: true
    };
  }
}
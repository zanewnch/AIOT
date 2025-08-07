/**
 * @fileoverview IoC 容器類型定義
 * 
 * 定義 InversifyJS 容器中所有服務的類型標識符，
 * 用於依賴注入的 @inject() decorator
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

/**
 * 服務類型標識符
 * 
 * 這些常數用於 InversifyJS 容器中識別不同的服務類型，
 * 確保依賴注入時的類型安全和清晰性
 */
export const TYPES = {
  // ===== 基礎設施服務 =====
  /**
   * WebSocket 服務類型
   */
  WebSocketService: Symbol.for('WebSocketService'),

  /**
   * WebSocket 認證中間件類型
   */
  WebSocketAuthMiddleware: Symbol.for('WebSocketAuthMiddleware'),

  // ===== 業務服務 =====
  /**
   * 無人機命令服務類型
   */
  DroneCommandService: Symbol.for('DroneCommandService'),

  /**
   * 無人機位置查詢服務類型
   */
  DronePositionQueriesSvc: Symbol.for('DronePositionQueriesSvc'),

  /**
   * 無人機位置命令服務類型
   */
  DronePositionCommandsSvc: Symbol.for('DronePositionCommandsSvc'),

  /**
   * 無人機狀態服務類型 (向下相容)
   */
  DroneStatusService: Symbol.for('DroneStatusService'),

  /**
   * 無人機即時狀態查詢服務類型
   */
  DroneStatusQueriesService: Symbol.for('DroneStatusQueriesService'),

  /**
   * 無人機即時狀態命令服務類型
   */
  DroneStatusCommandsService: Symbol.for('DroneStatusCommandsService'),

  // ===== 事件處理器 =====
  /**
   * 無人機位置事件處理器類型
   */
  DronePositionEventHandler: Symbol.for('DronePositionEventHandler'),

  /**
   * 無人機狀態事件處理器類型
   */
  DroneStatusEventHandler: Symbol.for('DroneStatusEventHandler'),

  /**
   * 無人機命令事件處理器類型
   */
  DroneCommandEventHandler: Symbol.for('DroneCommandEventHandler'),

  // ===== 工廠類別 =====
  /**
   * 無人機事件處理器工廠提供者類型 (InversifyJS Factory)
   */
  DroneEventHandlerFactory: Symbol.for('DroneEventHandlerFactory'),

  // ===== 應用程式核心 =====
  /**
   * Express 應用程式類型
   */
  App: Symbol.for('App'),

  /**
   * HTTP 伺服器類型
   */
  HTTPServer: Symbol.for('HTTPServer'),

  // ===== 資料庫和外部服務 =====
  /**
   * Sequelize 資料庫連線類型
   */
  DatabaseConnection: Symbol.for('DatabaseConnection'),

  /**
   * Redis 連線類型
   */
  RedisConnection: Symbol.for('RedisConnection'),

  /**
   * RabbitMQ 管理器類型
   */
  RabbitMQManager: Symbol.for('RabbitMQManager')
} as const;

/**
 * 類型標識符的類型定義
 * 用於 TypeScript 類型檢查
 */
export type ServiceTypes = typeof TYPES[keyof typeof TYPES];

/**
 * 無人機事件類型枚舉
 * 用於 Factory Provider 的類型安全選擇
 */
export enum DroneEventType {
  POSITION = 'position',
  STATUS = 'status',
  COMMAND = 'command'
}
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

  /**
   * 無人機位置查詢服務工廠類型
   */
  DronePositionQueriesFactory: Symbol.for('DronePositionQueriesFactory'),

  /**
   * 無人機位置命令服務工廠類型
   */
  DronePositionCommandsFactory: Symbol.for('DronePositionCommandsFactory'),

  /**
   * 無人機狀態查詢服務工廠類型
   */
  DroneStatusQueriesFactory: Symbol.for('DroneStatusQueriesFactory'),

  /**
   * 無人機狀態命令服務工廠類型
   */
  DroneStatusCommandsFactory: Symbol.for('DroneStatusCommandsFactory'),

  // ===== CQRS Services =====
  /**
   * 歸檔任務命令服務類型
   */
  ArchiveTaskCommandsSvc: Symbol.for('ArchiveTaskCommandsSvc'),

  /**
   * 歸檔任務查詢服務類型
   */
  ArchiveTaskQueriesSvc: Symbol.for('ArchiveTaskQueriesSvc'),


  /**
   * 會話查詢服務類型
   */
  SessionQueriesSvc: Symbol.for('SessionQueriesSvc'),

  /**
   * 無人機命令命令服務類型
   */
  DroneCommandCommandsSvc: Symbol.for('DroneCommandCommandsSvc'),

  /**
   * 無人機命令查詢服務類型
   */
  DroneCommandQueriesSvc: Symbol.for('DroneCommandQueriesSvc'),

  /**
   * 無人機狀態命令服務類型
   */
  DroneStatusCommandsSvc: Symbol.for('DroneStatusCommandsSvc'),

  /**
   * 無人機狀態查詢服務類型
   */
  DroneStatusQueriesSvc: Symbol.for('DroneStatusQueriesSvc'),

  /**
   * 無人機命令隊列命令服務類型
   */
  DroneCommandQueueCommandsSvc: Symbol.for('DroneCommandQueueCommandsSvc'),

  /**
   * 無人機命令隊列查詢服務類型
   */
  DroneCommandQueueQueriesSvc: Symbol.for('DroneCommandQueueQueriesSvc'),

  /**
   * 無人機命令歷史命令服務類型
   */
  DroneCommandsArchiveCommandsSvc: Symbol.for('DroneCommandsArchiveCommandsSvc'),

  /**
   * 無人機命令歷史查詢服務類型
   */
  DroneCommandsArchiveQueriesSvc: Symbol.for('DroneCommandsArchiveQueriesSvc'),

  /**
   * 無人機位置歷史命令服務類型
   */
  DronePositionsArchiveCommandsSvc: Symbol.for('DronePositionsArchiveCommandsSvc'),

  /**
   * 無人機位置歷史查詢服務類型
   */
  DronePositionsArchiveQueriesSvc: Symbol.for('DronePositionsArchiveQueriesSvc'),

  /**
   * 無人機狀態歷史命令服務類型
   */
  DroneStatusArchiveCommandsSvc: Symbol.for('DroneStatusArchiveCommandsSvc'),

  /**
   * 無人機狀態歷史查詢服務類型
   */
  DroneStatusArchiveQueriesSvc: Symbol.for('DroneStatusArchiveQueriesSvc'),

  /**
   * 權限命令服務類型
   */
  PermissionCommandsSvc: Symbol.for('PermissionCommandsSvc'),

  /**
   * 權限查詢服務類型
   */
  PermissionQueriesSvc: Symbol.for('PermissionQueriesSvc'),

  /**
   * 角色命令服務類型
   */
  RoleCommandsSvc: Symbol.for('RoleCommandsSvc'),

  /**
   * 角色查詢服務類型
   */
  RoleQueriesSvc: Symbol.for('RoleQueriesSvc'),

  /**
   * 角色權限命令服務類型
   */
  RoleToPermissionCommandsSvc: Symbol.for('RoleToPermissionCommandsSvc'),

  /**
   * 角色權限查詢服務類型
   */
  RoleToPermissionQueriesSvc: Symbol.for('RoleToPermissionQueriesSvc'),

  /**
   * 用戶命令服務類型
   */
  UserCommandsSvc: Symbol.for('UserCommandsSvc'),

  /**
   * 用戶查詢服務類型
   */
  UserQueriesSvc: Symbol.for('UserQueriesSvc'),

  /**
   * 用戶角色命令服務類型
   */
  UserToRoleCommandsSvc: Symbol.for('UserToRoleCommandsSvc'),

  /**
   * 用戶角色查詢服務類型
   */
  UserToRoleQueriesSvc: Symbol.for('UserToRoleQueriesSvc'),

  /**
   * 會話命令服務類型
   */
  SessionCommandsSvc: Symbol.for('SessionCommandsSvc'),

  /**
   * WebSocket 服務工廠類型
   */
  WebSocketServiceFactory: Symbol.for('WebSocketServiceFactory'),

  /**
   * WebSocket 認證中間件工廠類型
   */
  WebSocketAuthMiddlewareFactory: Symbol.for('WebSocketAuthMiddlewareFactory'),

  /**
   * 無人機位置事件處理器工廠類型
   */
  DronePositionEventHandlerFactory: Symbol.for('DronePositionEventHandlerFactory'),

  /**
   * 無人機狀態事件處理器工廠類型
   */
  DroneStatusEventHandlerFactory: Symbol.for('DroneStatusEventHandlerFactory'),

  /**
   * 無人機命令事件處理器工廠類型
   */
  DroneCommandEventHandlerFactory: Symbol.for('DroneCommandEventHandlerFactory'),

  // ===== 路由服務 =====
  /**
   * 路由註冊器類型
   */
  RouteRegistrar: Symbol.for('RouteRegistrar'),

  /**
   * RBAC 路由類型
   */
  RBACRoutes: Symbol.for('RBACRoutes'),

  /**
   * 文檔路由類型
   */
  DocsRoutes: Symbol.for('DocsRoutes'),

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
  RabbitMQManager: Symbol.for('RabbitMQManager'),

  // ===== Commands Controllers =====
  /**
   * 歸檔任務命令控制器類型
   */
  ArchiveTaskCommandsCtrl: Symbol.for('ArchiveTaskCommandsCtrl'),


  /**
   * 無人機命令命令控制器類型
   */
  DroneCommandCommandsCtrl: Symbol.for('DroneCommandCommandsCtrl'),

  /**
   * 無人機命令隊列命令控制器類型
   */
  DroneCommandQueueCommandsCtrl: Symbol.for('DroneCommandQueueCommandsCtrl'),

  /**
   * 無人機命令歷史命令控制器類型
   */
  DroneCommandsArchiveCommandsCtrl: Symbol.for('DroneCommandsArchiveCommandsCtrl'),

  /**
   * 無人機位置命令控制器類型
   */
  DronePositionCommandsCtrl: Symbol.for('DronePositionCommandsCtrl'),

  /**
   * 無人機位置歷史命令控制器類型
   */
  DronePositionsArchiveCommandsCtrl: Symbol.for('DronePositionsArchiveCommandsCtrl'),

  /**
   * 無人機即時狀態命令控制器類型
   */
  DroneRealTimeStatusCommandsCtrl: Symbol.for('DroneRealTimeStatusCommandsCtrl'),

  /**
   * 無人機狀態命令控制器類型
   */
  DroneStatusCommandsCtrl: Symbol.for('DroneStatusCommandsCtrl'),

  /**
   * 無人機狀態歷史命令控制器類型
   */
  DroneStatusArchiveCommandsCtrl: Symbol.for('DroneStatusArchiveCommandsCtrl'),

  /**
   * 權限命令控制器類型
   */
  PermissionCommandsCtrl: Symbol.for('PermissionCommandsCtrl'),

  /**
   * 角色命令控制器類型
   */
  RoleCommandsCtrl: Symbol.for('RoleCommandsCtrl'),

  /**
   * 角色權限命令控制器類型
   */
  RoleToPermissionCommandsCtrl: Symbol.for('RoleToPermissionCommandsCtrl'),

  /**
   * 用戶命令控制器類型
   */
  UserCommandsCtrl: Symbol.for('UserCommandsCtrl'),

  /**
   * 用戶角色命令控制器類型
   */
  UserToRoleCommandsCtrl: Symbol.for('UserToRoleCommandsCtrl'),

  // ===== Queries Controllers =====
  /**
   * 歸檔任務查詢控制器類型
   */
  ArchiveTaskQueriesCtrl: Symbol.for('ArchiveTaskQueriesCtrl'),


  /**
   * 無人機命令查詢控制器類型
   */
  DroneCommandQueriesCtrl: Symbol.for('DroneCommandQueriesCtrl'),

  /**
   * 無人機命令隊列查詢控制器類型
   */
  DroneCommandQueueQueriesCtrl: Symbol.for('DroneCommandQueueQueriesCtrl'),

  /**
   * 無人機命令歷史查詢控制器類型
   */
  DroneCommandsArchiveQueriesCtrl: Symbol.for('DroneCommandsArchiveQueriesCtrl'),

  /**
   * 無人機位置查詢控制器類型
   */
  DronePositionQueriesCtrl: Symbol.for('DronePositionQueriesCtrl'),

  /**
   * 無人機位置歷史查詢控制器類型
   */
  DronePositionsArchiveQueriesCtrl: Symbol.for('DronePositionsArchiveQueriesCtrl'),

  /**
   * 無人機即時狀態查詢控制器類型
   */
  DroneRealTimeStatusQueriesCtrl: Symbol.for('DroneRealTimeStatusQueriesCtrl'),

  /**
   * 無人機狀態查詢控制器類型
   */
  DroneStatusQueriesCtrl: Symbol.for('DroneStatusQueriesCtrl'),

  /**
   * 無人機狀態歷史查詢控制器類型
   */
  DroneStatusArchiveQueriesCtrl: Symbol.for('DroneStatusArchiveQueriesCtrl'),

  /**
   * 權限查詢控制器類型
   */
  PermissionQueriesCtrl: Symbol.for('PermissionQueriesCtrl'),

  /**
   * 角色查詢控制器類型
   */
  RoleQueriesCtrl: Symbol.for('RoleQueriesCtrl'),

  /**
   * 角色權限查詢控制器類型
   */
  RoleToPermissionQueriesCtrl: Symbol.for('RoleToPermissionQueriesCtrl'),

  /**
   * 用戶查詢控制器類型
   */
  UserQueriesCtrl: Symbol.for('UserQueriesCtrl'),

  /**
   * 用戶角色查詢控制器類型
   */
  UserToRoleQueriesCtrl: Symbol.for('UserToRoleQueriesCtrl'),

  // ===== JWT 和安全服務 =====
  /**
   * JWT 黑名單服務類型
   */
  JwtBlacklistService: Symbol.for('JwtBlacklistService'),

  // ===== Repo Types =====
  /**
   * 使用者查詢 Repo 類型
   */
  UserQueriesRepo: Symbol.for('UserQueriesRepo'),

  /**
   * 權限查詢 Repo 類型
   */
  PermissionQueriesRepo: Symbol.for('PermissionQueriesRepo'),

  /**
   * 角色查詢 Repo 類型
   */
  RoleQueriesRepo: Symbol.for('RoleQueriesRepo'),

  /**
   * 使用者角色查詢 Repo 類型
   */
  UserRoleQueriesRepo: Symbol.for('UserRoleQueriesRepo'),

  /**
   * 角色權限查詢 Repo 類型
   */
  RolePermissionQueriesRepo: Symbol.for('RolePermissionQueriesRepo'),

  /**
   * 使用者命令 Repo 類型
   */
  UserCommandsRepo: Symbol.for('UserCommandsRepo'),

  /**
   * 權限命令 Repo 類型
   */
  PermissionCommandsRepo: Symbol.for('PermissionCommandsRepo'),

  /**
   * 角色命令 Repo 類型
   */
  RoleCommandsRepo: Symbol.for('RoleCommandsRepo'),

  /**
   * 使用者角色命令 Repo 類型
   */
  UserRoleCommandsRepo: Symbol.for('UserRoleCommandsRepo'),

  /**
   * 角色權限命令 Repo 類型
   */
  RolePermissionCommandsRepo: Symbol.for('RolePermissionCommandsRepo')
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


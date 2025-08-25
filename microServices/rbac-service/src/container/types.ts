/**
 * @fileoverview IoC 容器類型定義
 * 
 * 定義 InversifyJS 容器中所有服務的類型標識符，
 * 用於依賴注入的 @inject() decorator
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

/**
 * 服務類型標識符
 * 這些常數用於 InversifyJS 容器中識別不同的服務類型，
 * 確保依賴注入時的類型安全和清晰性
 */
export const TYPES = {
  // ===== 基礎設施服務 =====
  /**
  // WebSocket 服務類型
   */
  WebSocketService: Symbol.for('WebSocketService'),
  // WebSocket 認證中間件類型
  WebSocketAuthMiddleware: Symbol.for('WebSocketAuthMiddleware'),
  // ===== 業務服務 =====
  // 無人機命令服務類型
  DroneCommandService: Symbol.for('DroneCommandService'),
  // 無人機位置查詢服務類型
  DronePositionQueriesService: Symbol.for('DronePositionQueriesService'),
  // 無人機位置命令服務類型
  DronePositionCommandsService: Symbol.for('DronePositionCommandsService'),
  // 無人機狀態服務類型 (向下相容)
  DroneStatusService: Symbol.for('DroneStatusService'),
  // 無人機即時狀態查詢服務類型
  DroneStatusQueriesService: Symbol.for('DroneStatusQueriesService'),
  // 無人機即時狀態命令服務類型
  DroneStatusCommandsService: Symbol.for('DroneStatusCommandsService'),
  // ===== 事件處理器 =====
  // 無人機位置事件處理器類型
  DronePositionEventHandler: Symbol.for('DronePositionEventHandler'),
  // 無人機狀態事件處理器類型
  DroneStatusEventHandler: Symbol.for('DroneStatusEventHandler'),
  // 無人機命令事件處理器類型
  DroneCommandEventHandler: Symbol.for('DroneCommandEventHandler'),
  // ===== 工廠類別 =====
  // 無人機事件處理器工廠提供者類型 (InversifyJS Factory)
  DroneEventHandlerFactory: Symbol.for('DroneEventHandlerFactory'),
  // 無人機位置查詢服務工廠類型
  DronePositionQueriesFactory: Symbol.for('DronePositionQueriesFactory'),
  // 無人機位置命令服務工廠類型
  DronePositionCommandsFactory: Symbol.for('DronePositionCommandsFactory'),
  // 無人機狀態查詢服務工廠類型
  DroneStatusQueriesFactory: Symbol.for('DroneStatusQueriesFactory'),
  // 無人機狀態命令服務工廠類型
  DroneStatusCommandsFactory: Symbol.for('DroneStatusCommandsFactory'),
  // ===== CQRS Services =====
  // 歸檔任務命令服務類型
  ArchiveTaskCommandsService: Symbol.for('ArchiveTaskCommandsService'),
  // 歸檔任務查詢服務類型
  ArchiveTaskQueriesService: Symbol.for('ArchiveTaskQueriesService'),
  // 會話查詢服務類型
  SessionQueriesService: Symbol.for('SessionQueriesService'),
  // 無人機命令命令服務類型
  DroneCommandCommandsService: Symbol.for('DroneCommandCommandsService'),
  // 無人機命令查詢服務類型
  DroneCommandQueriesService: Symbol.for('DroneCommandQueriesService'),
  // 無人機狀態命令服務類型
  // 無人機狀態查詢服務類型
  // 無人機命令隊列命令服務類型
  DroneCommandQueueCommandsService: Symbol.for('DroneCommandQueueCommandsService'),
  // 無人機命令隊列查詢服務類型
  DroneCommandQueueQueriesService: Symbol.for('DroneCommandQueueQueriesService'),
  // 無人機命令歷史命令服務類型
  DroneCommandsArchiveCommandsService: Symbol.for('DroneCommandsArchiveCommandsService'),
  // 無人機命令歷史查詢服務類型
  DroneCommandsArchiveQueriesService: Symbol.for('DroneCommandsArchiveQueriesService'),
  // 無人機位置歷史命令服務類型
  DronePositionsArchiveCommandsService: Symbol.for('DronePositionsArchiveCommandsService'),
  // 無人機位置歷史查詢服務類型
  DronePositionsArchiveQueriesService: Symbol.for('DronePositionsArchiveQueriesService'),
  // 無人機狀態歷史命令服務類型
  DroneStatusArchiveCommandsService: Symbol.for('DroneStatusArchiveCommandsService'),
  // 無人機狀態歷史查詢服務類型
  DroneStatusArchiveQueriesService: Symbol.for('DroneStatusArchiveQueriesService'),
  // 權限命令服務類型
  PermissionCommandsService: Symbol.for('PermissionCommandsService'),
  // 權限查詢服務類型
  PermissionQueriesService: Symbol.for('PermissionQueriesService'),
  // 角色命令服務類型
  RoleCommandsService: Symbol.for('RoleCommandsService'),
  // 角色查詢服務類型
  RoleQueriesService: Symbol.for('RoleQueriesService'),
  // 角色權限命令服務類型
  RoleToPermissionCommandsService: Symbol.for('RoleToPermissionCommandsService'),
  // 角色權限查詢服務類型
  RoleToPermissionQueriesService: Symbol.for('RoleToPermissionQueriesService'),
  // 用戶命令服務類型
  UserCommandsService: Symbol.for('UserCommandsService'),
  // 用戶查詢服務類型
  UserQueriesService: Symbol.for('UserQueriesService'),
  // 用戶角色命令服務類型
  UserToRoleCommandsService: Symbol.for('UserToRoleCommandsService'),
  // 用戶角色查詢服務類型
  UserToRoleQueriesService: Symbol.for('UserToRoleQueriesService'),
  // 會話命令服務類型
  SessionCommandsService: Symbol.for('SessionCommandsService'),
  // WebSocket 服務工廠類型
  WebSocketServiceFactory: Symbol.for('WebSocketServiceFactory'),
  // WebSocket 認證中間件工廠類型
  WebSocketAuthMiddlewareFactory: Symbol.for('WebSocketAuthMiddlewareFactory'),
  // 無人機位置事件處理器工廠類型
  DronePositionEventHandlerFactory: Symbol.for('DronePositionEventHandlerFactory'),
  // 無人機狀態事件處理器工廠類型
  DroneStatusEventHandlerFactory: Symbol.for('DroneStatusEventHandlerFactory'),
  // 無人機命令事件處理器工廠類型
  DroneCommandEventHandlerFactory: Symbol.for('DroneCommandEventHandlerFactory'),
  // ===== 路由服務 =====
  // 路由註冊器類型
  RouteRegistrar: Symbol.for('RouteRegistrar'),
  // RBAC 路由類型
  RBACRoutes: Symbol.for('RBACRoutes'),
  // 文檔路由類型
  DocsRoutes: Symbol.for('DocsRoutes'),
  // ===== 應用程式核心 =====
  // Express 應用程式類型
  App: Symbol.for('App'),
  // HTTP 伺服器類型
  HTTPServer: Symbol.for('HTTPServer'),
  // ===== 資料庫和外部服務 =====
  // Sequelize 資料庫連線類型
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  // Redis 連線類型
  RedisConnection: Symbol.for('RedisConnection'),
  // RabbitMQ 管理器類型
  RabbitMQManager: Symbol.for('RabbitMQManager'),
  // ===== Commands Controllers =====
  // 歸檔任務命令控制器類型
  ArchiveTaskCommandsController: Symbol.for('ArchiveTaskCommandsController'),
  // 無人機命令命令控制器類型
  DroneCommandCommandsController: Symbol.for('DroneCommandCommandsController'),
  // 無人機命令隊列命令控制器類型
  DroneCommandQueueCommandsController: Symbol.for('DroneCommandQueueCommandsController'),
  // 無人機命令歷史命令控制器類型
  DroneCommandsArchiveCommandsController: Symbol.for('DroneCommandsArchiveCommandsController'),
  // 無人機位置命令控制器類型
  DronePositionCommandsController: Symbol.for('DronePositionCommandsController'),
  // 無人機位置歷史命令控制器類型
  DronePositionsArchiveCommandsController: Symbol.for('DronePositionsArchiveCommandsController'),
  // 無人機即時狀態命令控制器類型
  DroneRealTimeStatusCommandsController: Symbol.for('DroneRealTimeStatusCommandsController'),
  // 無人機狀態命令控制器類型
  DroneStatusCommandsController: Symbol.for('DroneStatusCommandsController'),
  // 無人機狀態歷史命令控制器類型
  DroneStatusArchiveCommandsController: Symbol.for('DroneStatusArchiveCommandsController'),
  // 權限命令控制器類型
  PermissionCommandsController: Symbol.for('PermissionCommandsController'),
  // 角色命令控制器類型
  RoleCommandsController: Symbol.for('RoleCommandsController'),
  // 角色權限命令控制器類型
  RoleToPermissionCommandsController: Symbol.for('RoleToPermissionCommandsController'),
  // 用戶命令控制器類型
  UserCommandsController: Symbol.for('UserCommandsController'),
  // 用戶角色命令控制器類型
  UserToRoleCommandsController: Symbol.for('UserToRoleCommandsController'),
  // ===== Queries Controllers =====
  // 歸檔任務查詢控制器類型
  ArchiveTaskQueriesController: Symbol.for('ArchiveTaskQueriesController'),
  // 無人機命令查詢控制器類型
  DroneCommandQueriesController: Symbol.for('DroneCommandQueriesController'),
  // 無人機命令隊列查詢控制器類型
  DroneCommandQueueQueriesController: Symbol.for('DroneCommandQueueQueriesController'),
  // 無人機命令歷史查詢控制器類型
  DroneCommandsArchiveQueriesController: Symbol.for('DroneCommandsArchiveQueriesController'),
  // 無人機位置查詢控制器類型
  DronePositionQueriesController: Symbol.for('DronePositionQueriesController'),
  // 無人機位置歷史查詢控制器類型
  DronePositionsArchiveQueriesController: Symbol.for('DronePositionsArchiveQueriesController'),
  // 無人機即時狀態查詢控制器類型
  DroneRealTimeStatusQueriesController: Symbol.for('DroneRealTimeStatusQueriesController'),
  // 無人機狀態查詢控制器類型
  DroneStatusQueriesController: Symbol.for('DroneStatusQueriesController'),
  // 無人機狀態歷史查詢控制器類型
  DroneStatusArchiveQueriesController: Symbol.for('DroneStatusArchiveQueriesController'),
  // 權限查詢控制器類型
  PermissionQueriesController: Symbol.for('PermissionQueriesController'),
  // 角色查詢控制器類型
  RoleQueriesController: Symbol.for('RoleQueriesController'),
  // 角色權限查詢控制器類型
  RoleToPermissionQueriesController: Symbol.for('RoleToPermissionQueriesController'),
  // 用戶查詢控制器類型
  UserQueriesController: Symbol.for('UserQueriesController'),
  // 用戶角色查詢控制器類型
  UserToRoleQueriesController: Symbol.for('UserToRoleQueriesController'),
  // ===== JWT 和安全服務 =====
  // JWT 黑名單服務類型
  JwtBlacklistService: Symbol.for('JwtBlacklistService'),
  // ===== Repository Types =====
  // 使用者查詢 Repository 類型
  UserQueriesRepository: Symbol.for('UserQueriesRepository'),
  // 權限查詢 Repository 類型
  PermissionQueriesRepository: Symbol.for('PermissionQueriesRepository'),
  // 角色查詢 Repository 類型
  RoleQueriesRepository: Symbol.for('RoleQueriesRepository'),
  // 使用者角色查詢 Repository 類型
  UserRoleQueriesRepository: Symbol.for('UserRoleQueriesRepository'),
  // 角色權限查詢 Repository 類型
  RolePermissionQueriesRepository: Symbol.for('RolePermissionQueriesRepository'),
  // 使用者命令 Repository 類型
  UserCommandsRepository: Symbol.for('UserCommandsRepository'),
  // 權限命令 Repository 類型
  PermissionCommandsRepository: Symbol.for('PermissionCommandsRepository'),
  // 角色命令 Repository 類型
  RoleCommandsRepository: Symbol.for('RoleCommandsRepository'),
  // 使用者角色命令 Repository 類型
  UserRoleCommandsRepository: Symbol.for('UserRoleCommandsRepository'),
  // 角色權限命令 Repository 類型
  RolePermissionCommandsRepository: Symbol.for('RolePermissionCommandsRepository'),
  // 會話查詢 Repository 類型
  SessionQueriesRepository: Symbol.for('SessionQueriesRepository'),
  // RBAC MCP 路由類型
  RBACMCPRoutes: Symbol.for('RBACMCPRoutes')
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

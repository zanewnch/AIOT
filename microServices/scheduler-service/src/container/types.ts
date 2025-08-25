/**
 * @fileoverview 依賴注入類型常數定義
 * 
 * 定義 InversifyJS 容器中所有服務的類型標識符
 * 使用 Symbol 確保類型安全和避免字串衝突
 */

// 定義所有依賴注入的類型常數
export const TYPES = {
  // 核心應用程式
  App: Symbol.for('App'),
  
  // 基礎設施服務
  Logger: Symbol.for('Logger'),
  DatabaseService: Symbol.for('DatabaseService'),
  RabbitMQService: Symbol.for('RabbitMQService'),
  NotificationService: Symbol.for('NotificationService'),
  MonitoringService: Symbol.for('MonitoringService'),
  // 儲存庫
  ArchiveTaskRepository: Symbol.for('ArchiveTaskRepository'),
  ArchiveTaskService: Symbol.for('ArchiveTaskService'),
  // 排程器
  ArchiveScheduler: Symbol.for('ArchiveScheduler'),
  // 控制器
  HealthController: Symbol.for('HealthController'),
  ScheduleController: Symbol.for('ScheduleController'),
  NotificationController: Symbol.for('NotificationController'),
  ArchiveTaskController: Symbol.for('ArchiveTaskController'),
  // 配置
  DatabaseConfig: Symbol.for('DatabaseConfig'),
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  RabbitMQConfig: Symbol.for('RabbitMQConfig'),
  RedisConfig: Symbol.for('RedisConfig'),
  NotificationConfig: Symbol.for('NotificationConfig'),
  LoggerService: Symbol.for('LoggerService'),
  MetricsController: Symbol.for('MetricsController'),
  AlertsController: Symbol.for('AlertsController')
} as const;

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
  LoggerService: Symbol.for('LoggerService'),
  DatabaseService: Symbol.for('DatabaseService'),
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  RabbitMQService: Symbol.for('RabbitMQService'),
  MonitoringService: Symbol.for('MonitoringService'),
  NotificationService: Symbol.for('NotificationService'),
  
  // 儲存庫
  ArchiveTaskRepository: Symbol.for('ArchiveTaskRepository'),
  
  // 排程器
  ArchiveScheduler: Symbol.for('ArchiveScheduler'),
  
  // 控制器
  HealthController: Symbol.for('HealthController'),
  MetricsController: Symbol.for('MetricsController'),
  ScheduleController: Symbol.for('ScheduleController'),
  AlertsController: Symbol.for('AlertsController'),
  NotificationController: Symbol.for('NotificationController'),
  
  // 配置
  DatabaseConfig: Symbol.for('DatabaseConfig'),
  RabbitMQConfig: Symbol.for('RabbitMQConfig'),
  RedisConfig: Symbol.for('RedisConfig'),
  NotificationConfig: Symbol.for('NotificationConfig')
} as const;
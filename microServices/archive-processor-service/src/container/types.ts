/**
 * @fileoverview 依賴注入類型定義
 * 
 * 【設計意圖 (Intention)】
 * 定義 InversifyJS 容器中所有服務的識別符號
 * 提供類型安全的依賴注入標識
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 Symbol 確保唯一性
 * - 按功能分組組織識別符號
 * - 支援介面和實作的分離
 */

export const TYPES = {
  // 核心服務
  Logger: Symbol.for('Logger'),
  
  // 資料庫相關
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  
  // 訊息隊列相關
  RabbitMQService: Symbol.for('RabbitMQService'),
  
  // 儲存庫相關
  ArchiveTaskRepo: Symbol.for('ArchiveTaskRepo'),
  
  // 處理器相關
  ArchiveProcessor: Symbol.for('ArchiveProcessor'),
  
  // 消費者相關
  ArchiveConsumer: Symbol.for('ArchiveConsumer'),
  
  // 應用程式服務
  Application: Symbol.for('Application')
} as const;
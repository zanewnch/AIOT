/**
 * @fileoverview 控制器模組匯出索引 - 統一管理所有 CQRS 控制器的匯出
 * 
 * 此文件作為控制器模組的統一匯出點，提供：
 * - 所有 CQRS 控制器類別的匯出
 * - 清晰的查詢和命令分離結構
 * - 便於其他模組引用控制器
 * - 支援 ES6 模組語法
 * 
 * 遵循 CQRS 模式包含的控制器類別：
 * - 查詢控制器 (Queries): 處理讀取操作
 * - 命令控制器 (Commands): 處理寫入操作
 * - 身份驗證、API 文檔、使用者偏好設定等功能模組
 * - RBAC 控制器群組: 角色權限管理控制器
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

// 匯出所有查詢控制器 (Query Controllers)
export * from './queries/index.js';

// 匯出所有命令控制器 (Command Controllers) 
export * from './commands/index.js';

// 注意：RBAC 控制器已重構為 CQRS 模式，分別在 queries 和 commands 目錄中
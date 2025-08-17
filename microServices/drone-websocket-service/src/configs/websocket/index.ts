/**
 * @fileoverview WebSocket 模組統一導出
 * 
 * 此檔案統一導出所有 WebSocket 相關的配置、服務和工具，包括：
 * - 類型定義和介面
 * - 事件常數定義
 * - 命名空間和房間管理
 * - 核心配置函數
 * - Socket.IO 伺服器工廠函數
 * - WebSocket 服務類別
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

// 類型定義和介面
export type {
  WebSocketConfig,
  AuthenticatedSocket,
  KongUserInfo,
  DroneSubscriptionRequest,
  DroneCommandRequest
} from './types.js';

// 事件常數定義
export { DRONE_EVENTS } from './events.js';

// 命名空間和房間管理
export { WEBSOCKET_NAMESPACES, SOCKET_ROOMS } from './namespaces.js';

// 核心配置函數
export { getWebSocketConfig } from './config.js';

// Socket.IO 伺服器工廠函數
export {
  createSocketIOServer,
  setupSocketIONamespaces,
  setupSocketIOMiddleware
} from './factory.js';

// WebSocket 服務類別
export { IntegratedWebSocketService } from './service.js';
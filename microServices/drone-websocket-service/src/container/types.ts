/**
 * @fileoverview Drone-Realtime 服務依賴注入類型定義
 *
 * 只定義 Drone-Realtime 服務需要的依賴注入類型標識符。
 * 專注於實時狀態管理和 WebSocket 通訊。
 * @author AIOT Development Team  
 * @version 1.0.0
 * @since 2025-08-12
 */

 * Drone-Realtime 服務依賴注入類型標識符
export const TYPES = {
    // === 無人機即時狀態服務 (介面) ===
    IDroneRealTimeStatusQueriesService: Symbol.for('IDroneRealTimeStatusQueriesService'),
    
    // === 無人機即時狀態服務 (實現) ===
    DroneRealTimeStatusQueriesService: Symbol.for('DroneRealTimeStatusQueriesService'),
    // === 資料存取層 ===
    DroneRealTimeStatusQueriesRepositorysitory: Symbol.for('DroneRealTimeStatusQueriesRepositorysitory'),
    // === 控制器層 ===
    IDroneRealTimeStatusQueries: Symbol.for('IDroneRealTimeStatusQueries'),
    // === 路由層 ===
    // DroneRealtimeRoutes 已移除 - 微服務專注於 WebSocket 實時通信
    HealthRoutes: Symbol.for('HealthRoutes'),
    // === WebSocket 相關 ===
    // 整合的 WebSocket 服務和事件處理器
    IntegratedWebSocketService: Symbol.for('IntegratedWebSocketService'),
    // 舊版 WebSocket 服務 (向後兼容)
    WebSocketService: Symbol.for('WebSocketService'),
} as const;
 * WebSocket 事件類型列舉
export enum DroneEventType {
    STATUS_UPDATE = 'status_update',
    POSITION_UPDATE = 'position_update', 
    COMMAND_RECEIVED = 'command_received',
    BATTERY_WARNING = 'battery_warning',
    CONNECTION_STATUS = 'connection_status'
}
 * 實時狀態更新事件類型
export enum RealTimeEventType {
    DRONE_STATUS_CHANGED = 'drone_status_changed',
    BATTERY_LEVEL_CHANGED = 'battery_level_changed',
    SIGNAL_STRENGTH_CHANGED = 'signal_strength_changed',
    DRONE_CONNECTED = 'drone_connected',
    DRONE_DISCONNECTED = 'drone_disconnected'
 * WebSocket 命名空間定義
export const WEBSOCKET_NAMESPACES = {
    DRONE_STATUS: '/drone-status',
    DRONE_POSITION: '/drone-position', 
    DRONE_COMMANDS: '/drone-commands',
    ADMIN: '/admin'
export type WebSocketNamespace = typeof WEBSOCKET_NAMESPACES[keyof typeof WEBSOCKET_NAMESPACES];

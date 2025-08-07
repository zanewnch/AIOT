/**
 * @fileoverview Drone 服務依賴注入類型定義
 *
 * 只定義 Drone 服務需要的依賴注入類型標識符。
 *
 * @author AIOT Development Team  
 * @version 1.0.0
 * @since 2025-08-08
 */

/**
 * Drone 服務依賴注入類型標識符
 */
export const TYPES = {
    // === 無人機位置服務 ===
    DronePositionQueriesSvc: Symbol.for('DronePositionQueriesSvc'),
    DronePositionCommandsSvc: Symbol.for('DronePositionCommandsSvc'),
    
    // === 無人機狀態服務 ===
    DroneStatusQueriesSvc: Symbol.for('DroneStatusQueriesSvc'),
    DroneStatusCommandsSvc: Symbol.for('DroneStatusCommandsSvc'),
    
    // === 無人機即時狀態服務 ===
    DroneRealTimeStatusQueriesSvc: Symbol.for('DroneRealTimeStatusQueriesSvc'),
    DroneRealTimeStatusCommandsSvc: Symbol.for('DroneRealTimeStatusCommandsSvc'),
    
    // === 無人機命令服務 ===
    DroneCommandQueriesSvc: Symbol.for('DroneCommandQueriesSvc'),
    DroneCommandCommandsSvc: Symbol.for('DroneCommandCommandsSvc'),
    
    // === 無人機命令佇列服務 ===
    DroneCommandQueueQueriesSvc: Symbol.for('DroneCommandQueueQueriesSvc'),
    DroneCommandQueueCommandsSvc: Symbol.for('DroneCommandQueueCommandsSvc'),
    
    // === 歷史歸檔服務 ===
    ArchiveTaskQueriesSvc: Symbol.for('ArchiveTaskQueriesSvc'),
    ArchiveTaskCommandsSvc: Symbol.for('ArchiveTaskCommandsSvc'),
    DroneCommandsArchiveQueriesSvc: Symbol.for('DroneCommandsArchiveQueriesSvc'),
    DroneCommandsArchiveCommandsSvc: Symbol.for('DroneCommandsArchiveCommandsSvc'),
    DronePositionsArchiveQueriesSvc: Symbol.for('DronePositionsArchiveQueriesSvc'),
    DronePositionsArchiveCommandsSvc: Symbol.for('DronePositionsArchiveCommandsSvc'),
    DroneStatusArchiveQueriesSvc: Symbol.for('DroneStatusArchiveQueriesSvc'),
    DroneStatusArchiveCommandsSvc: Symbol.for('DroneStatusArchiveCommandsSvc'),
    
    // === 資料存取層 ===
    // 無人機位置儲存庫
    DronePositionQueriesRepository: Symbol.for('DronePositionQueriesRepository'),
    DronePositionCommandsRepository: Symbol.for('DronePositionCommandsRepository'),
    
    // 無人機狀態儲存庫
    DroneStatusQueriesRepository: Symbol.for('DroneStatusQueriesRepository'),
    DroneStatusCommandsRepository: Symbol.for('DroneStatusCommandsRepository'),
    
    // 無人機即時狀態儲存庫
    DroneRealTimeStatusQueriesRepository: Symbol.for('DroneRealTimeStatusQueriesRepository'),
    DroneRealTimeStatusCommandsRepository: Symbol.for('DroneRealTimeStatusCommandsRepository'),
    
    // 無人機命令儲存庫
    DroneCommandQueriesRepository: Symbol.for('DroneCommandQueriesRepository'),
    DroneCommandCommandsRepository: Symbol.for('DroneCommandCommandsRepository'),
    
    // === WebSocket 相關 ===
    WebSocketService: Symbol.for('WebSocketService'),
    DronePositionEventHandler: Symbol.for('DronePositionEventHandler'),
    DroneStatusEventHandler: Symbol.for('DroneStatusEventHandler'),
    DroneCommandEventHandler: Symbol.for('DroneCommandEventHandler'),
} as const;

/**
 * Drone 事件類型列舉
 */
export enum DroneEventType {
    POSITION_UPDATE = 'drone_position_update',
    STATUS_UPDATE = 'drone_status_update', 
    COMMAND_RECEIVED = 'drone_command_received',
    COMMAND_EXECUTED = 'drone_command_executed'
}
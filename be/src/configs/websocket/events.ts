/**
 * @fileoverview WebSocket 事件常數定義
 * 
 * 此檔案定義 WebSocket 系統中使用的所有事件常數，包括：
 * - 基本連線事件
 * - 認證相關事件  
 * - 無人機位置事件
 * - 無人機狀態事件
 * - 無人機命令事件
 * - 錯誤處理事件
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

/**
 * 無人機 WebSocket 事件類型定義
 * 定義無人機相關的所有 Socket.IO 事件名稱
 */
export const DRONE_EVENTS = {
  // 連線相關事件
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // 認證相關事件
  AUTHENTICATE: 'authenticate',
  AUTHENTICATION_SUCCESS: 'authentication_success',
  AUTHENTICATION_FAILED: 'authentication_failed',
  
  // 無人機位置相關事件
  DRONE_POSITION_UPDATE: 'drone_position_update',
  DRONE_POSITION_SUBSCRIBE: 'drone_position_subscribe',
  DRONE_POSITION_UNSUBSCRIBE: 'drone_position_unsubscribe',
  
  // 無人機狀態相關事件
  DRONE_STATUS_UPDATE: 'drone_status_update',
  DRONE_STATUS_SUBSCRIBE: 'drone_status_subscribe',
  DRONE_STATUS_UNSUBSCRIBE: 'drone_status_unsubscribe',
  
  // 無人機命令相關事件
  DRONE_COMMAND_SEND: 'drone_command_send',
  DRONE_COMMAND_RESPONSE: 'drone_command_response',
  DRONE_COMMAND_STATUS: 'drone_command_status',
  
  // 錯誤處理事件
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error'
} as const;
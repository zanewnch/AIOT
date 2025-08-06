/**
 * @fileoverview WebSocket 命名空間和房間管理
 * 
 * 此檔案定義 WebSocket 系統中的命名空間結構和房間管理工具，包括：
 * - WebSocket 命名空間定義
 * - 房間命名規則和工具函數
 * - 訂閱管理相關的房間操作
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

/**
 * WebSocket 命名空間定義
 * 為不同功能模組定義獨立的命名空間
 */
export const WEBSOCKET_NAMESPACES = {
  /** 無人機實時數據命名空間 */
  DRONE: '/drone'
} as const;

/**
 * Socket.IO 房間管理工具
 * 提供無人機相關的房間管理功能
 */
export const SOCKET_ROOMS = {
  /**
   * 獲取無人機位置訂閱房間名稱
   * @param {string} droneId - 無人機 ID
   * @returns {string} 房間名稱
   */
  getDronePositionRoom: (droneId: string): string => `drone_position_${droneId}`,
  
  /**
   * 獲取無人機狀態訂閱房間名稱
   * @param {string} droneId - 無人機 ID
   * @returns {string} 房間名稱
   */
  getDroneStatusRoom: (droneId: string): string => `drone_status_${droneId}`,
  
  /**
   * 獲取用戶所有無人機房間名稱
   * @param {string} userId - 用戶 ID
   * @returns {string} 房間名稱
   */
  getUserDronesRoom: (userId: string): string => `user_drones_${userId}`,
  
  /**
   * 獲取管理員監控房間名稱
   * @returns {string} 房間名稱
   */
  getAdminMonitorRoom: (): string => 'admin_monitor'
};
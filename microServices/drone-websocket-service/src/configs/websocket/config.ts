/**
 * @fileoverview WebSocket 核心配置
 * 
 * 此檔案定義 Socket.IO 伺服器的核心配置參數，包括：
 * - CORS 跨域設定
 * - 連線超時和重連策略
 * - 性能和安全參數
 * - 針對無人機通訊的專用設定
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { WebSocketConfig } from './types.js';

/**
 * 獲取 WebSocket 配置
 * 
 * 根據環境變數和預設值建立 Socket.IO 伺服器配置
 * 針對無人機實時通訊需求進行最佳化
 * 
 * @returns {WebSocketConfig} WebSocket 配置物件
 * 
 * @example
 * ```typescript
 * const config = getWebSocketConfig();
 * const io = new SocketIOServer(httpServer, config);
 * ```
 */
export function getWebSocketConfig(): WebSocketConfig {
  return {
    cors: {
      // 開發環境允許本地端口，生產環境需要指定實際域名
      origin: process.env.NODE_ENV === 'production' 
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'])
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    
    // 連線逾時設定 - 考慮無人機網路環境可能不穩定
    connectTimeout: 60000, // 60秒
    
    // Ping 設定 - 每秒一次的需求，ping 間隔設為較短
    pingInterval: 5000,    // 5秒 ping 一次
    pingTimeout: 10000,    // 10秒 ping 逾時
    
    // 緩衝區大小 - 考慮無人機數據可能包含大量位置和狀態信息
    maxHttpBufferSize: 1e6, // 1MB
    
    // 允許 WebSocket 升級
    allowUpgrades: true,
    
    // 優先使用 WebSocket，降級到 polling
    transports: ['websocket', 'polling']
  };
}
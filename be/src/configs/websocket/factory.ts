/**
 * @fileoverview Socket.IO 伺服器工廠函數
 * 
 * 此檔案提供建立和設定 Socket.IO 伺服器的工廠函數，包括：
 * - Socket.IO 伺服器實例建立
 * - 命名空間設定
 * - 中間件註冊
 * - 錯誤處理設定
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getWebSocketConfig } from './config.js';
import { WEBSOCKET_NAMESPACES } from './namespaces.js';

/**
 * 建立 Socket.IO 伺服器實例
 * 
 * 使用預設配置建立 Socket.IO 伺服器，並綁定到指定的 HTTP 伺服器
 * 
 * @param {HTTPServer} httpServer - HTTP 伺服器實例
 * @returns {SocketIOServer} Socket.IO 伺服器實例
 * 
 * @example
 * ```typescript
 * const httpServer = http.createServer(app);
 * const io = createSocketIOServer(httpServer);
 * ```
 */
export function createSocketIOServer(httpServer: HTTPServer): SocketIOServer {
  const config = getWebSocketConfig();
  const io = new SocketIOServer(httpServer, config);
  
  // 設定全域錯誤處理
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err);
  });
  
  return io;
}

/**
 * 設定 Socket.IO 命名空間
 * 
 * 為 Socket.IO 伺服器設定所需的命名空間
 * 
 * @param {SocketIOServer} io - Socket.IO 伺服器實例
 */
export function setupSocketIONamespaces(io: SocketIOServer): void {
  // 無人機命名空間 - 用於無人機實時數據傳輸
  const droneNamespace = io.of(WEBSOCKET_NAMESPACES.DRONE);

  console.log('✅ WebSocket namespaces configured:', {
    drone: WEBSOCKET_NAMESPACES.DRONE
  });
}

/**
 * 設定 Socket.IO 中間件
 * 
 * 為指定的 Socket.IO 伺服器註冊認證中間件
 * 
 * @param {SocketIOServer} io - Socket.IO 伺服器實例
 * @param {Function} authMiddleware - JWT 認證中間件
 */
export function setupSocketIOMiddleware(
  io: SocketIOServer, 
  authMiddleware: (socket: Socket, next: (err?: Error) => void) => void
): void {
  // 為無人機命名空間註冊認證中間件
  io.of(WEBSOCKET_NAMESPACES.DRONE).use(authMiddleware);
  
  console.log('✅ WebSocket authentication middleware configured');
}
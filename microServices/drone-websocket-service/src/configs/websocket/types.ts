/**
 * @fileoverview WebSocket 類型定義
 * 
 * 定義 WebSocket 系統中使用的所有介面和類型
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { Socket } from 'socket.io';

/**
 * WebSocket 配置介面
 * 定義 Socket.IO 伺服器的各項配置參數
 */
export interface WebSocketConfig {
  /** Socket.IO 伺服器 CORS 配置 */
  cors: {
    /** 允許的來源域名列表 */
    origin: string | string[];
    /** 允許的 HTTP 方法 */
    methods: string[];
    /** 是否允許傳送憑證 */
    credentials: boolean;
  };
  
  /** 連線逾時設定（毫秒） */
  connectTimeout: number;
  
  /** ping 間隔時間（毫秒） */
  pingInterval: number;
  
  /** ping 逾時時間（毫秒） */
  pingTimeout: number;
  
  /** 最大 HTTP 緩衝大小 */
  maxHttpBufferSize: number;
  
  /** 是否允許升級到 WebSocket */
  allowUpgrades: boolean;
  
  /** 傳輸方式優先順序 */
  transports: ('websocket' | 'polling')[];
}

/**
 * 擴展的 Socket 介面
 * 包含從 API Gateway 傳遞的用戶資訊
 */
export interface AuthenticatedSocket extends Socket {
  /** 從 API Gateway Headers 中提取的用戶資訊 */
  gatewayUser?: {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    sessionId: string;
  };
  /** 認證狀態（由 API Gateway 驗證） */
  isAuthenticated: boolean;
}

/**
 * API Gateway 傳遞的用戶資訊介面
 * 與 API Gateway JWT 載荷格式保持一致
 */
export interface ApiGatewayUserInfo {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  departmentId?: string;
  level?: number;
}

/**
 * 無人機訂閱請求介面
 */
export interface DroneSubscriptionRequest {
  droneId: string;
  dataTypes: ('position' | 'status')[];
}

/**
 * 無人機命令請求介面
 */
export interface DroneCommandRequest {
  droneId: string;
  command: string;
  parameters?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}
/**
 * @fileoverview WebSocket 連接管理 Hook
 * 
 * 提供 WebSocket 連接管理和即時更新功能，包括：
 * - 連接狀態管理
 * - 自動重連機制
 * - 事件訂閱和取消訂閱
 * - 認證和權限驗證
 * - 連接品質監控
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../stores/notificationStore';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useWebSocketConnection');

/**
 * WebSocket 連接狀態類型
 * 
 * @typedef {string} ConnectionStatus
 * @description 定義 WebSocket 連接的各種狀態
 */
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'authenticated'
  | 'reconnecting'
  | 'failed';

/**
 * WebSocket 事件類型常數
 * 
 * @constant {Object} WEBSOCKET_EVENTS
 * @description 定義所有 WebSocket 通訊使用的事件名稱常數
 */
export const WEBSOCKET_EVENTS = {
  // 連線相關
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // 認證相關
  AUTHENTICATE: 'authenticate',
  AUTHENTICATION_SUCCESS: 'authentication_success',
  AUTHENTICATION_FAILED: 'authentication_failed',
  
  // 無人機相關
  DRONE_POSITION_UPDATE: 'drone_position_update',
  DRONE_POSITION_SUBSCRIBE: 'drone_position_subscribe',
  DRONE_POSITION_UNSUBSCRIBE: 'drone_position_unsubscribe',
  
  DRONE_STATUS_UPDATE: 'drone_status_update',
  DRONE_STATUS_SUBSCRIBE: 'drone_status_subscribe',
  DRONE_STATUS_UNSUBSCRIBE: 'drone_status_unsubscribe',
  
  DRONE_COMMAND_SEND: 'drone_command_send',
  DRONE_COMMAND_RESPONSE: 'drone_command_response',
  DRONE_COMMAND_STATUS: 'drone_command_status',
  
  // 錯誤處理
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error'
} as const;

/**
 * WebSocket 配置介面
 * 
 * @interface WebSocketConfig
 * @description 定義 WebSocket 連接的配置選項
 */
interface WebSocketConfig {
  /** WebSocket 服務器 URL */
  url?: string;
  /** 自動連接 */
  autoConnect?: boolean;
  /** 自動重連 */
  autoReconnect?: boolean;
  /** 重連延遲（毫秒）*/
  reconnectDelay?: number;
  /** 最大重連次數 */
  maxReconnectAttempts?: number;
  /** 連接超時（毫秒）*/
  timeout?: number;
  /** 認證令牌 */
  authToken?: string;
}

/**
 * 連接統計信息介面
 * 
 * @interface ConnectionStats
 * @description 追蹤 WebSocket 連接的性能和使用統計
 */
interface ConnectionStats {
  /** 連接時間 */
  connectedAt: Date | null;
  /** 重連次數 */
  reconnectAttempts: number;
  /** 已接收消息數 */
  messagesReceived: number;
  /** 已發送消息數 */
  messagesSent: number;
  /** 平均延遲（毫秒）*/
  averageLatency: number;
  /** 最後一次心跳時間 */
  lastHeartbeat: Date | null;
}

/**
 * WebSocket 連接管理 Hook
 * 
 * @description 提供完整的 WebSocket 連接管理功能，包括自動重連、認證、心跳檢測等
 * @param config - WebSocket 配置選項
 * @returns 包含連接狀態、控制函數、統計信息的物件
 * 
 * @example
 * ```typescript
 * const {
 *   isConnected,
 *   isAuthenticated,
 *   emit,
 *   subscribe,
 *   connect,
 *   disconnect
 * } = useWebSocketConnection({
 *   url: 'ws://localhost:3004',
 *   autoConnect: true,
 *   authToken: 'your-auth-token'
 * });
 * 
 * // 訂閱事件
 * const unsubscribe = subscribe('drone_update', (data) => {
 *   console.log('收到無人機更新:', data);
 * });
 * 
 * // 發送消息
 * emit('command_send', { droneId: '001', command: 'takeoff' });
 * ```
 */
export const useWebSocketConnection = (config: WebSocketConfig = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || 'ws://localhost:3004',
    autoConnect = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    timeout = 10000,
    authToken,
  } = config;

  // 狀態管理
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 統計信息
  const [stats, setStats] = useState<ConnectionStats>({
    connectedAt: null,
    reconnectAttempts: 0,
    messagesReceived: 0,
    messagesSent: 0,
    averageLatency: 0,
    lastHeartbeat: null,
  });

  // 引用
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latencyHistoryRef = useRef<number[]>([]);
  
  // 通知服務
  const { addError, addSuccess, addWarning } = useNotificationStore();

  /**
   * 清理定時器
   * 
   * @description 清理所有運行中的定時器，防止記憶體洩漏
   */
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * 更新連接統計
   * 
   * @description 更新 WebSocket 連接的統計信息
   * @param updates - 要更新的統計資料部分
   */
  const updateStats = useCallback((updates: Partial<ConnectionStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 計算平均延遲
   * 
   * @description 基於歷史延遲記錄計算平均網路延遲
   * @returns 平均延遲時間（毫秒）
   */
  const calculateAverageLatency = useCallback(() => {
    const history = latencyHistoryRef.current;
    if (history.length === 0) return 0;
    
    const sum = history.reduce((acc, latency) => acc + latency, 0);
    return Math.round(sum / history.length);
  }, []);

  /**
   * 心跳檢測
   * 
   * @description 啟動定期心跳檢測，監控連接品質和延遲
   */
  const startHeartbeat = useCallback(() => {
    clearTimers();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const startTime = Date.now();
        
        socketRef.current.emit('ping', startTime, (response: number) => {
          const latency = Date.now() - startTime;
          
          // 更新延遲歷史
          latencyHistoryRef.current.push(latency);
          if (latencyHistoryRef.current.length > 10) {
            latencyHistoryRef.current.shift();
          }
          
          updateStats({
            averageLatency: calculateAverageLatency(),
            lastHeartbeat: new Date(),
          });
          
          logger.debug('WebSocket 心跳檢測', { latency });
        });
      }
    }, 30000); // 每30秒心跳
  }, [updateStats, calculateAverageLatency, clearTimers]);

  /**
   * 設置 Socket 事件監聽器
   * 
   * @description 為 Socket 實例設置所有必要的事件監聽器
   * @param socketInstance - Socket.IO 客戶端實例
   */
  const setupSocketEventListeners = useCallback((socketInstance: Socket) => {
    // 連接成功
    socketInstance.on('connect', () => {
      logger.info('WebSocket 連接成功');
      setStatus('connected');
      setError(null);
      
      updateStats({
        connectedAt: new Date(),
        reconnectAttempts: 0,
      });

      // 如果有認證令牌，自動進行認證
      if (authToken) {
        socketInstance.emit(WEBSOCKET_EVENTS.AUTHENTICATE, { token: authToken });
      }

      startHeartbeat();
      addSuccess('即時連接已建立');
    });

    // 連接斷開
    socketInstance.on('disconnect', (reason) => {
      logger.warn('WebSocket 連接斷開', { reason });
      setStatus('disconnected');
      setIsAuthenticated(false);
      clearTimers();
      
      updateStats({
        connectedAt: null,
      });

      if (reason === 'io server disconnect') {
        // 服務器主動斷開，不自動重連
        addWarning('服務器已斷開連接');
      } else if (autoReconnect) {
        // 網路問題等，嘗試重連
        attemptReconnect();
      }
    });

    // 連接錯誤
    socketInstance.on('connect_error', (err) => {
      logger.error('WebSocket 連接錯誤', { error: err.message });
      setStatus('failed');
      setError(err.message);
      addError(`連接失敗: ${err.message}`);
      
      if (autoReconnect) {
        attemptReconnect();
      }
    });

    // 認證成功
    socketInstance.on(WEBSOCKET_EVENTS.AUTHENTICATION_SUCCESS, () => {
      logger.info('WebSocket 認證成功');
      setStatus('authenticated');
      setIsAuthenticated(true);
      addSuccess('即時更新認證成功');
    });

    // 認證失敗
    socketInstance.on(WEBSOCKET_EVENTS.AUTHENTICATION_FAILED, (data) => {
      logger.error('WebSocket 認證失敗', data);
      setIsAuthenticated(false);
      setError(data?.message || '認證失敗');
      addError(`認證失敗: ${data?.message || '未知錯誤'}`);
    });

    // 錯誤處理
    socketInstance.on(WEBSOCKET_EVENTS.ERROR, (data) => {
      logger.error('WebSocket 錯誤', data);
      setError(data?.message || '未知錯誤');
    });

    // 驗證錯誤
    socketInstance.on(WEBSOCKET_EVENTS.VALIDATION_ERROR, (data) => {
      logger.warn('WebSocket 驗證錯誤', data);
      addWarning(`數據驗證錯誤: ${data?.message}`);
    });

    // 統計消息接收
    const originalOnAny = socketInstance.onAny;
    socketInstance.onAny = (event, ...args) => {
      updateStats(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
      }));
      
      if (originalOnAny) {
        originalOnAny.call(socketInstance, event, ...args);
      }
    };
    
  }, [
    authToken,
    autoReconnect,
    updateStats,
    startHeartbeat,
    clearTimers,
    addSuccess,
    addWarning,
    addError,
  ]);

  /**
   * 嘗試重連
   * 
   * @description 執行自動重連邏輯，使用指數退避策略
   */
  const attemptReconnect = useCallback(() => {
    if (stats.reconnectAttempts >= maxReconnectAttempts) {
      logger.error('WebSocket 重連次數已達上限', { attempts: stats.reconnectAttempts });
      setStatus('failed');
      addError('連接失敗，已停止重連嘗試');
      return;
    }

    setStatus('reconnecting');
    updateStats(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));

    logger.info('嘗試重連 WebSocket', { 
      attempt: stats.reconnectAttempts + 1,
      maxAttempts: maxReconnectAttempts 
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectDelay * Math.pow(1.5, stats.reconnectAttempts)); // 指數退避
  }, [stats.reconnectAttempts, maxReconnectAttempts, reconnectDelay, updateStats, addError]);

  /**
   * 建立連接
   * 
   * @description 建立新的 WebSocket 連接
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      logger.warn('WebSocket 已經連接，忽略重複連接請求');
      return;
    }

    logger.info('建立 WebSocket 連接', { url });
    setStatus('connecting');
    setError(null);

    try {
      const socketInstance = io(url, {
        timeout,
        autoConnect: false,
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      setupSocketEventListeners(socketInstance);
      socketInstance.connect();

    } catch (err: any) {
      logger.error('建立 WebSocket 連接失敗', { error: err.message });
      setStatus('failed');
      setError(err.message);
    }
  }, [url, timeout, setupSocketEventListeners]);

  /**
   * 斷開連接
   * 
   * @description 主動斷開 WebSocket 連接並清理資源
   */
  const disconnect = useCallback(() => {
    logger.info('主動斷開 WebSocket 連接');
    
    clearTimers();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setSocket(null);
    setStatus('disconnected');
    setIsAuthenticated(false);
    setError(null);
    
    updateStats({
      connectedAt: null,
    });
  }, [clearTimers, updateStats]);

  /**
   * 發送消息
   * 
   * @description 向 WebSocket 伺服器發送事件消息
   * @template T - 回調響應的類型
   * @param event - 事件名稱
   * @param data - 要發送的數據
   * @param callback - 接收響應的回調函數
   * @returns 消息是否成功發送
   * 
   * @example
   * ```typescript
   * // 發送簡單消息
   * const success = emit('ping', { timestamp: Date.now() });
   * 
   * // 發送帶回調的消息
   * emit('get_data', { id: '123' }, (response) => {
   *   console.log('接收到響應:', response);
   * });
   * ```
   */
  const emit = useCallback(<T = any>(event: string, data?: any, callback?: (response: T) => void) => {
    if (!socketRef.current?.connected) {
      logger.warn('WebSocket 未連接，無法發送消息', { event, data });
      addWarning('連接斷開，無法發送消息');
      return false;
    }

    try {
      socketRef.current.emit(event, data, callback);
      
      updateStats(prev => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
      }));
      
      logger.debug('WebSocket 消息已發送', { event, data });
      return true;
    } catch (err: any) {
      logger.error('WebSocket 發送消息失敗', { event, data, error: err.message });
      addError(`發送消息失敗: ${err.message}`);
      return false;
    }
  }, [updateStats, addWarning, addError]);

  /**
   * 訂閱事件
   * 
   * @description 訂閱 WebSocket 事件並返回取消訂閱函數
   * @param event - 要訂閱的事件名稱
   * @param callback - 事件處理回調函數
   * @returns 取消訂閱的函數
   * 
   * @example
   * ```typescript
   * const unsubscribe = subscribe('message', (data) => {
   *   console.log('收到消息:', data);
   * });
   * 
   * // 稍後取消訂閱
   * unsubscribe();
   * ```
   */
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) {
      logger.warn('WebSocket 未初始化，無法訂閱事件', { event });
      return () => {};
    }

    socketRef.current.on(event, callback);
    logger.debug('WebSocket 事件已訂閱', { event });
    
    // 返回取消訂閱函數
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
        logger.debug('WebSocket 事件已取消訂閱', { event });
      }
    };
  }, []);

  /**
   * 重新認證
   * 
   * @description 使用提供的令牌或配置的令牌進行 WebSocket 認證
   * @param token - 認證令牌，可選，如果未提供則使用配置的令牌
   * @returns 認證請求是否成功發送
   * 
   * @example
   * ```typescript
   * const success = authenticate('new-auth-token');
   * ```
   */
  const authenticate = useCallback((token?: string) => {
    const tokenToUse = token || authToken;
    
    if (!tokenToUse) {
      logger.warn('沒有提供認證令牌');
      addWarning('缺少認證令牌');
      return false;
    }

    return emit(WEBSOCKET_EVENTS.AUTHENTICATE, { token: tokenToUse });
  }, [authToken, emit, addWarning]);

  // 自動連接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // 清理函數
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // 連接狀態
    status,
    isConnected: status === 'connected' || status === 'authenticated',
    isAuthenticated,
    error,
    
    // 統計信息
    stats,
    
    // 連接控制
    connect,
    disconnect,
    authenticate,
    
    // 消息處理
    emit,
    subscribe,
    
    // Socket 實例（謹慎使用）
    socket: socketRef.current,
    
    // 便捷檢查
    canSendMessages: socketRef.current?.connected && status !== 'failed',
    connectionQuality: stats.averageLatency < 100 ? 'excellent' : 
                      stats.averageLatency < 300 ? 'good' : 
                      stats.averageLatency < 1000 ? 'poor' : 'bad',
  };
};

/**
 * 簡化版的 WebSocket Hook
 * 
 * @description 提供基本的 WebSocket 連接管理，使用預設配置，適用於大多數基本場景
 * @param url - WebSocket 伺服器 URL，可選
 * @returns 與 useWebSocketConnection 相同的返回值，但使用簡化的預設配置
 * 
 * @example
 * ```typescript
 * const { isConnected, emit, subscribe } = useWebSocket();
 * 
 * // 使用自定義 URL
 * const webSocket = useWebSocket('ws://localhost:8080');
 * ```
 */
export const useWebSocket = (url?: string) => {
  return useWebSocketConnection({
    url,
    autoConnect: true,
    autoReconnect: true,
    maxReconnectAttempts: 3,
    authToken: localStorage.getItem('authToken') || undefined,
  });
};
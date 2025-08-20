/**
 * @fileoverview 無人機 WebSocket 連接 Hook
 * 
 * 專門用於無人機數據的即時 WebSocket 連接
 * 提供位置、狀態、指令的即時更新
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useEffect, useCallback, useRef } from 'react';
import { useWebSocketConnection, WEBSOCKET_EVENTS } from './useWebSocketConnection';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useDroneWebSocket');

/**
 * 無人機位置數據類型
 */
interface DronePosition {
  id: number;
  drone_id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  battery_level: number;
  signal_strength: number;
  timestamp: string;
}

/**
 * 無人機狀態數據類型
 */
interface DroneStatus {
  id: number;
  drone_id: number;
  current_battery_level: number;
  current_status: string;
  current_altitude: number;
  current_speed: number;
  is_connected: boolean;
  last_seen: string;
  temperature?: number;
}

/**
 * 無人機指令響應類型
 */
interface DroneCommandResponse {
  id: number;
  drone_id: number;
  command_type: string;
  status: string;
  response_data?: any;
  executed_at?: string;
}

/**
 * WebSocket 回調函數類型
 */
interface DroneWebSocketCallbacks {
  onPositionUpdate?: (position: DronePosition) => void;
  onStatusUpdate?: (status: DroneStatus) => void;
  onCommandResponse?: (response: DroneCommandResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Hook 配置選項
 */
interface UseDroneWebSocketOptions {
  /** 是否自動訂閱位置更新 */
  subscribeToPositions?: boolean;
  /** 是否自動訂閱狀態更新 */
  subscribeToStatus?: boolean;
  /** 是否自動訂閱指令響應 */
  subscribeToCommands?: boolean;
  /** 指定要訂閱的無人機 ID 列表，如果不指定則訂閱所有 */
  droneIds?: number[];
}

/**
 * Hook 返回值類型
 */
interface UseDroneWebSocketReturn {
  connectionStatus: string;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  subscribeToPositions: (droneIds?: number[]) => void;
  unsubscribeFromPositions: () => void;
  subscribeToStatus: (droneIds?: number[]) => void;
  unsubscribeFromStatus: () => void;
  subscribeToCommands: (droneIds?: number[]) => void;
  unsubscribeFromCommands: () => void;
  sendCommand: (droneId: number, command: any) => void;
}

/**
 * 無人機 WebSocket Hook
 * 
 * 提供無人機數據的即時 WebSocket 連接
 */
export const useDroneWebSocket = (
  callbacks: DroneWebSocketCallbacks = {},
  options: UseDroneWebSocketOptions = {}
): UseDroneWebSocketReturn => {
  const {
    subscribeToPositions: autoSubscribePositions = true,
    subscribeToStatus: autoSubscribeStatus = true,
    subscribeToCommands: autoSubscribeCommands = true,
    droneIds = [],
  } = options;

  // WebSocket 連接
  const { 
    connectionStatus, 
    isConnected, 
    isAuthenticated, 
    error, 
    subscribe, 
    unsubscribe, 
    emit 
  } = useWebSocketConnection({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3004',
    autoConnect: true,
    autoReconnect: true,
  });

  // 訂閱狀態追蹤
  const subscriptionsRef = useRef({
    positions: false,
    status: false,
    commands: false,
  });

  /**
   * 訂閱無人機位置更新
   */
  const subscribeToPositions = useCallback((targetDroneIds?: number[]) => {
    if (!isConnected || subscriptionsRef.current.positions) return;

    logger.info('訂閱無人機位置更新', { droneIds: targetDroneIds || droneIds });
    
    subscribe(WEBSOCKET_EVENTS.DRONE_POSITION_UPDATE, (data: DronePosition) => {
      logger.debug('收到位置更新', { droneId: data.drone_id, position: data });
      callbacks.onPositionUpdate?.(data);
    });

    // 發送訂閱請求
    emit(WEBSOCKET_EVENTS.DRONE_POSITION_SUBSCRIBE, {
      droneIds: targetDroneIds || droneIds || []
    });

    subscriptionsRef.current.positions = true;
  }, [isConnected, subscribe, emit, callbacks.onPositionUpdate, droneIds]);

  /**
   * 取消訂閱無人機位置更新
   */
  const unsubscribeFromPositions = useCallback(() => {
    if (!subscriptionsRef.current.positions) return;

    logger.info('取消訂閱無人機位置更新');
    
    unsubscribe(WEBSOCKET_EVENTS.DRONE_POSITION_UPDATE);
    emit(WEBSOCKET_EVENTS.DRONE_POSITION_UNSUBSCRIBE, {});
    
    subscriptionsRef.current.positions = false;
  }, [unsubscribe, emit]);

  /**
   * 訂閱無人機狀態更新
   */
  const subscribeToStatus = useCallback((targetDroneIds?: number[]) => {
    if (!isConnected || subscriptionsRef.current.status) return;

    logger.info('訂閱無人機狀態更新', { droneIds: targetDroneIds || droneIds });
    
    subscribe(WEBSOCKET_EVENTS.DRONE_STATUS_UPDATE, (data: DroneStatus) => {
      logger.debug('收到狀態更新', { droneId: data.drone_id, status: data });
      callbacks.onStatusUpdate?.(data);
    });

    // 發送訂閱請求
    emit(WEBSOCKET_EVENTS.DRONE_STATUS_SUBSCRIBE, {
      droneIds: targetDroneIds || droneIds || []
    });

    subscriptionsRef.current.status = true;
  }, [isConnected, subscribe, emit, callbacks.onStatusUpdate, droneIds]);

  /**
   * 取消訂閱無人機狀態更新
   */
  const unsubscribeFromStatus = useCallback(() => {
    if (!subscriptionsRef.current.status) return;

    logger.info('取消訂閱無人機狀態更新');
    
    unsubscribe(WEBSOCKET_EVENTS.DRONE_STATUS_UPDATE);
    emit(WEBSOCKET_EVENTS.DRONE_STATUS_UNSUBSCRIBE, {});
    
    subscriptionsRef.current.status = false;
  }, [unsubscribe, emit]);

  /**
   * 訂閱無人機指令響應
   */
  const subscribeToCommands = useCallback((targetDroneIds?: number[]) => {
    if (!isConnected || subscriptionsRef.current.commands) return;

    logger.info('訂閱無人機指令響應', { droneIds: targetDroneIds || droneIds });
    
    subscribe(WEBSOCKET_EVENTS.DRONE_COMMAND_RESPONSE, (data: DroneCommandResponse) => {
      logger.debug('收到指令響應', { droneId: data.drone_id, response: data });
      callbacks.onCommandResponse?.(data);
    });

    subscriptionsRef.current.commands = true;
  }, [isConnected, subscribe, callbacks.onCommandResponse]);

  /**
   * 取消訂閱無人機指令響應
   */
  const unsubscribeFromCommands = useCallback(() => {
    if (!subscriptionsRef.current.commands) return;

    logger.info('取消訂閱無人機指令響應');
    
    unsubscribe(WEBSOCKET_EVENTS.DRONE_COMMAND_RESPONSE);
    
    subscriptionsRef.current.commands = false;
  }, [unsubscribe]);

  /**
   * 發送無人機指令
   */
  const sendCommand = useCallback((droneId: number, command: any) => {
    if (!isConnected) {
      logger.warn('WebSocket 未連接，無法發送指令', { droneId, command });
      return;
    }

    logger.info('發送無人機指令', { droneId, command });
    
    emit(WEBSOCKET_EVENTS.DRONE_COMMAND_SEND, {
      drone_id: droneId,
      ...command
    });
  }, [isConnected, emit]);

  // 連接成功後自動訂閱
  useEffect(() => {
    if (isAuthenticated) {
      if (autoSubscribePositions) {
        subscribeToPositions();
      }
      if (autoSubscribeStatus) {
        subscribeToStatus();
      }
      if (autoSubscribeCommands) {
        subscribeToCommands();
      }
    }
  }, [isAuthenticated, autoSubscribePositions, autoSubscribeStatus, autoSubscribeCommands]);

  // 錯誤處理
  useEffect(() => {
    if (error) {
      logger.error('WebSocket 連接錯誤', { error });
      callbacks.onError?.(error);
    }
  }, [error, callbacks.onError]);

  // 組件卸載時清理訂閱
  useEffect(() => {
    return () => {
      unsubscribeFromPositions();
      unsubscribeFromStatus();
      unsubscribeFromCommands();
    };
  }, []);

  return {
    connectionStatus,
    isConnected: isConnected && isAuthenticated,
    isAuthenticated,
    error,
    subscribeToPositions,
    unsubscribeFromPositions,
    subscribeToStatus,
    unsubscribeFromStatus,
    subscribeToCommands,
    unsubscribeFromCommands,
    sendCommand,
  };
};
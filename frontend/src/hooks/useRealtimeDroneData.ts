/**
 * @fileoverview 無人機即時數據 Hook
 * 
 * 提供無人機相關數據的即時更新功能，包括：
 * - 無人機位置即時更新
 * - 無人機狀態即時更新
 * - 無人機命令即時回饋
 * - 數據緩存和合併策略
 * - 自動訂閱管理
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketConnection, WEBSOCKET_EVENTS } from './useWebSocketConnection';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useRealtimeDroneData');

/**
 * 無人機位置數據介面
 * 
 * @interface DronePosition
 * @description 定義無人機位置相關的數據結構，包含地理座標、飛行狀態等資訊
 */
interface DronePosition {
  id: number;
  drone_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  timestamp: string;
  accuracy?: number;
}

/**
 * 無人機狀態數據介面
 * 
 * @interface DroneStatus
 * @description 定義無人機運行狀態的數據結構，包含電池、信號強度、連線狀態等資訊
 */
interface DroneStatus {
  id: number;
  drone_id: string;
  flight_status: string;
  battery_level: number;
  signal_strength: number;
  temperature?: number;
  humidity?: number;
  is_connected: boolean;
  last_ping: string;
  timestamp: string;
}

/**
 * 無人機命令響應介面
 * 
 * @interface DroneCommandResponse
 * @description 定義無人機命令執行回應的數據結構
 */
interface DroneCommandResponse {
  command_id: string;
  drone_id: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  response?: any;
  error?: string;
  timestamp: string;
}

/**
 * 即時數據統計介面
 * 
 * @interface RealtimeStats
 * @description 追蹤無人機即時數據更新的統計資訊
 */
interface RealtimeStats {
  /** 位置更新次數 */
  positionUpdates: number;
  /** 狀態更新次數 */
  statusUpdates: number;
  /** 命令響應次數 */
  commandResponses: number;
  /** 最後更新時間 */
  lastUpdateTime: Date | null;
  /** 訂閱的無人機數量 */
  subscribedDrones: number;
}

/**
 * 訂閱配置介面
 * 
 * @interface SubscriptionConfig
 * @description 設定無人機數據訂閱的相關參數
 */
interface SubscriptionConfig {
  /** 是否自動訂閱 */
  autoSubscribe?: boolean;
  /** 訂閱的無人機 ID 列表 */
  droneIds?: string[];
  /** 是否訂閱所有無人機 */
  subscribeAll?: boolean;
  /** 數據更新頻率限制（毫秒）*/
  updateThrottle?: number;
  /** 是否合併相同無人機的重複更新 */
  mergeDuplicates?: boolean;
}

/**
 * 無人機即時數據 Hook
 * 
 * @description 提供無人機即時數據的訂閱和管理功能，包含位置、狀態、命令響應等數據的即時更新
 * @param config - 訂閱配置選項
 * @returns 包含即時數據、訂閱控制和統計資訊的物件
 * 
 * @example
 * ```typescript
 * const {
 *   realtimePositions,
 *   realtimeStatuses,
 *   subscribeToPositions,
 *   sendDroneCommand,
 *   stats
 * } = useRealtimeDroneData({
 *   autoSubscribe: true,
 *   droneIds: ['drone-001', 'drone-002'],
 *   updateThrottle: 500
 * });
 * ```
 */
export const useRealtimeDroneData = (config: SubscriptionConfig = {}) => {
  const {
    autoSubscribe = true,
    droneIds = [],
    subscribeAll = false,
    updateThrottle = 500,
    mergeDuplicates = true,
  } = config;

  // WebSocket 連接
  const { 
    isConnected, 
    isAuthenticated, 
    emit, 
    subscribe,
    status: connectionStatus 
  } = useWebSocketConnection();

  // React Query 客戶端
  const queryClient = useQueryClient();
  

  // 狀態管理
  const [realtimePositions, setRealtimePositions] = useState<Map<string, DronePosition>>(new Map());
  const [realtimeStatuses, setRealtimeStatuses] = useState<Map<string, DroneStatus>>(new Map());
  const [realtimeCommands, setRealtimeCommands] = useState<Map<string, DroneCommandResponse>>(new Map());
  const [subscribedDroneIds, setSubscribedDroneIds] = useState<Set<string>>(new Set());
  
  // 統計信息
  const [stats, setStats] = useState<RealtimeStats>({
    positionUpdates: 0,
    statusUpdates: 0,
    commandResponses: 0,
    lastUpdateTime: null,
    subscribedDrones: 0,
  });

  // 節流控制
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<{
    positions: Map<string, DronePosition>;
    statuses: Map<string, DroneStatus>;
    commands: Map<string, DroneCommandResponse>;
  }>({
    positions: new Map(),
    statuses: new Map(),
    commands: new Map(),
  });

  /**
   * 更新統計信息
   * 
   * @description 更新即時數據的統計資訊
   * @param updates - 要更新的統計資料部分
   */
  const updateStats = useCallback((updates: Partial<RealtimeStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 節流更新處理
   * 
   * @description 批量處理待處理的數據更新，避免過於頻繁的狀態更新影響性能
   */
  const processThrottledUpdates = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < updateThrottle) {
      return;
    }

    lastUpdateTimeRef.current = now;
    const pending = pendingUpdatesRef.current;

    // 批量更新位置數據
    if (pending.positions.size > 0) {
      setRealtimePositions(prev => {
        const updated = new Map(prev);
        for (const [droneId, position] of pending.positions) {
          if (mergeDuplicates) {
            const existing = updated.get(droneId);
            if (existing && existing.timestamp >= position.timestamp) {
              continue; // 跳過舊數據
            }
          }
          updated.set(droneId, position);
        }
        return updated;
      });
      
      updateStats(prev => ({
        ...prev,
        positionUpdates: prev.positionUpdates + pending.positions.size,
      }));
      
      pending.positions.clear();
    }

    // 批量更新狀態數據
    if (pending.statuses.size > 0) {
      setRealtimeStatuses(prev => {
        const updated = new Map(prev);
        for (const [droneId, status] of pending.statuses) {
          if (mergeDuplicates) {
            const existing = updated.get(droneId);
            if (existing && existing.timestamp >= status.timestamp) {
              continue;
            }
          }
          updated.set(droneId, status);
        }
        return updated;
      });
      
      updateStats(prev => ({
        ...prev,
        statusUpdates: prev.statusUpdates + pending.statuses.size,
      }));
      
      pending.statuses.clear();
    }

    // 批量更新命令響應
    if (pending.commands.size > 0) {
      setRealtimeCommands(prev => {
        const updated = new Map(prev);
        for (const [commandId, command] of pending.commands) {
          updated.set(commandId, command);
        }
        return updated;
      });
      
      updateStats(prev => ({
        ...prev,
        commandResponses: prev.commandResponses + pending.commands.size,
      }));
      
      pending.commands.clear();
    }

    updateStats({ lastUpdateTime: new Date() });

    // 更新 React Query 緩存
    queryClient.invalidateQueries({ queryKey: ['drone'] });
  }, [updateThrottle, mergeDuplicates, updateStats, queryClient]);

  /**
   * 訂閱無人機位置更新
   * 
   * @description 向 WebSocket 伺服器發送位置數據訂閱請求
   * @param targetDroneIds - 要訂閱的無人機 ID 陣列，空陣列表示使用配置的預設值
   * @returns 訂閱請求是否成功發送
   * 
   * @example
   * ```typescript
   * const success = subscribeToPositions(['drone-001', 'drone-002']);
   * if (success) {
   *   console.log('位置訂閱請求已發送');
   * }
   * ```
   */
  const subscribeToPositions = useCallback((targetDroneIds: string[] = []) => {
    if (!isAuthenticated) {
      logger.warn('WebSocket 未認證，無法訂閱位置更新');
      return false;
    }

    const idsToSubscribe = targetDroneIds.length > 0 ? targetDroneIds : (subscribeAll ? ['*'] : droneIds);
    
    if (idsToSubscribe.length === 0) {
      logger.warn('沒有指定要訂閱的無人機 ID');
      return false;
    }

    const success = emit(WEBSOCKET_EVENTS.DRONE_POSITION_SUBSCRIBE, {
      droneIds: idsToSubscribe,
      subscribeAll
    });

    if (success) {
      logger.info('無人機位置訂閱請求已發送', { droneIds: idsToSubscribe });
    }

    return success;
  }, [isAuthenticated, subscribeAll, droneIds, emit]);

  /**
   * 訂閱無人機狀態更新
   * 
   * @description 向 WebSocket 伺服器發送狀態數據訂閱請求
   * @param targetDroneIds - 要訂閱的無人機 ID 陣列，空陣列表示使用配置的預設值
   * @returns 訂閱請求是否成功發送
   * 
   * @example
   * ```typescript
   * const success = subscribeToStatuses(['drone-001']);
   * ```
   */
  const subscribeToStatuses = useCallback((targetDroneIds: string[] = []) => {
    if (!isAuthenticated) {
      logger.warn('WebSocket 未認證，無法訂閱狀態更新');
      return false;
    }

    const idsToSubscribe = targetDroneIds.length > 0 ? targetDroneIds : (subscribeAll ? ['*'] : droneIds);
    
    const success = emit(WEBSOCKET_EVENTS.DRONE_STATUS_SUBSCRIBE, {
      droneIds: idsToSubscribe,
      subscribeAll
    });

    if (success) {
      logger.info('無人機狀態訂閱請求已發送', { droneIds: idsToSubscribe });
    }

    return success;
  }, [isAuthenticated, subscribeAll, droneIds, emit]);

  /**
   * 取消位置訂閱
   * 
   * @description 取消所有無人機位置數據的訂閱
   */
  const unsubscribeFromPositions = useCallback(() => {
    emit(WEBSOCKET_EVENTS.DRONE_POSITION_UNSUBSCRIBE, {});
    logger.info('已取消無人機位置訂閱');
  }, [emit]);

  /**
   * 取消狀態訂閱
   * 
   * @description 取消所有無人機狀態數據的訂閱
   */
  const unsubscribeFromStatuses = useCallback(() => {
    emit(WEBSOCKET_EVENTS.DRONE_STATUS_UNSUBSCRIBE, {});
    logger.info('已取消無人機狀態訂閱');
  }, [emit]);

  /**
   * 發送無人機命令
   * 
   * @description 向指定無人機發送控制命令
   * @param droneId - 目標無人機的 ID
   * @param command - 要發送的命令對象
   * @returns 命令是否成功發送
   * 
   * @example
   * ```typescript
   * const success = sendDroneCommand('drone-001', {
   *   type: 'takeoff',
   *   altitude: 10
   * });
   * ```
   */
  const sendDroneCommand = useCallback((droneId: string, command: any) => {
    if (!isAuthenticated) {
      return false;
    }

    const commandData = {
      droneId,
      command,
      timestamp: new Date().toISOString(),
    };

    const success = emit(WEBSOCKET_EVENTS.DRONE_COMMAND_SEND, commandData);
    
    if (success) {
      logger.info('無人機命令已發送', commandData);
    }

    return success;
  }, [isAuthenticated, emit]);

  /**
   * 設置 WebSocket 事件監聽器
   * 
   * @description 建立 WebSocket 事件監聽器，處理即時數據更新
   */
  useEffect(() => {
    if (!isConnected) return;

    // 位置更新監聽
    const unsubscribePositions = subscribe(
      WEBSOCKET_EVENTS.DRONE_POSITION_UPDATE,
      (data: DronePosition) => {
        logger.debug('收到無人機位置更新', { droneId: data.drone_id });
        pendingUpdatesRef.current.positions.set(data.drone_id, data);
        
        // 立即處理或節流處理
        if (updateThrottle === 0) {
          processThrottledUpdates();
        } else {
          // 延遲處理
          setTimeout(processThrottledUpdates, 0);
        }
      }
    );

    // 狀態更新監聽
    const unsubscribeStatuses = subscribe(
      WEBSOCKET_EVENTS.DRONE_STATUS_UPDATE,
      (data: DroneStatus) => {
        logger.debug('收到無人機狀態更新', { droneId: data.drone_id });
        pendingUpdatesRef.current.statuses.set(data.drone_id, data);
        
        if (updateThrottle === 0) {
          processThrottledUpdates();
        } else {
          setTimeout(processThrottledUpdates, 0);
        }
      }
    );

    // 命令響應監聽
    const unsubscribeCommands = subscribe(
      WEBSOCKET_EVENTS.DRONE_COMMAND_RESPONSE,
      (data: DroneCommandResponse) => {
        logger.debug('收到無人機命令響應', { commandId: data.command_id });
        pendingUpdatesRef.current.commands.set(data.command_id, data);
        
        if (updateThrottle === 0) {
          processThrottledUpdates();
        } else {
          setTimeout(processThrottledUpdates, 0);
        }
      }
    );

    return () => {
      unsubscribePositions();
      unsubscribeStatuses();
      unsubscribeCommands();
    };
  }, [isConnected, subscribe, processThrottledUpdates, updateThrottle]);

  /**
   * 自動訂閱
   * 
   * @description 當啟用自動訂閱且 WebSocket 已認證時，自動開始訂閱數據
   */
  useEffect(() => {
    if (autoSubscribe && isAuthenticated) {
      subscribeToPositions();
      subscribeToStatuses();
    }
  }, [autoSubscribe, isAuthenticated, subscribeToPositions, subscribeToStatuses]);

  /**
   * 更新訂閱統計
   * 
   * @description 當訂閱的無人機列表變更時，更新統計資訊
   */
  useEffect(() => {
    const totalSubscribed = subscribedDroneIds.size;
    updateStats({ subscribedDrones: totalSubscribed });
  }, [subscribedDroneIds, updateStats]);

  /**
   * 獲取特定無人機的即時數據
   * 
   * @description 取得指定無人機的最新位置和狀態資訊
   * @param droneId - 無人機 ID
   * @returns 包含位置、狀態、連線狀態和最後更新時間的物件
   * 
   * @example
   * ```typescript
   * const droneData = getDroneRealtimeData('drone-001');
   * console.log('無人機位置:', droneData.position);
   * console.log('是否在線:', droneData.isOnline);
   * ```
   */
  const getDroneRealtimeData = useCallback((droneId: string) => {
    return {
      position: realtimePositions.get(droneId),
      status: realtimeStatuses.get(droneId),
      isOnline: realtimeStatuses.get(droneId)?.is_connected || false,
      lastUpdate: Math.max(
        new Date(realtimePositions.get(droneId)?.timestamp || 0).getTime(),
        new Date(realtimeStatuses.get(droneId)?.timestamp || 0).getTime()
      ),
    };
  }, [realtimePositions, realtimeStatuses]);

  /**
   * 清除過期數據
   * 
   * @description 移除超過指定時間的舊數據，保持數據的時效性
   * @param maxAge - 最大保存時間（毫秒），預設為 5 分鐘
   * 
   * @example
   * ```typescript
   * // 清除 10 分鐘前的數據
   * clearExpiredData(10 * 60 * 1000);
   * ```
   */
  const clearExpiredData = useCallback((maxAge: number = 5 * 60 * 1000) => {
    const now = Date.now();
    
    setRealtimePositions(prev => {
      const filtered = new Map();
      for (const [droneId, position] of prev) {
        if (now - new Date(position.timestamp).getTime() < maxAge) {
          filtered.set(droneId, position);
        }
      }
      return filtered;
    });

    setRealtimeStatuses(prev => {
      const filtered = new Map();
      for (const [droneId, status] of prev) {
        if (now - new Date(status.timestamp).getTime() < maxAge) {
          filtered.set(droneId, status);
        }
      }
      return filtered;
    });
  }, []);

  return {
    // 即時數據
    realtimePositions: Array.from(realtimePositions.values()),
    realtimeStatuses: Array.from(realtimeStatuses.values()),
    realtimeCommands: Array.from(realtimeCommands.values()),
    
    // 數據查詢
    getDroneRealtimeData,
    
    // 訂閱控制
    subscribeToPositions,
    subscribeToStatuses,
    unsubscribeFromPositions,
    unsubscribeFromStatuses,
    
    // 命令發送
    sendDroneCommand,
    
    // 統計和狀態
    stats,
    connectionStatus,
    isConnected,
    isAuthenticated,
    subscribedDroneIds: Array.from(subscribedDroneIds),
    
    // 工具函數
    clearExpiredData,
    
    // 數據計數
    positionCount: realtimePositions.size,
    statusCount: realtimeStatuses.size,
    commandCount: realtimeCommands.size,
  };
};

/**
 * 簡化版無人機即時數據 Hook
 * 
 * @description 提供預設配置的無人機即時數據訂閱功能，適用於大多數基本使用場景
 * @param droneIds - 要訂閱的無人機 ID 陣列，可選
 * @returns 與 useRealtimeDroneData 相同的回傳值，但使用簡化的預設配置
 * 
 * @example
 * ```typescript
 * // 訂閱所有無人機
 * const { realtimePositions, stats } = useSimpleRealtimeDroneData();
 * 
 * // 訂閱特定無人機
 * const droneData = useSimpleRealtimeDroneData(['drone-001', 'drone-002']);
 * ```
 */
export const useSimpleRealtimeDroneData = (droneIds?: string[]) => {
  return useRealtimeDroneData({
    autoSubscribe: true,
    droneIds,
    subscribeAll: !droneIds || droneIds.length === 0,
    updateThrottle: 1000,
    mergeDuplicates: true,
  });
};
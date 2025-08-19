/**
 * @fileoverview 樂觀更新 Hook - 無人機命令控制
 * 
 * 提供樂觀更新功能，在發送命令時立即更新 UI 狀態，
 * 背景同步到服務器，如果失敗則回滾狀態
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { ReqResult } from '../utils/ReqResult';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useOptimisticCommand');

/**
 * 無人機命令類型定義
 * 
 * 定義所有可用的無人機控制命令類型
 */
export type DroneCommandType = 
  | 'takeoff'        // 起飛
  | 'land'           // 降落
  | 'hover'          // 懸停
  | 'emergency_stop' // 緊急停止
  | 'move_forward'   // 向前移動
  | 'move_backward'  // 向後移動
  | 'move_left'      // 向左移動
  | 'move_right'     // 向右移動
  | 'rotate_left'    // 向左旋轉
  | 'rotate_right'   // 向右旋轉
  | 'return_to_home' // 返回原點
  | 'reset';         // 重設

/**
 * 無人機狀態類型定義
 * 
 * 定義無人機的所有可能狀態
 */
export type DroneStatus = 
  | 'grounded'       // 在地面
  | 'taking_off'     // 起飛中
  | 'hovering'       // 懸停中
  | 'flying'         // 飛行中
  | 'landing'        // 降落中
  | 'emergency'      // 緊急狀態
  | 'returning_home' // 返航中
  | 'resetting';     // 重設中

/**
 * 無人機命令介面
 * 
 * 定義發送給無人機的命令結構
 */
export interface DroneCommand {
  /** 命令類型 */
  type: DroneCommandType;
  /** 無人機 ID，預設為 'default' */
  droneId?: string;
  /** 命令參數，根據不同命令類型而定 */
  parameters?: Record<string, any>;
}

/**
 * 樂觀更新無人機狀態介面
 * 
 * 定義樂觀更新機制中的無人機狀態
 */
export interface OptimisticDroneState {
  /** 無人機目前狀態 */
  status: DroneStatus;
  /** 目前執行中的命令 */
  currentCommand: DroneCommandType | null;
  /** 是否正在執行命令 */
  isExecuting: boolean;
  /** 最後一個執行的命令 */
  lastCommand?: DroneCommand;
  /** 狀態更新時間戳 */
  timestamp: Date;
}

/**
 * 根據命令類型取得樂觀更新的無人機狀態
 * 
 * 根據不同的命令類型，預測無人機執行命令後的狀態
 * 
 * @param command - 無人機命令類型
 * @returns 預測的無人機狀態
 * 
 * @example
 * ```typescript
 * const status = getOptimisticStatus('takeoff');
 * console.log(status); // 'taking_off'
 * ```
 */
const getOptimisticStatus = (command: DroneCommandType): DroneStatus => {
  const statusMap: Record<DroneCommandType, DroneStatus> = {
    takeoff: 'taking_off',
    land: 'landing',
    hover: 'hovering',
    emergency_stop: 'emergency',
    move_forward: 'flying',
    move_backward: 'flying',
    move_left: 'flying',
    move_right: 'flying',
    rotate_left: 'flying',
    rotate_right: 'flying',
    return_to_home: 'returning_home',
    reset: 'resetting'
  };
  
  return statusMap[command] || 'flying';
};

/**
 * 樂觀更新 Hook - 無人機命令控制
 * 
 * 提供即時的 UI 反饋，在後台同步命令到服務器
 */
export const useOptimisticCommand = () => {
  const queryClient = useQueryClient();
  const [optimisticState, setOptimisticState] = useState<OptimisticDroneState | null>(null);
  const [pendingCommands, setPendingCommands] = useState<Set<DroneCommandType>>(new Set());

  // 🚀 樂觀更新 Mutation
  const commandMutation = useMutation({
    mutationFn: async (command: DroneCommand): Promise<any> => {
      try {
        logger.info('Sending drone command', { command });
        
        // 發送到後端 API
        const response = await apiClient.post('/drone/commands', {
          command_type: command.type,
          drone_id: 1, // 預設無人機 ID 為 1
          parameters: command.parameters || {},
          issued_by: 1, // 預設發送者 ID 為 1（admin用戶）
          timestamp: new Date().toISOString()
        });

        const result = ReqResult.fromResponse(response);
        if (result.isError()) {
          throw new Error(result.message);
        }

        return result.unwrap();
      } catch (error: any) {
        logger.error('Failed to send drone command', { error, command });
        throw error;
      }
    },

    // 🎯 成功時更新緩存
    onSuccess: (data, variables) => {
      logger.info('Command executed successfully', { variables, data });
      
      // 更新相關查詢緩存
      queryClient.invalidateQueries({ queryKey: ['droneStatuses'] });
      queryClient.invalidateQueries({ queryKey: ['droneCommands'] });
      
      // 清除樂觀狀態
      setOptimisticState(null);
      setPendingCommands(prev => {
        const next = new Set(prev);
        next.delete(variables.type);
        return next;
      });
    },

    // ❌ 失敗時回滾狀態
    onError: (error, variables, context) => {
      logger.error('Command failed, rolling back optimistic update', { error, variables });
      
      // 回滾樂觀狀態
      setOptimisticState(null);
      setPendingCommands(prev => {
        const next = new Set(prev);
        next.delete(variables.type);
        return next;
      });

      // 可以在這裡觸發錯誤通知
      // notificationService.error(`命令執行失敗: ${error.message}`);
    },

    // ⚡ 執行前立即更新 UI (樂觀更新)
    onMutate: async (variables) => {
      logger.info('Applying optimistic update', { variables });
      
      // 立即更新 UI 狀態
      const newOptimisticState: OptimisticDroneState = {
        status: getOptimisticStatus(variables.type),
        currentCommand: variables.type,
        isExecuting: true,
        lastCommand: variables,
        timestamp: new Date()
      };
      
      setOptimisticState(newOptimisticState);
      setPendingCommands(prev => new Set(prev).add(variables.type));

      // 樂觀更新查詢緩存
      queryClient.setQueryData(['droneStatuses'], (old: any) => {
        if (!old) return old;
        
        return Array.isArray(old) ? old.map((drone: any) => ({
          ...drone,
          flight_status: newOptimisticState.status,
          current_command: newOptimisticState.currentCommand,
          is_executing: true,
          last_updated: new Date().toISOString()
        })) : {
          ...old,
          flight_status: newOptimisticState.status,
          current_command: newOptimisticState.currentCommand,
          is_executing: true,
          last_updated: new Date().toISOString()
        };
      });

      return { previousData: queryClient.getQueryData(['droneStatuses']) };
    },

    retry: 2,
    retryDelay: 1000
  });

  /**
   * 執行無人機命令
   * 
   * 使用樂觀更新機制執行無人機命令，立即更新 UI 狀態，
   * 然後在背景中發送到伺服器。如果失敗則回滾狀態。
   * 
   * @param command - 要執行的命令類型
   * @param parameters - 命令參數（可選）
   * @returns Promise，解析為伺服器回應的結果
   * 
   * @throws 當命令執行失敗時拋出錯誤
   * 
   * @example
   * ```typescript
   * try {
   *   await executeCommand('takeoff');
   *   console.log('起飛命令執行成功');
   * } catch (error) {
   *   console.error('命令執行失敗:', error);
   * }
   * 
   * // 帶參數的命令
   * await executeCommand('move_forward', { distance: 5 });
   * ```
   */
  const executeCommand = useCallback((command: DroneCommandType, parameters?: Record<string, any>) => {
    const droneCommand: DroneCommand = {
      type: command,
      parameters
    };
    
    return commandMutation.mutateAsync(droneCommand);
  }, [commandMutation]);

  /**
   * 檢查指定命令是否正在等待執行
   * 
   * 用於檢查某個特定命令是否在等待中，可用於 UI 狀態顯示
   * 
   * @param command - 要檢查的命令類型
   * @returns 如果命令正在等待執行則返回 true
   * 
   * @example
   * ```typescript
   * const isTakeoffPending = isCommandPending('takeoff');
   * if (isTakeoffPending) {
   *   console.log('起飛命令正在執行中');
   * }
   * 
   * // 用於 UI 顯示
   * <button disabled={isCommandPending('takeoff')}>
   *   {isCommandPending('takeoff') ? '起飛中...' : '起飛'}
   * </button>
   * ```
   */
  const isCommandPending = useCallback((command: DroneCommandType) => {
    return pendingCommands.has(command);
  }, [pendingCommands]);

  // 🏃 檢查是否有任何命令在執行
  const hasAnyPendingCommand = pendingCommands.size > 0;

  return {
    // 核心功能
    executeCommand,
    
    // 狀態
    optimisticState,
    isCommandPending,
    hasAnyPendingCommand,
    pendingCommands: Array.from(pendingCommands),
    
    // Mutation 狀態
    isLoading: commandMutation.isPending,
    error: commandMutation.error,
    isSuccess: commandMutation.isSuccess,
    
    // 重置函數
    reset: () => {
      setOptimisticState(null);
      setPendingCommands(new Set());
      commandMutation.reset();
    }
  };
};
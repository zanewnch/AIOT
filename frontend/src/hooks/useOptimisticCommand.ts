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
import { RequestResult } from '../utils/RequestResult';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useOptimisticCommand');

export type DroneCommandType = 
  | 'takeoff' 
  | 'land' 
  | 'hover' 
  | 'emergency_stop'
  | 'move_forward'
  | 'move_backward'
  | 'move_left'
  | 'move_right'
  | 'rotate_left'
  | 'rotate_right'
  | 'return_to_home'
  | 'reset';

export type DroneStatus = 
  | 'grounded'
  | 'taking_off'
  | 'hovering'
  | 'flying'
  | 'landing'
  | 'emergency'
  | 'returning_home'
  | 'resetting';

export interface DroneCommand {
  type: DroneCommandType;
  droneId?: string;
  parameters?: Record<string, any>;
}

export interface OptimisticDroneState {
  status: DroneStatus;
  currentCommand: DroneCommandType | null;
  isExecuting: boolean;
  lastCommand?: DroneCommand;
  timestamp: Date;
}

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
        const response = await apiClient.post('/api/drone-command/send', {
          command: command.type,
          droneId: command.droneId || 'default',
          parameters: command.parameters || {},
          timestamp: new Date().toISOString()
        });

        const result = RequestResult.fromResponse(response);
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

  // 🎮 執行命令函數
  const executeCommand = useCallback((command: DroneCommandType, parameters?: Record<string, any>) => {
    const droneCommand: DroneCommand = {
      type: command,
      parameters
    };
    
    return commandMutation.mutateAsync(droneCommand);
  }, [commandMutation]);

  // 🔄 檢查命令是否在執行中
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
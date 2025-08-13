/**
 * @fileoverview React Query hooks 用於無人機指令歷史歸檔數據管理
 * 
 * 使用 React Query 處理所有與無人機指令歷史歸檔相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger } from '../configs/loggerConfig';
import type { TableError } from '../types/table';

// 創建 logger
const logger = createLogger('useDroneCommandArchiveQuery');

/**
 * 無人機指令歷史歸檔資料介面
 */
export interface DroneCommandArchive {
  id: number;
  original_id: number;
  drone_id: number;
  command_type: 'takeoff' | 'land' | 'move' | 'hover' | 'return';
  command_data: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  issued_by: number;
  issued_at: Date;
  executed_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  archived_at: Date;
  archive_batch_id: string;
  created_at: Date;
  // 計算方法
  getWaitTime(): number | null;
  getExecutionTime(): number | null;
  getTotalTime(): number | null;
}

/**
 * 時間範圍查詢參數
 */
export interface TimeRangeQuery {
  startDate: string;
  endDate: string;
  droneId?: number;
  status?: string;
  commandType?: string;
}

/**
 * 分頁查詢參數
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * DroneCommandArchiveQuery - 無人機指令歷史歸檔查詢服務類
 * 
 * 使用 class 封裝所有與無人機指令歷史歸檔相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DroneCommandArchiveQuery {
  
  public DRONE_COMMAND_ARCHIVE_QUERY_KEYS: {
    DRONE_COMMANDS_ARCHIVE: readonly string[];
    DRONE_COMMAND_ARCHIVE_BY_ID: (id: string) => readonly (string | string)[];
    DRONE_COMMANDS_ARCHIVE_BY_DRONE_ID: (droneId: string) => readonly (string | string)[];
    DRONE_COMMANDS_ARCHIVE_BY_STATUS: (status: string) => readonly (string | string)[];
    DRONE_COMMANDS_ARCHIVE_BY_TYPE: (type: string) => readonly (string | string)[];
    DRONE_COMMANDS_ARCHIVE_TIME_RANGE: (query: TimeRangeQuery) => readonly (string | TimeRangeQuery)[];
    DRONE_COMMANDS_ARCHIVE_LATEST: readonly string[];
  };
  
  constructor() {
    this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS = {
      DRONE_COMMANDS_ARCHIVE: ['droneCommandsArchive'] as const,
      DRONE_COMMAND_ARCHIVE_BY_ID: (id: string) => ['droneCommandArchive', id] as const,
      DRONE_COMMANDS_ARCHIVE_BY_DRONE_ID: (droneId: string) => ['droneCommandsArchive', 'drone', droneId] as const,
      DRONE_COMMANDS_ARCHIVE_BY_STATUS: (status: string) => ['droneCommandsArchive', 'status', status] as const,
      DRONE_COMMANDS_ARCHIVE_BY_TYPE: (type: string) => ['droneCommandsArchive', 'type', type] as const,
      DRONE_COMMANDS_ARCHIVE_TIME_RANGE: (query: TimeRangeQuery) => ['droneCommandsArchive', 'timeRange', query] as const,
      DRONE_COMMANDS_ARCHIVE_LATEST: ['droneCommandsArchive', 'latest'] as const,
    };
  }

  /**
   * 獲取所有指令歷史歸檔資料
   * 
   * @param options - 查詢選項
   * @returns useQuery hook
   */
  useGetAllCommandsArchive(options: PaginationQuery = {}) {
    return useQuery({
      queryKey: [...this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS.DRONE_COMMANDS_ARCHIVE, options],
      queryFn: async (): Promise<DroneCommandArchive[]> => {
        try {
          logger.debug('Fetching all commands archive', { options });
          
          const params = new URLSearchParams();
          if (options.limit) params.append('limit', options.limit.toString());
          if (options.page) params.append('page', options.page.toString());
          if (options.sortBy) params.append('sortBy', options.sortBy);
          if (options.sortOrder) params.append('sortOrder', options.sortOrder);
          
          const url = `/api/drone/commands/archive/data?${params.toString()}`;
          const result = await apiClient.getWithResult<DroneCommandArchive[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          const commands = result.data || [];
          logger.info(`Successfully fetched ${commands.length} commands archive records`);
          return commands;
        } catch (error: any) {
          logger.error('Failed to fetch commands archive', { error, options });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch commands archive',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });
  }

  /**
   * 根據無人機ID獲取指令歷史
   * 
   * @param droneId - 無人機ID
   * @param options - 查詢選項
   * @returns useQuery hook
   */
  useGetCommandsArchiveByDroneId(droneId: number, options: PaginationQuery = {}) {
    return useQuery({
      queryKey: [...this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS.DRONE_COMMANDS_ARCHIVE_BY_DRONE_ID(droneId.toString()), options],
      queryFn: async (): Promise<DroneCommandArchive[]> => {
        try {
          logger.debug('Fetching commands archive by drone ID', { droneId, options });
          
          const params = new URLSearchParams();
          if (options.limit) params.append('limit', options.limit.toString());
          if (options.page) params.append('page', options.page.toString());
          if (options.sortBy) params.append('sortBy', options.sortBy);
          if (options.sortOrder) params.append('sortOrder', options.sortOrder);
          
          const url = `/api/drone/commands/archive/data/drone/${droneId}?${params.toString()}`;
          const result = await apiClient.getWithResult<DroneCommandArchive[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          const commands = result.data || [];
          logger.info(`Successfully fetched ${commands.length} commands archive records for drone ${droneId}`);
          return commands;
        } catch (error: any) {
          logger.error('Failed to fetch commands archive by drone ID', { error, droneId, options });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch commands archive for drone ${droneId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: !!droneId && droneId > 0,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });
  }

  /**
   * 根據時間範圍獲取指令歷史
   * 
   * @param query - 時間範圍查詢參數
   * @returns useQuery hook
   */
  useGetCommandsArchiveByTimeRange(query: TimeRangeQuery) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS.DRONE_COMMANDS_ARCHIVE_TIME_RANGE(query),
      queryFn: async (): Promise<DroneCommandArchive[]> => {
        try {
          logger.debug('Fetching commands archive by time range', { query });
          
          const params = new URLSearchParams();
          params.append('startDate', query.startDate);
          params.append('endDate', query.endDate);
          if (query.droneId) params.append('droneId', query.droneId.toString());
          if (query.status) params.append('status', query.status);
          if (query.commandType) params.append('commandType', query.commandType);
          
          const url = `/api/drone/commands/archive/data/time-range?${params.toString()}`;
          const result = await apiClient.getWithResult<DroneCommandArchive[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          const commands = result.data || [];
          logger.info(`Successfully fetched ${commands.length} commands archive records for time range`);
          return commands;
        } catch (error: any) {
          logger.error('Failed to fetch commands archive by time range', { error, query });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch commands archive by time range',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: !!(query.startDate && query.endDate),
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    });
  }

  /**
   * 根據指令狀態獲取歷史
   * 
   * @param status - 指令狀態
   * @param options - 查詢選項
   * @returns useQuery hook
   */
  useGetCommandsArchiveByStatus(status: string, options: PaginationQuery = {}) {
    return useQuery({
      queryKey: [...this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS.DRONE_COMMANDS_ARCHIVE_BY_STATUS(status), options],
      queryFn: async (): Promise<DroneCommandArchive[]> => {
        try {
          logger.debug('Fetching commands archive by status', { status, options });
          
          const params = new URLSearchParams();
          if (options.limit) params.append('limit', options.limit.toString());
          if (options.page) params.append('page', options.page.toString());
          
          const url = `/api/drone/commands/archive/data/status/${status}?${params.toString()}`;
          const result = await apiClient.getWithResult<DroneCommandArchive[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          const commands = result.data || [];
          logger.info(`Successfully fetched ${commands.length} commands archive records with status ${status}`);
          return commands;
        } catch (error: any) {
          logger.error('Failed to fetch commands archive by status', { error, status, options });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch commands archive with status ${status}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: !!status,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });
  }

  /**
   * 根據指令類型獲取歷史
   * 
   * @param commandType - 指令類型
   * @param options - 查詢選項
   * @returns useQuery hook
   */
  useGetCommandsArchiveByType(commandType: string, options: PaginationQuery = {}) {
    return useQuery({
      queryKey: [...this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS.DRONE_COMMANDS_ARCHIVE_BY_TYPE(commandType), options],
      queryFn: async (): Promise<DroneCommandArchive[]> => {
        try {
          logger.debug('Fetching commands archive by type', { commandType, options });
          
          const params = new URLSearchParams();
          if (options.limit) params.append('limit', options.limit.toString());
          if (options.page) params.append('page', options.page.toString());
          
          const url = `/api/drone/commands/archive/data/command-type/${commandType}?${params.toString()}`;
          const result = await apiClient.getWithResult<DroneCommandArchive[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          const commands = result.data || [];
          logger.info(`Successfully fetched ${commands.length} commands archive records with type ${commandType}`);
          return commands;
        } catch (error: any) {
          logger.error('Failed to fetch commands archive by type', { error, commandType, options });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch commands archive with type ${commandType}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: !!commandType,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });
  }

  /**
   * 獲取最新的指令歷史記錄
   * 
   * @param limit - 限制數量
   * @returns useQuery hook
   */
  useGetLatestCommandsArchive(limit: number = 50) {
    return useQuery({
      queryKey: [...this.DRONE_COMMAND_ARCHIVE_QUERY_KEYS.DRONE_COMMANDS_ARCHIVE_LATEST, limit],
      queryFn: async (): Promise<DroneCommandArchive[]> => {
        try {
          logger.debug('Fetching latest commands archive', { limit });
          
          const url = `/api/drone/commands/archive/data?limit=${limit}&sortBy=issued_at&sortOrder=DESC`;
          const result = await apiClient.getWithResult<DroneCommandArchive[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          const commands = result.data || [];
          logger.info(`Successfully fetched ${commands.length} latest commands archive records`);
          return commands;
        } catch (error: any) {
          logger.error('Failed to fetch latest commands archive', { error, limit });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch latest commands archive',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 10 * 1000, // 10 seconds for real-time feel
      gcTime: 2 * 60 * 1000, // 2 minutes
      retry: 2,
      refetchInterval: 30 * 1000, // 自動刷新每30秒
    });
  }
}

// 創建單例實例
const droneCommandArchiveQuery = new DroneCommandArchiveQuery();

// 導出 hooks
export const useDroneCommandArchiveQuery = () => droneCommandArchiveQuery;

// 也可以直接導出常用的 hooks
export const useGetAllCommandsArchive = (options?: PaginationQuery) => 
  droneCommandArchiveQuery.useGetAllCommandsArchive(options);

export const useGetCommandsArchiveByDroneId = (droneId: number, options?: PaginationQuery) => 
  droneCommandArchiveQuery.useGetCommandsArchiveByDroneId(droneId, options);

export const useGetLatestCommandsArchive = (limit?: number) => 
  droneCommandArchiveQuery.useGetLatestCommandsArchive(limit);

export const useGetCommandsArchiveByTimeRange = (query: TimeRangeQuery) => 
  droneCommandArchiveQuery.useGetCommandsArchiveByTimeRange(query);

export default droneCommandArchiveQuery;
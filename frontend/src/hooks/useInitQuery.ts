/**
 * @fileoverview 初始化相關的 React Query Hooks
 * 
 * 這個檔案包含所有系統初始化相關的 API 請求邏輯，使用 React Query 來處理：
 * - 快取管理
 * - 異步狀態處理
 * - 錯誤處理
 * - 重試邏輯
 * 
 * 提供系統初始化相關功能：
 * - RBAC 示例資料初始化
 * - RTK 示例資料初始化
 * - 管理員帳號創建
 * - 壓力測試資料生成
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { ReqResult } from '../utils/ReqResult';
import type { InitResponse, StressTestResponse, InitAllDemoResponse } from '../types/init';
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useInitQuery');

/**
 * InitQuery - 初始化查詢服務類
 * 
 * 使用 class 封裝所有與初始化相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class InitQuery {
  
  public INIT_QUERY_KEYS = {
    RBAC_DEMO: ['init', 'rbac-demo'] as const,
    RTK_DEMO: ['init', 'rtk-demo'] as const,
    ADMIN_USER: ['init', 'admin-user'] as const,
    STRESS_TEST: ['init', 'stress-test'] as const,
    ALL_DEMO: ['init', 'all-demo'] as const,
  } as const;
  
  constructor() {}
  
  /**
   * 初始化 RBAC 示例資料的 Mutation Hook
   */
  useInitRbacDemo() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationKey: this.INIT_QUERY_KEYS.RBAC_DEMO,
      mutationFn: async (): Promise<InitResponse> => {
        try {
          const response = await apiClient.post('/init/rbac-demo');
          const result = ReqResult.fromResponse<InitResponse>(response);
          
          if (result.isSuccess() && result.data) {
            logger.info('RBAC 示例資料初始化成功');
            return result.data;
          } else {
            throw new Error(result.message || 'Failed to initialize RBAC demo');
          }
        } catch (error: any) {
          logger.error('RBAC 示例資料初始化失敗:', error);
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to initialize RBAC demo',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        logger.info('✅ RBAC 示例資料初始化成功:', data.message);
        // 可以在這裡觸發相關數據的重新獲取
        queryClient.invalidateQueries({ queryKey: ['rbac'] });
      },
      onError: (error: TableError) => {
        logger.error('❌ RBAC 示例資料初始化失敗:', error.message);
        if (error.details) {
          logger.error('錯誤詳情:', error.details);
        }
      },
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 初始化 RTK 示例資料的 Mutation Hook
   */
  useInitRtkDemo() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationKey: this.INIT_QUERY_KEYS.RTK_DEMO,
      mutationFn: async (): Promise<InitResponse> => {
        try {
          const response = await apiClient.post('/init/rtk-demo');
          const result = ReqResult.fromResponse<InitResponse>(response);
          
          if (result.isSuccess() && result.data) {
            logger.info('RTK 示例資料初始化成功');
            return result.data;
          } else {
            throw new Error(result.message || 'Failed to initialize RTK demo');
          }
        } catch (error: any) {
          logger.error('RTK 示例資料初始化失敗:', error);
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to initialize RTK demo',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        logger.info('✅ RTK 示例資料初始化成功:', data.message);
        // 可以在這裡觸發相關數據的重新獲取
        queryClient.invalidateQueries({ queryKey: ['rtk'] });
      },
      onError: (error: TableError) => {
        logger.error('❌ RTK 示例資料初始化失敗:', error.message);
        if (error.details) {
          logger.error('錯誤詳情:', error.details);
        }
      },
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 創建管理員帳號的 Mutation Hook
   */
  useCreateAdminUser() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationKey: this.INIT_QUERY_KEYS.ADMIN_USER,
      mutationFn: async (): Promise<InitResponse> => {
        try {
          const response = await apiClient.post('/init/admin-user');
          const result = ReqResult.fromResponse<InitResponse>(response);
          
          if (result.isSuccess() && result.data) {
            logger.info('管理員帳號創建成功');
            return result.data;
          } else {
            throw new Error(result.message || 'Failed to create admin user');
          }
        } catch (error: any) {
          logger.error('管理員帳號創建失敗:', error);
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create admin user',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        logger.info('✅ 管理員帳號創建成功:', data.message);
        // 可以在這裡觸發用戶列表的重新獲取
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
      onError: (error: TableError) => {
        logger.error('❌ 管理員帳號創建失敗:', error.message);
        if (error.details) {
          logger.error('錯誤詳情:', error.details);
        }
      },
      retry: 1, // 創建用戶只重試一次
    });
  }

  /**
   * 創建壓力測試資料的 Mutation Hook
   */
  useCreateStressTestData() {
    return useMutation({
      mutationKey: this.INIT_QUERY_KEYS.STRESS_TEST,
      mutationFn: async (): Promise<StressTestResponse> => {
        try {
          const response = await apiClient.post('/init/stress-test-data');
          const result = ReqResult.fromResponse<StressTestResponse>(response);
          
          if (result.isSuccess() && result.data) {
            logger.info('壓力測試資料創建成功');
            return result.data;
          } else {
            throw new Error(result.message || 'Failed to create stress test data');
          }
        } catch (error: any) {
          logger.error('壓力測試資料創建失敗:', error);
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create stress test data',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        logger.info('✅ 壓力測試資料創建開始:', data.taskId);
        logger.info('📊 進度追蹤 URL:', data.progressUrl);
      },
      onError: (error: TableError) => {
        logger.error('❌ 壓力測試資料創建失敗:', error.message);
        if (error.details) {
          logger.error('錯誤詳情:', error.details);
        }
      },
      retry: 1, // 壓力測試只重試一次
    });
  }

  /**
   * 初始化所有示例資料的 Mutation Hook
   */
  useInitAllDemo() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationKey: this.INIT_QUERY_KEYS.ALL_DEMO,
      mutationFn: async (): Promise<InitAllDemoResponse> => {
        try {
          logger.info('開始初始化所有示例資料...');
          
          // Helper function for RBAC initialization
          const initRbacDemo = async (): Promise<InitResponse> => {
            const response = await apiClient.post('/init/rbac-demo');
            const result = ReqResult.fromResponse<InitResponse>(response);
            
            if (result.isSuccess() && result.data) {
              logger.info('RBAC 示例資料初始化成功');
              return result.data;
            } else {
              throw new Error(result.message || 'Failed to initialize RBAC demo');
            }
          };
          
          // Helper function for RTK initialization
          const initRtkDemo = async (): Promise<InitResponse> => {
            const response = await apiClient.post('/init/rtk-demo');
            const result = ReqResult.fromResponse<InitResponse>(response);
            
            if (result.isSuccess() && result.data) {
              logger.info('RTK 示例資料初始化成功');
              return result.data;
            } else {
              throw new Error(result.message || 'Failed to initialize RTK demo');
            }
          };
          
          // 並行執行 RBAC 和 RTK 示例資料初始化，提高效率
          const [rbacResult, rtkResult] = await Promise.all([
            initRbacDemo(),
            initRtkDemo()
          ]);

          logger.info('所有示例資料初始化完成');
          return {
            rbac: rbacResult,
            rtk: rtkResult
          };
        } catch (error: any) {
          logger.error('Failed to initialize all demo data:', error);
          const tableError: TableError = {
            message: 'Failed to initialize demo data',
            status: error.status,
            details: error,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        logger.info('🎉 所有示例資料初始化成功:');
        logger.info('  ✅ RBAC:', data.rbac.message);
        logger.info('  ✅ RTK:', data.rtk.message);
        
        // 觸發相關數據的重新獲取
        queryClient.invalidateQueries({ queryKey: ['rbac'] });
        queryClient.invalidateQueries({ queryKey: ['rtk'] });
      },
      onError: (error: TableError) => {
        logger.error('❌ 所有示例資料初始化失敗:', error.message);
        if (error.details) {
          logger.error('錯誤詳情:', error.details);
        }
      },
      retry: 1, // 批量初始化只重試一次
    });
  }

  /**
   * 主要初始化 Hook
   * 
   * 提供統一的初始化操作接口，包含所有初始化相關的功能
   */
  useInit() {
    const initRbacDemo = this.useInitRbacDemo();
    const initRtkDemo = this.useInitRtkDemo();
    const createAdminUser = this.useCreateAdminUser();
    const createStressTestData = this.useCreateStressTestData();
    const initAllDemo = this.useInitAllDemo();

    // 綜合載入狀態
    const isLoading = 
      initRbacDemo.isPending ||
      initRtkDemo.isPending ||
      createAdminUser.isPending ||
      createStressTestData.isPending ||
      initAllDemo.isPending;

    // 綜合錯誤狀態
    const error = 
      initRbacDemo.error ||
      initRtkDemo.error ||
      createAdminUser.error ||
      createStressTestData.error ||
      initAllDemo.error;

    return {
      // 狀態
      isLoading,
      error: error?.message || null,
      
      // 方法
      initRbacDemo: initRbacDemo.mutateAsync,
      initRtkDemo: initRtkDemo.mutateAsync,
      createAdminUser: createAdminUser.mutateAsync,
      createStressTestData: createStressTestData.mutateAsync,
      initAllDemo: initAllDemo.mutateAsync,
      
      // 原始的 mutation 對象 (用於更高級的操作)
      mutations: {
        initRbacDemo,
        initRtkDemo,
        createAdminUser,
        createStressTestData,
        initAllDemo,
      },
    };
  }
}

/**
 * 全局實例和便利 hooks
 */
export const initQuery = new InitQuery();
export const useInitQuery = () => initQuery;
export const useInitAllDemo = () => initQuery.useInitAllDemo();
export const useInitRbacDemo = () => initQuery.useInitRbacDemo();
export const useInitRtkDemo = () => initQuery.useInitRtkDemo();
export const useCreateAdminUser = () => initQuery.useCreateAdminUser();
export const useCreateStressTestData = () => initQuery.useCreateStressTestData();
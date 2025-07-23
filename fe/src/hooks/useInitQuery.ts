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
import type { InitResponse, StressTestResponse, InitAllDemoResponse, InitError } from '../types/init';

/**
 * React Query 查詢鍵
 */
export const INIT_QUERY_KEYS = {
  RBAC_DEMO: ['init', 'rbac-demo'] as const,
  RTK_DEMO: ['init', 'rtk-demo'] as const,
  ADMIN_USER: ['init', 'admin-user'] as const,
  STRESS_TEST: ['init', 'stress-test'] as const,
  ALL_DEMO: ['init', 'all-demo'] as const,
} as const;

/**
 * API 函數：初始化 RBAC 示例資料
 */
const initRbacDemoAPI = async (): Promise<InitResponse> => {
  try {
    const response = await apiClient.post<InitResponse>('/api/init/rbac-demo');
    return response;
  } catch (error: any) {
    console.error('Failed to initialize RBAC demo:', error);
    throw {
      message: error.response?.data?.message || 'Failed to initialize RBAC demo',
      status: error.response?.status,
      details: error.response?.data,
    } as InitError;
  }
};

/**
 * API 函數：初始化 RTK 示例資料
 */
const initRtkDemoAPI = async (): Promise<InitResponse> => {
  try {
    const response = await apiClient.post<InitResponse>('/api/init/rtk-demo');
    return response;
  } catch (error: any) {
    console.error('Failed to initialize RTK demo:', error);
    throw {
      message: error.response?.data?.message || 'Failed to initialize RTK demo',
      status: error.response?.status,
      details: error.response?.data,
    } as InitError;
  }
};

/**
 * API 函數：創建管理員帳號
 */
const createAdminUserAPI = async (): Promise<InitResponse> => {
  try {
    const response = await apiClient.post<InitResponse>('/api/init/admin-user');
    return response;
  } catch (error: any) {
    console.error('Failed to create admin user:', error);
    throw {
      message: error.response?.data?.message || 'Failed to create admin user',
      status: error.response?.status,
      details: error.response?.data,
    } as InitError;
  }
};

/**
 * API 函數：創建壓力測試資料
 */
const createStressTestDataAPI = async (): Promise<StressTestResponse> => {
  try {
    const response = await apiClient.post<StressTestResponse>('/api/init/stress-test-data');
    return response;
  } catch (error: any) {
    console.error('Failed to create stress test data:', error);
    throw {
      message: error.response?.data?.message || 'Failed to create stress test data',
      status: error.response?.status,
      details: error.response?.data,
    } as InitError;
  }
};

/**
 * API 函數：初始化所有示例資料
 */
const initAllDemoAPI = async (): Promise<InitAllDemoResponse> => {
  try {
    // 並行執行 RBAC 和 RTK 示例資料初始化，提高效率
    const [rbacResult, rtkResult] = await Promise.all([
      initRbacDemoAPI(),
      initRtkDemoAPI()
    ]);

    return {
      rbac: rbacResult,
      rtk: rtkResult
    };
  } catch (error: any) {
    console.error('Failed to initialize all demo data:', error);
    throw {
      message: 'Failed to initialize demo data',
      status: error.status,
      details: error,
    } as InitError;
  }
};

/**
 * 初始化 RBAC 示例資料的 Mutation Hook
 */
export const useInitRbacDemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: INIT_QUERY_KEYS.RBAC_DEMO,
    mutationFn: initRbacDemoAPI,
    onSuccess: (data) => {
      console.log('RBAC demo initialized successfully:', data.message);
      // 可以在這裡觸發相關數據的重新獲取
      queryClient.invalidateQueries({ queryKey: ['rbac'] });
    },
    onError: (error: InitError) => {
      console.error('RBAC demo initialization failed:', error.message);
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 初始化 RTK 示例資料的 Mutation Hook
 */
export const useInitRtkDemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: INIT_QUERY_KEYS.RTK_DEMO,
    mutationFn: initRtkDemoAPI,
    onSuccess: (data) => {
      console.log('RTK demo initialized successfully:', data.message);
      // 可以在這裡觸發相關數據的重新獲取
      queryClient.invalidateQueries({ queryKey: ['rtk'] });
    },
    onError: (error: InitError) => {
      console.error('RTK demo initialization failed:', error.message);
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 創建管理員帳號的 Mutation Hook
 */
export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: INIT_QUERY_KEYS.ADMIN_USER,
    mutationFn: createAdminUserAPI,
    onSuccess: (data) => {
      console.log('Admin user created successfully:', data.message);
      // 可以在這裡觸發用戶列表的重新獲取
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: InitError) => {
      console.error('Admin user creation failed:', error.message);
    },
    retry: 1, // 創建用戶只重試一次
  });
};

/**
 * 創建壓力測試資料的 Mutation Hook
 */
export const useCreateStressTestData = () => {
  return useMutation({
    mutationKey: INIT_QUERY_KEYS.STRESS_TEST,
    mutationFn: createStressTestDataAPI,
    onSuccess: (data) => {
      console.log('Stress test data creation started:', data.taskId);
      console.log('Progress URL:', data.progressUrl);
    },
    onError: (error: InitError) => {
      console.error('Stress test data creation failed:', error.message);
    },
    retry: 1, // 壓力測試只重試一次
  });
};

/**
 * 初始化所有示例資料的 Mutation Hook
 */
export const useInitAllDemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: INIT_QUERY_KEYS.ALL_DEMO,
    mutationFn: initAllDemoAPI,
    onSuccess: (data) => {
      console.log('All demo data initialized successfully:');
      console.log('RBAC:', data.rbac.message);
      console.log('RTK:', data.rtk.message);
      
      // 觸發相關數據的重新獲取
      queryClient.invalidateQueries({ queryKey: ['rbac'] });
      queryClient.invalidateQueries({ queryKey: ['rtk'] });
    },
    onError: (error: InitError) => {
      console.error('All demo data initialization failed:', error.message);
    },
    retry: 1, // 批量初始化只重試一次
  });
};

/**
 * 主要初始化 Hook
 * 
 * 提供統一的初始化操作接口，包含所有初始化相關的功能
 */
export const useInit = () => {
  const initRbacDemo = useInitRbacDemo();
  const initRtkDemo = useInitRtkDemo();
  const createAdminUser = useCreateAdminUser();
  const createStressTestData = useCreateStressTestData();
  const initAllDemo = useInitAllDemo();

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
};

/**
 * 導出 API 函數供其他模組使用
 */
export const initAPI = {
  initRbacDemo: initRbacDemoAPI,
  initRtkDemo: initRtkDemoAPI,
  createAdminUser: createAdminUserAPI,
  createStressTestData: createStressTestDataAPI,
  initAllDemo: initAllDemoAPI,
};
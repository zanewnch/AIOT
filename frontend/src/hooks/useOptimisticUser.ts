/**
 * @fileoverview 用戶操作樂觀更新 Hook
 * 
 * 提供用戶管理的樂觀更新功能，包括：
 * - 用戶編輯的樂觀更新
 * - 用戶角色分配的樂觀更新
 * - 用戶權限修改的樂觀更新
 * - 失敗時的自動回滾機制
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { createLogger } from '../configs/loggerConfig';
import type { User, UserUpdateRequest, UserRole, TableError } from '../types/table';

const logger = createLogger('useOptimisticUser');

/**
 * 樂觀更新的用戶狀態介面
 */
interface OptimisticUserState {
  /** 正在更新的用戶 */
  updatingUsers: Set<number>;
  /** 樂觀更新的數據 */
  optimisticData: Map<number, Partial<User>>;
  /** 操作歷史（用於回滾） */
  operationHistory: Map<number, User>;
}

/**
 * 用戶操作類型
 */
type UserOperationType = 
  | 'update_profile'
  | 'update_status'
  | 'assign_role'
  | 'remove_role'
  | 'update_permissions';

/**
 * 用戶操作請求介面
 */
interface UserOperationRequest {
  userId: number;
  type: UserOperationType;
  data: Partial<User | UserRole>;
  optimisticUpdate?: Partial<User>;
}

/**
 * 用戶操作樂觀更新 Hook
 * 
 * 提供用戶管理相關的樂觀更新功能
 * 
 * @returns 樂觀更新功能和狀態
 */
export const useOptimisticUser = () => {
  const queryClient = useQueryClient();

  // 樂觀更新狀態
  const [optimisticState, setOptimisticState] = useState<OptimisticUserState>({
    updatingUsers: new Set(),
    optimisticData: new Map(),
    operationHistory: new Map(),
  });

  /**
   * 用戶資料更新 Mutation
   */
  const userUpdateMutation = useMutation({
    mutationFn: async ({ userId, type, data }: UserOperationRequest) => {
      const endpoints = {
        update_profile: `/api/rbac/users/${userId}`,
        update_status: `/api/rbac/users/${userId}/status`,
        assign_role: `/api/rbac/users/${userId}/roles`,
        remove_role: `/api/rbac/users/${userId}/roles`,
        update_permissions: `/api/rbac/users/${userId}/permissions`,
      };

      const methods = {
        update_profile: 'PUT',
        update_status: 'PATCH',
        assign_role: 'POST',
        remove_role: 'DELETE',
        update_permissions: 'PUT',
      };

      const endpoint = endpoints[type];
      const method = methods[type];

      logger.info(`執行用戶操作 ${type}`, { userId, endpoint, data });

      if (method === 'POST') {
        await apiClient.postWithResult(endpoint, data);
      } else if (method === 'PUT') {
        await apiClient.putWithResult(endpoint, data);
      } else if (method === 'PATCH') {
        await apiClient.patchWithResult(endpoint, data);
      } else if (method === 'DELETE') {
        await apiClient.deleteWithResult(endpoint);
      }

      return { userId, type, data };
    },

    onMutate: async (variables) => {
      const { userId, optimisticUpdate } = variables;

      // 取消所有相關的查詢
      await queryClient.cancelQueries({ 
        queryKey: ['user', 'rbac'] 
      });
      
      await queryClient.cancelQueries({ 
        queryKey: ['user', 'roles'] 
      });

      // 獲取當前數據作為回滾備份
      const previousUsers = queryClient.getQueryData<User[]>(['user', 'rbac']);
      const previousUserRoles = queryClient.getQueryData<UserRole[]>(['user', 'roles']);

      if (optimisticUpdate && previousUsers) {
        // 保存原始數據用於回滾
        const originalUser = previousUsers.find(user => user.id === userId);
        if (originalUser) {
          setOptimisticState(prev => ({
            ...prev,
            operationHistory: new Map(prev.operationHistory).set(userId, originalUser),
            updatingUsers: new Set(prev.updatingUsers).add(userId),
            optimisticData: new Map(prev.optimisticData).set(userId, optimisticUpdate),
          }));
        }

        // 樂觀更新用戶列表
        const optimisticUsers = previousUsers.map(user => 
          user.id === userId 
            ? { ...user, ...optimisticUpdate }
            : user
        );

        queryClient.setQueryData(['user', 'rbac'], optimisticUsers);

        logger.info('樂觀更新用戶數據', { 
          userId, 
          optimisticUpdate,
          operation: variables.type 
        });
      }

      return { 
        previousUsers, 
        previousUserRoles, 
        userId: variables.userId,
        type: variables.type 
      };
    },

    onSuccess: (data, variables, context) => {
      const { userId, type } = variables;
      
      // 清除樂觀更新狀態
      setOptimisticState(prev => {
        const newUpdatingUsers = new Set(prev.updatingUsers);
        const newOptimisticData = new Map(prev.optimisticData);
        const newOperationHistory = new Map(prev.operationHistory);
        
        newUpdatingUsers.delete(userId);
        newOptimisticData.delete(userId);
        newOperationHistory.delete(userId);
        
        return {
          updatingUsers: newUpdatingUsers,
          optimisticData: newOptimisticData,
          operationHistory: newOperationHistory,
        };
      });

      // 重新獲取最新數據
      queryClient.invalidateQueries({ queryKey: ['user', 'rbac'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'roles'] });

      // 顯示成功通知
      const operationLabels = {
        update_profile: '更新用戶資料',
        update_status: '更新用戶狀態',
        assign_role: '分配用戶角色',
        remove_role: '移除用戶角色',
        update_permissions: '更新用戶權限',
      };

      
      logger.info('用戶操作成功完成', { 
        userId, 
        type,
        operation: 'success' 
      });
    },

    onError: (error: any, variables, context) => {
      const { userId, type } = variables;
      
      // 回滾樂觀更新
      if (context?.previousUsers) {
        queryClient.setQueryData(['user', 'rbac'], context.previousUsers);
      }
      if (context?.previousUserRoles) {
        queryClient.setQueryData(['user', 'roles'], context.previousUserRoles);
      }

      // 清除樂觀更新狀態
      setOptimisticState(prev => {
        const newUpdatingUsers = new Set(prev.updatingUsers);
        const newOptimisticData = new Map(prev.optimisticData);
        const newOperationHistory = new Map(prev.operationHistory);
        
        newUpdatingUsers.delete(userId);
        newOptimisticData.delete(userId);
        newOperationHistory.delete(userId);
        
        return {
          updatingUsers: newUpdatingUsers,
          optimisticData: newOptimisticData,
          operationHistory: newOperationHistory,
        };
      });

      const tableError = error as TableError;
      const errorMessage = tableError.message || 'Unknown error';
      
      
      logger.error('用戶操作失敗並已回滾', { 
        userId, 
        type,
        error: errorMessage,
        operation: 'rollback' 
      });
    },
  });

  /**
   * 執行用戶更新操作
   */
  const updateUser = useCallback(async (
    userId: number,
    updateData: Partial<User>,
    operationType: UserOperationType = 'update_profile'
  ) => {
    // 生成樂觀更新數據
    const optimisticUpdate: Partial<User> = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // 如果是狀態更新，添加視覺反饋
    if (operationType === 'update_status') {
    }

    return userUpdateMutation.mutateAsync({
      userId,
      type: operationType,
      data: updateData,
      optimisticUpdate,
    });
  }, [userUpdateMutation]);

  /**
   * 分配用戶角色
   */
  const assignUserRole = useCallback(async (
    userId: number,
    roleId: number,
    roleName?: string
  ) => {
    const optimisticUpdate: Partial<User> = {
      // 假設用戶對象有 roles 數組
      // roles: [...(existingRoles || []), { id: roleId, name: roleName }],
      updatedAt: new Date().toISOString(),
    };


    return userUpdateMutation.mutateAsync({
      userId,
      type: 'assign_role',
      data: { roleId },
      optimisticUpdate,
    });
  }, [userUpdateMutation]);

  /**
   * 移除用戶角色
   */
  const removeUserRole = useCallback(async (
    userId: number,
    roleId: number
  ) => {
    const optimisticUpdate: Partial<User> = {
      updatedAt: new Date().toISOString(),
    };


    return userUpdateMutation.mutateAsync({
      userId,
      type: 'remove_role',
      data: { roleId },
      optimisticUpdate,
    });
  }, [userUpdateMutation]);

  /**
   * 檢查用戶是否正在更新
   */
  const isUserUpdating = useCallback((userId: number) => {
    return optimisticState.updatingUsers.has(userId);
  }, [optimisticState.updatingUsers]);

  /**
   * 獲取用戶的樂觀更新數據
   */
  const getUserOptimisticData = useCallback((userId: number) => {
    return optimisticState.optimisticData.get(userId);
  }, [optimisticState.optimisticData]);

  /**
   * 批量操作多個用戶
   */
  const batchUpdateUsers = useCallback(async (
    operations: Array<{
      userId: number;
      updateData: Partial<User>;
      operationType?: UserOperationType;
    }>
  ) => {

    const promises = operations.map(({ userId, updateData, operationType }) =>
      updateUser(userId, updateData, operationType)
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error('批量用戶更新失敗', { error, operationsCount: operations.length });
      // 個別的錯誤處理已在 mutation 的 onError 中處理
    }
  }, [updateUser]);

  return {
    // 主要操作函數
    updateUser,
    assignUserRole,
    removeUserRole,
    batchUpdateUsers,

    // 狀態檢查
    isUserUpdating,
    getUserOptimisticData,
    isLoading: userUpdateMutation.isPending,
    
    // 樂觀更新狀態
    updatingUsers: Array.from(optimisticState.updatingUsers),
    optimisticDataCount: optimisticState.optimisticData.size,
    
    // Mutation 對象（用於高級控制）
    userUpdateMutation,
  };
};

/**
 * 快捷的用戶操作 Hook（簡化版）
 * 
 * 提供最常用的用戶操作功能
 */
export const useQuickUserActions = () => {
  const { updateUser, assignUserRole, removeUserRole, isUserUpdating } = useOptimisticUser();

  return {
    /**
     * 快速更新用戶狀態
     */
    toggleUserStatus: async (userId: number, currentStatus: boolean) => {
      return updateUser(userId, { 
        is_active: !currentStatus 
      }, 'update_status');
    },

    /**
     * 快速更新用戶資料
     */
    updateProfile: async (userId: number, profileData: Partial<User>) => {
      return updateUser(userId, profileData, 'update_profile');
    },

    /**
     * 快速角色操作
     */
    assignRole: assignUserRole,
    removeRole: removeUserRole,

    /**
     * 狀態檢查
     */
    isUpdating: isUserUpdating,
  };
};
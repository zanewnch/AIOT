/**
 * @fileoverview RBAC 樂觀更新 Hook
 * 
 * 提供角色、權限和用戶角色分配的樂觀更新功能，包括：
 * - 角色管理的樂觀更新
 * - 權限分配的樂觀更新
 * - 用戶角色關聯的樂觀更新
 * - 批量操作的樂觀更新
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
import type { 
  Role, 
  Permission, 
  UserRole, 
  RolePermission,
  TableError 
} from '../types/table';

const logger = createLogger('useOptimisticRBAC');

/**
 * RBAC 操作類型
 * 
 * @typedef {string} RBACOperationType
 * @description 定義 RBAC 系統支持的各種操作類型
 */
type RBACOperationType = 
  | 'update_role'
  | 'update_permission'
  | 'assign_permission_to_role'
  | 'remove_permission_from_role'
  | 'assign_role_to_user'
  | 'remove_role_from_user';

/**
 * 樂觀更新狀態介面
 * 
 * @interface OptimisticRBACState
 * @description 追蹤 RBAC 樂觀更新狀態的數據結構
 */
interface OptimisticRBACState {
  /** 正在更新的項目 */
  updatingItems: {
    roles: Set<number>;
    permissions: Set<number>;
    userRoles: Set<string>; // userId-roleId 組合
    rolePermissions: Set<string>; // roleId-permissionId 組合
  };
  /** 樂觀更新的數據 */
  optimisticData: {
    roles: Map<number, Partial<Role>>;
    permissions: Map<number, Partial<Permission>>;
    userRoles: Map<string, Partial<UserRole>>;
    rolePermissions: Map<string, Partial<RolePermission>>;
  };
}

/**
 * RBAC 操作請求介面
 * 
 * @interface RBACOperationRequest
 * @description 定義 RBAC 操作請求的數據結構
 */
interface RBACOperationRequest {
  type: RBACOperationType;
  entityId: number | string;
  data: any;
  optimisticUpdate?: any;
}

/**
 * RBAC 樂觀更新 Hook
 * 
 * @description 提供角色基礎存取控制的樂觀更新功能，包括角色、權限、用戶角色分配等操作
 * @returns 包含樂觀更新函數、狀態檢查、統計資訊的物件
 * 
 * @example
 * ```typescript
 * const {
 *   updateRole,
 *   updatePermission,
 *   assignPermissionToRole,
 *   isRoleUpdating,
 *   isLoading
 * } = useOptimisticRBAC();
 * 
 * // 更新角色
 * await updateRole(1, { name: '新角色名稱', description: '更新描述' });
 * 
 * // 檢查是否正在更新
 * if (isRoleUpdating(1)) {
 *   console.log('角色正在更新中');
 * }
 * ```
 */
export const useOptimisticRBAC = () => {
  const queryClient = useQueryClient();

  // 樂觀更新狀態
  const [optimisticState, setOptimisticState] = useState<OptimisticRBACState>({
    updatingItems: {
      roles: new Set(),
      permissions: new Set(),
      userRoles: new Set(),
      rolePermissions: new Set(),
    },
    optimisticData: {
      roles: new Map(),
      permissions: new Map(),
      userRoles: new Map(),
      rolePermissions: new Map(),
    },
  });

  /**
   * RBAC 操作 Mutation
   * 
   * @description 處理所有 RBAC 相關操作的主要 mutation，包含樂觀更新和錯誤回滾機制
   */
  const rbacMutation = useMutation({
    mutationFn: async ({ type, entityId, data }: RBACOperationRequest) => {
      const endpoints = {
        update_role: `/api/rbac/roles/${entityId}`,
        update_permission: `/api/rbac/permissions/${entityId}`,
        assign_permission_to_role: `/api/rbac/roles/${entityId}/permissions`,
        remove_permission_from_role: `/api/rbac/roles/${entityId}/permissions/${data.permissionId}`,
        assign_role_to_user: `/api/rbac/users/${entityId}/roles`,
        remove_role_from_user: `/api/rbac/users/${entityId}/roles/${data.roleId}`,
      };

      const methods = {
        update_role: 'PUT',
        update_permission: 'PUT',
        assign_permission_to_role: 'POST',
        remove_permission_from_role: 'DELETE',
        assign_role_to_user: 'POST',
        remove_role_from_user: 'DELETE',
      };

      const endpoint = endpoints[type];
      const method = methods[type];

      logger.info(`執行 RBAC 操作 ${type}`, { entityId, endpoint, data });

      if (method === 'POST') {
        await apiClient.postWithResult(endpoint, data);
      } else if (method === 'PUT') {
        await apiClient.putWithResult(endpoint, data);
      } else if (method === 'DELETE') {
        await apiClient.deleteWithResult(endpoint);
      }

      return { type, entityId, data };
    },

    onMutate: async (variables) => {
      const { type, entityId, optimisticUpdate } = variables;

      // 根據操作類型取消相關查詢
      const queryKeys = {
        update_role: ['role', 'list'],
        update_permission: ['permission', 'list'],
        assign_permission_to_role: ['role', 'list', 'rolePermissions'],
        remove_permission_from_role: ['role', 'list', 'rolePermissions'],
        assign_role_to_user: ['user', 'roles', 'userRoles'],
        remove_role_from_user: ['user', 'roles', 'userRoles'],
      };

      for (const key of queryKeys[type] || []) {
        await queryClient.cancelQueries({ queryKey: [key] });
      }

      // 獲取當前數據作為回滾備份
      let previousData: any = {};
      
      if (type.includes('role') && !type.includes('user')) {
        previousData.roles = queryClient.getQueryData(['role', 'list']);
      }
      if (type.includes('permission')) {
        previousData.permissions = queryClient.getQueryData(['permission', 'list']);
      }
      if (type.includes('user')) {
        previousData.userRoles = queryClient.getQueryData(['user', 'roles']);
      }

      // 執行樂觀更新
      if (optimisticUpdate) {
        setOptimisticState(prev => {
          const newState = { ...prev };
          
          if (type === 'update_role') {
            newState.updatingItems.roles.add(entityId as number);
            newState.optimisticData.roles.set(entityId as number, optimisticUpdate);
            
            // 更新查詢緩存
            const currentRoles = queryClient.getQueryData<Role[]>(['role', 'list']);
            if (currentRoles) {
              const optimisticRoles = currentRoles.map(role => 
                role.id === entityId ? { ...role, ...optimisticUpdate } : role
              );
              queryClient.setQueryData(['role', 'list'], optimisticRoles);
            }
          } else if (type === 'update_permission') {
            newState.updatingItems.permissions.add(entityId as number);
            newState.optimisticData.permissions.set(entityId as number, optimisticUpdate);
            
            // 更新查詢緩存
            const currentPermissions = queryClient.getQueryData<Permission[]>(['permission', 'list']);
            if (currentPermissions) {
              const optimisticPermissions = currentPermissions.map(permission => 
                permission.id === entityId ? { ...permission, ...optimisticUpdate } : permission
              );
              queryClient.setQueryData(['permission', 'list'], optimisticPermissions);
            }
          }
          
          return newState;
        });

        logger.info('樂觀更新 RBAC 數據', { 
          type, 
          entityId, 
          optimisticUpdate,
          operation: 'optimistic_update' 
        });
      }

      return { previousData, type, entityId };
    },

    onSuccess: (data, variables, context) => {
      const { type, entityId } = variables;
      
      // 清除樂觀更新狀態
      setOptimisticState(prev => {
        const newState = { ...prev };
        
        if (type === 'update_role') {
          newState.updatingItems.roles.delete(entityId as number);
          newState.optimisticData.roles.delete(entityId as number);
        } else if (type === 'update_permission') {
          newState.updatingItems.permissions.delete(entityId as number);
          newState.optimisticData.permissions.delete(entityId as number);
        }
        
        return newState;
      });

      // 重新獲取最新數據
      queryClient.invalidateQueries({ queryKey: ['role'] });
      queryClient.invalidateQueries({ queryKey: ['permission'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'roles'] });

      // 顯示成功通知
      const operationLabels = {
        update_role: '更新角色',
        update_permission: '更新權限',
        assign_permission_to_role: '分配權限給角色',
        remove_permission_from_role: '移除角色權限',
        assign_role_to_user: '分配角色給用戶',
        remove_role_from_user: '移除用戶角色',
      };

      
      logger.info('RBAC 操作成功完成', { 
        type, 
        entityId,
        operation: 'success' 
      });
    },

    onError: (error: any, variables, context) => {
      const { type, entityId } = variables;
      
      // 回滾樂觀更新
      if (context?.previousData) {
        if (context.previousData.roles) {
          queryClient.setQueryData(['role', 'list'], context.previousData.roles);
        }
        if (context.previousData.permissions) {
          queryClient.setQueryData(['permission', 'list'], context.previousData.permissions);
        }
        if (context.previousData.userRoles) {
          queryClient.setQueryData(['user', 'roles'], context.previousData.userRoles);
        }
      }

      // 清除樂觀更新狀態
      setOptimisticState(prev => {
        const newState = { ...prev };
        
        if (type === 'update_role') {
          newState.updatingItems.roles.delete(entityId as number);
          newState.optimisticData.roles.delete(entityId as number);
        } else if (type === 'update_permission') {
          newState.updatingItems.permissions.delete(entityId as number);
          newState.optimisticData.permissions.delete(entityId as number);
        }
        
        return newState;
      });

      const tableError = error as TableError;
      const errorMessage = tableError.message || 'Unknown error';
      
      
      logger.error('RBAC 操作失敗並已回滾', { 
        type, 
        entityId,
        error: errorMessage,
        operation: 'rollback' 
      });
    },
  });

  /**
   * 更新角色
   * 
   * @description 樂觀更新指定角色的資訊
   * @param roleId - 角色 ID
   * @param updateData - 要更新的角色資料部分
   * @returns Promise，解析為更新操作的結果
   * 
   * @example
   * ```typescript
   * await updateRole(1, {
   *   name: '管理員',
   *   description: '系統管理員角色',
   *   is_active: true
   * });
   * ```
   */
  const updateRole = useCallback(async (
    roleId: number,
    updateData: Partial<Role>
  ) => {
    const optimisticUpdate: Partial<Role> = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return rbacMutation.mutateAsync({
      type: 'update_role',
      entityId: roleId,
      data: updateData,
      optimisticUpdate,
    });
  }, [rbacMutation]);

  /**
   * 更新權限
   * 
   * @description 樂觀更新指定權限的資訊
   * @param permissionId - 權限 ID
   * @param updateData - 要更新的權限資料部分
   * @returns Promise，解析為更新操作的結果
   * 
   * @example
   * ```typescript
   * await updatePermission(1, {
   *   name: 'create_user',
   *   description: '創建用戶權限',
   *   is_active: true
   * });
   * ```
   */
  const updatePermission = useCallback(async (
    permissionId: number,
    updateData: Partial<Permission>
  ) => {
    const optimisticUpdate: Partial<Permission> = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return rbacMutation.mutateAsync({
      type: 'update_permission',
      entityId: permissionId,
      data: updateData,
      optimisticUpdate,
    });
  }, [rbacMutation]);

  /**
   * 分配權限給角色
   * 
   * @description 將指定權限分配給指定角色
   * @param roleId - 角色 ID
   * @param permissionId - 權限 ID
   * @returns Promise，解析為分配操作的結果
   * 
   * @example
   * ```typescript
   * await assignPermissionToRole(1, 5);
   * ```
   */
  const assignPermissionToRole = useCallback(async (
    roleId: number,
    permissionId: number
  ) => {

    return rbacMutation.mutateAsync({
      type: 'assign_permission_to_role',
      entityId: roleId,
      data: { permissionId },
    });
  }, [rbacMutation]);

  /**
   * 檢查角色是否正在更新
   * 
   * @description 檢查指定角色是否正在執行樂觀更新
   * @param roleId - 角色 ID
   * @returns 是否正在更新中
   * 
   * @example
   * ```typescript
   * if (isRoleUpdating(1)) {
   *   console.log('角色 1 正在更新中');
   * }
   * ```
   */
  const isRoleUpdating = useCallback((roleId: number) => {
    return optimisticState.updatingItems.roles.has(roleId);
  }, [optimisticState.updatingItems.roles]);

  /**
   * 檢查權限是否正在更新
   * 
   * @description 檢查指定權限是否正在執行樂觀更新
   * @param permissionId - 權限 ID
   * @returns 是否正在更新中
   * 
   * @example
   * ```typescript
   * if (isPermissionUpdating(5)) {
   *   console.log('權限 5 正在更新中');
   * }
   * ```
   */
  const isPermissionUpdating = useCallback((permissionId: number) => {
    return optimisticState.updatingItems.permissions.has(permissionId);
  }, [optimisticState.updatingItems.permissions]);

  /**
   * 獲取角色樂觀更新數據
   * 
   * @description 獲取指定角色的樂觀更新數據
   * @param roleId - 角色 ID
   * @returns 樂觀更新的角色資料，可能為 undefined
   * 
   * @example
   * ```typescript
   * const optimisticData = getRoleOptimisticData(1);
   * if (optimisticData) {
   *   console.log('樂觀更新的角色資料:', optimisticData);
   * }
   * ```
   */
  const getRoleOptimisticData = useCallback((roleId: number) => {
    return optimisticState.optimisticData.roles.get(roleId);
  }, [optimisticState.optimisticData.roles]);

  /**
   * 獲取權限樂觀更新數據
   * 
   * @description 獲取指定權限的樂觀更新數據
   * @param permissionId - 權限 ID
   * @returns 樂觀更新的權限資料，可能為 undefined
   * 
   * @example
   * ```typescript
   * const optimisticData = getPermissionOptimisticData(5);
   * if (optimisticData) {
   *   console.log('樂觀更新的權限資料:', optimisticData);
   * }
   * ```
   */
  const getPermissionOptimisticData = useCallback((permissionId: number) => {
    return optimisticState.optimisticData.permissions.get(permissionId);
  }, [optimisticState.optimisticData.permissions]);

  return {
    // 主要操作函數
    updateRole,
    updatePermission,
    assignPermissionToRole,

    // 狀態檢查
    isRoleUpdating,
    isPermissionUpdating,
    getRoleOptimisticData,
    getPermissionOptimisticData,
    
    // 通用狀態
    isLoading: rbacMutation.isPending,
    
    // 樂觀更新統計
    updatingRolesCount: optimisticState.updatingItems.roles.size,
    updatingPermissionsCount: optimisticState.updatingItems.permissions.size,
    
    // Mutation 對象（用於高級控制）
    rbacMutation,
  };
};

/**
 * 快捷的角色操作 Hook（簡化版）
 * 
 * @description 提供常用角色操作的快捷方法，封裝了最常用的角色更新操作
 * @returns 包含快捷操作函數和狀態檢查的物件
 * 
 * @example
 * ```typescript
 * const { toggleRoleStatus, updateRoleProfile, isUpdating } = useQuickRoleActions();
 * 
 * // 切換角色狀態
 * await toggleRoleStatus(1, true);
 * 
 * // 更新角色資料
 * await updateRoleProfile(1, { name: '新名稱' });
 * ```
 */
export const useQuickRoleActions = () => {
  const { updateRole, isRoleUpdating } = useOptimisticRBAC();

  return {
    /**
     * 快速更新角色狀態
     * 
     * @description 切換角色的啟用/停用狀態
     * @param roleId - 角色 ID
     * @param currentStatus - 當前狀態
     * @returns Promise，解析為更新結果
     */
    toggleRoleStatus: async (roleId: number, currentStatus: boolean) => {
      return updateRole(roleId, { 
        is_active: !currentStatus 
      });
    },

    /**
     * 快速更新角色資料
     * 
     * @description 更新角色的基本資訊
     * @param roleId - 角色 ID
     * @param profileData - 要更新的資料
     * @returns Promise，解析為更新結果
     */
    updateRoleProfile: async (roleId: number, profileData: Partial<Role>) => {
      return updateRole(roleId, profileData);
    },

    /**
     * 狀態檢查
     * 
     * @description 檢查角色是否正在更新中
     */
    isUpdating: isRoleUpdating,
  };
};

/**
 * 快捷的權限操作 Hook（簡化版）
 * 
 * @description 提供常用權限操作的快捷方法，封裝了最常用的權限更新操作
 * @returns 包含快捷操作函數和狀態檢查的物件
 * 
 * @example
 * ```typescript
 * const { togglePermissionStatus, updatePermissionProfile, isUpdating } = useQuickPermissionActions();
 * 
 * // 切換權限狀態
 * await togglePermissionStatus(1, true);
 * 
 * // 更新權限資料
 * await updatePermissionProfile(1, { name: 'new_permission' });
 * ```
 */
export const useQuickPermissionActions = () => {
  const { updatePermission, isPermissionUpdating } = useOptimisticRBAC();

  return {
    /**
     * 快速更新權限狀態
     * 
     * @description 切換權限的啟用/停用狀態
     * @param permissionId - 權限 ID
     * @param currentStatus - 當前狀態
     * @returns Promise，解析為更新結果
     */
    togglePermissionStatus: async (permissionId: number, currentStatus: boolean) => {
      return updatePermission(permissionId, { 
        is_active: !currentStatus 
      });
    },

    /**
     * 快速更新權限資料
     * 
     * @description 更新權限的基本資訊
     * @param permissionId - 權限 ID
     * @param profileData - 要更新的資料
     * @returns Promise，解析為更新結果
     */
    updatePermissionProfile: async (permissionId: number, profileData: Partial<Permission>) => {
      return updatePermission(permissionId, profileData);
    },

    /**
     * 狀態檢查
     * 
     * @description 檢查權限是否正在更新中
     */
    isUpdating: isPermissionUpdating,
  };
};
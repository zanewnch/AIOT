import { apiClient } from '../utils/RequestUtils';

interface Role {
  id: number;
  name: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface RTKData {
  id: number;
  longitude: number;
  latitude: number;
  altitude: number;
  timestamp: string;
}


export class TableService {
  /**
   * 取得 RBAC 角色列表
   * GET /api/rbac/roles
   */
  static async getRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>('/api/rbac/roles');
      return response;
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch roles');
    }
  }

  /**
   * 取得 RBAC 權限列表
   * GET /api/rbac/permissions
   */
  static async getPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<Permission[]>('/api/rbac/permissions');
      return response;
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }

  /**
   * 取得角色權限列表
   * GET /api/rbac/roles/{roleId}/permissions
   */
  static async getRoleToPermission(roleId: number): Promise<Permission[]> {
    try {
      const response = await apiClient.get<Permission[]>(`/api/rbac/roles/${roleId}/permissions`);
      return response;
    } catch (error: any) {
      console.error(`Failed to fetch permissions for role ${roleId}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch permissions for role ${roleId}`);
    }
  }

  /**
   * 取得 RBAC 使用者列表
   * GET /api/rbac/users
   */
  static async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/api/rbac/users');
      return response;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  /**
   * 取得使用者角色列表
   * GET /api/rbac/users/{userId}/roles
   */
  static async getUserToRole(userId: number): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>(`/api/rbac/users/${userId}/roles`);
      return response;
    } catch (error: any) {
      console.error(`Failed to fetch roles for user ${userId}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch roles for user ${userId}`);
    }
  }

  /**
   * 取得 RTK 定位資料
   * GET /api/rtk/data
   */
  static async getRTKData(): Promise<RTKData[]> {
    try {
      const response = await apiClient.get<RTKData[]>('/api/rtk/data');
      return response;
    } catch (error: any) {
      console.error('Failed to fetch RTK data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch RTK data');
    }
  }

  // 統一的 table 資料獲取方法
  static async getTableData(tableType: string, id?: number): Promise<any[]> {
    switch (tableType) {
      case 'permission':
        return this.getPermissions();
      case 'role':
        return this.getRoles();
      case 'roletopermission':
        if (!id) throw new Error('Role ID is required for role-to-permission data');
        return this.getRoleToPermission(id);
      case 'user':
        return this.getUsers();
      case 'usertorole':
        if (!id) throw new Error('User ID is required for user-to-role data');
        return this.getUserToRole(id);
      case 'RTK':
        return this.getRTKData();
      default:
        throw new Error(`Unknown table type: ${tableType}`);
    }
  }
}
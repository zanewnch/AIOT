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

interface RTKResponse {
  ok: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
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
   * 取得表格資料
   */
  static async getRTKData(endpoint: string): Promise<RTKResponse> {
    try {
      const response = await apiClient.get<RTKResponse>(endpoint);
      return response;
    } catch (error: any) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch data from ${endpoint}`);
    }
  }
}
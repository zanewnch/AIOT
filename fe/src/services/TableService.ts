import { apiClient } from '../utils/RequestUtils';

// 通知回調類型
type NotificationCallback = (type: 'success' | 'error', message: string) => void;

export interface Role {
  id: number;
  name: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleToPermission {
  roleId: number;
  permissionId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserToRole {
  userId: number;
  roleId: number;
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
  private static notifyCallback?: NotificationCallback;

  // 設定通知回調
  static setNotificationCallback(callback: NotificationCallback) {
    this.notifyCallback = callback;
  }

  // 發送通知
  private static notify(type: 'success' | 'error', message: string) {
    if (this.notifyCallback) {
      this.notifyCallback(type, message);
    }
  }

  /**
   * 取得 RBAC 角色列表
   * GET /api/rbac/roles
   */
  static async getRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>('/api/rbac/roles');
      this.notify('success', `成功獲取 ${response.length} 個角色資料`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      this.notify('error', `獲取角色資料失敗: ${errorMsg}`);
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
      this.notify('success', `成功獲取 ${response.length} 個權限資料`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      this.notify('error', `獲取權限資料失敗: ${errorMsg}`);
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
      this.notify('success', `成功獲取角色權限關聯資料`);
      return response;
    } catch (error: any) {
      console.error(`Failed to fetch permissions for role ${roleId}:`, error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      this.notify('error', `獲取角色權限關聯資料失敗: ${errorMsg}`);
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
      this.notify('success', `成功獲取 ${response.length} 個用戶資料`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      this.notify('error', `獲取用戶資料失敗: ${errorMsg}`);
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
      this.notify('success', `成功獲取用戶角色關聯資料`);
      return response;
    } catch (error: any) {
      console.error(`Failed to fetch roles for user ${userId}:`, error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      this.notify('error', `獲取用戶角色關聯資料失敗: ${errorMsg}`);
      throw new Error(error.response?.data?.message || `Failed to fetch roles for user ${userId}`);
    }
  }

  /**
   * 取得 RTK 定位資料
   * GET /api/rtk/data
   */
  static async getRTKData(): Promise<RTKData[]> {
    try {
      console.log('🚀 TableService: Requesting RTK data from /api/rtk/data');
      const response = await apiClient.get<RTKData[]>('/api/rtk/data');
      console.log('📡 TableService: Received RTK data response:', response);
      console.log('📡 TableService: Response length:', response.length);
      this.notify('success', `成功獲取 ${response.length} 筆 RTK 定位資料`);
      return response;
    } catch (error: any) {
      console.error('❌ TableService: Failed to fetch RTK data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Connection failed';
      this.notify('error', `獲取 RTK 定位資料失敗: ${errorMsg}`);
      throw new Error(error.response?.data?.message || 'Failed to fetch RTK data');
    }
  }

  /**
   * 更新 RTK 定位資料
   * PUT /api/rtk/data/:id
   */
  static async updateRTKData(id: number, data: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      console.log(`🔄 TableService: Updating RTK data with ID: ${id}`, data);
      const response = await apiClient.put(`/api/rtk/data/${id}`, data);
      console.log('✅ TableService: RTK data updated successfully:', response);
      this.notify('success', '成功更新 RTK 定位資料');
      return response;
    } catch (error: any) {
      console.error('❌ TableService: Failed to update RTK data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      this.notify('error', `更新 RTK 定位資料失敗: ${errorMsg}`);
      return {
        success: false,
        message: errorMsg
      };
    }
  }

  /**
   * 更新權限資料
   * PUT /api/rbac/permissions/:id
   */
  static async updatePermission(id: number, data: {
    name: string;
    description: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await apiClient.put(`/api/rbac/permissions/${id}`, data);
      this.notify('success', '成功更新權限資料');
      return { success: true, data: response };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      this.notify('error', `更新權限資料失敗: ${errorMsg}`);
      return { success: false, message: errorMsg };
    }
  }

  /**
   * 更新角色資料
   * PUT /api/rbac/roles/:id
   */
  static async updateRole(id: number, data: {
    name: string;
    displayName: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await apiClient.put(`/api/rbac/roles/${id}`, data);
      this.notify('success', '成功更新角色資料');
      return { success: true, data: response };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      this.notify('error', `更新角色資料失敗: ${errorMsg}`);
      return { success: false, message: errorMsg };
    }
  }

  /**
   * 更新用戶資料
   * PUT /api/rbac/users/:id
   */
  static async updateUser(id: number, data: {
    username: string;
    email: string;
    passwordHash?: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await apiClient.put(`/api/rbac/users/${id}`, data);
      this.notify('success', '成功更新用戶資料');
      return { success: true, data: response };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      this.notify('error', `更新用戶資料失敗: ${errorMsg}`);
      return { success: false, message: errorMsg };
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
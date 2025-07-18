/**
 * @fileoverview 表格服務模組
 * 
 * 提供各種表格資料的 CRUD 操作，包括 RBAC 權限管理和 RTK 定位資料。
 * 支援通知回調機制，統一處理 API 請求的成功和錯誤狀態。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// 匯入 API 客戶端工具
import { apiClient } from '../utils/RequestUtils';

/**
 * 通知回調類型定義
 * 
 * @typedef {Function} NotificationCallback
 * @param {'success' | 'error'} type - 通知類型
 * @param {string} message - 通知訊息
 */
type NotificationCallback = (type: 'success' | 'error', message: string) => void;

/**
 * 角色介面
 * 
 * @interface Role
 * @description 定義系統角色的資料結構
 */
export interface Role {
  /** 角色 ID */
  id: number;
  /** 角色名稱 */
  name: string;
  /** 角色顯示名稱 */
  displayName: string;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/**
 * 權限介面
 * 
 * @interface Permission
 * @description 定義系統權限的資料結構
 */
export interface Permission {
  /** 權限 ID */
  id: number;
  /** 權限名稱 */
  name: string;
  /** 權限描述 */
  description: string;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/**
 * 使用者介面
 * 
 * @interface User
 * @description 定義系統使用者的資料結構
 */
export interface User {
  /** 使用者 ID */
  id: number;
  /** 使用者名稱 */
  username: string;
  /** 電子郵件 */
  email: string;
  /** 密碼雜湊值 */
  passwordHash: string;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/**
 * 角色權限關聯介面
 * 
 * @interface RoleToPermission
 * @description 定義角色與權限的關聯關係
 */
export interface RoleToPermission {
  /** 角色 ID */
  roleId: number;
  /** 權限 ID */
  permissionId: number;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/**
 * 使用者角色關聯介面
 * 
 * @interface UserToRole
 * @description 定義使用者與角色的關聯關係
 */
export interface UserToRole {
  /** 使用者 ID */
  userId: number;
  /** 角色 ID */
  roleId: number;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/**
 * RTK 定位資料介面
 * 
 * @interface RTKData
 * @description 定義 RTK 定位系統的資料結構
 */
interface RTKData {
  /** 資料 ID */
  id: number;
  /** 經度 */
  longitude: number;
  /** 緯度 */
  latitude: number;
  /** 海拔高度 */
  altitude: number;
  /** 時間戳記 */
  timestamp: string;
}


/**
 * 表格服務類別
 * 
 * @class TableService
 * @description 提供各種表格資料的 CRUD 操作，包括 RBAC 權限管理和 RTK 定位資料
 * @example
 * ```typescript
 * // 設定通知回調
 * TableService.setNotificationCallback((type, message) => {
 *   console.log(`${type}: ${message}`);
 * });
 * 
 * // 獲取角色列表
 * const roles = await TableService.getRoles();
 * ```
 */
export class TableService {
  /** 通知回調函數，用於處理成功和錯誤訊息 */
  private static notifyCallback?: NotificationCallback;

  /**
   * 設定通知回調函數
   * 
   * @method setNotificationCallback
   * @param {NotificationCallback} callback - 通知回調函數
   * @description 設定用於處理 API 請求結果通知的回調函數
   * @static
   */
  static setNotificationCallback(callback: NotificationCallback) {
    // 儲存通知回調函數供後續使用
    this.notifyCallback = callback;
  }

  /**
   * 發送通知
   * 
   * @method notify
   * @param {'success' | 'error'} type - 通知類型
   * @param {string} message - 通知訊息
   * @description 透過已設定的回調函數發送通知
   * @private
   * @static
   */
  private static notify(type: 'success' | 'error', message: string) {
    // 如果已設定通知回調函數，則呼叫它
    if (this.notifyCallback) {
      this.notifyCallback(type, message);
    }
  }

  /**
   * 取得 RBAC 角色列表
   * 
   * @method getRoles
   * @returns {Promise<Role[]>} 角色列表
   * @description 從後端 API 獲取系統中所有角色的資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * const roles = await TableService.getRoles();
   * console.log(roles); // 角色列表
   * ```
   */
  static async getRoles(): Promise<Role[]> {
    try {
      // 發送 GET 請求到 /api/rbac/roles 端點
      const response = await apiClient.get<Role[]>('/api/rbac/roles');
      // 發送成功通知，顯示獲取的角色數量
      this.notify('success', `成功獲取 ${response.length} 個角色資料`);
      return response; // 回傳角色列表
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to fetch roles:', error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      // 發送錯誤通知
      this.notify('error', `獲取角色資料失敗: ${errorMsg}`);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to fetch roles');
    }
  }

  /**
   * 取得 RBAC 權限列表
   * 
   * @method getPermissions
   * @returns {Promise<Permission[]>} 權限列表
   * @description 從後端 API 獲取系統中所有權限的資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * const permissions = await TableService.getPermissions();
   * console.log(permissions); // 權限列表
   * ```
   */
  static async getPermissions(): Promise<Permission[]> {
    try {
      // 發送 GET 請求到 /api/rbac/permissions 端點
      const response = await apiClient.get<Permission[]>('/api/rbac/permissions');
      // 發送成功通知，顯示獲取的權限數量
      this.notify('success', `成功獲取 ${response.length} 個權限資料`);
      return response; // 回傳權限列表
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to fetch permissions:', error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      // 發送錯誤通知
      this.notify('error', `獲取權限資料失敗: ${errorMsg}`);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }

  /**
   * 取得角色權限列表
   * 
   * @method getRoleToPermission
   * @param {number} roleId - 角色 ID
   * @returns {Promise<Permission[]>} 該角色擁有的權限列表
   * @description 從後端 API 獲取指定角色的權限資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * const permissions = await TableService.getRoleToPermission(1);
   * console.log(permissions); // 角色 ID 1 的權限列表
   * ```
   */
  static async getRoleToPermission(roleId: number): Promise<Permission[]> {
    try {
      // 發送 GET 請求到 /api/rbac/roles/{roleId}/permissions 端點
      const response = await apiClient.get<Permission[]>(`/api/rbac/roles/${roleId}/permissions`);
      // 發送成功通知
      this.notify('success', `成功獲取角色權限關聯資料`);
      return response; // 回傳權限列表
    } catch (error: any) {
      // 記錄錯誤到控制台，包含角色 ID 資訊
      console.error(`Failed to fetch permissions for role ${roleId}:`, error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      // 發送錯誤通知
      this.notify('error', `獲取角色權限關聯資料失敗: ${errorMsg}`);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || `Failed to fetch permissions for role ${roleId}`);
    }
  }

  /**
   * 取得 RBAC 使用者列表
   * 
   * @method getUsers
   * @returns {Promise<User[]>} 使用者列表
   * @description 從後端 API 獲取系統中所有使用者的資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * const users = await TableService.getUsers();
   * console.log(users); // 使用者列表
   * ```
   */
  static async getUsers(): Promise<User[]> {
    try {
      // 發送 GET 請求到 /api/rbac/users 端點
      const response = await apiClient.get<User[]>('/api/rbac/users');
      // 發送成功通知，顯示獲取的使用者數量
      this.notify('success', `成功獲取 ${response.length} 個用戶資料`);
      return response; // 回傳使用者列表
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to fetch users:', error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      // 發送錯誤通知
      this.notify('error', `獲取用戶資料失敗: ${errorMsg}`);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  /**
   * 取得使用者角色列表
   * 
   * @method getUserToRole
   * @param {number} userId - 使用者 ID
   * @returns {Promise<Role[]>} 該使用者擁有的角色列表
   * @description 從後端 API 獲取指定使用者的角色資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * const roles = await TableService.getUserToRole(1);
   * console.log(roles); // 使用者 ID 1 的角色列表
   * ```
   */
  static async getUserToRole(userId: number): Promise<Role[]> {
    try {
      // 發送 GET 請求到 /api/rbac/users/{userId}/roles 端點
      const response = await apiClient.get<Role[]>(`/api/rbac/users/${userId}/roles`);
      // 發送成功通知
      this.notify('success', `成功獲取用戶角色關聯資料`);
      return response; // 回傳角色列表
    } catch (error: any) {
      // 記錄錯誤到控制台，包含使用者 ID 資訊
      console.error(`Failed to fetch roles for user ${userId}:`, error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      // 發送錯誤通知
      this.notify('error', `獲取用戶角色關聯資料失敗: ${errorMsg}`);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || `Failed to fetch roles for user ${userId}`);
    }
  }

  /**
   * 取得 RTK 定位資料
   * 
   * @method getRTKData
   * @returns {Promise<RTKData[]>} RTK 定位資料列表
   * @description 從後端 API 獲取 RTK 定位系統的所有資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * const rtkData = await TableService.getRTKData();
   * console.log(rtkData); // RTK 定位資料列表
   * ```
   */
  static async getRTKData(): Promise<RTKData[]> {
    try {
      // 記錄開始請求 RTK 資料
      console.log('🚀 TableService: Requesting RTK data from /api/rtk/data');
      // 發送 GET 請求到 /api/rtk/data 端點
      const response = await apiClient.get<RTKData[]>('/api/rtk/data');
      // 記錄成功接收到的回應資料
      console.log('📡 TableService: Received RTK data response:', response);
      console.log('📡 TableService: Response length:', response.length);
      // 發送成功通知，顯示獲取的 RTK 資料筆數
      this.notify('success', `成功獲取 ${response.length} 筆 RTK 定位資料`);
      return response; // 回傳 RTK 定位資料列表
    } catch (error: any) {
      // 記錄錯誤到控制台，使用 emoji 標記錯誤
      console.error('❌ TableService: Failed to fetch RTK data:', error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Connection failed';
      // 發送錯誤通知
      this.notify('error', `獲取 RTK 定位資料失敗: ${errorMsg}`);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to fetch RTK data');
    }
  }

  /**
   * 更新 RTK 定位資料
   * 
   * @method updateRTKData
   * @param {number} id - RTK 資料 ID
   * @param {object} data - 要更新的資料
   * @param {number} data.latitude - 緯度
   * @param {number} data.longitude - 經度
   * @param {number} data.altitude - 海拔高度
   * @param {string} data.timestamp - 時間戳記
   * @returns {Promise<{ success: boolean; message?: string; data?: any }>} 更新結果
   * @description 更新指定 ID 的 RTK 定位資料
   * @static
   * @example
   * ```typescript
   * const result = await TableService.updateRTKData(1, {
   *   latitude: 25.0330,
   *   longitude: 121.5654,
   *   altitude: 10.5,
   *   timestamp: '2024-01-01T12:00:00Z'
   * });
   * ```
   */
  static async updateRTKData(id: number, data: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // 記錄開始更新 RTK 資料，包含 ID 和資料內容
      console.log(`🔄 TableService: Updating RTK data with ID: ${id}`, data);
      // 發送 PUT 請求到 /api/rtk/data/{id} 端點
      const response = await apiClient.put(`/api/rtk/data/${id}`, data);
      // 記錄成功更新的回應
      console.log('✅ TableService: RTK data updated successfully:', response);
      // 發送成功通知
      this.notify('success', '成功更新 RTK 定位資料');
      return response; // 回傳更新結果
    } catch (error: any) {
      // 記錄更新失敗的錯誤
      console.error('❌ TableService: Failed to update RTK data:', error);
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      // 發送錯誤通知
      this.notify('error', `更新 RTK 定位資料失敗: ${errorMsg}`);
      // 回傳包含錯誤資訊的物件
      return {
        success: false,
        message: errorMsg
      };
    }
  }

  /**
   * 更新權限資料
   * 
   * @method updatePermission
   * @param {number} id - 權限 ID
   * @param {object} data - 要更新的權限資料
   * @param {string} data.name - 權限名稱
   * @param {string} data.description - 權限描述
   * @returns {Promise<{ success: boolean; message?: string; data?: any }>} 更新結果
   * @description 更新指定 ID 的權限資料
   * @static
   * @example
   * ```typescript
   * const result = await TableService.updatePermission(1, {
   *   name: 'read_users',
   *   description: '讀取使用者資料權限'
   * });
   * ```
   */
  static async updatePermission(id: number, data: {
    name: string;
    description: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // 發送 PUT 請求到 /api/rbac/permissions/{id} 端點
      const response = await apiClient.put(`/api/rbac/permissions/${id}`, data);
      // 發送成功通知
      this.notify('success', '成功更新權限資料');
      return { success: true, data: response }; // 回傳成功結果
    } catch (error: any) {
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      // 發送錯誤通知
      this.notify('error', `更新權限資料失敗: ${errorMsg}`);
      return { success: false, message: errorMsg }; // 回傳錯誤結果
    }
  }

  /**
   * 更新角色資料
   * 
   * @method updateRole
   * @param {number} id - 角色 ID
   * @param {object} data - 要更新的角色資料
   * @param {string} data.name - 角色名稱
   * @param {string} data.displayName - 角色顯示名稱
   * @returns {Promise<{ success: boolean; message?: string; data?: any }>} 更新結果
   * @description 更新指定 ID 的角色資料
   * @static
   * @example
   * ```typescript
   * const result = await TableService.updateRole(1, {
   *   name: 'admin',
   *   displayName: '系統管理員'
   * });
   * ```
   */
  static async updateRole(id: number, data: {
    name: string;
    displayName: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // 發送 PUT 請求到 /api/rbac/roles/{id} 端點
      const response = await apiClient.put(`/api/rbac/roles/${id}`, data);
      // 發送成功通知
      this.notify('success', '成功更新角色資料');
      return { success: true, data: response }; // 回傳成功結果
    } catch (error: any) {
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      // 發送錯誤通知
      this.notify('error', `更新角色資料失敗: ${errorMsg}`);
      return { success: false, message: errorMsg }; // 回傳錯誤結果
    }
  }

  /**
   * 更新用戶資料
   * 
   * @method updateUser
   * @param {number} id - 用戶 ID
   * @param {object} data - 要更新的用戶資料
   * @param {string} data.username - 使用者名稱
   * @param {string} data.email - 電子郵件
   * @param {string} [data.passwordHash] - 密碼雜湊值（可選）
   * @returns {Promise<{ success: boolean; message?: string; data?: any }>} 更新結果
   * @description 更新指定 ID 的用戶資料
   * @static
   * @example
   * ```typescript
   * const result = await TableService.updateUser(1, {
   *   username: 'admin',
   *   email: 'admin@example.com'
   * });
   * ```
   */
  static async updateUser(id: number, data: {
    username: string;
    email: string;
    passwordHash?: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // 發送 PUT 請求到 /api/rbac/users/{id} 端點
      const response = await apiClient.put(`/api/rbac/users/${id}`, data);
      // 發送成功通知
      this.notify('success', '成功更新用戶資料');
      return { success: true, data: response }; // 回傳成功結果
    } catch (error: any) {
      // 提取錯誤訊息，優先使用 API 回應的訊息
      const errorMsg = error.response?.data?.message || error.message || 'Update failed';
      // 發送錯誤通知
      this.notify('error', `更新用戶資料失敗: ${errorMsg}`);
      return { success: false, message: errorMsg }; // 回傳錯誤結果
    }
  }

  /**
   * 統一的表格資料獲取方法
   * 
   * @method getTableData
   * @param {string} tableType - 表格類型
   * @param {number} [id] - 關聯 ID（部分表格類型需要）
   * @returns {Promise<any[]>} 表格資料列表
   * @description 根據表格類型獲取對應的資料，統一入口點
   * @throws {Error} 當表格類型不支援或缺少必要參數時拋出錯誤
   * @static
   * @example
   * ```typescript
   * // 獲取權限列表
   * const permissions = await TableService.getTableData('permission');
   * 
   * // 獲取角色權限關聯資料
   * const rolePermissions = await TableService.getTableData('roletopermission', 1);
   * ```
   */
  static async getTableData(tableType: string, id?: number): Promise<any[]> {
    switch (tableType) {
      case 'permission':
        // 獲取權限列表
        return this.getPermissions();
      case 'role':
        // 獲取角色列表
        return this.getRoles();
      case 'roletopermission':
        // 獲取角色權限關聯資料，需要角色 ID
        if (!id) throw new Error('Role ID is required for role-to-permission data');
        return this.getRoleToPermission(id);
      case 'user':
        // 獲取使用者列表
        return this.getUsers();
      case 'usertorole':
        // 獲取使用者角色關聯資料，需要使用者 ID
        if (!id) throw new Error('User ID is required for user-to-role data');
        return this.getUserToRole(id);
      case 'RTK':
        // 獲取 RTK 定位資料
        return this.getRTKData();
      default:
        // 不支援的表格類型
        throw new Error(`Unknown table type: ${tableType}`);
    }
  }
}
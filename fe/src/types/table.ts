/**
 * @fileoverview 表格相關的類型定義
 * 
 * 包含所有表格功能相關的類型定義，
 * 從原本的 TableService 中提取出來，供各個模組共用。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

/**
 * 通知回調類型定義
 * 
 * @description 處理成功和錯誤訊息的回調函數類型
 */
export type NotificationCallback = (type: 'success' | 'error', message: string) => void;

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
  /** 索引簽名，允許字串索引 */
  [key: string]: any;
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
export interface RTKData {
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
 * 表格類型定義
 */
export type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK' | 'DronePosition' | 'DroneStatus' | 'DroneCommand' | 'DronePositionsArchive' | 'DroneStatusArchive' | 'DroneCommandsArchive' | 'ArchiveTask' | 'UserPreference';

/**
 * 更新操作回應介面
 * 
 * @interface UpdateResponse
 * @description 定義更新操作的回應結構
 */
export interface UpdateResponse {
  /** 操作是否成功 */
  success: boolean;
  /** 成功或錯誤訊息 */
  message?: string;
  /** 回傳的資料 */
  data?: any;
}

/**
 * 表格錯誤介面
 * 
 * @interface TableError
 * @description 定義表格相關錯誤的資料結構
 */
export interface TableError {
  /** 錯誤訊息 */
  message: string;
  /** HTTP 狀態碼 (可選) */
  status?: number;
  /** 錯誤詳情 (可選) */
  details?: any;
}

/**
 * RTK 資料更新請求介面
 */
export interface RTKDataUpdateRequest {
  /** 緯度 */
  latitude: number;
  /** 經度 */
  longitude: number;
  /** 海拔高度 */
  altitude: number;
  /** 時間戳記 */
  timestamp: string;
}

/**
 * 權限更新請求介面
 */
export interface PermissionUpdateRequest {
  /** 權限名稱 */
  name: string;
  /** 權限描述 */
  description: string;
}

/**
 * 角色更新請求介面
 */
export interface RoleUpdateRequest {
  /** 角色名稱 */
  name: string;
  /** 角色顯示名稱 */
  displayName: string;
}

/**
 * 使用者更新請求介面
 */
export interface UserUpdateRequest {
  /** 使用者名稱 */
  username: string;
  /** 電子郵件 */
  email: string;
  /** 密碼雜湊值（可選） */
  passwordHash?: string;
}
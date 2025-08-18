/**
 * @fileoverview 無人機狀態相關的類型定義
 * 
 * 定義無人機狀態管理相關的資料結構，包含無人機基本資訊、
 * 狀態更新請求和統計資料等介面。對應後端 API 結構。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

/**
 * 無人機狀態介面
 * 
 * @interface DroneStatus
 * @description 定義無人機完整狀態資訊的資料結構
 */
export interface DroneStatus {
  /** 無人機唯一識別碼 */
  id: string;
  /** 無人機序號 */
  drone_serial: string;
  /** 無人機名稱 */
  drone_name: string;
  /** 無人機型號 */
  model: string;
  /** 製造商 */
  manufacturer: string;
  /** 擁有者使用者 ID */
  owner_user_id: string;
  /** 無人機狀態：啟用、非啟用、飛行中、維護中、離線、錯誤 */
  status: 'active' | 'inactive' | 'flying' | 'maintenance' | 'offline' | 'error';
  /** 最大飛行高度（公尺） */
  max_altitude: number;
  /** 最大飛行範圍（公尺） */
  max_range: number;
  /** 電池容量（mAh） */
  battery_capacity: number;
  /** 重量（公克） */
  weight: number;
  /** 建立時間 */
  createdAt: string;
  /** 最後更新時間 */
  updatedAt: string;
}

/**
 * 建立無人機狀態請求介面
 * 
 * @interface CreateDroneStatusRequest
 * @description 定義建立新無人機時需要提供的資料
 */
export interface CreateDroneStatusRequest {
  /** 無人機序號 */
  serialNumber: string;
  /** 無人機名稱 */
  name: string;
  /** 無人機型號 */
  model: string;
  /** 製造商 */
  manufacturer: string;
  /** 擁有者 ID */
  ownerId: string;
  /** 韌體版本（可選） */
  firmwareVersion?: string;
  /** 最大飛行時間（分鐘，可選） */
  maxFlightTime?: number;
  /** 最大飛行範圍（公尺，可選） */
  maxRange?: number;
}

/**
 * 更新無人機狀態請求介面
 * 
 * @interface UpdateDroneStatusRequest
 * @description 定義更新無人機資訊時可修改的欄位
 */
export interface UpdateDroneStatusRequest {
  /** 無人機名稱（可選） */
  name?: string;
  /** 無人機型號（可選） */
  model?: string;
  /** 製造商（可選） */
  manufacturer?: string;
  /** 狀態（可選） */
  status?: string;
  /** 電池電量百分比（可選） */
  batteryLevel?: number;
  /** 擁有者 ID（可選） */
  ownerId?: string;
  /** 韌體版本（可選） */
  firmwareVersion?: string;
  /** 最大飛行時間（分鐘，可選） */
  maxFlightTime?: number;
  /** 最大飛行範圍（公尺，可選） */
  maxRange?: number;
  /** 是否啟用（可選） */
  isActive?: boolean;
}

/**
 * 僅更新無人機狀態請求介面
 * 
 * @interface UpdateDroneStatusOnlyRequest
 * @description 定義僅更新狀態和電量的精簡請求格式
 */
export interface UpdateDroneStatusOnlyRequest {
  /** 無人機狀態 */
  status: string;
  /** 電池電量百分比（可選） */
  batteryLevel?: number;
}

/**
 * 無人機狀態統計介面
 * 
 * @interface DroneStatusStatistics
 * @description 定義無人機狀態統計資料的結構
 */
export interface DroneStatusStatistics {
  /** 總無人機數量 */
  totalDrones: number;
  /** 啟用中的無人機數量 */
  activeDrones: number;
  /** 閒置的無人機數量 */
  idleDrones: number;
  /** 飛行中的無人機數量 */
  flyingDrones: number;
  /** 充電中的無人機數量 */
  chargingDrones: number;
  /** 維護中的無人機數量 */
  maintenanceDrones: number;
  /** 離線的無人機數量 */
  offlineDrones: number;
  /** 錯誤狀態的無人機數量 */
  errorDrones: number;
  /** 平均電池電量 */
  averageBatteryLevel: number;
}
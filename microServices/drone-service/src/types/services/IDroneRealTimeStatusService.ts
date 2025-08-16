/**
 * @fileoverview Drone Real Time Status Service Interface
 * 
 * 定義無人機即時狀態服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { DroneRealTimeStatusModel, DroneRealTimeStatusCreationAttributes, DroneRealTimeStatusAttributes } from '../../models/DroneRealTimeStatusModel.js';

export type { DroneRealTimeStatusCreationAttributes, DroneRealTimeStatusAttributes };

export interface RealTimeStatusStatistics {
  totalStatuses: number;
  activeStatuses: number;
  inactiveStatuses: number;
  maintenanceStatuses: number;
  flyingStatuses: number;
  offlineStatuses: number;
  chargingStatuses: number;
  errorStatuses: number;
  lowBatteryCount: number;
  averageBatteryLevel: number;
  averageSignalStrength?: number; // 平均信號強度
  humidity?: number; // 濕度
}

export interface IDroneRealTimeStatusService {
  /**
   * 創建即時狀態記錄
   */
  createRealTimeStatus(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel>;

  /**
   * 更新即時狀態記錄
   */
  updateRealTimeStatus(id: number, data: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusModel | null>;

  /**
   * 刪除即時狀態記錄
   */
  deleteRealTimeStatus(id: number): Promise<void>;

  /**
   * 批量創建即時狀態記錄
   */
  createRealTimeStatusesBatch(data: DroneRealTimeStatusCreationAttributes[]): Promise<DroneRealTimeStatusModel[]>;

  /**
   * 獲取最新狀態
   */
  getLatestStatus(droneId: number): Promise<DroneRealTimeStatusModel | null>;

  /**
   * 更新無人機當前狀態
   */
  updateCurrentStatus(droneId: number, data: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusModel>;
}
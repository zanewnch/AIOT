/**
 * @fileoverview Drone Positions Archive Service Interface
 * 
 * 定義無人機位置歷史服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { DronePositionsArchiveModel, DronePositionsArchiveCreationAttributes } from '../../models/DronePositionsArchiveModel.js';

// 軌跡統計介面
export interface TrajectoryStatistics {
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  maxAltitude: number;
  minAltitude: number;
  averageAltitude: number;
  flightTime: number;
  flightDuration: number;
  totalPoints: number;
  startTime?: Date; // 開始時間
}

// 電量使用統計介面
export interface BatteryUsageStatistics {
  initialBattery: number;
  finalBattery: number;
  batteryConsumed: number;
  averageBatteryDrain: number;
  averageBattery: number;
  lowBatteryWarnings: number;
  consumptionRate: number;
}

// 位置分布統計介面
export interface PositionDistributionStatistics {
  latitudeRange: { min: number; max: number };
  longitudeRange: { min: number; max: number };
  altitudeRange: { min: number; max: number };
  centerPoint: { latitude: number; longitude: number };
  center?: { lat: number; lng: number }; // 中心點別名
  bounds: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  };
}

// 歸檔批次統計介面
export interface ArchiveBatchStatistics {
  totalRecords: number;
  recordCount: number;
  dateRange: { start: Date; end: Date };
  timeRange?: { start: Date; end: Date }; // 時間範圍別名
  droneCount: number;
  avgRecordsPerDrone: number;
  batchId: string;
  archivedAt: Date;
}

export interface IDronePositionsArchiveSvc {
  /**
   * 創建位置歷史記錄
   */
  createPositionArchive(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveModel>;

  /**
   * 更新位置歷史記錄
   */
  updatePositionArchive(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveModel | null>;

  /**
   * 刪除位置歷史記錄
   */
  deletePositionArchive(id: number): Promise<void>;
}
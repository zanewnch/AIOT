/**
 * @fileoverview Drone Positions Archive Repository Interface
 * 
 * 定義無人機位置歷史儲存庫的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { DronePositionsArchiveModel, DronePositionsArchiveCreationAttributes } from '../../models/DronePositionsArchiveModel.js';

export interface IDronePositionsArchiveRepository {
  /**
   * 創建位置歷史記錄
   */
  create(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveModel>;

  /**
   * 根據 ID 查找位置歷史記錄
   */
  findById(id: number): Promise<DronePositionsArchiveModel | null>;

  /**
   * 查找所有位置歷史記錄
   */
  selectAll(limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據無人機ID查找位置歷史
   */
  findByDroneId(droneId: number, limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據時間範圍查找位置歷史
   */
  findByTimeRange(start: Date, end: Date, limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據批次ID查找位置歷史
   */
  findByBatchId(batchId: string): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據創建者查找位置歷史
   */
  findByCreatedBy(createdBy: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據高度範圍查找位置歷史
   */
  findByAltitudeRange(min: number, max: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據溫度範圍查找位置歷史
   */
  findByTemperatureRange(min: number, max: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 查找最新的位置記錄
   */
  findLatest(limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據無人機ID查找最新位置
   */
  findLatestByDroneId(droneId: number): Promise<DronePositionsArchiveModel | null>;

  /**
   * 計算總記錄數
   */
  count(): Promise<number>;

  /**
   * 根據無人機ID計算記錄數
   */
  countByDroneId(droneId: number): Promise<number>;

  /**
   * 根據時間範圍計算記錄數
   */
  countByTimeRange(start: Date, end: Date): Promise<number>;

  /**
   * 根據批次ID計算記錄數
   */
  countByBatchId(batchId: string): Promise<number>;

  /**
   * 批量創建位置歷史記錄
   */
  bulkCreate(data: DronePositionsArchiveCreationAttributes[]): Promise<DronePositionsArchiveModel[]>;

  /**
   * 更新位置歷史記錄
   */
  update(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveModel | null>;

  /**
   * 刪除位置歷史記錄
   */
  delete(id: number): Promise<void>;

  /**
   * 根據日期刪除記錄
   */
  deleteBeforeDate(date: Date): Promise<number>;

  /**
   * 批量刪除記錄
   */
  deleteBatch(batchId: string): Promise<number>;

  /**
   * 批量刪除記錄（由ID陣列）
   */
  deleteBatchByIds(ids: number[]): Promise<number>;

  /**
   * 根據原始ID查找
   */
  findByOriginalId(originalId: number): Promise<DronePositionsArchiveModel | null>;

  /**
   * 根據歸檔日期範圍查找
   */
  findByArchivedDateRange(start: Date, end: Date, limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據地理邊界查找
   */
  findByGeoBounds(northEast: any, southWest: any, altitude?: number, speed?: number, limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據無人機和時間查找軌跡
   */
  findTrajectoryByDroneAndTime(droneId: number, start: Date, end: Date, limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據電量範圍查找
   */
  findByBatteryRange(min: number, max: number, limit?: number): Promise<DronePositionsArchiveModel[]>;

  /**
   * 根據速度範圍查找
   */
  findBySpeedRange(min: number, max: number, limit?: number): Promise<DronePositionsArchiveModel[]>;
}
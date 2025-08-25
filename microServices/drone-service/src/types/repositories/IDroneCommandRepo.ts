/**
 * @fileoverview Drone Command Repositorysitory Interface
 * 
 * 定義無人機命令儲存庫的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { DroneCommandModel, DroneCommandCreationAttributes } from '../../models/DroneCommandModel.js';

export interface IDroneCommandRepo {
  /**
   * 創建命令
   */
  create(data: DroneCommandCreationAttributes): Promise<DroneCommandModel>;

  /**
   * 根據 ID 查找命令
   */
  findById(id: number): Promise<DroneCommandModel | null>;

  /**
   * 更新命令
   */
  update(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandModel | null>;

  /**
   * 刪除命令
   */
  delete(id: number): Promise<void>;

  /**
   * 標記為執行中
   */
  markAsExecuting(id: number): Promise<DroneCommandModel | null>;

  /**
   * 標記為完成
   */
  markAsCompleted(id: number): Promise<DroneCommandModel | null>;

  /**
   * 標記為失敗
   */
  markAsFailed(id: number, errorMessage?: string): Promise<DroneCommandModel | null>;

  /**
   * 刪除指定日期之前已完成的命令
   */
  deleteCompletedBefore(date: Date): Promise<number>;

  /**
   * 刪除指定日期之前的命令
   */
  deleteBeforeDate(date: Date): Promise<number>;

  /**
   * 更新狀態
   */
  updateStatus(id: number, status: any, errorMessage?: string): Promise<DroneCommandModel | null>;

  // Query methods
  /**
   * 查詢所有命令
   */
  selectAll(limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據無人機ID查找命令
   */
  findByDroneId(droneId: number, limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據狀態查找命令
   */
  findByStatus(status: string, limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據命令類型查找
   */
  findByCommandType(commandType: string, limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據發送者查找命令
   */
  findByIssuedBy(issuedBy: number, limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據日期範圍查找命令
   */
  findByDateRange(start: Date, end: Date, limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 查找待執行的命令
   */
  findPendingCommandsByDroneId(droneId: number): Promise<DroneCommandModel[]>;

  /**
   * 查找正在執行的命令
   */
  findExecutingCommandByDroneId(droneId: number): Promise<DroneCommandModel | null>;

  /**
   * 查找最新的命令
   */
  findLatest(limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據無人機ID查找最新命令
   */
  findLatestByDroneId(droneId: number): Promise<DroneCommandModel | null>;

  /**
   * 查找失敗的命令
   */
  findFailedCommands(limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 查找超時的命令
   */
  findTimeoutCommands(limit?: number): Promise<DroneCommandModel[]>;

  /**
   * 根據無人機和狀態查找命令
   */
  findByDroneIdAndStatus(droneId: number, status: string): Promise<DroneCommandModel[]>;

  /**
   * 根據無人機和命令類型查找
   */
  findByDroneIdAndCommandType(droneId: number, commandType: string): Promise<DroneCommandModel[]>;

  // Count methods
  /**
   * 計算總數
   */
  count(): Promise<number>;

  /**
   * 根據日期範圍計算數量
   */
  countByDateRange(start: Date, end: Date): Promise<number>;

  /**
   * 根據狀態計算數量
   */
  countByStatus(status: string): Promise<number>;

  /**
   * 根據命令類型計算數量
   */
  countByCommandType(commandType: string): Promise<number>;

  /**
   * 根據無人機ID計算數量
   */
  countByDroneId(droneId: number): Promise<number>;
}
/**
 * @fileoverview 無人機位置服務介面
 * 
 * 定義無人機位置服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import type { DronePositionAttributes } from '../../models/DronePositionModel.js';
import type { PaginationParams, PaginatedResult } from '../PaginationTypes.js';

/**
 * 無人機位置查詢服務介面
 */
export interface IDronePositionQueriesSvc {
    getAllDronePositions(params?: PaginationParams): Promise<PaginatedResult<DronePositionAttributes>>;
    getDronePositionById(id: number): Promise<DronePositionAttributes | null>;
    getDronePositionsByDroneId(droneId: number, limit?: number): Promise<DronePositionAttributes[]>;
    getLatestDronePosition(droneId: number): Promise<DronePositionAttributes | null>;
    getDronePositionsByTimeRange(droneId: number, startDate: Date, endDate: Date): Promise<DronePositionAttributes[]>;
    getDronePositionStatistics(): Promise<{total: number}>;
    getTotalPositionCount(): Promise<number>;
    getPositionCountByDrone(droneId: number): Promise<number>;
    
    // 新增分頁查詢方法
    getAllPositionsPaginated(pagination: any): Promise<any>;
    getPositionsByDroneIdPaginated(droneId: number, pagination: any): Promise<any>;
    getPositionsByIdPaginated(id: number, pagination: any): Promise<any>;
    getPositionsByTimeRangePaginated(startTime: Date, endTime: Date, pagination: any): Promise<any>;
}

/**
 * 無人機位置命令服務介面
 */
export interface IDronePositionCommandsSvc {
    createDronePosition(position: Partial<DronePositionAttributes>): Promise<DronePositionAttributes>;
    updateDronePosition(id: number, position: Partial<DronePositionAttributes>): Promise<DronePositionAttributes | null>;
    deleteDronePosition(id: number): Promise<boolean>;
    bulkCreateDronePositions(positions: Partial<DronePositionAttributes>[]): Promise<DronePositionAttributes[]>;
    clearPositionsByDroneId(droneId: string): Promise<number>;
}
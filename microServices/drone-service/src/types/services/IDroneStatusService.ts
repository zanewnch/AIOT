/**
 * @fileoverview 無人機狀態服務介面
 * 
 * 定義無人機狀態服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import type { DroneStatusAttributes } from '../../models/DroneStatusModel.js';
import type { PaginationParams, PaginatedResult } from '../PaginationTypes.js';

/**
 * 無人機狀態查詢服務介面
 */
export interface IDroneStatusQueriesService {
    getAllDroneStatuses(params?: PaginationParams): Promise<PaginatedResult<DroneStatusAttributes>>;
    getDroneStatusById(id: number): Promise<DroneStatusAttributes | null>;
    getDroneStatusesByDroneId(droneId: string): Promise<DroneStatusAttributes[]>;
    getLatestDroneStatus(): Promise<DroneStatusAttributes | null>;
    getDroneStatusesByTimeRange(startDate: Date, endDate: Date): Promise<DroneStatusAttributes[]>;
    getDroneStatusStatistics(): Promise<any>;
}

/**
 * 無人機狀態命令服務介面
 */
export interface IDroneStatusCommandsService {
    createDroneStatus(status: Partial<DroneStatusAttributes>): Promise<DroneStatusAttributes>;
    updateDroneStatus(id: number, status: Partial<DroneStatusAttributes>): Promise<DroneStatusAttributes | null>;
    deleteDroneStatus(id: number): Promise<boolean>;
    bulkCreateDroneStatuses(statuses: Partial<DroneStatusAttributes>[]): Promise<DroneStatusAttributes[]>;
    clearStatusesByDroneId(droneId: string): Promise<number>;
}
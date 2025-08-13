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

/**
 * 無人機位置查詢服務介面
 */
export interface IDronePositionQueriesSvc {
    getAllDronePositions(): Promise<DronePositionAttributes[]>;
    getDronePositionById(id: number): Promise<DronePositionAttributes | null>;
    getDronePositionsByDroneId(droneId: string): Promise<DronePositionAttributes[]>;
    getLatestDronePosition(): Promise<DronePositionAttributes | null>;
    getDronePositionsByTimeRange(startDate: Date, endDate: Date): Promise<DronePositionAttributes[]>;
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
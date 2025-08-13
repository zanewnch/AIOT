/**
 * @fileoverview 無人機狀態查詢控制器介面
 * 
 * 定義無人機狀態查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機狀態查詢控制器介面
 */
export interface IDroneStatusQueries {
    getAllDroneStatuses(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDroneStatusById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDroneStatusesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLatestDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDroneStatusesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDroneStatusStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
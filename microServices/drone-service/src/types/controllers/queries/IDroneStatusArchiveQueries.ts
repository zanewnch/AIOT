/**
 * @fileoverview 無人機狀態歷史查詢控制器介面
 * 
 * 定義無人機狀態歷史查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機狀態歷史查詢控制器介面
 */
export interface IDroneStatusArchiveQueries {
    getAllArchivedStatuses(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedStatusById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedStatusesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedStatusesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedStatusStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
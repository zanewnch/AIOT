/**
 * @fileoverview 無人機即時狀態查詢控制器介面
 * 
 * 定義無人機即時狀態查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機即時狀態查詢控制器介面
 */
export interface IDroneRealTimeStatusQueries {
    getAllRealTimeStatuses(req: Request, res: Response, next: NextFunction): Promise<void>;
    getRealTimeStatusByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getConnectionStatuses(req: Request, res: Response, next: NextFunction): Promise<void>;
    getRealTimeStatusStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
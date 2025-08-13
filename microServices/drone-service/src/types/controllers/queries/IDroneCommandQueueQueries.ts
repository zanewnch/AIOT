/**
 * @fileoverview 無人機命令佇列查詢控制器介面
 * 
 * 定義無人機命令佇列查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機命令佇列查詢控制器介面
 */
export interface IDroneCommandQueueQueries {
    getAllQueuedCommands(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueuedCommandById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueuedCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueueStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getQueueStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPendingDroneCommandQueues(req: Request, res: Response, next: NextFunction): Promise<void>;
}
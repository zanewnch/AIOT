/**
 * @fileoverview 無人機命令查詢控制器介面
 * 
 * 定義無人機命令查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機命令查詢控制器介面
 */
export interface IDroneCommandQueries {
    getAllCommands(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCommandById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCommandsByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCommandStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
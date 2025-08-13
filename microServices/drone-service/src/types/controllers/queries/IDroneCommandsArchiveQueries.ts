/**
 * @fileoverview 無人機命令歷史查詢控制器介面
 * 
 * 定義無人機命令歷史查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機命令歷史查詢控制器介面
 */
export interface IDroneCommandsArchiveQueries {
    getAllArchivedCommands(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedCommandById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedCommandsByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchivedCommandStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAllCommandsArchive(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCommandArchiveById(req: Request, res: Response, next: NextFunction): Promise<void>;
}
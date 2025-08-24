/**
 * @fileoverview 無人機命令歷史查詢控制器介面
 * 
 * 定義無人機命令歷史查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 無人機命令歷史查詢控制器介面
 */
export interface IDroneCommandsArchiveQueries {
    getAllCommandsArchivePaginated(req: Request, res: Response): Promise<void>;
    getCommandsArchiveByDroneIdPaginated(req: Request, res: Response): Promise<void>;
    getCommandsArchiveByCommandTypePaginated(req: Request, res: Response): Promise<void>;
    getCommandsArchiveByStatusPaginated(req: Request, res: Response): Promise<void>;
}
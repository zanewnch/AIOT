/**
 * @fileoverview 無人機命令查詢控制器介面
 * 
 * 定義無人機命令查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 無人機命令查詢控制器介面
 */
export interface IDroneCommandQueries {
    getAllCommandsPaginated(req: Request, res: Response): Promise<void>;
    getCommandsByDroneIdPaginated(req: Request, res: Response): Promise<void>;
    getCommandsByStatusPaginated(req: Request, res: Response): Promise<void>;
}
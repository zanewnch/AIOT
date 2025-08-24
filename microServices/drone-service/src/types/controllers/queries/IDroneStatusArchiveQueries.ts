/**
 * @fileoverview 無人機狀態歷史查詢控制器介面
 * 
 * 定義無人機狀態歷史查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 無人機狀態歷史查詢控制器介面
 */
export interface IDroneStatusArchiveQueries {
    getAllStatusArchivesPaginated(req: Request, res: Response): Promise<void>;
    getStatusArchivesByDroneIdPaginated(req: Request, res: Response): Promise<void>;
    getStatusArchivesByStatusPaginated(req: Request, res: Response): Promise<void>;
    getStatusArchivesByDateRangePaginated(req: Request, res: Response): Promise<void>;
}
/**
 * @fileoverview 無人機位置歷史查詢控制器介面
 * 
 * 定義無人機位置歷史查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 無人機位置歷史查詢控制器介面
 * 
 * 定義所有無人機位置歷史查詢相關的控制器方法
 */
export interface IDronePositionsArchiveQueries {
    getAllPositionsArchivePaginated(req: Request, res: Response): Promise<void>;
    getPositionsArchiveByDroneIdPaginated(req: Request, res: Response): Promise<void>;
    getPositionsArchiveByBatchIdPaginated(req: Request, res: Response): Promise<void>;
    getPositionsArchiveByTimeRangePaginated(req: Request, res: Response): Promise<void>;
}
/**
 * @fileoverview 無人機狀態查詢控制器介面
 * 
 * 定義無人機狀態查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 無人機狀態查詢控制器介面
 */
export interface IDroneStatusQueries {
    getAllStatusesPaginated(req: Request, res: Response): Promise<void>;
    getStatusesByStatusPaginated(req: Request, res: Response): Promise<void>;
    getStatusesByDroneIdPaginated(req: Request, res: Response): Promise<void>;
}
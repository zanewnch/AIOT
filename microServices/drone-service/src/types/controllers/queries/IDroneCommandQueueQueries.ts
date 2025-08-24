/**
 * @fileoverview 無人機命令佇列查詢控制器介面
 * 
 * 定義無人機命令佇列查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 無人機命令佇列查詢控制器介面
 */
export interface IDroneCommandQueueQueries {
    getAllDroneCommandQueuesPaginated(req: Request, res: Response): Promise<void>;
    getDroneCommandQueuesByDroneIdPaginated(req: Request, res: Response): Promise<void>;
    getDroneCommandQueuesByStatusPaginated(req: Request, res: Response): Promise<void>;
    getDroneCommandQueuesByPriorityPaginated(req: Request, res: Response): Promise<void>;
}
/**
 * @fileoverview 歸檔任務查詢控制器介面
 * 
 * 定義歸檔任務查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response } from 'express';

/**
 * 歸檔任務查詢控制器介面
 */
export interface IArchiveTaskQueries {
    getAllTasksPaginated(req: Request, res: Response): Promise<void>;
    getTasksByStatusPaginated(req: Request, res: Response): Promise<void>;
    getTasksByJobTypePaginated(req: Request, res: Response): Promise<void>;
    getTasksByBatchIdPaginated(req: Request, res: Response): Promise<void>;
}
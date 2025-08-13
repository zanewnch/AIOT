/**
 * @fileoverview 無人機位置查詢控制器介面
 * 
 * 定義無人機位置查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機位置查詢控制器介面
 * 
 * 定義所有無人機位置查詢相關的控制器方法
 */
export interface IDronePositionQueries {
    /**
     * 取得所有無人機位置資料
     */
    getAllDronePositions(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據 ID 取得無人機位置資料
     */
    getDronePositionById(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據無人機 ID 取得位置資料
     */
    getDronePositionsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 取得最新的無人機位置資料
     */
    getLatestDronePosition(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據時間範圍取得無人機位置資料
     */
    getDronePositionsByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void>;
}
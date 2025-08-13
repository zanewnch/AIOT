/**
 * @fileoverview 無人機位置歷史查詢控制器介面
 * 
 * 定義無人機位置歷史查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機位置歷史查詢控制器介面
 * 
 * 定義所有無人機位置歷史查詢相關的控制器方法
 */
export interface IDronePositionsArchiveQueries {
    /**
     * 獲取所有歷史位置記錄
     */
    getAllPositionArchives(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據 ID 獲取歷史位置詳情
     */
    getPositionArchiveById(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據無人機 ID 獲取歷史位置
     */
    getPositionArchivesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據時間範圍獲取歷史位置
     */
    getPositionArchivesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 獲取軌跡資料
     */
    getTrajectoryByDroneAndTime(req: Request, res: Response, next: NextFunction): Promise<void>;
}
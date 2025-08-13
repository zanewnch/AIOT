/**
 * @fileoverview 歸檔任務查詢控制器介面
 * 
 * 定義歸檔任務查詢控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 歸檔任務查詢控制器介面
 * 
 * 定義所有歸檔任務查詢相關的控制器方法
 */
export interface IArchiveTaskQueries {
    /**
     * 取得所有歸檔任務
     */
    getAllTasks(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據 ID 取得歸檔任務
     */
    getTaskById(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 取得歸檔任務統計資訊
     */
    getTaskStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 取得歸檔任務資料（用於前端表格顯示）
     */
    getTasksData(req: Request, res: Response, next: NextFunction): Promise<void>;
}
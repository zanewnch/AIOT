/**
 * @fileoverview 歸檔任務命令控制器介面
 * 
 * 定義歸檔任務命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 歸檔任務命令控制器介面
 * 
 * 定義所有歸檔任務命令相關的控制器方法
 */
export interface IArchiveTaskCommands {
    /**
     * 創建新的歸檔任務
     */
    createTask(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 批次創建歸檔任務
     */
    createBatchTasks(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 啟動歸檔任務執行
     */
    executeTask(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 取消歸檔任務執行
     */
    cancelTask(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 重試歸檔任務
     */
    retryTask(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 清理舊任務
     */
    cleanupOldTasks(req: Request, res: Response, next: NextFunction): Promise<void>;
}
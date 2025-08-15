/**
 * @fileoverview 無人機位置歷史命令控制器介面
 * 
 * 定義無人機位置歷史命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機位置歷史命令控制器介面
 * 
 * 定義所有無人機位置歷史命令相關的控制器方法
 */
export interface IDronePositionsArchiveCommands {
    /**
     * 建立歷史位置記錄
     */
    createPositionArchive(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 批次建立歷史位置記錄
     */
    bulkCreatePositionArchives(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 更新歷史位置記錄
     */
    updatePositionArchive(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 刪除歷史位置記錄
     */
    deletePositionArchive(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 清理舊的歷史位置記錄
     */
    deleteArchivesBeforeDate(req: Request, res: Response, next: NextFunction): Promise<void>;
}
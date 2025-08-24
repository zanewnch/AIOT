/**
 * @fileoverview 無人機位置命令控制器介面
 * 
 * 定義無人機位置命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機位置命令控制器介面
 * 
 * 定義所有無人機位置命令相關的控制器方法
 */
export interface IDronePositionCommands {
    /**
     * 創建新的無人機位置記錄
     */
    createDronePosition(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 批次創建無人機位置記錄
     */
    bulkCreateDronePositions(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 更新無人機位置記錄
     */
    updateDronePosition(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 刪除無人機位置記錄
     */
    deleteDronePosition(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 根據無人機 ID 清空所有位置記錄
     */
    clearPositionsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 清理舊的位置記錄
     */
    cleanupOldPositions(req: Request, res: Response, next: NextFunction): Promise<void>;
}
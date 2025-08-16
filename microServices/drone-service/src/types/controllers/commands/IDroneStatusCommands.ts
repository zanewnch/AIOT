/**
 * @fileoverview 無人機狀態命令控制器介面
 * 
 * 定義無人機狀態命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機狀態命令控制器介面
 */
export interface IDroneStatusCommands {
    createDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkCreateDroneStatuses(req: Request, res: Response, next: NextFunction): Promise<void>;
    clearStatusesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void>;
}
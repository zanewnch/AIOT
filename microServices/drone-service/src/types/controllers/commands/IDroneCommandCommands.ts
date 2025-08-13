/**
 * @fileoverview 無人機命令控制器介面
 * 
 * 定義無人機命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機命令控制器介面
 */
export interface IDroneCommandCommands {
    createCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    executeCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    cancelCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkCreateCommands(req: Request, res: Response, next: NextFunction): Promise<void>;
}
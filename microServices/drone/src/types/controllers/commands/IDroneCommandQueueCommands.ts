/**
 * @fileoverview 無人機命令佇列命令控制器介面
 * 
 * 定義無人機命令佇列命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機命令佇列命令控制器介面
 */
export interface IDroneCommandQueueCommands {
    addToQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    removeFromQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    processQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    clearQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
    prioritizeCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    enqueueDroneCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    dequeueDroneCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    clearDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
}
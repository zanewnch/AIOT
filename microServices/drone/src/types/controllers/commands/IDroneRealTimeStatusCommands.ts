/**
 * @fileoverview 無人機即時狀態命令控制器介面
 * 
 * 定義無人機即時狀態命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機即時狀態命令控制器介面
 */
export interface IDroneRealTimeStatusCommands {
    updateRealTimeStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    broadcastMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendNotification(req: Request, res: Response, next: NextFunction): Promise<void>;
    disconnectDrone(req: Request, res: Response, next: NextFunction): Promise<void>;
}
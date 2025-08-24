/**
 * @fileoverview 無人機命令歷史命令控制器介面
 * 
 * 定義無人機命令歷史命令控制器的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 無人機命令歷史命令控制器介面
 */
export interface IDroneCommandsArchiveCommands {
    archiveCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkArchiveCommands(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteArchivedCommand(req: Request, res: Response, next: NextFunction): Promise<void>;
    cleanupOldArchives(req: Request, res: Response, next: NextFunction): Promise<void>;
    createCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void>;
}
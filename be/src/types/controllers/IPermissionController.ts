/**
 * 權限控制器介面定義
 * 
 * 定義權限控制器必須實現的方法簽名，包括路由器屬性和所有權限相關的操作方法。
 * 確保所有權限控制器實現都遵循統一的介面規範。
 * 
 * @module Types
 */

import { Router, Request, Response } from 'express';

export interface IPermissionController {
    router: Router;
    getPermissions(req: Request, res: Response): Promise<void>;
    getPermissionById(req: Request, res: Response): Promise<void>;
    createPermission(req: Request, res: Response): Promise<void>;
    updatePermission(req: Request, res: Response): Promise<void>;
    deletePermission(req: Request, res: Response): Promise<void>;
}
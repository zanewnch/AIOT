/**
 * 角色控制器介面定義
 * 
 * 定義角色控制器必須實現的方法簽名，包括路由器屬性和所有角色相關的 CRUD 操作方法。
 * 確保所有角色控制器實現都遵循統一的介面規範。
 * 
 * @module Types
 */

import { Router, Request, Response } from 'express';

export interface IRoleController {
    router: Router;
    getRoles(req: Request, res: Response): Promise<void>;
    getRoleById(req: Request, res: Response): Promise<void>;
    createRole(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    deleteRole(req: Request, res: Response): Promise<void>;
}
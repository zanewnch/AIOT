/**
 * 角色權限關聯控制器介面定義
 * 
 * 定義角色權限關聯控制器必須實現的方法簽名，包括權限指派、查詢和移除等操作。
 * 管理 RBAC 系統中角色與權限之間的多對多關係。
 * 
 * @module Types
 */

import { Request, Response } from 'express';

export interface IRoleToPermissionController {
    getRolePermissions(req: Request, res: Response): Promise<void>;
    assignPermissionsToRole(req: Request, res: Response): Promise<void>;
    removePermissionFromRole(req: Request, res: Response): Promise<void>;
    createRolePermission(req: Request, res: Response): Promise<void>;
    getRolePermissionById(req: Request, res: Response): Promise<void>;
    updateRolePermission(req: Request, res: Response): Promise<void>;
    deleteRolePermission(req: Request, res: Response): Promise<void>;
}
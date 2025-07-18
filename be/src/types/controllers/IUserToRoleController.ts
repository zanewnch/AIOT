/**
 * 使用者角色關聯控制器介面定義
 * 
 * 定義使用者角色關聯控制器必須實現的方法簽名，包括角色指派、查詢和移除等操作。
 * 管理 RBAC 系統中使用者與角色之間的多對多關係。
 * 
 * @module Types
 */

import { Request, Response } from 'express';

export interface IUserToRoleController {
    getUserRoles(req: Request, res: Response): Promise<void>;
    assignRolesToUser(req: Request, res: Response): Promise<void>;
    removeRoleFromUser(req: Request, res: Response): Promise<void>;
    createUserRole(req: Request, res: Response): Promise<void>;
    getUserRoleById(req: Request, res: Response): Promise<void>;
    updateUserRole(req: Request, res: Response): Promise<void>;
    deleteUserRole(req: Request, res: Response): Promise<void>;
}
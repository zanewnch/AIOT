/**
 * 使用者控制器介面定義
 * 
 * 定義使用者控制器必須實現的方法簽名，包括所有使用者相關的 CRUD 操作方法。
 * 確保所有使用者控制器實現都遵循統一的介面規範。
 * 
 * @module Types
 */

import { Request, Response } from 'express';

export interface IUserController {
    getUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
}
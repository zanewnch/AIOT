// Permission controller interface definition

import { Router, Request, Response } from 'express';

export interface IPermissionController {
    router: Router;
    getPermissions(req: Request, res: Response): Promise<void>;
    getPermissionById(req: Request, res: Response): Promise<void>;
    createPermission(req: Request, res: Response): Promise<void>;
    updatePermission(req: Request, res: Response): Promise<void>;
    deletePermission(req: Request, res: Response): Promise<void>;
}
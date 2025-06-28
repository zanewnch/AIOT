// Role to permission controller interface definition

import { Router, Request, Response } from 'express';

export interface IRoleToPermissionController {
    router: Router;
    getRolePermissions(req: Request, res: Response): Promise<void>;
    assignPermissionsToRole(req: Request, res: Response): Promise<void>;
    removePermissionFromRole(req: Request, res: Response): Promise<void>;
}
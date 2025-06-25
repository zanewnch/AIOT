// User to role controller interface definition

import { Router, Request, Response } from 'express';

export interface IUserToRoleController {
    router: Router;
    getUserRoles(req: Request, res: Response): Promise<void>;
    assignRolesToUser(req: Request, res: Response): Promise<void>;
    removeRoleFromUser(req: Request, res: Response): Promise<void>;
}
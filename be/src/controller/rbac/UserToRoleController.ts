import { Router, Request, Response } from 'express';
import { UserModel } from '../../models/rbac/UserModel.js';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IUserToRoleController } from '../../types/index.js';

export class UserToRoleController implements IUserToRoleController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/:userId/roles')
            .get(this.getUserRoles.bind(this))
            .post(this.assignRolesToUser.bind(this));
        this.router.delete('/:userId/roles/:roleId', this.removeRoleFromUser.bind(this));
    }

    public async getUserRoles(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const user = await UserModel.findByPk(userId, { include: [RoleModel] });
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(user.roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch user roles', error: (error as Error).message });
        }
    }

    public async assignRolesToUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { roleIds } = req.body; // expect array of role IDs
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            const roles = await RoleModel.findAll({ where: { id: roleIds } });
            await user.$add('roles', roles);
            res.json({ message: 'Roles assigned to user' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to assign roles', error: (error as Error).message });
        }
    }

    public async removeRoleFromUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId, roleId } = req.params;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.$remove('roles', Number(roleId));
            res.json({ message: 'Role removed from user' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to remove role', error: (error as Error).message });
        }
    }
}

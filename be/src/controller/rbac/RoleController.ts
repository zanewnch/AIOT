import { Router, Request, Response } from 'express';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IRoleController } from '../../types/index.js';

export class RoleController implements IRoleController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getRoles.bind(this))
            .post(this.createRole.bind(this));
        this.router.route('/:roleId')
            .get(this.getRoleById.bind(this))
            .put(this.updateRole.bind(this))
            .delete(this.deleteRole.bind(this));
    }

    public async getRoles(req: Request, res: Response): Promise<void> {
        try {
            const roles = await RoleModel.findAll();
            res.json(roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch roles', error: (error as Error).message });
        }
    }

    public async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch role', error: (error as Error).message });
        }
    }

    public async createRole(req: Request, res: Response): Promise<void> {
        try {
            const { name, displayName } = req.body;
            const role = await RoleModel.create({ name, displayName });
            res.status(201).json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create role', error: (error as Error).message });
        }
    }

    public async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const { name, displayName } = req.body;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.update({ name, displayName });
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update role', error: (error as Error).message });
        }
    }

    public async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete role', error: (error as Error).message });
        }
    }
}

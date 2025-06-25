import { Router, Request, Response } from 'express';
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
import { IPermissionController } from '../../types/index.js';

export class PermissionController implements IPermissionController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getPermissions.bind(this))
            .post(this.createPermission.bind(this));
        this.router.route('/:permissionId')
            .get(this.getPermissionById.bind(this))
            .put(this.updatePermission.bind(this))
            .delete(this.deletePermission.bind(this));
    }

    public async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            const permissions = await PermissionModel.findAll();
            res.json(permissions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch permissions', error: (error as Error).message });
        }
    }

    public async getPermissionById(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            res.json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch permission', error: (error as Error).message });
        }
    }

    public async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const permission = await PermissionModel.create({ name, description });
            res.status(201).json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create permission', error: (error as Error).message });
        }
    }

    public async updatePermission(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const { name, description } = req.body;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            await permission.update({ name, description });
            res.json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update permission', error: (error as Error).message });
        }
    }

    public async deletePermission(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            await permission.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete permission', error: (error as Error).message });
        }
    }
}
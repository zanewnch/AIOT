import { Router, Request, Response } from 'express';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
import { IRoleToPermissionController } from '../../types/index.js';

export class RoleToPermissionController implements IRoleToPermissionController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/:roleId/permissions')
            .get(this.getRolePermissions.bind(this))
            .post(this.assignPermissionsToRole.bind(this));
        this.router.delete('/:roleId/permissions/:permissionId', this.removePermissionFromRole.bind(this));
    }

    public async getRolePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId, { include: [PermissionModel] });
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            res.json(role.permissions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch role permissions', error: (error as Error).message });
        }
    }

    public async assignPermissionsToRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const { permissionIds } = req.body; // expect array of permission IDs
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            const permissions = await PermissionModel.findAll({ where: { id: permissionIds } });
            await role.$add('permissions', permissions);
            res.json({ message: 'Permissions assigned to role' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to assign permissions', error: (error as Error).message });
        }
    }

    public async removePermissionFromRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId, permissionId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.$remove('permissions', Number(permissionId));
            res.json({ message: 'Permission removed from role' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to remove permission', error: (error as Error).message });
        }
    }
}

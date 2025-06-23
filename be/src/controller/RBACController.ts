import { Router, Request, Response } from 'express';
import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';

class RBACController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // users
        this.router.route('/users')
            .get(this.getUsers)
            .post(this.createUser);
        this.router.route('/users/:userId')
            .get(this.getUserById)
            .put(this.updateUser)
            .delete(this.deleteUser);

        // roles
        this.router.route('/roles')
            .get(this.getRoles)
            .post(this.createRole);
        this.router.route('/roles/:roleId')
            .get(this.getRoleById)
            .put(this.updateRole)
            .delete(this.deleteRole);

        // permissions
        this.router.route('/permissions')
            .get(this.getPermissions)
            .post(this.createPermission);
        this.router.route('/permissions/:permissionId')
            .get(this.getPermissionById)
            .put(this.updatePermission)
            .delete(this.deletePermission);

        // user-roles
        this.router.route('/users/:userId/roles')
            .get(this.getUserRoles)
            .post(this.assignRolesToUser);
        this.router.delete('/users/:userId/roles/:roleId', this.removeRoleFromUser);

        // role-permissions
        this.router.route('/roles/:roleId/permissions')
            .get(this.getRolePermissions)
            .post(this.assignPermissionsToRole);
        this.router.delete('/roles/:roleId/permissions/:permissionId', this.removePermissionFromRole);
    }

    // User handlers
    private async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await UserModel.findAll();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
        }
    }

    private async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch user', error: (error as Error).message });
        }
    }

    private async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { username, passwordHash, email } = req.body;
            const user = await UserModel.create({ username, passwordHash, email });
            res.status(201).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
        }
    }

    private async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { username, passwordHash, email } = req.body;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.update({ username, passwordHash, email });
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
        }
    }

    private async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const user = await UserModel.findByPk(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            await user.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete user', error: (error as Error).message });
        }
    }

    // Role handlers
    private async getRoles(req: Request, res: Response): Promise<void> {
        try {
            const roles = await RoleModel.findAll();
            res.json(roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch roles', error: (error as Error).message });
        }
    }

    private async getRoleById(req: Request, res: Response): Promise<void> {
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

    private async createRole(req: Request, res: Response): Promise<void> {
        try {
            const { name, displayName } = req.body;
            const role = await RoleModel.create({ name, displayName });
            res.status(201).json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create role', error: (error as Error).message });
        }
    }

    private async updateRole(req: Request, res: Response): Promise<void> {
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

    private async deleteRole(req: Request, res: Response): Promise<void> {
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

    // Permission handlers
    private async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            const permissions = await PermissionModel.findAll();
            res.json(permissions);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch permissions', error: (error as Error).message });
        }
    }

    private async getPermissionById(req: Request, res: Response): Promise<void> {
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

    private async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const permission = await PermissionModel.create({ name, description });
            res.status(201).json(permission);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create permission', error: (error as Error).message });
        }
    }

    private async updatePermission(req: Request, res: Response): Promise<void> {
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

    private async deletePermission(req: Request, res: Response): Promise<void> {
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

    // User-Role relations
    private async getUserRoles(req: Request, res: Response): Promise<void> {
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

    private async assignRolesToUser(req: Request, res: Response): Promise<void> {
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

    private async removeRoleFromUser(req: Request, res: Response): Promise<void> {
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

    // Role-Permission relations
    private async getRolePermissions(req: Request, res: Response): Promise<void> {
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

    private async assignPermissionsToRole(req: Request, res: Response): Promise<void> {
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

    private async removePermissionFromRole(req: Request, res: Response): Promise<void> {
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

export default new RBACController();
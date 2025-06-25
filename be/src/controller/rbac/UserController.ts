import { Router, Request, Response } from 'express';
import { UserModel } from '../../models/rbac/UserModel.js';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IUserController } from '../../types/index.js';

export class UserController implements IUserController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getUsers.bind(this))
            .post(this.createUser.bind(this));
        this.router.route('/:userId')
            .get(this.getUserById.bind(this))
            .put(this.updateUser.bind(this))
            .delete(this.deleteUser.bind(this));
    }

    public async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await UserModel.findAll();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
        }
    }

    public async getUserById(req: Request, res: Response): Promise<void> {
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

    public async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { username, passwordHash, email } = req.body;
            const user = await UserModel.create({ username, passwordHash, email });
            res.status(201).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
        }
    }

    public async updateUser(req: Request, res: Response): Promise<void> {
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

    public async deleteUser(req: Request, res: Response): Promise<void> {
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
}

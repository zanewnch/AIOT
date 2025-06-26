import { UserModel } from '../models/rbac/UserModel.js';

export interface IUserRepository {
    findByUsername(username: string): Promise<UserModel | null>;
    findById(id: number): Promise<UserModel | null>;
    create(userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel>;
}

export class UserRepository implements IUserRepository {
    async findByUsername(username: string): Promise<UserModel | null> {
        return await UserModel.findOne({ where: { username } });
    }

    async findById(id: number): Promise<UserModel | null> {
        return await UserModel.findByPk(id);
    }

    async create(userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel> {
        return await UserModel.create(userData);
    }
}
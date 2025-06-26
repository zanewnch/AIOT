import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository, IUserRepository } from '../repo/UserRepo.js';
import { UserModel } from '../models/rbac/UserModel.js';

export interface LoginResult {
    success: boolean;
    token?: string;
    message: string;
    user?: UserModel;
}

export interface IAuthService {
    login(username: string, password: string): Promise<LoginResult>;
}

export class AuthService implements IAuthService {
    private userRepository: IUserRepository;

    constructor(userRepository: IUserRepository = new UserRepository()) {
        this.userRepository = userRepository;
    }

    async login(username: string, password: string): Promise<LoginResult> {
        try {
            // 查找用戶
            const user = await this.userRepository.findByUsername(username);
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // 驗證密碼
            const match = await bcrypt.compare(password, user.passwordHash);
            if (!match) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // 生成 JWT
            const payload = { sub: user.id };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET || 'your_jwt_secret_here',
                { expiresIn: '1h' }
            );

            return {
                success: true,
                token,
                message: 'Login successful',
                user
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Login failed'
            };
        }
    }
}
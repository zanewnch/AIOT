/**
 * UserController 單元測試套件
 *
 * 測試目標：驗證 UserController 各方法的業務邏輯
 * 測試層級：單元測試 (Unit Test)
 * 特色：
 * - 完全隔離外部依賴 (UserModel)
 * - 專注測試 UserController 的核心邏輯
 * - 驗證錯誤處理、參數處理、回應格式
 * - 涵蓋使用者 CRUD 操作的所有場景
 */
import { Request, Response } from 'express';
import { UserController } from '../src/controllers/rbac/UserController.js';
import { UserModel } from '../src/models/rbac/UserModel.js';

// 模擬 UserModel
jest.mock('../src/models/rbac/UserModel.js');

describe('UserController Unit Tests', () => {
    let userController: UserController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        userController = new UserController();

        mockRequest = {};
        mockResponse = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        mockNext = jest.fn();

        // 清除所有模擬函數的呼叫記錄
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        test('應該成功返回所有使用者', async () => {
            const mockUsers = [
                {
                    id: 1,
                    username: 'john_doe',
                    email: 'john@example.com',
                    passwordHash: '$2b$10$hashedpassword1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    username: 'jane_smith',
                    email: 'jane@example.com',
                    passwordHash: '$2b$10$hashedpassword2',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            (UserModel.findAll as jest.Mock).mockResolvedValue(mockUsers);

            await userController.getUsers(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findAll).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (UserModel.findAll as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.getUsers(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch users',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該正確處理空使用者列表', async () => {
            (UserModel.findAll as jest.Mock).mockResolvedValue([]);

            await userController.getUsers(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findAll).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });
    });

    describe('getUserById', () => {
        beforeEach(() => {
            mockRequest.params = { userId: '1' };
        });

        test('應該成功返回指定 ID 的使用者', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                passwordHash: '$2b$10$hashedpassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userController.getUserById(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            await userController.getUserById(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (UserModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.getUserById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch user',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該正確處理各種 ID 格式', async () => {
            mockRequest.params = { userId: '123' };
            const mockUser = { id: 123, username: 'test_user', email: 'test@example.com' };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userController.getUserById(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('123');
            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('createUser', () => {
        beforeEach(() => {
            mockRequest.body = {
                username: 'new_user',
                email: 'new_user@example.com',
                passwordHash: '$2b$10$newhashedpassword'
            };
        });

        test('應該成功創建新使用者', async () => {
            const mockCreatedUser = {
                id: 3,
                username: 'new_user',
                email: 'new_user@example.com',
                passwordHash: '$2b$10$newhashedpassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            await userController.createUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.create).toHaveBeenCalledWith({
                username: 'new_user',
                email: 'new_user@example.com',
                passwordHash: '$2b$10$newhashedpassword'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedUser);
        });

        test('應該處理必要欄位的創建', async () => {
            const mockCreatedUser = {
                id: 4,
                username: 'minimal_user',
                email: 'minimal@example.com',
                passwordHash: '$2b$10$minimalpassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.body = {
                username: 'minimal_user',
                email: 'minimal@example.com',
                passwordHash: '$2b$10$minimalpassword'
            };

            (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            await userController.createUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.create).toHaveBeenCalledWith({
                username: 'minimal_user',
                email: 'minimal@example.com',
                passwordHash: '$2b$10$minimalpassword'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedUser);
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Unique constraint violation');
            (UserModel.create as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.createUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to create user',
                error: 'Unique constraint violation'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該處理重複使用者名稱的錯誤', async () => {
            const mockError = new Error('Duplicate entry for username');
            (UserModel.create as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.createUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to create user',
                error: 'Duplicate entry for username'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('updateUser', () => {
        beforeEach(() => {
            mockRequest.params = { userId: '1' };
            mockRequest.body = {
                username: 'updated_user',
                email: 'updated@example.com',
                passwordHash: '$2b$10$updatedpassword'
            };
        });

        test('應該成功更新使用者', async () => {
            const mockUser = {
                id: 1,
                username: 'old_user',
                email: 'old@example.com',
                passwordHash: '$2b$10$oldpassword',
                update: jest.fn().mockResolvedValue(undefined)
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userController.updateUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockUser.update).toHaveBeenCalledWith({
                username: 'updated_user',
                email: 'updated@example.com',
                passwordHash: '$2b$10$updatedpassword'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });

        test('應該在部分更新時正確處理', async () => {
            mockRequest.body = {
                email: 'newemail@example.com'
            };

            const mockUser = {
                id: 1,
                username: 'existing_user',
                email: 'old@example.com',
                passwordHash: '$2b$10$existingpassword',
                update: jest.fn().mockResolvedValue(undefined)
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userController.updateUser(mockRequest as Request, mockResponse as Response);

            expect(mockUser.update).toHaveBeenCalledWith({
                username: undefined,
                email: 'newemail@example.com',
                passwordHash: undefined
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            await userController.updateUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (UserModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.updateUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to update user',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該處理密碼更新', async () => {
            mockRequest.body = {
                passwordHash: '$2b$10$newhashedpassword'
            };

            const mockUser = {
                id: 1,
                username: 'test_user',
                email: 'test@example.com',
                passwordHash: '$2b$10$oldpassword',
                update: jest.fn().mockResolvedValue(undefined)
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userController.updateUser(mockRequest as Request, mockResponse as Response);

            expect(mockUser.update).toHaveBeenCalledWith({
                username: undefined,
                email: undefined,
                passwordHash: '$2b$10$newhashedpassword'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('deleteUser', () => {
        beforeEach(() => {
            mockRequest.params = { userId: '1' };
        });

        test('應該成功刪除使用者', async () => {
            const mockUser = {
                id: 1,
                username: 'user_to_delete',
                email: 'delete@example.com',
                passwordHash: '$2b$10$password',
                destroy: jest.fn().mockResolvedValue(undefined)
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockUser.destroy).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Foreign key constraint error');
            (UserModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to delete user',
                error: 'Foreign key constraint error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該正確處理級聯刪除相關的錯誤', async () => {
            const mockUser = {
                id: 1,
                username: 'admin_user',
                email: 'admin@example.com',
                destroy: jest.fn().mockRejectedValue(new Error('Cannot delete user with active roles'))
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userController.deleteUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to delete user',
                error: 'Cannot delete user with active roles'
            });

            consoleSpy.mockRestore();
        });
    });

    // 注釋掉路由初始化測試，因為控制器不包含路由邏輯
    // describe('Router initialization', () => {
    //     test('應該正確初始化 router 和路由', () => {
    //         expect(userController.router).toBeDefined();
    //         expect(typeof userController.router).toBe('function');
    //     });
    // });
});
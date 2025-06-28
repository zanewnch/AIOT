/**
 * UserToRoleController 單元測試套件
 *
 * 測試目標：驗證 UserToRoleController 各方法的業務邏輯
 * 測試層級：單元測試 (Unit Test)
 * 特色：
 * - 完全隔離外部依賴 (UserModel, RoleModel)
 * - 專注測試使用者角色關聯的核心邏輯
 * - 驗證多對多關聯操作、錯誤處理、參數處理
 * - 涵蓋使用者角色分配、查詢、移除的所有場景
 */
import { Request, Response } from 'express';
import { UserToRoleController } from '../src/controller/rbac/UserToRoleController.js';
import { UserModel } from '../src/models/rbac/UserModel.js';
import { RoleModel } from '../src/models/rbac/RoleModel.js';

// 模擬 UserModel 和 RoleModel
jest.mock('../src/models/rbac/UserModel.js');
jest.mock('../src/models/rbac/RoleModel.js');

describe('UserToRoleController Unit Tests', () => {
    let userToRoleController: UserToRoleController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        userToRoleController = new UserToRoleController();

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

    describe('getUserRoles', () => {
        beforeEach(() => {
            mockRequest.params = { userId: '1' };
        });

        test('應該成功返回使用者的角色列表', async () => {
            const mockRoles = [
                {
                    id: 1,
                    name: 'admin',
                    displayName: '管理員',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    name: 'user',
                    displayName: '一般使用者',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                roles: mockRoles
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.getUserRoles(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1', { include: [RoleModel] });
            expect(mockResponse.json).toHaveBeenCalledWith(mockRoles);
        });

        test('應該處理使用者沒有角色的情況', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                roles: []
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.getUserRoles(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1', { include: [RoleModel] });
            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            await userToRoleController.getUserRoles(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1', { include: [RoleModel] });
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (UserModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userToRoleController.getUserRoles(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch user roles',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該正確處理各種使用者 ID 格式', async () => {
            mockRequest.params = { userId: '123' };
            const mockUser = {
                id: 123,
                username: 'test_user',
                roles: []
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.getUserRoles(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('123', { include: [RoleModel] });
            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });
    });

    describe('assignRolesToUser', () => {
        beforeEach(() => {
            mockRequest.params = { userId: '1' };
            mockRequest.body = { roleIds: [1, 2, 3] };
        });

        test('應該成功分配角色給使用者', async () => {
            const mockRoles = [
                { id: 1, name: 'admin', displayName: '管理員' },
                { id: 2, name: 'user', displayName: '一般使用者' },
                { id: 3, name: 'guest', displayName: '訪客' }
            ];

            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: [1, 2, 3] } });
            expect(mockUser.$add).toHaveBeenCalledWith('roles', mockRoles);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Roles assigned to user' });
        });

        test('應該處理單一角色分配', async () => {
            mockRequest.body = { roleIds: [1] };

            const mockRole = [{ id: 1, name: 'admin', displayName: '管理員' }];
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRole);

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: [1] } });
            expect(mockUser.$add).toHaveBeenCalledWith('roles', mockRole);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Roles assigned to user' });
        });

        test('應該處理空角色列表', async () => {
            mockRequest.body = { roleIds: [] };

            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue([]);

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: [] } });
            expect(mockUser.$add).toHaveBeenCalledWith('roles', []);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Roles assigned to user' });
        });

        test('應該處理部分角色不存在的情況', async () => {
            mockRequest.body = { roleIds: [1, 2, 999] }; // 999 不存在

            const mockRoles = [
                { id: 1, name: 'admin', displayName: '管理員' },
                { id: 2, name: 'user', displayName: '一般使用者' }
                // 角色 999 不存在，不會在結果中
            ];

            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: [1, 2, 999] } });
            expect(mockUser.$add).toHaveBeenCalledWith('roles', mockRoles);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Roles assigned to user' });
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
            expect(RoleModel.findAll).not.toHaveBeenCalled();
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (UserModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to assign roles',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該處理角色查詢失敗的情況', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockRejectedValue(new Error('Role query failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to assign roles',
                error: 'Role query failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該處理角色分配操作失敗的情況', async () => {
            const mockRoles = [{ id: 1, name: 'admin' }];
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockRejectedValue(new Error('Association failed'))
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userToRoleController.assignRolesToUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to assign roles',
                error: 'Association failed'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('removeRoleFromUser', () => {
        beforeEach(() => {
            mockRequest.params = { userId: '1', roleId: '2' };
        });

        test('應該成功從使用者移除角色', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 2);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role removed from user' });
        });

        test('應該正確處理字串角色 ID 轉數字', async () => {
            mockRequest.params = { userId: '1', roleId: '999' };

            const mockUser = {
                id: 1,
                username: 'test_user',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 999);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role removed from user' });
        });

        test('應該處理移除不存在的角色（冪等操作）', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 2);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role removed from user' });
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (UserModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to remove role',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該處理角色移除操作失敗的情況', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $remove: jest.fn().mockRejectedValue(new Error('Remove association failed'))
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to remove role',
                error: 'Remove association failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該處理無效的角色 ID', async () => {
            mockRequest.params = { userId: '1', roleId: 'invalid' };

            const mockUser = {
                id: 1,
                username: 'john_doe',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await userToRoleController.removeRoleFromUser(mockRequest as Request, mockResponse as Response);

            // Number('invalid') 會返回 NaN
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', NaN);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role removed from user' });
        });
    });

    describe('Router initialization', () => {
        test('應該正確初始化 router 和路由', () => {
            expect(userToRoleController.router).toBeDefined();
            expect(typeof userToRoleController.router).toBe('function');
        });
    });
});
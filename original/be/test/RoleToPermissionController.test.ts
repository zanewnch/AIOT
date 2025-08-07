/**
 * RoleToPermissionController 單元測試套件
 *
 * 測試目標：驗證 RoleToPermissionController 角色權限關聯操作的業務邏輯
 * 測試層級：單元測試 (Unit Test)
 * 特色：
 * - 完全隔離外部依賴 (RoleModel, PermissionModel)
 * - 專注測試 Controller 的核心邏輯
 * - 驗證錯誤處理、參數處理、回應格式
 * - 測試 Sequelize 關聯操作模擬
 */
import { Request, Response } from 'express';
import { RoleToPermissionController } from '../src/controllers/rbac/RoleToPermissionController.js';
import { RoleModel } from '../src/models/rbac/RoleModel.js';
import { PermissionModel } from '../src/models/rbac/PermissionModel.js';

// 模擬 RoleModel 和 PermissionModel
jest.mock('../src/models/rbac/RoleModel.js');
jest.mock('../src/models/rbac/PermissionModel.js');

describe('RoleToPermissionController Unit Tests', () => {
    let roleToPermissionController: RoleToPermissionController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        roleToPermissionController = new RoleToPermissionController();

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

    describe('getRolePermissions', () => {
        beforeEach(() => {
            mockRequest.params = { roleId: '1' };
        });

        test('應該成功返回角色的權限列表', async () => {
            const mockPermissions = [
                { id: 1, name: 'read_users', description: '讀取使用者' },
                { id: 2, name: 'write_users', description: '寫入使用者' }
            ];

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                permissions: mockPermissions
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleToPermissionController.getRolePermissions(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1', { include: [PermissionModel] });
            expect(mockResponse.json).toHaveBeenCalledWith(mockPermissions);
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            await roleToPermissionController.getRolePermissions(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1', { include: [PermissionModel] });
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleToPermissionController.getRolePermissions(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch role permissions',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該正確處理空權限列表', async () => {
            const mockRole = {
                id: 1,
                name: 'basic_user',
                displayName: '基本使用者',
                permissions: []
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleToPermissionController.getRolePermissions(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });
    });

    describe('assignPermissionsToRole', () => {
        beforeEach(() => {
            mockRequest.params = { roleId: '1' };
            mockRequest.body = { permissionIds: [1, 2, 3] };
        });

        test('應該成功分配權限給角色', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            const mockPermissions = [
                { id: 1, name: 'read_users', description: '讀取使用者' },
                { id: 2, name: 'write_users', description: '寫入使用者' },
                { id: 3, name: 'delete_users', description: '刪除使用者' }
            ];

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue(mockPermissions);

            await roleToPermissionController.assignPermissionsToRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(PermissionModel.findAll).toHaveBeenCalledWith({ where: { id: [1, 2, 3] } });
            expect(mockRole.$add).toHaveBeenCalledWith('permissions', mockPermissions);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permissions assigned to role' });
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            await roleToPermissionController.assignPermissionsToRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
            expect(PermissionModel.findAll).not.toHaveBeenCalled();
        });

        test('應該處理空權限ID陣列', async () => {
            mockRequest.body = { permissionIds: [] };

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue([]);

            await roleToPermissionController.assignPermissionsToRole(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findAll).toHaveBeenCalledWith({ where: { id: [] } });
            expect(mockRole.$add).toHaveBeenCalledWith('permissions', []);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permissions assigned to role' });
        });

        test('應該處理部分權限不存在的情況', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            // 只有兩個權限存在，第三個不存在
            const mockPermissions = [
                { id: 1, name: 'read_users', description: '讀取使用者' },
                { id: 2, name: 'write_users', description: '寫入使用者' }
            ];

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue(mockPermissions);

            await roleToPermissionController.assignPermissionsToRole(mockRequest as Request, mockResponse as Response);

            expect(mockRole.$add).toHaveBeenCalledWith('permissions', mockPermissions);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permissions assigned to role' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database constraint error');
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleToPermissionController.assignPermissionsToRole(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to assign permissions',
                error: 'Database constraint error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('removePermissionFromRole', () => {
        beforeEach(() => {
            mockRequest.params = { roleId: '1', permissionId: '2' };
        });

        test('應該成功從角色移除權限', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleToPermissionController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockRole.$remove).toHaveBeenCalledWith('permissions', 2);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission removed from role' });
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            await roleToPermissionController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
        });

        test('應該正確處理數字格式的權限ID', async () => {
            mockRequest.params = { roleId: '1', permissionId: '123' };

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleToPermissionController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(mockRole.$remove).toHaveBeenCalledWith('permissions', 123);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission removed from role' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Foreign key constraint error');
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleToPermissionController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to remove permission',
                error: 'Foreign key constraint error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });

        test('應該處理不存在的權限移除操作', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $remove: jest.fn().mockResolvedValue(0) // 返回 0 表示沒有移除任何關聯
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleToPermissionController.removePermissionFromRole(mockRequest as Request, mockResponse as Response);

            expect(mockRole.$remove).toHaveBeenCalledWith('permissions', 2);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission removed from role' });
        });
    });

    // describe('Router initialization', () => {
    //     test('應該正確初始化 router 和路由', () => {
    //         expect(roleToPermissionController.router).toBeDefined();
    //         expect(typeof roleToPermissionController.router).toBe('function');
    //     });
    // });
});
import { Request, Response } from 'express';
import { PermissionController } from '../src/controller/rbac/PermissionController.js';
import { PermissionModel } from '../src/models/rbac/PermissionModel.js';

// Mock PermissionModel
jest.mock('../src/models/rbac/PermissionModel.js');

describe('PermissionController', () => {
    let permissionController: PermissionController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        permissionController = new PermissionController();

        mockRequest = {};
        mockResponse = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        mockNext = jest.fn();

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('getPermissions', () => {
        test('應該成功返回所有權限', async () => {
            const mockPermissions = [
                { id: 1, name: 'read_users', description: '讀取使用者' },
                { id: 2, name: 'write_users', description: '寫入使用者' }
            ];

            (PermissionModel.findAll as jest.Mock).mockResolvedValue(mockPermissions);

            await permissionController.getPermissions(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findAll).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockPermissions);
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database error');
            (PermissionModel.findAll as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await permissionController.getPermissions(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch permissions',
                error: 'Database error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('getPermissionById', () => {
        beforeEach(() => {
            mockRequest.params = { permissionId: '1' };
        });

        test('應該成功返回指定 ID 的權限', async () => {
            const mockPermission = { id: 1, name: 'read_users', description: '讀取使用者' };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            await permissionController.getPermissionById(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith(mockPermission);
        });

        test('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            await permissionController.getPermissionById(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database error');
            (PermissionModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await permissionController.getPermissionById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch permission',
                error: 'Database error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('createPermission', () => {
        beforeEach(() => {
            mockRequest.body = {
                name: 'new_permission',
                description: '新權限描述'
            };
        });

        test('應該成功創建新權限', async () => {
            const mockCreatedPermission = {
                id: 1,
                name: 'new_permission',
                description: '新權限描述',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (PermissionModel.create as jest.Mock).mockResolvedValue(mockCreatedPermission);

            await permissionController.createPermission(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.create).toHaveBeenCalledWith({
                name: 'new_permission',
                description: '新權限描述'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedPermission);
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database error');
            (PermissionModel.create as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await permissionController.createPermission(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to create permission',
                error: 'Database error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('updatePermission', () => {
        beforeEach(() => {
            mockRequest.params = { permissionId: '1' };
            mockRequest.body = {
                name: 'updated_permission',
                description: '更新的權限描述'
            };
        });

        test('應該成功更新權限', async () => {
            const mockPermission = {
                id: 1,
                name: 'old_permission',
                description: '舊描述',
                update: jest.fn().mockResolvedValue(undefined)
            };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockPermission.update).toHaveBeenCalledWith({
                name: 'updated_permission',
                description: '更新的權限描述'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockPermission);
        });

        test('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database error');
            (PermissionModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await permissionController.updatePermission(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to update permission',
                error: 'Database error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('deletePermission', () => {
        beforeEach(() => {
            mockRequest.params = { permissionId: '1' };
        });

        test('應該成功刪除權限', async () => {
            const mockPermission = {
                id: 1,
                name: 'permission_to_delete',
                destroy: jest.fn().mockResolvedValue(undefined)
            };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            await permissionController.deletePermission(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockPermission.destroy).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        test('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            await permissionController.deletePermission(mockRequest as Request, mockResponse as Response);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database error');
            (PermissionModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await permissionController.deletePermission(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to delete permission',
                error: 'Database error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('路由初始化', () => {
        test('應該正確初始化所有路由', () => {
            const router = permissionController.router;
            expect(router).toBeDefined();

            // 檢查路由堆疊是否包含預期的路徑
            const routes = router.stack.map((layer: any) => ({
                path: layer.route?.path,
                methods: layer.route?.methods
            }));

            expect(routes).toContainEqual({
                path: '/',
                methods: { get: true, post: true }
            });

            expect(routes).toContainEqual({
                path: '/:permissionId',
                methods: { get: true, put: true, delete: true }
            });
        });
    });
});
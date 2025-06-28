/**
 * RoleController 單元測試套件
 *
 * 測試目標：驗證 RoleController 各方法的業務邏輯
 * 測試層級：單元測試 (Unit Test)
 * 特色：
 * - 完全隔離外部依賴 (RoleModel)
 * - 專注測試 RoleController 的核心邏輯
 * - 驗證錯誤處理、參數處理、回應格式
 */
import { Request, Response } from 'express';
import { RoleController } from '../src/controller/rbac/RoleController.js';
import { RoleModel } from '../src/models/rbac/RoleModel.js';

// 模擬 RoleModel
jest.mock('../src/models/rbac/RoleModel.js');

describe('RoleController Unit Tests', () => {
    let roleController: RoleController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        roleController = new RoleController();

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

    describe('getRoles', () => {
        test('應該成功返回所有角色', async () => {
            const mockRoles = [
                { id: 1, name: 'admin', displayName: '系統管理員', createdAt: new Date(), updatedAt: new Date() },
                { id: 2, name: 'user', displayName: '一般使用者', createdAt: new Date(), updatedAt: new Date() }
            ];

            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            await roleController.getRoles(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findAll).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(mockRoles);
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (RoleModel.findAll as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleController.getRoles(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch roles',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('getRoleById', () => {
        beforeEach(() => {
            mockRequest.params = { roleId: '1' };
        });

        test('應該成功返回指定 ID 的角色', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.json).toHaveBeenCalledWith(mockRole);
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleController.getRoleById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to fetch role',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('createRole', () => {
        beforeEach(() => {
            mockRequest.body = {
                name: 'editor',
                displayName: '編輯者'
            };
        });

        test('應該成功創建新角色', async () => {
            const mockCreatedRole = {
                id: 3,
                name: 'editor',
                displayName: '編輯者',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (RoleModel.create as jest.Mock).mockResolvedValue(mockCreatedRole);

            await roleController.createRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.create).toHaveBeenCalledWith({
                name: 'editor',
                displayName: '編輯者'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedRole);
        });

        test('應該在僅提供 name 時成功創建角色', async () => {
            mockRequest.body = { name: 'viewer' };

            const mockCreatedRole = {
                id: 4,
                name: 'viewer',
                displayName: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (RoleModel.create as jest.Mock).mockResolvedValue(mockCreatedRole);

            await roleController.createRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.create).toHaveBeenCalledWith({
                name: 'viewer',
                displayName: undefined
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedRole);
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Duplicate key error');
            (RoleModel.create as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleController.createRole(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to create role',
                error: 'Duplicate key error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('updateRole', () => {
        beforeEach(() => {
            mockRequest.params = { roleId: '1' };
            mockRequest.body = {
                name: 'updated_admin',
                displayName: '更新的管理員'
            };
        });

        test('應該成功更新角色', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                update: jest.fn().mockResolvedValue(undefined)
            };
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockRole.update).toHaveBeenCalledWith({
                name: 'updated_admin',
                displayName: '更新的管理員'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockRole);
        });

        test('應該在部分更新時正確處理', async () => {
            mockRequest.body = { displayName: '僅更新顯示名稱' };

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                update: jest.fn().mockResolvedValue(undefined)
            };
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(mockRole.update).toHaveBeenCalledWith({
                name: undefined,
                displayName: '僅更新顯示名稱'
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockRole);
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Database connection error');
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleController.updateRole(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to update role',
                error: 'Database connection error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('deleteRole', () => {
        beforeEach(() => {
            mockRequest.params = { roleId: '1' };
        });

        test('應該成功刪除角色', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                destroy: jest.fn().mockResolvedValue(undefined)
            };
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockRole.destroy).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role not found' });
        });

        test('應該在發生錯誤時返回 500 狀態碼', async () => {
            const mockError = new Error('Foreign key constraint error');
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await roleController.deleteRole(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Failed to delete role',
                error: 'Foreign key constraint error'
            });
            expect(consoleSpy).toHaveBeenCalledWith(mockError);

            consoleSpy.mockRestore();
        });
    });

    describe('Router initialization', () => {
        test('應該正確初始化 router 和路由', () => {
            expect(roleController.router).toBeDefined();
            expect(typeof roleController.router).toBe('function');
        });
    });
});
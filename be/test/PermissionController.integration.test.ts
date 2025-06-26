import request from 'supertest';
import express from 'express';
import { PermissionController } from '../src/controller/rbac/PermissionController.js';
import { PermissionModel } from '../src/models/rbac/PermissionModel.js';

// Mock PermissionModel
jest.mock('../src/models/rbac/PermissionModel.js');

describe('PermissionController Integration Tests', () => {
    let app: express.Application;
    let permissionController: PermissionController;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        permissionController = new PermissionController();
        app.use('/permissions', permissionController.router);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('GET /permissions', () => {
        it('應該返回所有權限並返回 200 狀態碼', async () => {
            const mockPermissions = [
                { id: 1, name: 'read_users', description: '讀取使用者' },
                { id: 2, name: 'write_users', description: '寫入使用者' }
            ];

            (PermissionModel.findAll as jest.Mock).mockResolvedValue(mockPermissions);

            const response = await request(app)
                .get('/permissions')
                .expect(200);

            expect(response.body).toEqual(mockPermissions);
            expect(PermissionModel.findAll).toHaveBeenCalled();
        });

        it('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (PermissionModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/permissions')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch permissions',
                error: 'Database error'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('GET /permissions/:permissionId', () => {
        it('應該返回指定 ID 的權限並返回 200 狀態碼', async () => {
            const mockPermission = { id: 1, name: 'read_users', description: '讀取使用者' };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            const response = await request(app)
                .get('/permissions/1')
                .expect(200);

            expect(response.body).toEqual(mockPermission);
            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
        });

        it('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get('/permissions/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'Permission not found' });
        });

        it('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/permissions/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch permission',
                error: 'Database error'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('POST /permissions', () => {
        it('應該成功創建新權限並返回 201 狀態碼', async () => {
            const newPermission = {
                name: 'delete_users',
                description: '刪除使用者'
            };

            const mockCreatedPermission = {
                id: 3,
                ...newPermission,
                createdAt: '2025-06-26T06:46:04.861Z',
                updatedAt: '2025-06-26T06:46:04.861Z'
            };

            (PermissionModel.create as jest.Mock).mockResolvedValue(mockCreatedPermission);

            const response = await request(app)
                .post('/permissions')
                .send(newPermission)
                .expect(201);

            expect(response.body).toEqual(mockCreatedPermission);
            expect(PermissionModel.create).toHaveBeenCalledWith(newPermission);
        });

        it('應該接受只有名稱的權限（description 為可選）', async () => {
            const newPermission = {
                name: 'new_permission'
            };

            const mockCreatedPermission = {
                id: 4,
                name: 'new_permission',
                createdAt: '2025-06-26T06:46:04.885Z',
                updatedAt: '2025-06-26T06:46:04.885Z'
            };

            (PermissionModel.create as jest.Mock).mockResolvedValue(mockCreatedPermission);

            const response = await request(app)
                .post('/permissions')
                .send(newPermission)
                .expect(201);

            expect(response.body).toEqual(mockCreatedPermission);
            expect(PermissionModel.create).toHaveBeenCalledWith({
                name: 'new_permission',
                description: undefined
            });
        });

        it('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (PermissionModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/permissions')
                .send({ name: 'test_permission' })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to create permission',
                error: 'Database error'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('PUT /permissions/:permissionId', () => {
        it('應該成功更新權限並返回 200 狀態碼', async () => {
            const updateData = {
                name: 'updated_permission',
                description: '更新的權限描述'
            };

            const mockPermission = {
                id: 1,
                name: 'old_permission',
                description: '舊描述',
                update: jest.fn().mockResolvedValue(undefined)
            };

            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            const response = await request(app)
                .put('/permissions/1')
                .send(updateData)
                .expect(200);

            expect(response.body).toMatchObject({
                id: 1,
                name: 'old_permission',
                description: '舊描述'
            });
            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockPermission.update).toHaveBeenCalledWith(updateData);
        });

        it('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put('/permissions/999')
                .send({ name: 'test' })
                .expect(404);

            expect(response.body).toEqual({ message: 'Permission not found' });
        });

        it('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .put('/permissions/1')
                .send({ name: 'test' })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to update permission',
                error: 'Database error'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('DELETE /permissions/:permissionId', () => {
        it('應該成功刪除權限並返回 204 狀態碼', async () => {
            const mockPermission = {
                id: 1,
                name: 'permission_to_delete',
                destroy: jest.fn().mockResolvedValue(undefined)
            };

            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            await request(app)
                .delete('/permissions/1')
                .expect(204);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockPermission.destroy).toHaveBeenCalled();
        });

        it('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/permissions/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'Permission not found' });
        });

        it('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/permissions/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to delete permission',
                error: 'Database error'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('HTTP 方法和路由', () => {
        it('應該拒絕不支援的 HTTP 方法', async () => {
            await request(app)
                .patch('/permissions/1')
                .expect(404);
        });

        it('應該正確處理參數驗證（非數字 ID）', async () => {
            const mockPermission = { id: 1, name: 'test' };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            const response = await request(app)
                .get('/permissions/abc')
                .expect(200);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('abc');
        });
    });

    describe('Content-Type 處理', () => {
        it('應該正確處理 JSON Content-Type', async () => {
            const mockCreatedPermission = {
                id: 1,
                name: 'test_permission',
                description: '測試描述'
            };

            (PermissionModel.create as jest.Mock).mockResolvedValue(mockCreatedPermission);

            await request(app)
                .post('/permissions')
                .set('Content-Type', 'application/json')
                .send({ name: 'test_permission', description: '測試描述' })
                .expect(201);

            expect(PermissionModel.create).toHaveBeenCalledWith({
                name: 'test_permission',
                description: '測試描述'
            });
        });
    });
});
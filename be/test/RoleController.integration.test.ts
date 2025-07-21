/**
 * RoleController 整合測試套件
 *
 * 測試目標：驗證 RoleController 與 Express 路由的整合行為
 * 測試層級：整合測試 (Integration Test)
 * 特色：
 * - 模擬 RoleModel 但保留 Express 真實路由機制
 * - 重點測試 HTTP 請求/回應流程
 * - 驗證狀態碼、回應格式、錯誤處理
 * - 測試路由參數處理和中介軟體整合
 */
import express from 'express';
import request from 'supertest';
import { RoleController } from '../src/controller/rbac/RoleController.js';
import { RoleModel } from '../src/models/rbac/RoleModel.js';
import { rbacRoutes } from '../src/routes/rbacRoutes.js';

/**
 * 完整模擬 RoleModel 模組
 * 目的：隔離資料庫層，專注測試 Controller 與路由整合
 */
jest.mock('../src/models/rbac/RoleModel.js');

/**
 * 模擬 JWT Authentication Middleware (如果有使用)
 * 目的：隔離認證邏輯，專注測試 RoleController 的業務邏輯
 */
jest.mock('../src/middleware/jwtAuthMiddleware.js', () => ({
    JwtAuthMiddleware: jest.fn().mockImplementation(() => ({
        authenticate: jest.fn((req, res, next) => {
            // 模擬已認證的用戶
            req.user = {
                id: 1,
                username: 'testuser'
            };
            next();
        }),
        optional: jest.fn((req, res, next) => {
            req.user = {
                id: 1,
                username: 'testuser'
            };
            next();
        })
    }))
}));

describe('RoleController Integration Tests', () => {
    let app: express.Application;
    let roleController: RoleController;

    /**
     * 測試前置設定
     * 執行時機：每個 test 案例前
     */
    beforeEach(() => {
        app = express();
        app.use(express.json()); // 啟用 JSON 解析中介軟體

        roleController = new RoleController();
        app.use('/api/rbac', rbacRoutes); // 掛載測試路由

        // 清除所有模擬函數的呼叫記錄
        jest.clearAllMocks();
    });

    describe('GET /roles', () => {
        test('應該返回所有角色並返回 200 狀態碼', async () => {
            const mockRoles = [
                { id: 1, name: 'admin', displayName: '系統管理員', createdAt: '2025-06-26T09:12:38.106Z', updatedAt: '2025-06-26T09:12:38.106Z' },
                { id: 2, name: 'user', displayName: '一般使用者', createdAt: '2025-06-26T09:12:38.106Z', updatedAt: '2025-06-26T09:12:38.106Z' },
                { id: 3, name: 'editor', displayName: '編輯者', createdAt: '2025-06-26T09:12:38.106Z', updatedAt: '2025-06-26T09:12:38.106Z' }
            ];

            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            const response = await request(app)
                .get('/api/rbac/roles')
                .expect(200);

            expect(response.body).toEqual(mockRoles);
            expect(RoleModel.findAll).toHaveBeenCalled();
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findAll as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/api/rbac/roles')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch roles',
                error: 'Database connection failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理空結果', async () => {
            (RoleModel.findAll as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .get('/api/rbac/roles')
                .expect(200);

            expect(response.body).toEqual([]);
            expect(RoleModel.findAll).toHaveBeenCalled();
        });
    });

    describe('GET /roles/:roleId', () => {
        test('應該返回指定 ID 的角色並返回 200 狀態碼', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                createdAt: '2025-06-26T09:12:38.150Z',
                updatedAt: '2025-06-26T09:12:38.150Z'
            };
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .get('/api/rbac/roles/1')
                .expect(200);

            expect(response.body).toEqual(mockRole);
            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get('/api/rbac/roles/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'Role not found' });
            expect(RoleModel.findByPk).toHaveBeenCalledWith('999');
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database query failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/api/rbac/roles/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch role',
                error: 'Database query failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理各種 ID 格式', async () => {
            const mockRole = { id: 123, name: 'test', displayName: '測試角色' };
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            // 測試數字 ID
            await request(app)
                .get('/api/rbac/roles/123')
                .expect(200);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('123');
        });
    });

    describe('POST /roles', () => {
        test('應該成功創建新角色並返回 201 狀態碼', async () => {
            const newRoleData = {
                name: 'moderator',
                displayName: '版主'
            };

            const mockCreatedRole = {
                id: 4,
                ...newRoleData,
                createdAt: '2025-06-26T09:12:38.162Z',
                updatedAt: '2025-06-26T09:12:38.162Z'
            };

            (RoleModel.create as jest.Mock).mockResolvedValue(mockCreatedRole);

            const response = await request(app)
                .post('/api/rbac/roles')
                .send(newRoleData)
                .expect(201);

            expect(response.body).toEqual(mockCreatedRole);
            expect(RoleModel.create).toHaveBeenCalledWith(newRoleData);
        });

        test('應該在僅提供必要欄位時成功創建角色', async () => {
            const newRoleData = { name: 'guest' };
            const mockCreatedRole = {
                id: 5,
                name: 'guest',
                createdAt: '2025-06-26T09:12:38.182Z',
                updatedAt: '2025-06-26T09:12:38.182Z'
            };

            (RoleModel.create as jest.Mock).mockResolvedValue(mockCreatedRole);

            const response = await request(app)
                .post('/api/rbac/roles')
                .send(newRoleData)
                .expect(201);

            expect(response.body).toEqual(mockCreatedRole);
            expect(RoleModel.create).toHaveBeenCalledWith(newRoleData);
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            const newRoleData = { name: 'duplicate_role', displayName: '重複角色' };
            (RoleModel.create as jest.Mock).mockRejectedValue(new Error('Unique constraint violation'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/api/rbac/roles')
                .send(newRoleData)
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to create role',
                error: 'Unique constraint violation'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理 JSON 格式的請求', async () => {
            const newRoleData = {
                name: 'api_user',
                displayName: 'API 使用者'
            };

            const mockCreatedRole = { id: 6, ...newRoleData };
            (RoleModel.create as jest.Mock).mockResolvedValue(mockCreatedRole);

            const response = await request(app)
                .post('/api/rbac/roles')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(newRoleData))
                .expect(201);

            expect(response.body).toEqual(mockCreatedRole);
        });
    });

    describe('PUT /roles/:roleId', () => {
        test('應該成功更新角色並返回 200 狀態碼', async () => {
            const updateData = {
                name: 'super_admin',
                displayName: '超級管理員'
            };

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '管理員',
                update: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .put('/api/rbac/roles/1')
                .send(updateData)
                .expect(200);

            expect(response.body).toEqual({
                id: 1,
                name: 'admin',
                displayName: '管理員'
            });
            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockRole.update).toHaveBeenCalledWith(updateData);
        });

        test('應該在部分更新時正確處理', async () => {
            const updateData = { displayName: '僅更新顯示名稱' };

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '管理員',
                update: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .put('/api/rbac/roles/1')
                .send(updateData)
                .expect(200);

            expect(mockRole.update).toHaveBeenCalledWith(updateData);
            expect(response.body).toEqual({
                id: 1,
                name: 'admin',
                displayName: '管理員'
            });
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put('/api/rbac/roles/999')
                .send({ name: 'nonexistent' })
                .expect(404);

            expect(response.body).toEqual({ message: 'Role not found' });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database update failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .put('/api/rbac/roles/1')
                .send({ name: 'updated_role' })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to update role',
                error: 'Database update failed'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('DELETE /roles/:roleId', () => {
        test('應該成功刪除角色並返回 204 狀態碼', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '管理員',
                destroy: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .delete('/api/rbac/roles/1')
                .expect(204);

            expect(response.body).toEqual({});
            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockRole.destroy).toHaveBeenCalled();
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/rbac/roles/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'Role not found' });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(new Error('Foreign key constraint'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/api/rbac/roles/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to delete role',
                error: 'Foreign key constraint'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('路由整合測試', () => {
        test('應該正確處理不存在的路由', async () => {
            await request(app)
                .get('/api/rbac/roles/1/nonexistent')
                .expect(404);
        });

        test('應該正確設置 Content-Type', async () => {
            const mockRoles = [{ id: 1, name: 'admin', displayName: '管理員' }];
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            const response = await request(app)
                .get('/api/rbac/roles')
                .expect(200);

            expect(response.type).toBe('application/json');
        });

        test('應該正確處理中介軟體堆疊', async () => {
            // 測試 express.json() 中介軟體
            const newRoleData = { name: 'middleware_test' };
            const mockCreatedRole = { id: 10, ...newRoleData };
            (RoleModel.create as jest.Mock).mockResolvedValue(mockCreatedRole);

            await request(app)
                .post('/api/rbac/roles')
                .send(newRoleData)
                .expect(201);

            expect(RoleModel.create).toHaveBeenCalledWith(newRoleData);
        });
    });
});
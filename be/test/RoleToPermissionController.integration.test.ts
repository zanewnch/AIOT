/**
 * RoleToPermissionController 整合測試套件
 *
 * 測試目標：驗證 RoleToPermissionController 與 Express 路由的整合行為
 * 測試層級：整合測試 (Integration Test)
 * 特色：
 * - 模擬 RoleModel 和 PermissionModel 但保留 Express 真實路由機制
 * - 重點測試 HTTP 請求/回應流程
 * - 驗證狀態碼、回應格式、錯誤處理
 * - 測試角色權限關聯操作的路由參數處理
 */
import express from 'express';
import request from 'supertest';
import { RoleToPermissionController } from '../src/controller/rbac/RoleToPermissionController.js';
import { RoleModel } from '../src/models/rbac/RoleModel.js';
import { PermissionModel } from '../src/models/rbac/PermissionModel.js';

/**
 * 完整模擬相關模組
 * 目的：隔離資料庫層，專注測試 Controller 與路由整合
 */
jest.mock('../src/models/rbac/RoleModel.js');
jest.mock('../src/models/rbac/PermissionModel.js');

/**
 * 模擬 JWT Authentication Middleware (如果有使用)
 * 目的：隔離認證邏輯，專注測試 RoleToPermissionController 的業務邏輯
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

describe('RoleToPermissionController Integration Tests', () => {
    let app: express.Application;
    let roleToPermissionController: RoleToPermissionController;

    /**
     * 測試前置設定
     * 執行時機：每個 test 案例前
     */
    beforeEach(() => {
        app = express();
        app.use(express.json()); // 啟用 JSON 解析中介軟體

        roleToPermissionController = new RoleToPermissionController();
        app.use('/roles', roleToPermissionController.router); // 掛載測試路由

        // 清除所有模擬函數的呼叫記錄
        jest.clearAllMocks();
    });

    describe('GET /roles/:roleId/permissions', () => {
        test('應該返回角色的權限列表並返回 200 狀態碼', async () => {
            const mockPermissions = [
                { id: 1, name: 'read_users', description: '讀取使用者', createdAt: '2025-06-26T09:12:38.106Z', updatedAt: '2025-06-26T09:12:38.106Z' },
                { id: 2, name: 'write_users', description: '寫入使用者', createdAt: '2025-06-26T09:12:38.106Z', updatedAt: '2025-06-26T09:12:38.106Z' },
                { id: 3, name: 'delete_users', description: '刪除使用者', createdAt: '2025-06-26T09:12:38.106Z', updatedAt: '2025-06-26T09:12:38.106Z' }
            ];

            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                permissions: mockPermissions
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .get('/roles/1/permissions')
                .expect(200);

            expect(response.body).toEqual(mockPermissions);
            expect(RoleModel.findByPk).toHaveBeenCalledWith('1', { include: [PermissionModel] });
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get('/roles/999/permissions')
                .expect(404);

            expect(response.body).toEqual({ message: 'Role not found' });
            expect(RoleModel.findByPk).toHaveBeenCalledWith('999', { include: [PermissionModel] });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/roles/1/permissions')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch role permissions',
                error: 'Database connection failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理空權限列表', async () => {
            const mockRole = {
                id: 2,
                name: 'basic_user',
                displayName: '基本使用者',
                permissions: []
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .get('/roles/2/permissions')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        test('應該正確處理各種角色 ID 格式', async () => {
            const mockRole = {
                id: 123,
                name: 'test_role',
                displayName: '測試角色',
                permissions: []
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await request(app)
                .get('/roles/123/permissions')
                .expect(200);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('123', { include: [PermissionModel] });
        });
    });

    describe('POST /roles/:roleId/permissions', () => {
        test('應該成功分配權限給角色並返回 200 狀態碼', async () => {
            const permissionIds = [1, 2, 3];
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

            const response = await request(app)
                .post('/roles/1/permissions')
                .send({ permissionIds })
                .expect(200);

            expect(response.body).toEqual({ message: 'Permissions assigned to role' });
            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(PermissionModel.findAll).toHaveBeenCalledWith({ where: { id: permissionIds } });
            expect(mockRole.$add).toHaveBeenCalledWith('permissions', mockPermissions);
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/roles/999/permissions')
                .send({ permissionIds: [1, 2] })
                .expect(404);

            expect(response.body).toEqual({ message: 'Role not found' });
            expect(PermissionModel.findAll).not.toHaveBeenCalled();
        });

        test('應該處理空權限ID陣列', async () => {
            const mockRole = {
                id: 1,
                name: 'basic_user',
                displayName: '基本使用者',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .post('/roles/1/permissions')
                .send({ permissionIds: [] })
                .expect(200);

            expect(response.body).toEqual({ message: 'Permissions assigned to role' });
            expect(PermissionModel.findAll).toHaveBeenCalledWith({ where: { id: [] } });
            expect(mockRole.$add).toHaveBeenCalledWith('permissions', []);
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database constraint violation'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/roles/1/permissions')
                .send({ permissionIds: [1, 2] })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to assign permissions',
                error: 'Database constraint violation'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理 JSON 格式的請求', async () => {
            const permissionIds = [1, 2];
            const mockRole = {
                id: 1,
                name: 'editor',
                displayName: '編輯者',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            const mockPermissions = [
                { id: 1, name: 'read_articles', description: '讀取文章' },
                { id: 2, name: 'write_articles', description: '寫入文章' }
            ];

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue(mockPermissions);

            const response = await request(app)
                .post('/roles/1/permissions')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ permissionIds }))
                .expect(200);

            expect(response.body).toEqual({ message: 'Permissions assigned to role' });
        });

        test('應該處理部分權限不存在的情況', async () => {
            const mockRole = {
                id: 1,
                name: 'moderator',
                displayName: '版主',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            // 請求 3 個權限，但只有 2 個存在
            const mockPermissions = [
                { id: 1, name: 'read_posts', description: '讀取貼文' },
                { id: 2, name: 'moderate_posts', description: '審核貼文' }
            ];

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue(mockPermissions);

            const response = await request(app)
                .post('/roles/1/permissions')
                .send({ permissionIds: [1, 2, 999] })
                .expect(200);

            expect(response.body).toEqual({ message: 'Permissions assigned to role' });
            expect(mockRole.$add).toHaveBeenCalledWith('permissions', mockPermissions);
        });
    });

    describe('DELETE /roles/:roleId/permissions/:permissionId', () => {
        test('應該成功從角色移除權限並返回 200 狀態碼', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '系統管理員',
                $remove: jest.fn().mockResolvedValue(1)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .delete('/roles/1/permissions/2')
                .expect(200);

            expect(response.body).toEqual({ message: 'Permission removed from role' });
            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockRole.$remove).toHaveBeenCalledWith('permissions', 2);
        });

        test('應該在角色不存在時返回 404 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/roles/999/permissions/1')
                .expect(404);

            expect(response.body).toEqual({ message: 'Role not found' });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (RoleModel.findByPk as jest.Mock).mockRejectedValue(new Error('Foreign key constraint error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/roles/1/permissions/2')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to remove permission',
                error: 'Foreign key constraint error'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理各種 ID 格式', async () => {
            const mockRole = {
                id: 123,
                name: 'test_role',
                displayName: '測試角色',
                $remove: jest.fn().mockResolvedValue(1)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await request(app)
                .delete('/roles/123/permissions/456')
                .expect(200);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('123');
            expect(mockRole.$remove).toHaveBeenCalledWith('permissions', 456);
        });

        test('應該處理不存在的權限移除操作', async () => {
            const mockRole = {
                id: 1,
                name: 'user',
                displayName: '使用者',
                $remove: jest.fn().mockResolvedValue(0) // 返回 0 表示沒有移除任何關聯
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .delete('/roles/1/permissions/999')
                .expect(200);

            expect(response.body).toEqual({ message: 'Permission removed from role' });
            expect(mockRole.$remove).toHaveBeenCalledWith('permissions', 999);
        });
    });

    describe('路由整合測試', () => {
        test('應該正確處理不存在的路由', async () => {
            await request(app)
                .get('/roles/1/permissions/invalid')
                .expect(404);
        });

        test('應該正確設置 Content-Type', async () => {
            const mockRole = {
                id: 1,
                name: 'admin',
                displayName: '管理員',
                permissions: []
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            const response = await request(app)
                .get('/roles/1/permissions')
                .expect(200);

            expect(response.type).toBe('application/json');
        });

        test('應該正確處理中介軟體堆疊', async () => {
            // 測試 express.json() 中介軟體
            const mockRole = {
                id: 1,
                name: 'test_role',
                displayName: '測試角色',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);
            (PermissionModel.findAll as jest.Mock).mockResolvedValue([]);

            await request(app)
                .post('/roles/1/permissions')
                .send({ permissionIds: [1] })
                .expect(200);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('1');
        });

        test('應該正確處理路由參數解析', async () => {
            const mockRole = {
                id: 42,
                name: 'special_role',
                displayName: '特殊角色',
                permissions: []
            };

            (RoleModel.findByPk as jest.Mock).mockResolvedValue(mockRole);

            await request(app)
                .get('/roles/42/permissions')
                .expect(200);

            expect(RoleModel.findByPk).toHaveBeenCalledWith('42', { include: [PermissionModel] });
        });
    });
});
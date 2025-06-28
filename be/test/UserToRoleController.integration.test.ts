/**
 * UserToRoleController 整合測試套件
 *
 * 測試目標：驗證 UserToRoleController 與 Express 路由的整合行為
 * 測試層級：整合測試 (Integration Test)
 * 特色：
 * - 模擬 UserModel 和 RoleModel 但保留 Express 真實路由機制
 * - 重點測試 HTTP 請求/回應流程
 * - 驗證狀態碼、回應格式、錯誤處理
 * - 測試使用者角色關聯操作的路由參數處理
 */
import express from 'express';
import request from 'supertest';
import { UserToRoleController } from '../src/controller/rbac/UserToRoleController.js';
import { UserModel } from '../src/models/rbac/UserModel.js';
import { RoleModel } from '../src/models/rbac/RoleModel.js';

/**
 * 完整模擬 UserModel 和 RoleModel 模組
 * 目的：隔離資料庫層，專注測試 Controller 與路由整合
 */
jest.mock('../src/models/rbac/UserModel.js');
jest.mock('../src/models/rbac/RoleModel.js');

/**
 * 模擬 JWT Authentication Middleware (如果有使用)
 * 目的：隔離認證邏輯，專注測試 UserToRoleController 的業務邏輯
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

describe('UserToRoleController Integration Tests', () => {
    let app: express.Application;
    let userToRoleController: UserToRoleController;

    /**
     * 測試前置設定
     * 執行時機：每個 test 案例前
     */
    beforeEach(() => {
        app = express();
        app.use(express.json()); // 啟用 JSON 解析中介軟體

        userToRoleController = new UserToRoleController();
        app.use('/users', userToRoleController.router); // 掛載測試路由

        // 清除所有模擬函數的呼叫記錄
        jest.clearAllMocks();
    });

    describe('GET /users/:userId/roles', () => {
        test('應該返回使用者的角色列表並返回 200 狀態碼', async () => {
            const mockRoles = [
                {
                    id: 1,
                    name: 'admin',
                    displayName: '管理員',
                    createdAt: '2025-06-26T09:12:38.106Z',
                    updatedAt: '2025-06-26T09:12:38.106Z'
                },
                {
                    id: 2,
                    name: 'user',
                    displayName: '一般使用者',
                    createdAt: '2025-06-26T09:12:38.106Z',
                    updatedAt: '2025-06-26T09:12:38.106Z'
                },
                {
                    id: 3,
                    name: 'guest',
                    displayName: '訪客',
                    createdAt: '2025-06-26T09:12:38.106Z',
                    updatedAt: '2025-06-26T09:12:38.106Z'
                }
            ];

            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                roles: mockRoles
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/users/1/roles')
                .expect(200);

            expect(response.body).toEqual(mockRoles);
            expect(UserModel.findByPk).toHaveBeenCalledWith('1', { include: [RoleModel] });
        });

        test('應該處理使用者沒有角色的情況', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                roles: []
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/users/1/roles')
                .expect(200);

            expect(response.body).toEqual([]);
            expect(UserModel.findByPk).toHaveBeenCalledWith('1', { include: [RoleModel] });
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get('/users/999/roles')
                .expect(404);

            expect(response.body).toEqual({ message: 'User not found' });
            expect(UserModel.findByPk).toHaveBeenCalledWith('999', { include: [RoleModel] });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/users/1/roles')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch user roles',
                error: 'Database connection failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理各種使用者 ID 格式', async () => {
            const mockUser = {
                id: 123,
                username: 'test_user',
                roles: []
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await request(app)
                .get('/users/123/roles')
                .expect(200);

            expect(UserModel.findByPk).toHaveBeenCalledWith('123', { include: [RoleModel] });
        });
    });

    describe('POST /users/:userId/roles', () => {
        test('應該成功分配角色給使用者並返回 200 狀態碼', async () => {
            const roleIds = [1, 2, 3];
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

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds })
                .expect(200);

            expect(response.body).toEqual({ message: 'Roles assigned to user' });
            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: roleIds } });
            expect(mockUser.$add).toHaveBeenCalledWith('roles', mockRoles);
        });

        test('應該處理單一角色分配', async () => {
            const roleIds = [1];
            const mockRoles = [{ id: 1, name: 'admin', displayName: '管理員' }];

            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds })
                .expect(200);

            expect(response.body).toEqual({ message: 'Roles assigned to user' });
            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: roleIds } });
        });

        test('應該處理空角色列表', async () => {
            const roleIds: number[] = [];
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds })
                .expect(200);

            expect(response.body).toEqual({ message: 'Roles assigned to user' });
            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: [] } });
        });

        test('應該處理部分角色不存在的情況', async () => {
            const roleIds = [1, 2, 999]; // 999 不存在
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

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds })
                .expect(200);

            expect(response.body).toEqual({ message: 'Roles assigned to user' });
            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: roleIds } });
            expect(mockUser.$add).toHaveBeenCalledWith('roles', mockRoles);
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/users/999/roles')
                .send({ roleIds: [1, 2] })
                .expect(404);

            expect(response.body).toEqual({ message: 'User not found' });
            expect(RoleModel.findAll).not.toHaveBeenCalled();
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds: [1, 2] })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to assign roles',
                error: 'Database connection failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理 JSON 格式的請求', async () => {
            const roleIds = [1, 2];
            const mockRoles = [
                { id: 1, name: 'admin' },
                { id: 2, name: 'user' }
            ];
            const mockUser = {
                id: 1,
                username: 'json_user',
                $add: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            const response = await request(app)
                .post('/users/1/roles')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ roleIds }))
                .expect(200);

            expect(response.body).toEqual({ message: 'Roles assigned to user' });
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

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds: [1, 2] })
                .expect(500);

            expect(response.body).toEqual({
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

            const response = await request(app)
                .post('/users/1/roles')
                .send({ roleIds: [1] })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to assign roles',
                error: 'Association failed'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('DELETE /users/:userId/roles/:roleId', () => {
        test('應該成功從使用者移除角色並返回 200 狀態碼', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/users/1/roles/2')
                .expect(200);

            expect(response.body).toEqual({ message: 'Role removed from user' });
            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 2);
        });

        test('應該正確處理字串角色 ID 轉數字', async () => {
            const mockUser = {
                id: 1,
                username: 'test_user',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/users/1/roles/999')
                .expect(200);

            expect(response.body).toEqual({ message: 'Role removed from user' });
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 999);
        });

        test('應該處理移除不存在的角色（冪等操作）', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/users/1/roles/2')
                .expect(200);

            expect(response.body).toEqual({ message: 'Role removed from user' });
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 2);
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/users/999/roles/1')
                .expect(404);

            expect(response.body).toEqual({ message: 'User not found' });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/users/1/roles/2')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to remove role',
                error: 'Database connection failed'
            });

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

            const response = await request(app)
                .delete('/users/1/roles/2')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to remove role',
                error: 'Remove association failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該處理無效的角色 ID', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/users/1/roles/invalid')
                .expect(200);

            expect(response.body).toEqual({ message: 'Role removed from user' });
            // Number('invalid') 會返回 NaN
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', NaN);
        });
    });

    describe('路由整合測試', () => {
        test('應該正確處理不存在的路由', async () => {
            await request(app)
                .get('/users/1/nonexistent')
                .expect(404);
        });

        test('應該正確設置 Content-Type', async () => {
            const mockUser = {
                id: 1,
                username: 'test_user',
                roles: []
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/users/1/roles')
                .expect(200);

            expect(response.type).toBe('application/json');
        });

        test('應該正確處理中介軟體堆疊', async () => {
            // 測試 express.json() 中介軟體
            const mockUser = {
                id: 1,
                username: 'middleware_test',
                $add: jest.fn().mockResolvedValue(undefined)
            };
            const mockRoles = [{ id: 1, name: 'admin' }];

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (RoleModel.findAll as jest.Mock).mockResolvedValue(mockRoles);

            await request(app)
                .post('/users/1/roles')
                .send({ roleIds: [1] })
                .expect(200);

            expect(RoleModel.findAll).toHaveBeenCalledWith({ where: { id: [1] } });
        });

        test('應該正確處理路由參數解析', async () => {
            const mockUser = {
                id: 42,
                username: 'param_user',
                roles: []
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await request(app)
                .get('/users/42/roles')
                .expect(200);

            expect(UserModel.findByPk).toHaveBeenCalledWith('42', { include: [RoleModel] });
        });

        test('應該正確處理複合路由參數', async () => {
            const mockUser = {
                id: 123,
                username: 'complex_user',
                $remove: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await request(app)
                .delete('/users/123/roles/456')
                .expect(200);

            expect(UserModel.findByPk).toHaveBeenCalledWith('123');
            expect(mockUser.$remove).toHaveBeenCalledWith('roles', 456);
        });
    });
});
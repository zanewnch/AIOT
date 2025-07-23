/**
 * UserController 整合測試套件
 *
 * 測試目標：驗證 UserController 與 Express 路由的整合行為
 * 測試層級：整合測試 (Integration Test)
 * 特色：
 * - 模擬 UserModel 但保留 Express 真實路由機制
 * - 重點測試 HTTP 請求/回應流程
 * - 驗證狀態碼、回應格式、錯誤處理
 * - 測試使用者 CRUD 操作的路由參數處理
 */
import express from 'express';
import request from 'supertest';
import { UserController } from '../src/controllers/rbac/UserController.js';
import { UserModel } from '../src/models/rbac/UserModel.js';
import { rbacRoutes } from '../src/routes/rbacRoutes.js';

/**
 * 完整模擬 UserModel 模組
 * 目的：隔離資料庫層，專注測試 Controller 與路由整合
 */
jest.mock('../src/models/rbac/UserModel.js');

/**
 * 模擬 JWT Authentication Middleware (如果有使用)
 * 目的：隔離認證邏輯，專注測試 UserController 的業務邏輯
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

describe('UserController Integration Tests', () => {
    let app: express.Application;
    let userController: UserController;

    /**
     * 測試前置設定
     * 執行時機：每個 test 案例前
     */
    beforeEach(() => {
        app = express();
        app.use(express.json()); // 啟用 JSON 解析中介軟體

        userController = new UserController();
        app.use('/api/rbac', rbacRoutes); // 掛載測試路由

        // 清除所有模擬函數的呼叫記錄
        jest.clearAllMocks();
    });

    describe('GET /users', () => {
        test('應該返回所有使用者並返回 200 狀態碼', async () => {
            const mockUsers = [
                {
                    id: 1,
                    username: 'john_doe',
                    email: 'john@example.com',
                    passwordHash: '$2b$10$hashedpassword1',
                    createdAt: '2025-06-26T09:12:38.106Z',
                    updatedAt: '2025-06-26T09:12:38.106Z'
                },
                {
                    id: 2,
                    username: 'jane_smith',
                    email: 'jane@example.com',
                    passwordHash: '$2b$10$hashedpassword2',
                    createdAt: '2025-06-26T09:12:38.106Z',
                    updatedAt: '2025-06-26T09:12:38.106Z'
                },
                {
                    id: 3,
                    username: 'bob_wilson',
                    email: 'bob@example.com',
                    passwordHash: '$2b$10$hashedpassword3',
                    createdAt: '2025-06-26T09:12:38.106Z',
                    updatedAt: '2025-06-26T09:12:38.106Z'
                }
            ];

            (UserModel.findAll as jest.Mock).mockResolvedValue(mockUsers);

            const response = await request(app)
                .get('/api/rbac/users')
                .expect(200);

            expect(response.body).toEqual(mockUsers);
            expect(UserModel.findAll).toHaveBeenCalled();
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findAll as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/api/rbac/users')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch users',
                error: 'Database connection failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理空使用者列表', async () => {
            (UserModel.findAll as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .get('/api/rbac/users')
                .expect(200);

            expect(response.body).toEqual([]);
            expect(UserModel.findAll).toHaveBeenCalled();
        });
    });

    describe('GET /users/:userId', () => {
        test('應該返回指定 ID 的使用者並返回 200 狀態碼', async () => {
            const mockUser = {
                id: 1,
                username: 'john_doe',
                email: 'john@example.com',
                passwordHash: '$2b$10$hashedpassword',
                createdAt: '2025-06-26T09:12:38.150Z',
                updatedAt: '2025-06-26T09:12:38.150Z'
            };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/rbac/users/1')
                .expect(200);

            expect(response.body).toEqual(mockUser);
            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get('/api/rbac/users/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'User not found' });
            expect(UserModel.findByPk).toHaveBeenCalledWith('999');
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database query failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .get('/api/rbac/users/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to fetch user',
                error: 'Database query failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理各種 ID 格式', async () => {
            const mockUser = { id: 123, username: 'test_user', email: 'test@example.com' };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            // 測試數字 ID
            await request(app)
                .get('/api/rbac/users/123')
                .expect(200);

            expect(UserModel.findByPk).toHaveBeenCalledWith('123');
        });
    });

    describe('POST /users', () => {
        test('應該成功創建新使用者並返回 201 狀態碼', async () => {
            const newUserData = {
                username: 'new_user',
                email: 'new_user@example.com',
                passwordHash: '$2b$10$newhashedpassword'
            };

            const mockCreatedUser = {
                id: 4,
                ...newUserData,
                createdAt: '2025-06-26T09:12:38.162Z',
                updatedAt: '2025-06-26T09:12:38.162Z'
            };

            (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            const response = await request(app)
                .post('/api/rbac/users')
                .send(newUserData)
                .expect(201);

            expect(response.body).toEqual(mockCreatedUser);
            expect(UserModel.create).toHaveBeenCalledWith(newUserData);
        });

        test('應該處理所有必要欄位的創建', async () => {
            const newUserData = {
                username: 'complete_user',
                email: 'complete@example.com',
                passwordHash: '$2b$10$completepassword'
            };

            const mockCreatedUser = {
                id: 5,
                ...newUserData,
                createdAt: '2025-06-26T09:12:38.182Z',
                updatedAt: '2025-06-26T09:12:38.182Z'
            };

            (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            const response = await request(app)
                .post('/api/rbac/users')
                .send(newUserData)
                .expect(201);

            expect(response.body).toEqual(mockCreatedUser);
            expect(UserModel.create).toHaveBeenCalledWith(newUserData);
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            const newUserData = {
                username: 'duplicate_user',
                email: 'duplicate@example.com',
                passwordHash: '$2b$10$duplicatepassword'
            };
            (UserModel.create as jest.Mock).mockRejectedValue(new Error('Unique constraint violation'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/api/rbac/users')
                .send(newUserData)
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to create user',
                error: 'Unique constraint violation'
            });

            consoleSpy.mockRestore();
        });

        test('應該正確處理 JSON 格式的請求', async () => {
            const newUserData = {
                username: 'json_user',
                email: 'json@example.com',
                passwordHash: '$2b$10$jsonpassword'
            };

            const mockCreatedUser = { id: 6, ...newUserData };
            (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            const response = await request(app)
                .post('/api/rbac/users')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(newUserData))
                .expect(201);

            expect(response.body).toEqual(mockCreatedUser);
        });

        test('應該處理重複使用者名稱的錯誤', async () => {
            const newUserData = {
                username: 'existing_user',
                email: 'existing@example.com',
                passwordHash: '$2b$10$existingpassword'
            };

            (UserModel.create as jest.Mock).mockRejectedValue(new Error('Duplicate entry for username'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/api/rbac/users')
                .send(newUserData)
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to create user',
                error: 'Duplicate entry for username'
            });

            consoleSpy.mockRestore();
        });

        test('應該處理重複電子郵件的錯誤', async () => {
            const newUserData = {
                username: 'unique_user',
                email: 'duplicate@example.com',
                passwordHash: '$2b$10$uniquepassword'
            };

            (UserModel.create as jest.Mock).mockRejectedValue(new Error('Duplicate entry for email'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .post('/api/rbac/users')
                .send(newUserData)
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to create user',
                error: 'Duplicate entry for email'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('PUT /users/:userId', () => {
        test('應該成功更新使用者並返回 200 狀態碼', async () => {
            const updateData = {
                username: 'updated_user',
                email: 'updated@example.com',
                passwordHash: '$2b$10$updatedpassword'
            };

            const mockUser = {
                id: 1,
                username: 'old_user',
                email: 'old@example.com',
                passwordHash: '$2b$10$oldpassword',
                update: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .put('/api/rbac/users/1')
                .send(updateData)
                .expect(200);

            // 檢查回應內容，排除 update 函數
            const expectedResponse = {
                id: 1,
                username: 'old_user',
                email: 'old@example.com',
                passwordHash: '$2b$10$oldpassword'
            };
            expect(response.body).toEqual(expectedResponse);
            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockUser.update).toHaveBeenCalledWith(updateData);
        });

        test('應該在部分更新時正確處理', async () => {
            const updateData = { email: 'newemail@example.com' };

            const mockUser = {
                id: 1,
                username: 'existing_user',
                email: 'old@example.com',
                passwordHash: '$2b$10$existingpassword',
                update: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .put('/api/rbac/users/1')
                .send(updateData)
                .expect(200);

            expect(mockUser.update).toHaveBeenCalledWith(updateData);
            // 檢查回應內容，排除 update 函數
            const expectedResponse = {
                id: 1,
                username: 'existing_user',
                email: 'old@example.com',
                passwordHash: '$2b$10$existingpassword'
            };
            expect(response.body).toEqual(expectedResponse);
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put('/api/rbac/users/999')
                .send({ username: 'nonexistent' })
                .expect(404);

            expect(response.body).toEqual({ message: 'User not found' });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database update failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .put('/api/rbac/users/1')
                .send({ username: 'updated_user' })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to update user',
                error: 'Database update failed'
            });

            consoleSpy.mockRestore();
        });

        test('應該處理密碼更新', async () => {
            const updateData = {
                passwordHash: '$2b$10$newhashedpassword'
            };

            const mockUser = {
                id: 1,
                username: 'password_user',
                email: 'password@example.com',
                passwordHash: '$2b$10$oldpassword',
                update: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .put('/api/rbac/users/1')
                .send(updateData)
                .expect(200);

            expect(mockUser.update).toHaveBeenCalledWith(updateData);
            // 檢查回應內容，排除 update 函數
            const expectedResponse = {
                id: 1,
                username: 'password_user',
                email: 'password@example.com',
                passwordHash: '$2b$10$oldpassword'
            };
            expect(response.body).toEqual(expectedResponse);
        });

        test('應該處理使用者名稱重複的錯誤', async () => {
            const mockUser = {
                id: 1,
                username: 'existing_user',
                email: 'existing@example.com',
                update: jest.fn().mockRejectedValue(new Error('Username already exists'))
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .put('/api/rbac/users/1')
                .send({ username: 'duplicate_username' })
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to update user',
                error: 'Username already exists'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('DELETE /users/:userId', () => {
        test('應該成功刪除使用者並返回 204 狀態碼', async () => {
            const mockUser = {
                id: 1,
                username: 'user_to_delete',
                email: 'delete@example.com',
                destroy: jest.fn().mockResolvedValue(undefined)
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .delete('/api/rbac/users/1')
                .expect(204);

            expect(response.body).toEqual({});
            expect(UserModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockUser.destroy).toHaveBeenCalled();
        });

        test('應該在使用者不存在時返回 404 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/rbac/users/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'User not found' });
        });

        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
            (UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Foreign key constraint'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/api/rbac/users/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to delete user',
                error: 'Foreign key constraint'
            });

            consoleSpy.mockRestore();
        });

        test('應該處理級聯刪除相關的錯誤', async () => {
            const mockUser = {
                id: 1,
                username: 'admin_user',
                email: 'admin@example.com',
                destroy: jest.fn().mockRejectedValue(new Error('Cannot delete user with active roles'))
            };

            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app)
                .delete('/api/rbac/users/1')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Failed to delete user',
                error: 'Cannot delete user with active roles'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('路由整合測試', () => {
        test('應該正確處理不存在的路由', async () => {
            await request(app)
                .get('/api/rbac/users/1/nonexistent')
                .expect(404);
        });

        test('應該正確設置 Content-Type', async () => {
            const mockUsers = [{ id: 1, username: 'test_user', email: 'test@example.com' }];
            (UserModel.findAll as jest.Mock).mockResolvedValue(mockUsers);

            const response = await request(app)
                .get('/api/rbac/users')
                .expect(200);

            expect(response.type).toBe('application/json');
        });

        test('應該正確處理中介軟體堆疊', async () => {
            // 測試 express.json() 中介軟體
            const newUserData = {
                username: 'middleware_test',
                email: 'middleware@example.com',
                passwordHash: '$2b$10$middlewarepassword'
            };
            const mockCreatedUser = { id: 10, ...newUserData };
            (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            await request(app)
                .post('/api/rbac/users')
                .send(newUserData)
                .expect(201);

            expect(UserModel.create).toHaveBeenCalledWith(newUserData);
        });

        test('應該正確處理路由參數解析', async () => {
            const mockUser = { id: 42, username: 'param_user', email: 'param@example.com' };
            (UserModel.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await request(app)
                .get('/api/rbac/users/42')
                .expect(200);

            expect(UserModel.findByPk).toHaveBeenCalledWith('42');
        });
    });
});
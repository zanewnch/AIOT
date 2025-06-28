/**
 * PermissionController 整合測試套件
 *
 * 測試目標：驗證 PermissionController 與 Express 路由的整合行為
 * 測試層級：整合測試 (Integration Test)
 * 特色：
 * - 模擬 PermissionModel 但保留 Express 真實路由機制
 * - 重點測試 HTTP 請求/回應流程
 * - 驗證狀態碼、回應格式、錯誤處理
 */
import express from 'express';
import request from 'supertest';
import { PermissionController } from '../src/controller/rbac/PermissionController.js';
import { PermissionModel } from '../src/models/rbac/PermissionModel.js';

/**
 * 完整模擬 PermissionModel 模組
 *
 * 功能說明：
 * 1. 自動建立模擬版本替代真實模組
 *    - 所有導出函數會被替換為 jest.fn()
 *    - 其他導出值會變成 undefined
 *
 * 2. 主要用途：
 *    - 隔離測試環境，避免觸發真實資料庫操作
 *    - 讓測試聚焦在 PermissionController 的邏輯
 *
 * 3. 實際應用範例：
 *    // 設定模擬返回值
 *    PermissionModel.create.mockResolvedValue({ id: 1 });
 *
 *    // 驗證函數呼叫
 *    expect(PermissionModel.findById).toHaveBeenCalledWith('123');
 *
 * 注意事項：
 * - 路徑是相對於當前測試檔案的位置
 * - 建議在 describe 外層模擬以提升測試效能
 *
 *
 * 如果 class 跟 method 都是模擬的 那不就測不到真實的method content 嗎
 * 您提到了一個非常核心的測試觀念！這正是「單元測試」和「整合測試」的關鍵區別。讓我分幾個層面說明：
 * 單元測試 (Unit Test)
 * ✅ 只測試「當前單元」(如 PermissionController)
 * ✅ 故意隔離所有依賴 (如 PermissionModel)
 * ✅ 驗證「邏輯正確性」而非「整合行為」
 * 整合測試 (Integration Test)
 * ✅ 在另一個測試檔案中測試 PermissionModel 與真實資料庫的互動
 * ✅ 需要真實連線資料庫 (但可用測試專用資料庫)
 *
 * 我可以理解成 就是只測試 single specific file 的 responsibility 是嘛
 */
jest.mock('../src/models/rbac/PermissionModel.js');

/**
 * 模擬 JWT Authentication Middleware
 * 目的：隔離認證邏輯，專注測試 PermissionController 的業務邏輯
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

/**
 * 主測試區塊
 * 架構說明：
 * 1. 使用 Express 實例模擬真實伺服器環境
 * 2. 每個測試案例前重置模擬狀態
 * 3. 透過 supertest 發送模擬 HTTP 請求
 */
describe('PermissionController Integration Tests', () => {
    let app: express.Application;
    let permissionController: PermissionController;

    /**
     * 測試前置設定
     * 執行時機：每個 it() 測試案例前
     * 包含：
     * - 初始化 Express 應用
     * - 掛載測試目標路由
     * - 重置所有模擬狀態 (避免測試間污染)
     */
    beforeEach(() => {
        app = express();
        app.use(express.json()); // 啟用 JSON 解析中介軟體

        permissionController = new PermissionController();
        app.use('/permissions', permissionController.router); // 掛載測試路由

        // 清除所有模擬函數的呼叫記錄
        jest.clearAllMocks();
    });

    /**
     * 測試案例設計模式：
     * 1. 設定模擬返回值 → 2. 發送請求 → 3. 驗證回應
     * 常見驗證要點：
     * - HTTP 狀態碼
     * - 回應格式 (JSON 結構)
     * - 錯誤處理
     * - 模擬函數的呼叫參數
     */
    describe('GET /permissions', () => {
        /**
         * 測試案例：成功取得所有權限
         * 驗證要點：
         * - HTTP 狀態碼：200
         * - 回應格式：JSON 陣列
         * - 模擬函數的呼叫參數：PermissionModel.findAll
         */
        test('應該返回所有權限並返回 200 狀態碼', async () => {
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

        /**
         * 測試案例：資料庫錯誤
         * 驗證要點：
         * - HTTP 狀態碼：500
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findAll
         */
        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
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
        /**
         * 測試案例：成功取得指定 ID 的權限
         * 驗證要點：
         * - HTTP 狀態碼：200
         * - 回應格式：JSON 物件
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該返回指定 ID 的權限並返回 200 狀態碼', async () => {
            const mockPermission = { id: 1, name: 'read_users', description: '讀取使用者' };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            const response = await request(app)
                .get('/permissions/1')
                .expect(200);

            expect(response.body).toEqual(mockPermission);
            expect(PermissionModel.findByPk).toHaveBeenCalledWith('1');
        });

        /**
         * 測試案例：權限不存在
         * 驗證要點：
         * - HTTP 狀態碼：404
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get('/permissions/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'Permission not found' });
        });

        /**
         * 測試案例：資料庫錯誤
         * 驗證要點：
         * - HTTP 狀態碼：500
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
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
        /**
         * 測試案例：成功創建新權限
         * 驗證要點：
         * - HTTP 狀態碼：201
         * - 回應格式：JSON 物件
         *
         * - 模擬函數的呼叫參數：PermissionModel.create
         */
        test('應該成功創建新權限並返回 201 狀態碼', async () => {
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

        /**
         * 測試案例：接受只有名稱的權限（description 為可選）
         * 驗證要點：
         * - HTTP 狀態碼：201
         * - 回應格式：JSON 物件
         * - 模擬函數的呼叫參數：PermissionModel.create
         */
        test('應該接受只有名稱的權限（description 為可選）', async () => {
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

        /**
         * 測試案例：資料庫錯誤
         * 驗證要點：
         * - HTTP 狀態碼：500
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.create
         */
        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
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
        /**
         * 測試案例：成功更新權限
         * 驗證要點：
         * - HTTP 狀態碼：200
         * - 回應格式：JSON 物件
         * - 模擬函數的呼叫參數：PermissionModel.findByPk、PermissionModel.update
         */
        test('應該成功更新權限並返回 200 狀態碼', async () => {
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

        /**
         * 測試案例：權限不存在
         * 驗證要點：
         * - HTTP 狀態碼：404
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put('/permissions/999')
                .send({ name: 'test' })
                .expect(404);

            expect(response.body).toEqual({ message: 'Permission not found' });
        });

        /**
         * 測試案例：資料庫錯誤
         * 驗證要點：
         * - HTTP 狀態碼：500
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
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
        /**
         * 測試案例：成功刪除權限
         * 驗證要點：
         * - HTTP 狀態碼：204
         * - 回應格式：空白
         * - 模擬函數的呼叫參數：PermissionModel.findByPk、PermissionModel.destroy
         */
        test('應該成功刪除權限並返回 204 狀態碼', async () => {
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

        /**
         * 測試案例：權限不存在
         * 驗證要點：
         * - HTTP 狀態碼：404
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該在權限不存在時返回 404 狀態碼', async () => {
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete('/permissions/999')
                .expect(404);

            expect(response.body).toEqual({ message: 'Permission not found' });
        });

        /**
         * 測試案例：資料庫錯誤
         * 驗證要點：
         * - HTTP 狀態碼：500
         * - 回應格式：錯誤訊息
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該在資料庫錯誤時返回 500 狀態碼', async () => {
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
        /**
         * 測試案例：拒絕不支援的 HTTP 方法
         * 驗證要點：
         * - HTTP 狀態碼：404
         * - 回應格式：錯誤訊息
         */
        test('應該拒絕不支援的 HTTP 方法', async () => {
            await request(app)
                .patch('/permissions/1')
                .expect(404);
        });

        /**
         * 測試案例：正確處理參數驗證（非數字 ID）
         * 驗證要點：
         * - HTTP 狀態碼：200
         * - 回應格式：JSON 物件
         * - 模擬函數的呼叫參數：PermissionModel.findByPk
         */
        test('應該正確處理參數驗證（非數字 ID）', async () => {
            const mockPermission = { id: 1, name: 'test' };
            (PermissionModel.findByPk as jest.Mock).mockResolvedValue(mockPermission);

            const response = await request(app)
                .get('/permissions/abc')
                .expect(200);

            expect(PermissionModel.findByPk).toHaveBeenCalledWith('abc');
        });
    });

    describe('Content-Type 處理', () => {
        /**
         * 測試案例：正確處理 JSON Content-Type
         * 驗證要點：
         * - HTTP 狀態碼：201
         * - 回應格式：JSON 物件
         * - 模擬函數的呼叫參數：PermissionModel.create
         */
        test('應該正確處理 JSON Content-Type', async () => {
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
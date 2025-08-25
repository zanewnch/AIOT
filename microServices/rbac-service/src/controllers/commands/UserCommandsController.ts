/**
 * @fileoverview 使用者命令控制器 - 檔案層級意圖說明
 *
 * 目的：此控制器負責處理所有與使用者管理相關的命令型 HTTP API 端點。
 * 遵循 CQRS 模式的命令端負責，專門處理會改變系統狀態的操作。
 *
 * **主要功能：**
 * - 使用者的創建、更新、刪除操作
 * - 輸入參數的驗證和清理
 * - 業務規則的驗證（如密碼確認、唯一性檢查）
 * - 結果的結構化回傳和錯誤處理
 *
 * **API 路由範圍：**
 * - POST /api/rbac/users - 創建新使用者
 * - PUT /api/rbac/users/:id - 更新使用者資訊
 * - DELETE /api/rbac/users/:id - 刪除使用者
 *
 * **輸入驗證範圍：**
 * - 必填欄位檢查
 * - 數據格式驗證
 * - 密碼強度和確認檢查
 * - ID 參數的有效性驗證
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {UserCommandsService} from.*Service.js';
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import * as sharedPackages from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('UserCommandsController');

/**
 * 使用者命令控制器類別 - RBAC 系統中的使用者管理命令端點
 *
 * 此控制器類別實作 CQRS 架構中的命令端負責，專門處理所有
 * 與使用者管理相關的狀態改變操作。所有方法都經過完整的驗證和錯誤處理。
 *
 * **設計理念：**
 * - 單一負責原則：只處理使用者命令操作
 * - 輸入驗證優先：在委派給服務層之前先驗證
 * - 錯誤分類處理：不同類型的錯誤有不同的 HTTP 狀態碼
 * - 結構化輸出：使用 ResResult 統一回應格式
 *
 * **安全考量：**
 * - 所有輸入參數都經過驗證和清理
 * - 密碼相關操作有額外的安全檢查
 * - 詳細的操作日誌記錄
 * - 防止機敏資訊在錯誤訊息中洩漏
 *
 * **依賴注入：**
 * - UserCommandsService: 使用者命令服務層，負責具體的業務邏輯
 *
 * @class UserCommandsController
 * @example
 * ```typescript
 * const userController = container.get<UserCommandsController>(TYPES.UserCommandsController);
 * 
 * // 在 Express 路由中使用
 * app.post('/api/rbac/users', userController.createUser);
 * app.put('/api/rbac/users/:id', userController.updateUser);
 * app.delete('/api/rbac/users/:id', userController.deleteUser);
 * ```
 *
 * @since 1.0.0
 * @public
 */
@injectable()
export class UserCommandsController {
    /**
     * UserCommandsController 控制器建構函數
     *
     * 透過 Inversify 依賴注入機制注入所需的服務實例。
     *
     * @param userCommandsService - 使用者命令服務實例，負責執行具體的業務邏輯
     */
    constructor(
        @inject(TYPES.UserCommandsService) private readonly userCommandsService: UserCommandsService // 注入使用者命令服務，用於處理具體的業務邏輯
    ) {
    }

    /**
     * 創建新使用者 - HTTP POST /api/rbac/users
     *
     * 處理新使用者的創建請求，包括完整的輸入驗證、業務規則檢查和錯誤處理。
     *
     * **驗證規則：**
     * - username: 必填，作為使用者的唯一識別
     * - email: 必填，作為聯絡方式和備用識別
     * - password: 必填，使用者的登入密碼
     * - confirmPassword: 必填，必須與 password 一致
     *
     * **業務規則：**
     * - 使用者名稱在系統中必須唯一
     * - 電子郵件在系統中必須唯一
     * - 密碼需要經過的安全性檢查
     *
     * **回應格式：**
     * 成功時 (201):
     * ```json
     * {
     *   "status": 201,
     *   "message": "使用者創建成功",
     *   "data": {
     *     "id": 123,
     *     "username": "john_doe",
     *     "email": "john@example.com",
     *     "createdAt": "2024-01-01T00:00:00Z"
     *   }
     * }
     * ```
     *
     * @async
     * @param req - Express 請求物件，包含使用者資料在 body 中
     * @param req.body.username - 使用者名稱（必填）
     * @param req.body.email - 電子郵件地址（必填）
     * @param req.body.password - 登入密碼（必填）
     * @param req.body.confirmPassword - 密碼確認（必填）
     * @param res - Express 回應物件，用於返回創建結果
     * @returns {Promise<void>} 非同步操作完成的 Promise
     *
     * @throws {Error} 當服務層出現異常時分類處理不同錯誤
     *
     * @example
     * ```typescript
     * // POST /api/rbac/users
     * {
     *   "username": "john_doe",
     *   "email": "john@example.com",
     *   "password": "securePassword123",
     *   "confirmPassword": "securePassword123"
     * }
     * ```
     */
    public createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const {username, email, password, confirmPassword} = req.body;

            // 基本驗證
            if (!username || !email || !password) {
                const result = sharedPackages.ResResult.badRequest('缺少必要的使用者資訊');
                res.status(result.status).json(result);
                return;
            }

            if (password !== confirmPassword) {
                const result = sharedPackages.ResResult.badRequest('密碼和確認密碼不匹配');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Creating new user: ${username}`, 'info');
            logger.debug('Creating new user via service', {username, email});

            const newUser = await this.userCommandsService.createUser({
                username,
                email,
                password
            });

            const result = sharedPackages.ResResult.created('使用者創建成功', newUser);
            res.status(result.status).json(result);
            logger.info('Successfully created new user', {
                userId: newUser.id,
                username: newUser.username
            });
        } catch (error) {
            logger.error('Error creating user', {
                username: req.body?.username,
                email: req.body?.email,
                error
            });

            // 檢查是否為重複使用者錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = sharedPackages.ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = sharedPackages.ResResult.internalError('創建使用者失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 更新使用者資訊 - HTTP PUT /api/rbac/users/:id
     *
     * 更新指定 ID 的使用者資訊，支援部分更新（PATCH 語意）。
     * 只有提供的欄位會被更新，未提供的欄位保持不變。
     *
     * **可更新欄位：**
     * - username: 使用者名稱（選填，但必須唯一）
     * - email: 電子郵件地址（選填，但必須唯一）
     * - password: 新密碼（選填，將進行適當的雜湊處理）
     *
     * **業務規則：**
     * - 使用者 ID 必須存在且為有效整數
     * - 更新後的 username/email 在系統中仍然必須唯一
     * - 空值或無效值會被忽略（不更新該欄位）
     *
     * **回應格式：**
     * 成功時 (200):
     * ```json
     * {
     *   "status": 200,
     *   "message": "使用者更新成功",
     *   "data": {
     *     "id": 123,
     *     "username": "john_doe_updated",
     *     "email": "john_new@example.com",
     *     "updatedAt": "2024-01-02T00:00:00Z"
     *   }
     * }
     * ```
     *
     * @async
     * @param req - Express 請求物件
     * @param req.params.id - 要更新的使用者 ID（路徑參數）
     * @param req.body.username - 新的使用者名稱（選填）
     * @param req.body.email - 新的電子郵件地址（選填）
     * @param req.body.password - 新的密碼（選填）
     * @param res - Express 回應物件，用於返回更新結果
     * @returns {Promise<void>} 非同步操作完成的 Promise
     *
     * @throws {Error} 當服務層出現異常時分類處理不同錯誤
     *
     * @example
     * ```typescript
     * // PUT /api/rbac/users/123
     * {
     *   "username": "john_updated",
     *   "email": "john_new@example.com"
     *   // password 是選填的
     * }
     * ```
     */
    public updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                const result = sharedPackages.ResResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            const {username, email, password} = req.body;

            logRequest(req, `Updating user with ID: ${userId}`, 'info');
            logger.debug('Updating user via service', {userId, username, email});

            const updateData: any = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (password) updateData.password = password;

            const updatedUser = await this.userCommandsService.updateUser(userId, updateData);

            if (!updatedUser) {
                const result = sharedPackages.ResResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                logger.warn(`User not found for update with ID: ${userId}`);
                return;
            }

            const result = sharedPackages.ResResult.success('使用者更新成功', updatedUser);
            res.status(result.status).json(result);
            logger.info('Successfully updated user', {
                userId,
                username: updatedUser.username
            });
        } catch (error) {
            logger.error('Error updating user', {
                userId: req.params.id,
                error
            });

            // 檢查是否為重複使用者錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = sharedPackages.ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = sharedPackages.ResResult.internalError('更新使用者失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 刪除使用者 - HTTP DELETE /api/rbac/users/:id
     *
     * 從系統中永久刪除指定 ID 的使用者及其相關資料。
     * 此操作不可逆，會同時清理該使用者的所有關聯資料。
     *
     * **刪除範圍：**
     * - 使用者基本資訊（用戶名、電子郵件、密碼等）
     * - 使用者與角色的關聯關係
     * - 相關的會話和權限資料
     *
     * **安全考量：**
     * - 刪除操作不可逆，需謹慎執行
     * - 建議在實際刪除前進行額外的權限檢查
     * - 系統管理員與關鍵使用者建議使用停用而非刪除
     *
     * **回應格式：**
     * 成功時 (200):
     * ```json
     * {
     *   "status": 200,
     *   "message": "使用者刪除成功",
     *   "data": null
     * }
     * ```
     *
     * 使用者不存在時 (404):
     * ```json
     * {
     *   "status": 404,
     *   "message": "使用者不存在",
     *   "data": null
     * }
     * ```
     *
     * @async
     * @param req - Express 請求物件
     * @param req.params.id - 要刪除的使用者 ID（路徑參數，必須為有效整數）
     * @param res - Express 回應物件，用於返回刪除結果
     * @returns {Promise<void>} 非同步操作完成的 Promise
     *
     * @throws {Error} 當服務層出現異常時記錄錯誤並回傳內部錯誤
     *
     * @example
     * ```typescript
     * // DELETE /api/rbac/users/123
     * // 無需 body，只需路徑參數 ID
     * ```
     *
     * @warning 此操作不可逆，請確保已獲得適當的授權和確認
     */
    public deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                const result = sharedPackages.ResResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting user with ID: ${userId}`, 'info');
            logger.debug('Deleting user via service', {userId});

            const deleted = await this.userCommandsService.deleteUser(userId);

            if (!deleted) {
                const result = sharedPackages.ResResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                logger.warn(`User not found for deletion with ID: ${userId}`);
                return;
            }

            const result = sharedPackages.ResResult.success('使用者刪除成功');
            res.status(result.status).json(result);
            logger.info('Successfully deleted user', {userId});
        } catch (error) {
            logger.error('Error deleting user', {
                userId: req.params.id,
                error
            });
            const result = sharedPackages.ResResult.internalError('刪除使用者失敗');
            res.status(result.status).json(result);
        }
    }
}
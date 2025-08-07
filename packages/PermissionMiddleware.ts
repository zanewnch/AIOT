/**
 * @fileoverview 權限驗證中間件模組
 *
 * 此模組實作基於角色的存取控制（RBAC）權限驗證系統。
 * 提供細粒度的權限檢查，支援單一權限、任一權限、所有權限及角色驗證。
 *
 * 權限驗證流程：
 * 1. 身分驗證：確認使用者已通過 JWT 驗證
 * 2. 權限檢查：根據不同的驗證模式檢查使用者權限
 * 3. 資料庫查詢：透過 PermissionService 查詢使用者權限
 * 4. 結果回傳：通過則繼續，否則回傳 403 錯誤
 *
 * 支援的驗證模式：
 * - requirePermission：需要特定權限
 * - requireAnyPermission：需要任一權限（OR 邏輯）
 * - requireAllPermissions：需要所有權限（AND 邏輯）
 * - requireRole：需要特定角色
 *
 * @author AIOT Team
 * @since 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // 引入 Express 類型定義
import { UserQueriesRepository } from '../repo/queries/rbac/UserQueriesRepo.js'; // 引入使用者查詢資料存取層
import { PermissionQueriesSvc } from '../services/queries/PermissionQueriesSvc.js'; // 引入權限查詢服務層
import { createLogger } from '../configs/loggerConfig.js'; // 引入日誌記錄器
// Express 類型擴展已透過 tsconfig.json 自動載入

// 創建中間件專用的日誌記錄器
const logger = createLogger('PermissionMiddleware');

/**
 * 權限驗證中間件
 * ================
 *
 * 基於 RBAC (Role-Based Access Control) 的權限驗證系統
 * 支援細粒度的權限控制，可檢查使用者是否具有特定權限
 *
 * 使用方式：
 * - requirePermission('user.create') - 需要特定權限
 * - requireAnyPermission(['user.create', 'user.update']) - 需要任一權限
 * - requireAllPermissions(['user.read', 'user.write']) - 需要所有權限
 */

/**
 * 權限驗證中間件類別
 *
 * 實作基於角色的存取控制（RBAC）系統，提供多種權限驗證模式。
 * 所有方法都會先檢查使用者是否已通過身分驗證，然後進行權限檢查。
 *
 * @class PermissionMiddleware
 * @example
 * ```typescript
 * import { PermissionMiddleware } from './middleware/permissionMiddleware';
 *
 * const permissionMiddleware = new PermissionMiddleware();
 *
 * // 單一權限驗證
 * app.post('/api/users', permissionMiddleware.requirePermission('user.create'));
 *
 * // 任一權限驗證
 * app.put('/api/users/:id', permissionMiddleware.requireAnyPermission(['user.update', 'user.admin']));
 *
 * // 所有權限驗證
 * app.delete('/api/users/:id', permissionMiddleware.requireAllPermissions(['user.delete', 'user.admin']));
 *
 * // 角色驗證
 * app.get('/api/admin/stats', permissionMiddleware.requireRole('admin'));
 * ```
 */
export class PermissionMiddleware {
    /** 使用者查詢資料存取層實例，用於查詢使用者資訊 */
    private userRepository: UserQueriesRepository;

    /** 權限查詢服務層實例，用於權限驗證邏輯 */
    private permissionService: PermissionQueriesSvc;

    /**
     * 建構函式
     *
     * 初始化 PermissionMiddleware 實例，設定依賴注入的服務層。
     * 如果未提供參數，則使用預設實例。
     *
     * @param {UserQueriesRepository} userRepository - 使用者查詢資料存取層實例
     * @param {PermissionQueriesSvc} permissionService - 權限查詢服務層實例
     *
     * @example
     * ```typescript
     * // 使用預設實例
     * const permissionMiddleware = new PermissionMiddleware();
     *
     * // 使用自訂實例
     * const customUserRepo = new UserQueriesRepository();
     * const customPermissionService = new PermissionQueriesSvc();
     * const permissionMiddleware = new PermissionMiddleware(customUserRepo, customPermissionService);
     * ```
     */
    constructor(
        userRepository: UserQueriesRepository = new UserQueriesRepository(),
        permissionService: PermissionQueriesSvc = new PermissionQueriesSvc()
    ) {
        this.userRepository = userRepository; // 設定使用者資料存取層
        this.permissionService = permissionService; // 設定權限服務層
    }

    /**
     * 檢查使用者是否具有特定權限
     * @param permissionName 權限名稱 (例如: 'user.create', 'device.delete')
     * @returns Express 中間件函式
     *
     * @example
     * ```typescript
     * const permissionMiddleware = new PermissionMiddleware();
     *
     * // 檢查使用者是否有建立使用者的權限
     * app.post('/api/users',
     *   jwtAuth.authenticate,
     *   permissionMiddleware.requirePermission('user.create'),
     *   userController.createUser
     * );
     * ```
     */
    public requirePermission(permissionName: string) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                logger.debug(`Checking permission '${permissionName}' for request: ${req.method} ${req.path}`);

                // 確認使用者已經通過 JWT 驗證
                if (!req.user || !req.user.id) {
                    logger.warn(`Unauthorized request to ${req.method} ${req.path} - No authenticated user`);
                    res.status(401).json({
                        message: 'Authentication required', // 需要身分驗證
                        error: 'USER_NOT_AUTHENTICATED'
                    });
                    return; // 中止執行，不調用 next()
                }

                logger.debug(`User ${req.user.id} requesting permission: ${permissionName}`);

                // 檢查使用者權限
                const hasPermission = await this.permissionService.userHasPermission(
                    req.user.id, // 使用者 ID
                    permissionName // 需要檢查的權限名稱
                );

                if (!hasPermission) {
                    logger.warn(`Access denied for user ${req.user.id} - Missing permission: ${permissionName}`);
                    // 權限不足，回傳 403 禁止存取
                    res.status(403).json({
                        message: `Access denied. Required permission: ${permissionName}`,
                        error: 'INSUFFICIENT_PERMISSIONS',
                        required: permissionName // 提供需要的權限資訊
                    });
                    return; // 中止執行，不調用 next()
                }

                logger.info(`Permission granted for user ${req.user.id} - ${permissionName}`);
                next(); // 權限檢查通過，繼續執行下一個中間件
            } catch (error) {
                // 捕獲權限檢查過程中的任何錯誤
                logger.error('Permission check error:', error);
                res.status(500).json({
                    message: 'Permission validation failed', // 權限驗證失敗
                    error: 'PERMISSION_CHECK_ERROR'
                });
            }
        };
    }

    /**
     * 檢查使用者是否具有任一權限（OR 邏輯）
     * @param permissions 權限名稱陣列
     * @returns Express 中間件函式
     *
     * @example
     * ```typescript
     * // 使用者需要具有建立或更新使用者的權限之一
     * app.put('/api/users/:id',
     *   jwtAuth.authenticate,
     *   permissionMiddleware.requireAnyPermission(['user.create', 'user.update']),
     *   userController.updateUser
     * );
     * ```
     */
    public requireAnyPermission(permissions: string[]) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                // 確認使用者已經通過 JWT 驗證
                if (!req.user || !req.user.id) {
                    res.status(401).json({
                        message: 'Authentication required', // 需要身分驗證
                        error: 'USER_NOT_AUTHENTICATED'
                    });
                    return; // 中止執行，不調用 next()
                }

                // 檢查使用者是否具有任一權限（OR 邏輯）
                const hasAnyPermission = await this.permissionService.userHasAnyPermission(
                    req.user.id, // 使用者 ID
                    permissions // 權限名稱陣列
                );

                if (!hasAnyPermission) {
                    // 使用者沒有任何一個必要權限
                    res.status(403).json({
                        message: `Access denied. Required any of permissions: ${permissions.join(', ')}`,
                        error: 'INSUFFICIENT_PERMISSIONS',
                        required: permissions // 提供需要的權限清單
                    });
                    return; // 中止執行，不調用 next()
                }

                next(); // 權限檢查通過，繼續執行下一個中間件
            } catch (error) {
                // 捕獲權限檢查過程中的任何錯誤
                console.error('Permission check error:', error);
                res.status(500).json({
                    message: 'Permission validation failed', // 權限驗證失敗
                    error: 'PERMISSION_CHECK_ERROR'
                });
            }
        };
    }

    /**
     * 檢查使用者是否具有所有權限（AND 邏輯）
     * @param permissions 權限名稱陣列
     * @returns Express 中間件函式
     *
     * @example
     * ```typescript
     * // 使用者需要同時具有讀取和寫入權限
     * app.post('/api/sensitive-data',
     *   jwtAuth.authenticate,
     *   permissionMiddleware.requireAllPermissions(['data.read', 'data.write']),
     *   dataController.createSensitiveData
     * );
     * ```
     */
    public requireAllPermissions(permissions: string[]) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                // 確認使用者已經通過 JWT 驗證
                if (!req.user || !req.user.id) {
                    res.status(401).json({
                        message: 'Authentication required', // 需要身分驗證
                        error: 'USER_NOT_AUTHENTICATED'
                    });
                    return; // 中止執行，不調用 next()
                }

                // 檢查使用者是否具有所有權限（AND 邏輯）
                const hasAllPermissions = await this.permissionService.userHasAllPermissions(
                    req.user.id, // 使用者 ID
                    permissions // 權限名稱陣列
                );

                if (!hasAllPermissions) {
                    // 使用者缺少一個或多個必要權限
                    res.status(403).json({
                        message: `Access denied. Required all permissions: ${permissions.join(', ')}`,
                        error: 'INSUFFICIENT_PERMISSIONS',
                        required: permissions // 提供需要的權限清單
                    });
                    return; // 中止執行，不調用 next()
                }

                next(); // 權限檢查通過，繼續執行下一個中間件
            } catch (error) {
                // 捕獲權限檢查過程中的任何錯誤
                console.error('Permission check error:', error);
                res.status(500).json({
                    message: 'Permission validation failed', // 權限驗證失敗
                    error: 'PERMISSION_CHECK_ERROR'
                });
            }
        };
    }

    /**
     * 檢查使用者是否具有特定角色
     * @param roleName 角色名稱
     * @returns Express 中間件函式
     *
     * @example
     * ```typescript
     * // 只有管理員可以存取
     * app.get('/api/admin/stats',
     *   jwtAuth.authenticate,
     *   permissionMiddleware.requireRole('admin'),
     *   adminController.getStats
     * );
     * ```
     */
    public requireRole(roleName: string) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                // 確認使用者已經通過 JWT 驗證
                if (!req.user || !req.user.id) {
                    res.status(401).json({
                        message: 'Authentication required', // 需要身分驗證
                        error: 'USER_NOT_AUTHENTICATED'
                    });
                    return; // 中止執行，不調用 next()
                }

                // 檢查使用者角色
                const hasRole = await this.permissionService.userHasRole(
                    req.user.id, // 使用者 ID
                    roleName // 需要檢查的角色名稱
                );

                if (!hasRole) {
                    // 使用者沒有所需的角色
                    res.status(403).json({
                        message: `Access denied. Required role: ${roleName}`,
                        error: 'INSUFFICIENT_ROLE',
                        required: roleName // 提供需要的角色資訊
                    });
                    return; // 中止執行，不調用 next()
                }

                next(); // 角色檢查通過，繼續執行下一個中間件
            } catch (error) {
                // 捕獲角色檢查過程中的任何錯誤
                console.error('Role check error:', error);
                res.status(500).json({
                    message: 'Role validation failed', // 角色驗證失敗
                    error: 'ROLE_CHECK_ERROR'
                });
            }
        };
    }
}

/**
 * 匯出預設的權限中間件實例
 */
export const permissionMiddleware = new PermissionMiddleware();
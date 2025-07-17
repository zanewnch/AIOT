import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repo/UserRepo.js';
import { PermissionService } from '../service/PermissionService.js';
import '../types/express.js';

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
 */
export class PermissionMiddleware {
    private userRepository: UserRepository;
    private permissionService: PermissionService;

    /**
     * 建構函式
     * @param userRepository 使用者資料存取層
     * @param permissionService 權限服務層
     */
    constructor(
        userRepository: UserRepository = new UserRepository(),
        permissionService: PermissionService = new PermissionService()
    ) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
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
                // 確認使用者已經通過 JWT 驗證
                if (!req.user || !req.user.id) {
                    res.status(401).json({ 
                        message: 'Authentication required',
                        error: 'USER_NOT_AUTHENTICATED' 
                    });
                    return;
                }

                // 檢查使用者權限
                const hasPermission = await this.permissionService.userHasPermission(
                    req.user.id, 
                    permissionName
                );

                if (!hasPermission) {
                    res.status(403).json({ 
                        message: `Access denied. Required permission: ${permissionName}`,
                        error: 'INSUFFICIENT_PERMISSIONS',
                        required: permissionName
                    });
                    return;
                }

                next();
            } catch (error) {
                console.error('Permission check error:', error);
                res.status(500).json({ 
                    message: 'Permission validation failed',
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
                if (!req.user || !req.user.id) {
                    res.status(401).json({ 
                        message: 'Authentication required',
                        error: 'USER_NOT_AUTHENTICATED' 
                    });
                    return;
                }

                // 檢查使用者是否具有任一權限
                const hasAnyPermission = await this.permissionService.userHasAnyPermission(
                    req.user.id, 
                    permissions
                );

                if (!hasAnyPermission) {
                    res.status(403).json({ 
                        message: `Access denied. Required any of permissions: ${permissions.join(', ')}`,
                        error: 'INSUFFICIENT_PERMISSIONS',
                        required: permissions
                    });
                    return;
                }

                next();
            } catch (error) {
                console.error('Permission check error:', error);
                res.status(500).json({ 
                    message: 'Permission validation failed',
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
                if (!req.user || !req.user.id) {
                    res.status(401).json({ 
                        message: 'Authentication required',
                        error: 'USER_NOT_AUTHENTICATED' 
                    });
                    return;
                }

                // 檢查使用者是否具有所有權限
                const hasAllPermissions = await this.permissionService.userHasAllPermissions(
                    req.user.id, 
                    permissions
                );

                if (!hasAllPermissions) {
                    res.status(403).json({ 
                        message: `Access denied. Required all permissions: ${permissions.join(', ')}`,
                        error: 'INSUFFICIENT_PERMISSIONS',
                        required: permissions
                    });
                    return;
                }

                next();
            } catch (error) {
                console.error('Permission check error:', error);
                res.status(500).json({ 
                    message: 'Permission validation failed',
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
                if (!req.user || !req.user.id) {
                    res.status(401).json({ 
                        message: 'Authentication required',
                        error: 'USER_NOT_AUTHENTICATED' 
                    });
                    return;
                }

                // 檢查使用者角色
                const hasRole = await this.permissionService.userHasRole(
                    req.user.id, 
                    roleName
                );

                if (!hasRole) {
                    res.status(403).json({ 
                        message: `Access denied. Required role: ${roleName}`,
                        error: 'INSUFFICIENT_ROLE',
                        required: roleName
                    });
                    return;
                }

                next();
            } catch (error) {
                console.error('Role check error:', error);
                res.status(500).json({ 
                    message: 'Role validation failed',
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
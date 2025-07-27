/**
 * @fileoverview 開發階段資料查看路由
 * 
 * 此路由專為開發階段設計，提供快速查看資料表內容的功能。
 * 包含 RBAC 系統的五個核心表和 RTK 定位資料表的查看功能。
 * 直接返回 JSON 資料，適合使用 Postman 等工具進行測試。
 * 
 * ⚠️  注意：此路由僅用於開發環境，生產環境中應該移除或限制存取
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import { Router } from 'express';
import type { Request, Response } from 'express';

// 導入模型
import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
import { RTKModel } from '../models/RTKModel.js';

const router = Router();

// 路由：總覽頁面
router.get('/dev/overview', async (_req: Request, res: Response) => {
    try {
        // 獲取各表的資料統計
        const [userCount, roleCount, permissionCount, userRoleCount, rolePermissionCount, rtkDataCount] = await Promise.all([
            UserModel.count(),
            RoleModel.count(),
            PermissionModel.count(),
            UserRoleModel.count(),
            RolePermissionModel.count(),
            RTKModel.count()
        ]);

        const overview = {
            timestamp: new Date().toISOString(),
            tables: {
                users: userCount,
                roles: roleCount,
                permissions: permissionCount,
                user_roles: userRoleCount,
                role_permissions: rolePermissionCount,
                rtk_data: rtkDataCount
            },
            total_records: userCount + roleCount + permissionCount + userRoleCount + rolePermissionCount + rtkDataCount
        };

        res.json({
            success: true,
            data: overview
        });
    } catch (error) {
        console.error('取得資料庫總覽失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// 路由：查看使用者資料
router.get('/dev/users', async (_req: Request, res: Response) => {
    try {
        const users = await UserModel.findAll({
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                table_name: 'users',
                count: users.length,
                records: users.map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email || null,
                    created_at: user.createdAt,
                    updated_at: user.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('取得使用者資料失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得使用者資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// 路由：查看角色資料
router.get('/dev/roles', async (_req: Request, res: Response) => {
    try {
        const roles = await RoleModel.findAll({
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                table_name: 'roles',
                count: roles.length,
                records: roles.map(role => ({
                    id: role.id,
                    name: role.name,
                    display_name: role.displayName,
                    created_at: role.createdAt,
                    updated_at: role.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('取得角色資料失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得角色資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// 路由：查看權限資料
router.get('/dev/permissions', async (_req: Request, res: Response) => {
    try {
        const permissions = await PermissionModel.findAll({
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                table_name: 'permissions',
                count: permissions.length,
                records: permissions.map(permission => ({
                    id: permission.id,
                    name: permission.name,
                    description: permission.description || null,
                    created_at: permission.createdAt,
                    updated_at: permission.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('取得權限資料失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得權限資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// 路由：查看使用者角色關聯
router.get('/dev/user-roles', async (_req: Request, res: Response) => {
    try {
        const userRoles = await UserRoleModel.findAll({
            include: [
                { model: UserModel, as: 'user', attributes: ['username'] },
                { model: RoleModel, as: 'role', attributes: ['name'] }
            ],
            order: [['userId', 'ASC'], ['roleId', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                table_name: 'user_roles',
                count: userRoles.length,
                records: userRoles.map(userRole => ({
                    user_id: userRole.userId,
                    username: (userRole as any).user?.username || null,
                    role_id: userRole.roleId,
                    role_name: (userRole as any).role?.name || null,
                    created_at: userRole.createdAt,
                    updated_at: userRole.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('取得使用者角色關聯資料失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得使用者角色關聯資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// 路由：查看角色權限關聯
router.get('/dev/role-permissions', async (_req: Request, res: Response) => {
    try {
        const rolePermissions = await RolePermissionModel.findAll({
            include: [
                { model: RoleModel, as: 'role', attributes: ['name'] },
                { model: PermissionModel, as: 'permission', attributes: ['name'] }
            ],
            order: [['roleId', 'ASC'], ['permissionId', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                table_name: 'role_permissions',
                count: rolePermissions.length,
                records: rolePermissions.map(rolePermission => ({
                    role_id: rolePermission.roleId,
                    role_name: (rolePermission as any).role?.name || null,
                    permission_id: rolePermission.permissionId,
                    permission_name: (rolePermission as any).permission?.name || null,
                    created_at: rolePermission.createdAt,
                    updated_at: rolePermission.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('取得角色權限關聯資料失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得角色權限關聯資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// 路由：查看 RTK 資料
router.get('/dev/rtk-data', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const { count, rows: rtkData } = await RTKModel.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        res.json({
            success: true,
            data: {
                table_name: 'rtk_data',
                pagination: {
                    total_records: count,
                    current_page: currentPage,
                    total_pages: totalPages,
                    limit: limit,
                    offset: offset,
                    has_next: (offset + limit) < count,
                    has_prev: offset > 0
                },
                records: rtkData.map(data => ({
                    id: data.id,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    google_maps_url: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
                    created_at: data.createdAt,
                    updated_at: data.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('取得 RTK 資料失敗:', error);
        res.status(500).json({
            success: false,
            error: '取得 RTK 資料失敗',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});

// ========== 錯誤處理測試路由（用於測試增強的錯誤處理機制） ==========

// 測試一般 JavaScript 錯誤
router.get('/dev/test-error/general', (_req: Request, _res: Response) => {
    throw new Error('這是一個測試用的一般錯誤，用於驗證增強的錯誤處理機制');
});

// 測試資料庫錯誤
router.get('/dev/test-error/database', async (_req: Request, _res: Response) => {
    // 故意查詢不存在的表來觸發資料庫錯誤
    await UserModel.sequelize?.query('SELECT * FROM non_existent_table');
});

// 測試類型錯誤
router.get('/dev/test-error/type', (_req: Request, _res: Response) => {
    const obj: any = null;
    obj.someProperty.nestedProperty = 'test'; // 這會拋出 TypeError
});

// 測試自定義錯誤物件
router.get('/dev/test-error/custom', (_req: Request, _res: Response) => {
    const customError = new Error('自定義錯誤測試');
    (customError as any).code = 'CUSTOM_ERROR_CODE';
    (customError as any).details = {
        userId: 123,
        action: 'test_action',
        timestamp: new Date().toISOString()
    };
    throw customError;
});

// 測試異步錯誤
router.get('/dev/test-error/async', async (_req: Request, _res: Response) => {
    await new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('異步操作失敗 - 模擬網路超時或其他異步錯誤'));
        }, 100);
    });
});

// 測試 HTTP 錯誤（使用 http-errors）
router.get('/dev/test-error/http/:status', (req: Request, _res: Response, next) => {
    const status = parseInt(req.params.status) || 500;
    const createError = require('http-errors');
    
    const statusMessages: { [key: number]: string } = {
        400: '錯誤的請求參數',
        401: '未授權存取',
        403: '禁止存取此資源',
        404: '找不到請求的資源',
        500: '內部伺服器錯誤',
        503: '服務暫時無法使用'
    };
    
    const message = statusMessages[status] || `HTTP ${status} 錯誤`;
    next(createError(status, message));
});

// 根路徑重導向到總覽
router.get('/dev', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: '開發階段資料查看 API',
        endpoints: {
            overview: '/dev/overview',
            users: '/dev/users',
            roles: '/dev/roles',
            permissions: '/dev/permissions',
            user_roles: '/dev/user-roles',
            role_permissions: '/dev/role-permissions',
            rtk_data: '/dev/rtk-data?limit=100&offset=0'
        },
        error_testing: {
            general_error: '/dev/test-error/general',
            database_error: '/dev/test-error/database',
            type_error: '/dev/test-error/type',
            custom_error: '/dev/test-error/custom',
            async_error: '/dev/test-error/async',
            http_errors: '/dev/test-error/http/:status (例如: /dev/test-error/http/404)'
        },
        note: '此 API 僅限開發環境使用。錯誤測試路由會故意拋出錯誤來驗證錯誤處理機制。'
    });
});

export default router;
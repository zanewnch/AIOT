/**
 * @fileoverview 認證測試控制器
 * @description 用於測試 Gateway 層的 JWT 認證和權限檢查功能
 * @author AIOT Development Team  
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Request, Response, Router } from 'express';
import { ResResult } from '../utils/ResResult.js';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * 認證測試控制器類別
 */
@injectable()
export class AuthTestController {
    private logger = loggerConfig;

    /**
     * 獲取認證測試路由器
     */
    public getRouter = (): Router => {
        const router = Router();

        router.get('/auth', this.testAuth);
        router.get('/permissions', this.testPermissions);
        router.get('/admin', this.testAdminAccess);
        router.get('/drone', this.testDroneAccess);
        router.get('/public', this.testPublicAccess);

        return router;
    };

    /**
     * 測試基本認證
     */
    public testAuth = (req: Request, res: Response): void => {
        try {
            const userInfo = {
                isAuthenticated: !!req.user,
                user: req.user || null,
                permissions: req.permissions || null,
                authContext: req.authContext || null,
                sessionInfo: req.session || null
            };

            this.logger.info('Auth test accessed', {
                userId: req.user?.id,
                username: req.user?.username,
                authenticated: !!req.user
            });

            ResResult.success(res, userInfo, 'Authentication test successful');
        } catch (error) {
            this.logger.error('Auth test error:', error);
            ResResult.fail(res, 'Authentication test failed', 500);
        }
    };

    /**
     * 測試權限檢查
     */
    public testPermissions = (req: Request, res: Response): void => {
        try {
            const permissionInfo = {
                user: {
                    id: req.user?.id,
                    username: req.user?.username
                },
                permissions: req.permissions?.permissions || [],
                roles: req.permissions?.roles || [],
                scopes: req.permissions?.scopes || [],
                hasAdminRole: req.permissions?.roles?.includes('admin') || false,
                hasDronePermissions: req.permissions?.permissions?.some(p => p.startsWith('drone:')) || false,
                message: 'You have the required permissions to access this endpoint'
            };

            this.logger.info('Permission test accessed', {
                userId: req.user?.id,
                permissions: req.permissions?.permissions,
                roles: req.permissions?.roles
            });

            ResResult.success(res, permissionInfo, 'Permission test successful');
        } catch (error) {
            this.logger.error('Permission test error:', error);
            ResResult.fail(res, 'Permission test failed', 500);
        }
    };

    /**
     * 測試管理員權限
     */
    public testAdminAccess = (req: Request, res: Response): void => {
        try {
            const adminInfo = {
                user: {
                    id: req.user?.id,
                    username: req.user?.username
                },
                roles: req.permissions?.roles || [],
                isAdmin: req.permissions?.roles?.includes('admin') || false,
                accessLevel: 'administrator',
                message: 'Welcome, administrator! You have full access to the system.',
                adminCapabilities: [
                    'User Management',
                    'System Configuration',
                    'Security Settings',
                    'Service Monitoring',
                    'Data Analytics'
                ]
            };

            this.logger.info('Admin access test', {
                userId: req.user?.id,
                username: req.user?.username,
                roles: req.permissions?.roles
            });

            ResResult.success(res, adminInfo, 'Admin access granted');
        } catch (error) {
            this.logger.error('Admin test error:', error);
            ResResult.fail(res, 'Admin test failed', 500);
        }
    };

    /**
     * 測試無人機權限
     */
    public testDroneAccess = (req: Request, res: Response): void => {
        try {
            const dronePermissions = req.permissions?.permissions?.filter(p => p.startsWith('drone:')) || [];
            
            const droneInfo = {
                user: {
                    id: req.user?.id,
                    username: req.user?.username
                },
                dronePermissions,
                hasReadAccess: dronePermissions.includes('drone:read'),
                hasWriteAccess: dronePermissions.includes('drone:write'),
                hasControlAccess: dronePermissions.includes('drone:control'),
                message: 'You have access to drone operations',
                availableOperations: [] as string[]
            };

            // 根據權限決定可用操作
            if (droneInfo.hasReadAccess) {
                droneInfo.availableOperations.push('View Drone Status', 'Read Flight Data');
            }
            if (droneInfo.hasWriteAccess) {
                droneInfo.availableOperations.push('Update Drone Config', 'Log Flight Data');
            }
            if (droneInfo.hasControlAccess) {
                droneInfo.availableOperations.push('Send Commands', 'Emergency Stop');
            }

            this.logger.info('Drone access test', {
                userId: req.user?.id,
                dronePermissions,
                operations: droneInfo.availableOperations
            });

            ResResult.success(res, droneInfo, 'Drone access granted');
        } catch (error) {
            this.logger.error('Drone test error:', error);
            ResResult.fail(res, 'Drone test failed', 500);
        }
    };

    /**
     * 公開端點測試（無需認證）
     */
    public testPublicAccess = (req: Request, res: Response): void => {
        try {
            const publicInfo = {
                message: 'This is a public endpoint - no authentication required',
                isAuthenticated: !!req.user,
                userInfo: req.user ? {
                    id: req.user.id,
                    username: req.user.username
                } : null,
                timestamp: new Date().toISOString(),
                gatewayVersion: '1.0.0'
            };

            this.logger.debug('Public access test', {
                authenticated: !!req.user,
                userId: req.user?.id
            });

            ResResult.success(res, publicInfo, 'Public access successful');
        } catch (error) {
            this.logger.error('Public test error:', error);
            ResResult.fail(res, 'Public test failed', 500);
        }
    };
}
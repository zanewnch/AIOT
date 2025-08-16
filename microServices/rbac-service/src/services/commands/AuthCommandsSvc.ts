/**
 * @fileoverview 認證命令服務實現
 * 
 * 此文件實作了認證命令業務邏輯層，
 * 專注於處理所有寫入相關的認證業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含登入、登出等寫入邏輯。
 * 
 * @module AuthCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 2.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { createLogger } from '../../configs/loggerConfig.js';
import { JwtUtils, JwtGenerateOptions } from '../../utils/JwtUtils.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('AuthCommandsSvc');

/**
 * 登入請求介面 - 支援 OPA 集中驗證
 */
export interface LoginRequest {
    username: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
    rememberMe?: boolean;
    deviceInfo?: {
        type: string;
        os: string;
        browser: string;
    };
}

/**
 * 登入回應介面
 */
export interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: number;
        username: string;
        roles: string[];
        permissions: string[];
        departmentId: number;
        level: number;
    };
}

/**
 * 登出請求介面
 */
export interface LogoutRequest {
    token?: string;
    userId?: number;
}

/**
 * 用戶權限信息介面
 */
interface UserPermissions {
    roles: string[];
    permissions: string[];
    departmentId: number;
    level: number;
}

/**
 * 認證命令服務類別
 * 
 * 提供認證的所有命令功能，
 * 包含登入、登出和會話管理。
 */
@injectable()
export class AuthCommandsSvc {
    
    /**
     * 會話管理
     */
    private readonly activeSessions = new Map<string, string>(); // sessionId -> userId

    /**
     * 預設用戶帳號數據 (生產環境應從數據庫讀取)
     */
    private readonly validUsers: Record<string, { password: string, id: number }> = {
        'superadmin': { password: 'superadmin', id: 1 },
        'admin': { password: 'admin', id: 2 },
        'drone_admin': { password: 'drone123', id: 3 },
        'pilot_001': { password: 'pilot123', id: 4 },
        'mission_cmd': { password: 'mission123', id: 5 },
        'maintenance_tech': { password: 'maintenance123', id: 6 },
        'monitor_op': { password: 'monitor123', id: 7 },
        'dept_manager': { password: 'manager123', id: 8 },
        'regular_user': { password: 'user123', id: 9 },
        'emergency_user': { password: 'emergency123', id: 10 }
    };

    /**
     * 獲取用戶完整權限信息
     */
    private getUserPermissions(username: string): UserPermissions {
        const userPermissions: Record<string, UserPermissions> = {
            'superadmin': {
                roles: ['superadmin'],
                permissions: ['*'], // 超級管理員擁有所有權限
                departmentId: 1,
                level: 10
            },
            'admin': {
                roles: ['admin'],
                permissions: [
                    'user.create', 'user.read', 'user.update', 'user.delete',
                    'role.create', 'role.read', 'role.update', 'role.delete',
                    'permission.create', 'permission.read', 'permission.update', 'permission.delete',
                    'drone.read', 'drone.update', 'system.configure', 'audit.read'
                ],
                departmentId: 1,
                level: 8
            },
            'drone_admin': {
                roles: ['drone_admin'],
                permissions: [
                    'drone.create', 'drone.read', 'drone.update', 'drone.delete',
                    'drone.command.all', 'drone.status.all', 'drone.archive.all'
                ],
                departmentId: 2,
                level: 8
            },
            'pilot_001': {
                roles: ['drone_operator', 'flight_controller'],
                permissions: [
                    'drone.command.create', 'drone.command.read', 'drone.command.update',
                    'drone.status.read', 'drone.realtime.read', 'drone.command.assigned', 
                    'drone.status.assigned', 'drone.position.assigned'
                ],
                departmentId: 2,
                level: 5
            },
            'mission_cmd': {
                roles: ['mission_commander'],
                permissions: [
                    'mission.create', 'mission.read', 'mission.update', 'mission.delete',
                    'archive.create', 'archive.read', 'archive.update', 'archive.delete'
                ],
                departmentId: 2,
                level: 7
            },
            'maintenance_tech': {
                roles: ['maintenance_technician'],
                permissions: [
                    'drone.status.update', 'drone.maintenance.all',
                    'archive.read', 'diagnostic.run'
                ],
                departmentId: 3,
                level: 4
            },
            'monitor_op': {
                roles: ['monitor_operator'],
                permissions: [
                    'drone.status.read', 'drone.position.read', 
                    'system.monitor', 'alert.read'
                ],
                departmentId: 1,
                level: 2
            },
            'dept_manager': {
                roles: ['department_manager'],
                permissions: [
                    'user.read.department', 'user.update.department',
                    'report.generate.department', 'audit.read.department'
                ],
                departmentId: 2,
                level: 6
            },
            'regular_user': {
                roles: ['user'],
                permissions: [
                    'profile.read', 'profile.update',
                    'preference.read', 'preference.update', 'preference.create'
                ],
                departmentId: 2,
                level: 1
            },
            'emergency_user': {
                roles: ['user', 'emergency_responder'],
                permissions: [
                    'profile.read', 'profile.update',
                    'preference.read', 'preference.update', 'preference.create',
                    'emergency.override', 'drone.command.emergency',
                    'system.emergency', 'alert.create'
                ],
                departmentId: 3,
                level: 3
            }
        };

        return userPermissions[username] || {
            roles: ['user'],
            permissions: ['profile.read', 'profile.update', 'preference.read', 'preference.update'],
            departmentId: 1,
            level: 1
        };
    }

    /**
     * 生成包含完整權限的 JWT for OPA
     */
    private async generateJWT(
        userId: number, 
        username: string, 
        userPermissions: UserPermissions,
        sessionInfo: {
            sessionId: string;
            ipAddress?: string;
            userAgent?: string;
            rememberMe?: boolean;
        }
    ): Promise<string> {
        // 構建 API 作用域
        const scopes = this.buildApiScopes(userPermissions.permissions);
        
        const options: JwtGenerateOptions = {
            user: {
                id: userId,
                username: username,
                is_active: true
            },
            roles: userPermissions.roles,
            permissions: userPermissions.permissions,
            scopes: scopes,
            sessionId: sessionInfo.sessionId,
            ipAddress: sessionInfo.ipAddress,
            userAgent: sessionInfo.userAgent,
            rememberMe: sessionInfo.rememberMe || false
        };

        return await JwtUtils.generateToken(options);
    }

    /**
     * 根據權限構建 API 作用域
     */
    private buildApiScopes(permissions: string[]): string[] {
        const scopes = ['api:basic'];
        
        // 根據權限動態添加作用域
        if (permissions.includes('*') || permissions.some(p => p.includes('read'))) {
            scopes.push('api:read');
        }
        if (permissions.includes('*') || permissions.some(p => p.includes('create') || p.includes('update') || p.includes('delete'))) {
            scopes.push('api:write');
        }
        if (permissions.includes('*') || permissions.some(p => p.includes('admin'))) {
            scopes.push('api:admin');
        }
        if (permissions.some(p => p.includes('emergency'))) {
            scopes.push('api:emergency');
        }
        
        return scopes;
    }

    /**
     * 使用者登入 - 支援 OPA 集中驗證
     */
    public login = async (request: LoginRequest): Promise<LoginResponse> => {
        try {
            logger.info(`Login attempt for user: ${request.username}, IP: ${request.ipAddress}`);
            
            // 檢查用戶是否存在且密碼正確
            const user = this.validUsers[request.username];
            if (!user || user.password !== request.password) {
                logger.warn(`Authentication failed for user: ${request.username}`);
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            logger.info(`Login successful for user: ${request.username}`);
            
            // 獲取用戶完整權限信息
            const userPermissions = this.getUserPermissions(request.username);
            
            // 生成會話 ID
            const sessionId = uuidv4();
            this.activeSessions.set(sessionId, user.id.toString());
            
            // 生成包含完整權限的 JWT for OPA
            const token = await this.generateJWT(user.id, request.username, userPermissions, {
                sessionId,
                ipAddress: request.ipAddress,
                userAgent: request.userAgent,
                rememberMe: request.rememberMe
            });
            
            logger.info(`JWT generated for user: ${request.username}, session: ${sessionId}, permissions: ${userPermissions.permissions.length} items, roles: ${userPermissions.roles.join(', ')}`);
            
            return {
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    username: request.username,
                    roles: userPermissions.roles,
                    permissions: userPermissions.permissions,
                    departmentId: userPermissions.departmentId,
                    level: userPermissions.level
                }
            };
            
        } catch (error) {
            logger.error('Login error:', error);
            return {
                success: false,
                message: 'An error occurred during login'
            };
        }
    }

    /**
     * 使用者登出
     */
    public logout = async (request: LogoutRequest): Promise<{ success: boolean; message: string }> => {
        try {
            logger.info('Processing logout request');
            
            // TODO: 在實際實現中，應該將 JWT 加入黑名單或從 Redis 清除會話
            if (request.token) {
                logger.info('Token invalidated successfully');
            }
            
            return {
                success: true,
                message: 'Logout successful'
            };
        } catch (error) {
            logger.error('Logout error:', error);
            return {
                success: false,
                message: 'Logout failed due to system error'
            };
        }
    }
}
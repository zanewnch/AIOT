/**
 * @fileoverview RBAC Service MCP (Model Context Protocol) 路由
 * 
 * 此文件實作 RBAC 服務的 MCP Server 端點，將用戶權限管理功能
 * 轉換為可被 LLM AI Engine 調用的 MCP 工具。
 * 
 * 支援的自然語言操作包括：
 * - 用戶查詢：「查看用戶 admin 的基本資料」
 * - 角色管理：「列出所有管理員角色」
 * - 權限檢查：「檢查用戶 john 是否有刪除權限」
 * - 用戶角色：「查看用戶 alice 的所有角色」
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router, Request, Response } from 'express';
import { TYPES } from '../container/types.js';
import { UserQueriesService } from '../services/queries/UserQueriesService.js';
import { RoleQueriesService } from '../services/queries/RoleQueriesService.js';
import { PermissionQueriesService } from '../services/queries/PermissionQueriesService.js';
import { UserToRoleQueriesService } from '../services/queries/UserToRoleQueriesService.js';
import { RoleToPermissionQueriesService } from '../services/queries/RoleToPermissionQueriesService.js';
import { createLogger } from '../configs/loggerConfig.js';
import { ResResult } from 'aiot-shared-packages';

const logger = createLogger('MCPRoutes');

/**
 * RBAC MCP 工具定義
 * 每個工具對應一個可被自然語言調用的功能
 */
const RBAC_MCP_TOOLS = [
    {
        name: 'get_user_info',
        description: '獲取用戶基本資料，包括用戶名、郵箱、狀態等資訊',
        inputSchema: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: '用戶ID，必填參數' },
                includeRoles: { type: 'boolean', description: '是否包含用戶角色資訊，預設為 false' }
            },
            required: ['userId']
        }
    },
    {
        name: 'list_users',
        description: '列出系統中的用戶，支援分頁和篩選條件',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，從 1 開始，預設為 1' },
                limit: { type: 'number', description: '每頁數量，預設為 10' },
                status: { type: 'string', description: '用戶狀態篩選：active, inactive, suspended' },
                searchKeyword: { type: 'string', description: '搜尋關鍵字，會搜尋用戶名和郵箱' }
            }
        }
    },
    {
        name: 'get_user_roles',
        description: '獲取指定用戶的所有角色列表',
        inputSchema: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: '用戶ID，必填參數' }
            },
            required: ['userId']
        }
    },
    {
        name: 'get_user_permissions',
        description: '獲取用戶的所有權限，包括直接權限和通過角色繼承的權限',
        inputSchema: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: '用戶ID，必填參數' },
                includeInherited: { type: 'boolean', description: '是否包含從角色繼承的權限，預設為 true' }
            },
            required: ['userId']
        }
    },
    {
        name: 'list_roles',
        description: '列出系統中的所有角色，支援分頁和篩選',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，從 1 開始，預設為 1' },
                limit: { type: 'number', description: '每頁數量，預設為 10' },
                includePermissions: { type: 'boolean', description: '是否包含角色的權限列表，預設為 false' }
            }
        }
    },
    {
        name: 'get_role_info',
        description: '獲取指定角色的詳細資訊，包括描述和權限列表',
        inputSchema: {
            type: 'object',
            properties: {
                roleId: { type: 'string', description: '角色ID，必填參數' },
                includeUsers: { type: 'boolean', description: '是否包含擁有此角色的用戶列表，預設為 false' }
            },
            required: ['roleId']
        }
    },
    {
        name: 'get_role_permissions',
        description: '獲取指定角色的所有權限列表',
        inputSchema: {
            type: 'object',
            properties: {
                roleId: { type: 'string', description: '角色ID，必填參數' }
            },
            required: ['roleId']
        }
    },
    {
        name: 'list_permissions',
        description: '列出系統中的所有權限，支援分頁和分類篩選',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，從 1 開始，預設為 1' },
                limit: { type: 'number', description: '每頁數量，預設為 10' },
                category: { type: 'string', description: '權限分類篩選，如 user, admin, system' }
            }
        }
    },
    {
        name: 'check_user_permission',
        description: '檢查指定用戶是否擁有特定權限',
        inputSchema: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: '用戶ID，必填參數' },
                permission: { type: 'string', description: '權限名稱，如 user.create, admin.delete' }
            },
            required: ['userId', 'permission']
        }
    },
    {
        name: 'get_users_with_role',
        description: '獲取擁有指定角色的所有用戶列表',
        inputSchema: {
            type: 'object',
            properties: {
                roleId: { type: 'string', description: '角色ID，必填參數' },
                page: { type: 'number', description: '頁碼，預設為 1' },
                limit: { type: 'number', description: '每頁數量，預設為 10' }
            },
            required: ['roleId']
        }
    }
];

/**
 * RBAC MCP 路由處理類別
 * 
 * 負責處理來自 LLM AI Engine 的 MCP 工具調用請求
 */
@injectable()
export class RBACMCPRoutes {
    constructor(
        @inject(TYPES.UserQueriesService) private userQueriesService: UserQueriesService,
        @inject(TYPES.RoleQueriesService) private roleQueriesService: RoleQueriesService,
        @inject(TYPES.PermissionQueriesService) private permissionQueriesService: PermissionQueriesService,
        @inject(TYPES.UserToRoleQueriesService) private userToRoleQueriesService: UserToRoleQueriesService,
        @inject(TYPES.RoleToPermissionQueriesService) private roleToPermissionQueriesService: RoleToPermissionQueriesService
    ) {}

    /**
     * 獲取路由器實例
     */
    getRouter = (): Router => {
        const router = Router();

        // MCP 工具列表端點
        router.get('/tools', this.getTools);
        
        // MCP 工具調用端點
        router.post('/call', this.callTool);

        return router;
    };

    /**
     * 獲取 RBAC 服務支援的所有 MCP 工具列表
     */
    private getTools = async (req: Request, res: Response): Promise<void> => {
        try {
            logger.info('📋 Returning RBAC MCP tools list');
            ResResult.success(res, {
                service: 'rbac-service',
                version: '1.0.0',
                tools: RBAC_MCP_TOOLS,
                total: RBAC_MCP_TOOLS.length
            }, 'RBAC MCP tools retrieved successfully');
        } catch (error) {
            logger.error('❌ Failed to get RBAC MCP tools:', error);
            ResResult.error(res, 500, 'Failed to retrieve MCP tools', error);
        }
    };

    /**
     * 執行 MCP 工具調用
     */
    private callTool = async (req: Request, res: Response): Promise<void> => {
        try {
            const { tool_name, arguments: args = {} } = req.body;

            if (!tool_name) {
                ResResult.error(res, 400, 'tool_name is required');
                return;
            }

            logger.info(`🔧 Executing RBAC MCP tool: ${tool_name}`, { arguments: args });

            let result: any;

            switch (tool_name) {
                case 'get_user_info':
                    result = await this.handleGetUserInfo(args);
                    break;
                    
                case 'list_users':
                    result = await this.handleListUsers(args);
                    break;
                    
                case 'get_user_roles':
                    result = await this.handleGetUserRoles(args);
                    break;
                    
                case 'get_user_permissions':
                    result = await this.handleGetUserPermissions(args);
                    break;
                    
                case 'list_roles':
                    result = await this.handleListRoles(args);
                    break;
                    
                case 'get_role_info':
                    result = await this.handleGetRoleInfo(args);
                    break;
                    
                case 'get_role_permissions':
                    result = await this.handleGetRolePermissions(args);
                    break;
                    
                case 'list_permissions':
                    result = await this.handleListPermissions(args);
                    break;
                    
                case 'check_user_permission':
                    result = await this.handleCheckUserPermission(args);
                    break;
                    
                case 'get_users_with_role':
                    result = await this.handleGetUsersWithRole(args);
                    break;
                    
                default:
                    ResResult.error(res, 404, `Unknown tool: ${tool_name}`);
                    return;
            }

            logger.info(`✅ RBAC MCP tool executed successfully: ${tool_name}`);
            ResResult.success(res, result, `Tool ${tool_name} executed successfully`);

        } catch (error: any) {
            logger.error(`❌ RBAC MCP tool execution failed:`, error);
            ResResult.error(res, 500, `Tool execution failed: ${error.message}`, error);
        }
    };

    /**
     * 處理獲取用戶資訊工具
     */
    private handleGetUserInfo = async (args: any) => {
        const { userId, includeRoles = false } = args;

        if (!userId) {
            throw new Error('userId is required');
        }

        try {
            // 使用現有的 UserQueriesService 方法
            const userInfo = await this.userQueriesService.getUserById(userId);
            
            if (!userInfo) {
                return {
                    success: false,
                    message: `User not found: ${userId}`,
                    data: null
                };
            }

            let roles = null;
            if (includeRoles) {
                try {
                    roles = await this.userToRoleQueriesService.getRolesByUserId(userId);
                } catch (error) {
                    logger.warn(`Failed to get roles for user ${userId}:`, error);
                }
            }

            return {
                success: true,
                message: `User information retrieved successfully`,
                data: {
                    user: userInfo,
                    roles: roles
                }
            };
        } catch (error) {
            logger.error(`Error getting user info for ${userId}:`, error);
            throw error;
        }
    };

    /**
     * 處理列出用戶工具
     */
    private handleListUsers = async (args: any) => {
        const { 
            page = 1, 
            limit = 10, 
            status = null, 
            searchKeyword = null 
        } = args;

        try {
            const pagination = { page, limit, offset: (page - 1) * limit };
            const filters = { status, searchKeyword };

            const users = await this.userQueriesService.getAllUsers(pagination, filters);

            return {
                success: true,
                message: `Users retrieved successfully`,
                data: users,
                pagination: {
                    page,
                    limit,
                    total: users.total || 0
                }
            };
        } catch (error) {
            logger.error('Error listing users:', error);
            throw error;
        }
    };

    /**
     * 處理獲取用戶角色工具
     */
    private handleGetUserRoles = async (args: any) => {
        const { userId } = args;

        if (!userId) {
            throw new Error('userId is required');
        }

        try {
            const roles = await this.userToRoleQueriesService.getRolesByUserId(userId);

            return {
                success: true,
                message: `User roles retrieved successfully`,
                data: {
                    userId,
                    roles: roles || []
                }
            };
        } catch (error) {
            logger.error(`Error getting roles for user ${userId}:`, error);
            throw error;
        }
    };

    /**
     * 處理獲取用戶權限工具
     */
    private handleGetUserPermissions = async (args: any) => {
        const { userId, includeInherited = true } = args;

        if (!userId) {
            throw new Error('userId is required');
        }

        try {
            // 這裡可能需要調用多個服務來組合權限資訊
            const userRoles = await this.userToRoleQueriesService.getRolesByUserId(userId);
            let permissions: any[] = [];

            if (includeInherited && userRoles && userRoles.length > 0) {
                for (const role of userRoles) {
                    try {
                        const rolePermissions = await this.roleToPermissionQueriesService.getPermissionsByRoleId(role.id);
                        if (rolePermissions) {
                            permissions.push(...rolePermissions);
                        }
                    } catch (error) {
                        logger.warn(`Failed to get permissions for role ${role.id}:`, error);
                    }
                }
            }

            // 去重權限
            const uniquePermissions = permissions.filter((permission, index, self) =>
                index === self.findIndex(p => p.id === permission.id)
            );

            return {
                success: true,
                message: `User permissions retrieved successfully`,
                data: {
                    userId,
                    permissions: uniquePermissions,
                    inheritedFromRoles: includeInherited
                }
            };
        } catch (error) {
            logger.error(`Error getting permissions for user ${userId}:`, error);
            throw error;
        }
    };

    /**
     * 處理列出角色工具
     */
    private handleListRoles = async (args: any) => {
        const { page = 1, limit = 10, includePermissions = false } = args;

        try {
            const pagination = { page, limit, offset: (page - 1) * limit };
            const roles = await this.roleQueriesService.getAllRoles(pagination);

            if (includePermissions && roles.data) {
                for (const role of roles.data) {
                    try {
                        const permissions = await this.roleToPermissionQueriesService.getPermissionsByRoleId(role.id);
                        role.permissions = permissions || [];
                    } catch (error) {
                        logger.warn(`Failed to get permissions for role ${role.id}:`, error);
                        role.permissions = [];
                    }
                }
            }

            return {
                success: true,
                message: `Roles retrieved successfully`,
                data: roles,
                pagination: {
                    page,
                    limit,
                    total: roles.total || 0
                }
            };
        } catch (error) {
            logger.error('Error listing roles:', error);
            throw error;
        }
    };

    /**
     * 處理獲取角色資訊工具
     */
    private handleGetRoleInfo = async (args: any) => {
        const { roleId, includeUsers = false } = args;

        if (!roleId) {
            throw new Error('roleId is required');
        }

        try {
            const roleInfo = await this.roleQueriesService.getRoleById(roleId);
            
            if (!roleInfo) {
                return {
                    success: false,
                    message: `Role not found: ${roleId}`,
                    data: null
                };
            }

            let users = null;
            if (includeUsers) {
                try {
                    users = await this.userToRoleQueriesService.getUsersByRoleId(roleId);
                } catch (error) {
                    logger.warn(`Failed to get users for role ${roleId}:`, error);
                }
            }

            return {
                success: true,
                message: `Role information retrieved successfully`,
                data: {
                    role: roleInfo,
                    users: users
                }
            };
        } catch (error) {
            logger.error(`Error getting role info for ${roleId}:`, error);
            throw error;
        }
    };

    /**
     * 處理獲取角色權限工具
     */
    private handleGetRolePermissions = async (args: any) => {
        const { roleId } = args;

        if (!roleId) {
            throw new Error('roleId is required');
        }

        try {
            const permissions = await this.roleToPermissionQueriesService.getPermissionsByRoleId(roleId);

            return {
                success: true,
                message: `Role permissions retrieved successfully`,
                data: {
                    roleId,
                    permissions: permissions || []
                }
            };
        } catch (error) {
            logger.error(`Error getting permissions for role ${roleId}:`, error);
            throw error;
        }
    };

    /**
     * 處理列出權限工具
     */
    private handleListPermissions = async (args: any) => {
        const { page = 1, limit = 10, category = null } = args;

        try {
            const pagination = { page, limit, offset: (page - 1) * limit };
            const filters = { category };

            const permissions = await this.permissionQueriesService.getAllPermissions(pagination, filters);

            return {
                success: true,
                message: `Permissions retrieved successfully`,
                data: permissions,
                pagination: {
                    page,
                    limit,
                    total: permissions.total || 0
                }
            };
        } catch (error) {
            logger.error('Error listing permissions:', error);
            throw error;
        }
    };

    /**
     * 處理檢查用戶權限工具
     */
    private handleCheckUserPermission = async (args: any) => {
        const { userId, permission } = args;

        if (!userId || !permission) {
            throw new Error('userId and permission are required');
        }

        try {
            // 這裡需要實現權限檢查邏輯
            // 可能需要查詢用戶的所有權限，然後檢查是否包含指定權限
            const userPermissions = await this.handleGetUserPermissions({ userId, includeInherited: true });
            
            let hasPermission = false;
            if (userPermissions.success && userPermissions.data.permissions) {
                hasPermission = userPermissions.data.permissions.some(
                    (p: any) => p.name === permission || p.code === permission
                );
            }

            return {
                success: true,
                message: `Permission check completed`,
                data: {
                    userId,
                    permission,
                    hasPermission,
                    checkResult: hasPermission ? 'GRANTED' : 'DENIED'
                }
            };
        } catch (error) {
            logger.error(`Error checking permission ${permission} for user ${userId}:`, error);
            throw error;
        }
    };

    /**
     * 處理獲取角色用戶工具
     */
    private handleGetUsersWithRole = async (args: any) => {
        const { roleId, page = 1, limit = 10 } = args;

        if (!roleId) {
            throw new Error('roleId is required');
        }

        try {
            const pagination = { page, limit, offset: (page - 1) * limit };
            const users = await this.userToRoleQueriesService.getUsersByRoleId(roleId, pagination);

            return {
                success: true,
                message: `Users with role retrieved successfully`,
                data: {
                    roleId,
                    users: users || []
                },
                pagination: {
                    page,
                    limit,
                    total: users?.total || 0
                }
            };
        } catch (error) {
            logger.error(`Error getting users for role ${roleId}:`, error);
            throw error;
        }
    };
}

export default RBACMCPRoutes;
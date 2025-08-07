/**
 * @fileoverview 使用者角色關聯服務介面（已重構為 CQRS 模式）
 * 
 * 此文件現在作為相容性介面，重新導出 CQRS 模式的查詢和命令介面。
 * 原始的統一服務已重構為分離的查詢服務和命令服務，遵循 CQRS 模式。
 * 
 * 重構說明：
 * - 查詢功能移至 IUserToRoleQueriesSvc
 * - 命令功能移至 IUserToRoleCommandsSvc
 * - 此介面保留向後相容性
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 * @deprecated 建議使用 IUserToRoleQueriesSvc 和 IUserToRoleCommandsSvc
 */

/**
 * 使用者角色資料傳輸物件
 */
export interface UserRoleDTO {
    userId: number;
    roleId: number;
    assignedAt: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
    role?: {
        id: number;
        name: string;
        displayName?: string;
    };
}

/**
 * 角色資料傳輸物件
 */
export interface RoleDTO {
    id: number;
    name: string;
    displayName?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 使用者資料傳輸物件
 */
export interface UserDTO {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

// 重新導出新的 CQRS 介面以保持向後相容性
export type { IUserToRoleQueriesSvc } from './IUserToRoleQueriesSvc.js';
export type { IUserToRoleCommandsSvc } from './IUserToRoleCommandsSvc.js';
export type { 
    RoleDTO as QueriesRoleDTO, 
    UserDTO as QueriesUserDTO, 
    UserRoleBasicDTO, 
    CacheOptions 
} from './IUserToRoleQueriesSvc.js';
export type { AssignRolesRequest, RemoveRoleRequest } from './IUserToRoleCommandsSvc.js';

/**
 * 使用者角色關聯服務介面（已廢棄）
 * 
 * 此介面已重構為 CQRS 模式，請使用 IUserToRoleQueriesSvc 和 IUserToRoleCommandsSvc。
 * 
 * @deprecated 建議使用 IUserToRoleQueriesSvc 和 IUserToRoleCommandsSvc
 */
export interface IUserToRoleService {
    /**
     * @deprecated 使用 IUserToRoleQueriesSvc.getUserRoles
     */
    getUserRoles(userId: number): Promise<RoleDTO[]>;

    /**
     * @deprecated 使用 IUserToRoleCommandsSvc.assignRolesToUser
     */
    assignRolesToUser(userId: number, roleIds: number[]): Promise<void>;

    /**
     * @deprecated 使用 IUserToRoleCommandsSvc.removeRoleFromUser
     */
    removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;

    /**
     * @deprecated 使用 IUserToRoleQueriesSvc.userHasRole
     */
    userHasRole(userId: number, roleId: number): Promise<boolean>;

    /**
     * @deprecated 使用 IUserToRoleQueriesSvc.getRoleUsers
     */
    getRoleUsers(roleId: number): Promise<UserDTO[]>;

    /**
     * @deprecated 使用 IUserToRoleCommandsSvc.removeAllRolesFromUser
     */
    removeAllRolesFromUser(userId: number): Promise<number>;

    /**
     * @deprecated 使用 IUserToRoleCommandsSvc.removeAllUsersFromRole
     */
    removeAllUsersFromRole(roleId: number): Promise<number>;

    /**
     * @deprecated 使用 IUserToRoleQueriesSvc.getAllUserRoles
     */
    getAllUserRoles(): Promise<UserRoleDTO[]>;
}
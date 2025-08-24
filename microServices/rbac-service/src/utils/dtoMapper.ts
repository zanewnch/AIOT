/**
 * @fileoverview DTO 映射轉換工具
 * 
 * 統一管理 Model 到 DTO 的轉換邏輯，確保資料在各層間的一致性傳遞
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { UserModel } from '../models/UserModel.js';
import { RoleModel } from '../models/RoleModel.js';
import { PermissionModel } from '../models/PermissionModel.js';
import { UserRoleModel } from '../models/UserToRoleModel.js';
import { RolePermissionModel } from '../models/RoleToPermissionModel.js';
import {
    UserResponseDto,
    UserDetailResponseDto,
    RoleResponseDto,
    RoleDetailResponseDto,
    PermissionResponseDto,
    PermissionDetailResponseDto,
    UserRoleResponseDto,
    RolePermissionResponseDto,
    PaginatedListResponseDto,
    PaginationResponseDto,
    PaginatedResult
} from '../dto/index.js';

/**
 * DTO 映射器類別
 * 
 * 提供 Model 到 DTO 的標準化轉換方法
 */
export class DtoMapper {

    /**
     * 將 UserModel 轉換為 UserResponseDto
     */
    static toUserResponseDto = (model: UserModel): UserResponseDto => {
        return {
            id: model.id?.toString(),
            username: model.username,
            email: model.email,
            displayName: model.username, // Use username as displayName
            status: model.isActive ? 'active' : 'inactive',
            lastLoginAt: model.lastLoginAt?.toISOString(),
            isVerified: true, // Default to true since we don't have isVerified field
            roles: [], // 將在需要時填充
            createdAt: model.createdAt?.toISOString(),
            updatedAt: model.updatedAt?.toISOString()
        };
    };

    /**
     * 將 UserModel 陣列轉換為 UserResponseDto 陣列
     */
    static toUserResponseDtoArray = (models: UserModel[]): UserResponseDto[] => {
        return models.map(DtoMapper.toUserResponseDto);
    };

    /**
     * 將分頁查詢結果轉換為分頁 User DTO
     */
    static toPaginatedUserResponse = (
        result: PaginatedResult<UserModel>
    ): PaginatedListResponseDto<UserResponseDto> => {
        const dtoArray = DtoMapper.toUserResponseDtoArray(result.data);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };
        
        return { 
            data: dtoArray, 
            pagination,
            statistics: {
                totalCount: result.totalCount,
                activeCount: 0, // 將在需要時計算
                inactiveCount: 0 // 將在需要時計算
            }
        };
    };

    /**
     * 將 RoleModel 轉換為 RoleResponseDto
     */
    static toRoleResponseDto = (model: RoleModel): RoleResponseDto => {
        return {
            id: model.id?.toString(),
            name: model.name,
            displayName: model.displayName,
            description: '', // Default empty description
            type: 'standard', // Default type
            status: 'active', // Default active status
            permissionCount: 0, // 將在需要時計算
            userCount: 0, // 將在需要時計算
            createdAt: model.createdAt?.toISOString(),
            updatedAt: model.updatedAt?.toISOString()
        };
    };

    /**
     * 將 RoleModel 陣列轉換為 RoleResponseDto 陣列
     */
    static toRoleResponseDtoArray = (models: RoleModel[]): RoleResponseDto[] => {
        return models.map(DtoMapper.toRoleResponseDto);
    };

    /**
     * 將分頁查詢結果轉換為分頁 Role DTO
     */
    static toPaginatedRoleResponse = (
        result: PaginatedResult<RoleModel>
    ): PaginatedListResponseDto<RoleResponseDto> => {
        const dtoArray = DtoMapper.toRoleResponseDtoArray(result.data);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };
        
        return { 
            data: dtoArray, 
            pagination,
            statistics: {
                totalCount: result.totalCount,
                activeCount: 0, // 將在需要時計算
                inactiveCount: 0 // 將在需要時計算
            }
        };
    };

    /**
     * 將 PermissionModel 轉換為 PermissionResponseDto
     */
    static toPermissionResponseDto = (model: PermissionModel): PermissionResponseDto => {
        return {
            id: model.id?.toString(),
            name: model.name,
            displayName: model.name, // Use name as displayName
            description: model.description || '',
            resource: 'system', // Default resource
            action: 'read', // Default action  
            type: 'standard', // Default type
            status: 'active', // Default status
            roleCount: 0, // 將在需要時計算
            createdAt: model.createdAt?.toISOString(),
            updatedAt: model.updatedAt?.toISOString()
        };
    };

    /**
     * 將 PermissionModel 陣列轉換為 PermissionResponseDto 陣列
     */
    static toPermissionResponseDtoArray = (models: PermissionModel[]): PermissionResponseDto[] => {
        return models.map(DtoMapper.toPermissionResponseDto);
    };

    /**
     * 將分頁查詢結果轉換為分頁 Permission DTO
     */
    static toPaginatedPermissionResponse = (
        result: PaginatedResult<PermissionModel>
    ): PaginatedListResponseDto<PermissionResponseDto> => {
        const dtoArray = DtoMapper.toPermissionResponseDtoArray(result.data);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };
        
        return { 
            data: dtoArray, 
            pagination,
            statistics: {
                totalCount: result.totalCount,
                activeCount: 0, // 將在需要時計算
                inactiveCount: 0 // 將在需要時計算
            }
        };
    };

    /**
     * 將 UserToRoleModel 轉換為 UserRoleResponseDto
     */
    static toUserRoleResponseDto = (model: UserToRoleModel): UserRoleResponseDto => {
        return {
            id: model.id?.toString(),
            userId: model.user_id?.toString(),
            roleId: model.role_id?.toString(),
            user: model.user ? {
                username: model.user.username,
                email: model.user.email,
                displayName: model.user.displayName
            } : undefined,
            role: model.role ? {
                name: model.role.name,
                displayName: model.role.displayName,
                type: model.role.type
            } : undefined,
            grantedBy: model.granted_by?.toString(),
            grantedAt: model.granted_at?.toISOString() || model.createdAt?.toISOString(),
            expiresAt: model.expires_at?.toISOString(),
            status: model.status || 'active',
            isExpired: model.expires_at ? new Date() > model.expires_at : false,
            createdAt: model.createdAt?.toISOString(),
            updatedAt: model.updatedAt?.toISOString()
        };
    };

    /**
     * 將 UserToRoleModel 陣列轉換為 UserRoleResponseDto 陣列
     */
    static toUserRoleResponseDtoArray = (models: UserToRoleModel[]): UserRoleResponseDto[] => {
        return models.map(DtoMapper.toUserRoleResponseDto);
    };

    /**
     * 將分頁查詢結果轉換為分頁 UserRole DTO
     */
    static toPaginatedUserRoleResponse = (
        result: PaginatedResult<UserToRoleModel>
    ): PaginatedListResponseDto<UserRoleResponseDto> => {
        const dtoArray = DtoMapper.toUserRoleResponseDtoArray(result.data);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };
        
        return { 
            data: dtoArray, 
            pagination,
            statistics: {
                totalCount: result.totalCount,
                activeCount: 0, // 將在需要時計算
                expiredCount: 0, // 將在需要時計算
                inactiveCount: 0 // 將在需要時計算
            }
        };
    };

    /**
     * 將 RoleToPermissionModel 轉換為 RolePermissionResponseDto
     */
    static toRolePermissionResponseDto = (model: RoleToPermissionModel): RolePermissionResponseDto => {
        return {
            id: model.id?.toString(),
            roleId: model.role_id?.toString(),
            permissionId: model.permission_id?.toString(),
            role: model.role ? {
                name: model.role.name,
                displayName: model.role.displayName,
                type: model.role.type
            } : undefined,
            permission: model.permission ? {
                name: model.permission.name,
                displayName: model.permission.displayName,
                resource: model.permission.resource,
                action: model.permission.action
            } : undefined,
            grantedBy: model.granted_by?.toString(),
            grantedAt: model.granted_at?.toISOString() || model.createdAt?.toISOString(),
            status: model.status || 'active',
            createdAt: model.createdAt?.toISOString(),
            updatedAt: model.updatedAt?.toISOString()
        };
    };

    /**
     * 將 RoleToPermissionModel 陣列轉換為 RolePermissionResponseDto 陣列
     */
    static toRolePermissionResponseDtoArray = (models: RoleToPermissionModel[]): RolePermissionResponseDto[] => {
        return models.map(DtoMapper.toRolePermissionResponseDto);
    };

    /**
     * 將分頁查詢結果轉換為分頁 RolePermission DTO
     */
    static toPaginatedRolePermissionResponse = (
        result: PaginatedResult<RoleToPermissionModel>
    ): PaginatedListResponseDto<RolePermissionResponseDto> => {
        const dtoArray = DtoMapper.toRolePermissionResponseDtoArray(result.data);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };
        
        return { 
            data: dtoArray, 
            pagination,
            statistics: {
                totalCount: result.totalCount,
                activeCount: 0, // 將在需要時計算
                inactiveCount: 0 // 將在需要時計算
            }
        };
    };

    /**
     * 通用分頁轉換方法
     * 
     * @param result 分頁查詢結果
     * @param mapperFn 單個實體的轉換函數
     */
    static toPaginatedResponse = <TModel, TDto>(
        result: PaginatedResult<TModel>,
        mapperFn: (model: TModel) => TDto
    ): PaginatedListResponseDto<TDto> => {
        const dtoArray = result.data.map(mapperFn);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };
        
        return { data: dtoArray, pagination };
    };
}

/**
 * 導出便利函數
 */
export const toUserDto = DtoMapper.toUserResponseDto;
export const toUserDtoArray = DtoMapper.toUserResponseDtoArray;
export const toPaginatedUserResponse = DtoMapper.toPaginatedUserResponse;
export const toRoleDto = DtoMapper.toRoleResponseDto;
export const toRoleDtoArray = DtoMapper.toRoleResponseDtoArray;
export const toPaginatedRoleResponse = DtoMapper.toPaginatedRoleResponse;
export const toPermissionDto = DtoMapper.toPermissionResponseDto;
export const toPermissionDtoArray = DtoMapper.toPermissionResponseDtoArray;
export const toPaginatedPermissionResponse = DtoMapper.toPaginatedPermissionResponse;
export const toUserRoleDto = DtoMapper.toUserRoleResponseDto;
export const toUserRoleDtoArray = DtoMapper.toUserRoleResponseDtoArray;
export const toPaginatedUserRoleResponse = DtoMapper.toPaginatedUserRoleResponse;
export const toRolePermissionDto = DtoMapper.toRolePermissionResponseDto;
export const toRolePermissionDtoArray = DtoMapper.toRolePermissionResponseDtoArray;
export const toPaginatedRolePermissionResponse = DtoMapper.toPaginatedRolePermissionResponse;

// 通用分頁映射方法 - 適用於所有實體
export const createPaginatedResponse = <TModel>(
    result: PaginatedResult<TModel>,
    mapperFn: (model: TModel) => any
): PaginatedListResponseDto<any> => {
    const dtoArray = result.data.map(mapperFn);
    const pagination = {
        currentPage: result.currentPage,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / result.pageSize),
        hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
        hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
};
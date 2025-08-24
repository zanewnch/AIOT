/**
 * @fileoverview 角色請求 DTO
 * 
 * 定義所有與角色相關的請求資料結構
 * 基於 RBAC 系統的角色管理業務需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { 
    IsString, 
    IsOptional, 
    IsNotEmpty, 
    IsNumber, 
    IsBoolean,
    IsArray,
    IsIn,
    IsEnum,
    MinLength,
    MaxLength,
    ValidateNested,
    ArrayNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';

/**
 * 角色類型
 */
export enum RoleType {
    SYSTEM = 'system',
    CUSTOM = 'custom',
    TEMPORARY = 'temporary'
}

/**
 * 角色狀態類型
 */
export enum RoleStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DEPRECATED = 'deprecated'
}

/**
 * 創建角色請求 DTO
 */
export class CreateRoleRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: 'Role name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Role name cannot exceed 50 characters' })
    readonly name: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
    readonly displayName?: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
    readonly description?: string;
    
    @IsOptional()
    @IsEnum(RoleType, { message: 'Role type must be one of: system, custom, temporary' })
    readonly type?: RoleType = RoleType.CUSTOM;
    
    @IsOptional()
    @IsEnum(RoleStatus, { message: 'Status must be one of: active, inactive, deprecated' })
    readonly status?: RoleStatus = RoleStatus.ACTIVE;

    constructor(name: string, displayName?: string, description?: string, type?: RoleType, status?: RoleStatus) {
        super();
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.type = type || RoleType.CUSTOM;
        this.status = status || RoleStatus.ACTIVE;
    }
}

/**
 * 更新角色請求 DTO
 */
export class UpdateRoleRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
    readonly displayName?: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
    readonly description?: string;
    
    @IsOptional()
    @IsEnum(RoleType, { message: 'Role type must be one of: system, custom, temporary' })
    readonly type?: RoleType;
    
    @IsOptional()
    @IsEnum(RoleStatus, { message: 'Status must be one of: active, inactive, deprecated' })
    readonly status?: RoleStatus;
}

/**
 * 角色查詢請求 DTO
 */
export class RoleQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Role ID must be a number' })
    readonly roleId?: number;
    
    @IsOptional()
    @IsString()
    readonly name?: string;
    
    @IsOptional()
    @IsEnum(RoleType, { message: 'Role type must be one of: system, custom, temporary' })
    readonly type?: RoleType;
    
    @IsOptional()
    @IsEnum(RoleStatus, { message: 'Status must be one of: active, inactive, deprecated' })
    readonly status?: RoleStatus;
}

/**
 * 角色搜尋請求 DTO
 */
export class RoleSearchRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: 'Search keyword must be at least 2 characters long' })
    @MaxLength(100, { message: 'Search keyword cannot exceed 100 characters' })
    readonly keyword: string;
    
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsIn(['name', 'displayName', 'description'], { each: true, message: 'Search fields must be one of: name, displayName, description' })
    readonly fields?: string[] = ['name', 'displayName', 'description'];
    
    @IsOptional()
    @IsBoolean()
    readonly fuzzy?: boolean = true;

    constructor(keyword: string, fields?: string[], fuzzy?: boolean) {
        super();
        this.keyword = keyword;
        this.fields = fields || ['name', 'displayName', 'description'];
        this.fuzzy = fuzzy ?? true;
    }
}

/**
 * 批量操作類型
 */
export enum BatchRoleOperation {
    ACTIVATE = 'activate',
    DEACTIVATE = 'deactivate',
    DELETE = 'delete',
    UPDATE = 'update'
}

/**
 * 批量角色操作請求 DTO
 */
export class BatchRoleRequestDto extends BaseRequestDto {
    @IsArray()
    @ArrayNotEmpty({ message: 'Role IDs array cannot be empty' })
    @Type(() => Number)
    @IsNumber({}, { each: true, message: 'Each role ID must be a number' })
    readonly roleIds: number[];
    
    @IsEnum(BatchRoleOperation, { message: 'Operation must be one of: activate, deactivate, delete, update' })
    readonly operation: BatchRoleOperation;
    
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateRoleRequestDto)
    readonly updateData?: UpdateRoleRequestDto;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    readonly reason?: string;

    constructor(roleIds: number[], operation: BatchRoleOperation, updateData?: UpdateRoleRequestDto, reason?: string) {
        super();
        this.roleIds = roleIds;
        this.operation = operation;
        this.updateData = updateData;
        this.reason = reason;
    }
}
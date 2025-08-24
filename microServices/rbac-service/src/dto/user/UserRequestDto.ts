/**
 * @fileoverview 用戶請求 DTO
 * 
 * 定義所有與用戶相關的請求資料結構
 * 基於 RBAC 系統的用戶管理業務需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { 
    IsString, 
    IsOptional, 
    IsNotEmpty, 
    IsEmail, 
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
 * 用戶狀態類型
 */
export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    DELETED = 'deleted'
}

/**
 * 創建用戶請求 DTO
 */
export class CreateUserRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
    readonly username: string;
    
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty()
    readonly email: string;
    
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    readonly password: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
    readonly displayName?: string;
    
    @IsOptional()
    @IsEnum(UserStatus, { message: 'Status must be one of: active, inactive, suspended, deleted' })
    readonly status?: UserStatus = UserStatus.ACTIVE;

    constructor(username: string, email: string, password: string, displayName?: string, status?: UserStatus) {
        super();
        this.username = username;
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.status = status || UserStatus.ACTIVE;
    }
}

/**
 * 更新用戶請求 DTO
 */
export class UpdateUserRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsEmail({}, { message: 'Email must be a valid email address' })
    readonly email?: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
    readonly displayName?: string;
    
    @IsOptional()
    @IsEnum(UserStatus, { message: 'Status must be one of: active, inactive, suspended, deleted' })
    readonly status?: UserStatus;

    @IsOptional()
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    readonly password?: string;
}

/**
 * 用戶查詢請求 DTO
 */
export class UserQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'User ID must be a number' })
    readonly userId?: number;
    
    @IsOptional()
    @IsString()
    readonly username?: string;
    
    @IsOptional()
    @IsEmail({}, { message: 'Email must be a valid email address' })
    readonly email?: string;
    
    @IsOptional()
    @IsEnum(UserStatus, { message: 'Status must be one of: active, inactive, suspended, deleted' })
    readonly status?: UserStatus;
}

/**
 * 用戶搜尋請求 DTO
 */
export class UserSearchRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: 'Search keyword must be at least 2 characters long' })
    @MaxLength(100, { message: 'Search keyword cannot exceed 100 characters' })
    readonly keyword: string;
    
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsIn(['username', 'email', 'displayName'], { each: true, message: 'Search fields must be one of: username, email, displayName' })
    readonly fields?: string[] = ['username', 'email', 'displayName'];
    
    @IsOptional()
    @IsBoolean()
    readonly fuzzy?: boolean = true;

    constructor(keyword: string, fields?: string[], fuzzy?: boolean) {
        super();
        this.keyword = keyword;
        this.fields = fields || ['username', 'email', 'displayName'];
        this.fuzzy = fuzzy ?? true;
    }
}

/**
 * 批量操作類型
 */
export enum BatchUserOperation {
    ACTIVATE = 'activate',
    DEACTIVATE = 'deactivate',
    DELETE = 'delete',
    UPDATE = 'update'
}

/**
 * 批量用戶操作請求 DTO
 */
export class BatchUserRequestDto extends BaseRequestDto {
    @IsArray()
    @ArrayNotEmpty({ message: 'User IDs array cannot be empty' })
    @Type(() => Number)
    @IsNumber({}, { each: true, message: 'Each user ID must be a number' })
    readonly userIds: number[];
    
    @IsEnum(BatchUserOperation, { message: 'Operation must be one of: activate, deactivate, delete, update' })
    readonly operation: BatchUserOperation;
    
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateUserRequestDto)
    readonly updateData?: UpdateUserRequestDto;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    readonly reason?: string;

    constructor(userIds: number[], operation: BatchUserOperation, updateData?: UpdateUserRequestDto, reason?: string) {
        super();
        this.userIds = userIds;
        this.operation = operation;
        this.updateData = updateData;
        this.reason = reason;
    }
}
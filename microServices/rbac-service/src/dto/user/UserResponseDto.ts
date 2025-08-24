/**
 * @fileoverview 用戶回應 DTO
 * 
 * 定義所有與用戶相關的回應資料結構
 * 基於 RBAC 系統的用戶管理業務需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose, Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsOptional, IsArray, IsObject, IsDateString, IsEnum } from 'class-validator';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';
import { UserStatus } from './UserRequestDto';

/**
 * 用戶回應 DTO
 */
export class UserResponseDto extends BaseResponseDto {
    @Expose()
    @IsString()
    readonly username: string;
    
    @Expose()
    @IsString()
    readonly email: string;
    
    @Expose()
    @IsOptional()
    @IsString()
    readonly displayName?: string;
    
    @Expose()
    @IsEnum(UserStatus)
    readonly status: UserStatus;
    
    @Expose()
    @IsOptional()
    @IsDateString()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly lastLoginAt?: string;
    
    @Expose()
    @IsBoolean()
    readonly isVerified: boolean = false;
    
    @Expose()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly roles?: string[];

    constructor(user: any) {
        super(user.id?.toString(), user.createdAt, user.updatedAt);
        this.username = user.username;
        this.email = user.email;
        this.displayName = user.displayName;
        this.status = user.status;
        this.lastLoginAt = user.lastLoginAt?.toISOString();
        this.isVerified = user.isVerified || false;
        this.roles = user.roles || [];
    }

    static fromModel(user: any): UserResponseDto {
        return new UserResponseDto(user);
    }

    static fromModels(users: any[]): UserResponseDto[] {
        return users.map(user => new UserResponseDto(user));
    }
}

/**
 * 用戶統計資訊類別
 */
export class UserStatisticsDto {
    @Expose()
    @IsNumber()
    readonly loginCount: number = 0;
    
    @Expose()
    @IsOptional()
    @IsDateString()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly lastActivityAt?: string;
    
    @Expose()
    @IsNumber()
    readonly createdResourcesCount: number = 0;

    constructor(stats: any) {
        this.loginCount = stats.loginCount || 0;
        this.lastActivityAt = stats.lastActivityAt?.toISOString();
        this.createdResourcesCount = stats.createdResourcesCount || 0;
    }
}

/**
 * 用戶詳細資訊回應 DTO
 */
export class UserDetailResponseDto extends UserResponseDto {
    @Expose()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    readonly permissions?: string[];
    
    @Expose()
    @IsOptional()
    @IsObject()
    readonly settings?: Record<string, any>;
    
    @Expose()
    @IsOptional()
    @Type(() => UserStatisticsDto)
    readonly statistics?: UserStatisticsDto;

    constructor(user: any) {
        super(user);
        this.permissions = user.permissions || [];
        this.settings = user.settings || {};
        this.statistics = user.statistics ? new UserStatisticsDto(user.statistics) : undefined;
    }

    static fromModel(user: any): UserDetailResponseDto {
        return new UserDetailResponseDto(user);
    }
}

/**
 * 成長趨勢資料類別
 */
export class GrowthTrendDto {
    @Expose()
    @IsString()
    readonly period: string;
    
    @Expose()
    @IsNumber()
    readonly count: number;

    constructor(period: string, count: number) {
        this.period = period;
        this.count = count;
    }
}

/**
 * 用戶統計回應 DTO
 */
export class UserStatisticsResponseDto {
    @Expose()
    @IsNumber()
    readonly totalUsers: number;
    
    @Expose()
    @IsNumber()
    readonly activeUsers: number;
    
    @Expose()
    @IsNumber()
    readonly inactiveUsers: number;
    
    @Expose()
    @IsNumber()
    readonly verifiedUsers: number;
    
    @Expose()
    @IsNumber()
    readonly newUsersThisMonth: number;
    
    @Expose()
    @IsOptional()
    @IsArray()
    @Type(() => GrowthTrendDto)
    readonly growthTrend?: GrowthTrendDto[];

    constructor(stats: any) {
        this.totalUsers = stats.totalUsers || 0;
        this.activeUsers = stats.activeUsers || 0;
        this.inactiveUsers = stats.inactiveUsers || 0;
        this.verifiedUsers = stats.verifiedUsers || 0;
        this.newUsersThisMonth = stats.newUsersThisMonth || 0;
        this.growthTrend = stats.growthTrend?.map((trend: any) => new GrowthTrendDto(trend.period, trend.count));
    }
}

/**
 * 用戶列表統計資訊類別
 */
export class UserListStatisticsDto {
    @Expose()
    @IsNumber()
    readonly totalCount: number;
    
    @Expose()
    @IsNumber()
    readonly activeCount: number;
    
    @Expose()
    @IsNumber()
    readonly inactiveCount: number;

    constructor(totalCount: number, activeCount: number, inactiveCount: number) {
        this.totalCount = totalCount;
        this.activeCount = activeCount;
        this.inactiveCount = inactiveCount;
    }
}

/**
 * 用戶列表回應 DTO
 */
export class UserListResponseDto extends PaginatedListResponseDto<UserResponseDto> {
    @Expose()
    @IsOptional()
    @Type(() => UserListStatisticsDto)
    readonly statistics?: UserListStatisticsDto;

    constructor(
        users: UserResponseDto[], 
        pagination: any, 
        statistics?: UserListStatisticsDto
    ) {
        super(users, pagination);
        this.statistics = statistics;
    }

    static fromPaginatedData(
        users: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number,
        statistics?: { activeCount: number; inactiveCount: number }
    ): UserListResponseDto {
        const userDtos = UserResponseDto.fromModels(users);
        const paginatedList = PaginatedListResponseDto.create(userDtos, currentPage, pageSize, totalCount);
        const listStats = statistics ? new UserListStatisticsDto(totalCount, statistics.activeCount, statistics.inactiveCount) : undefined;
        
        return new UserListResponseDto(userDtos, paginatedList.pagination, listStats);
    }
}

/**
 * 批量操作錯誤類別
 */
export class BatchOperationErrorDto {
    @Expose()
    @IsString()
    readonly userId: string;
    
    @Expose()
    @IsString()
    readonly reason: string;

    constructor(userId: string, reason: string) {
        this.userId = userId;
        this.reason = reason;
    }
}

/**
 * 批量操作摘要類別
 */
export class BatchOperationSummaryDto {
    @Expose()
    @IsNumber()
    readonly total: number;
    
    @Expose()
    @IsNumber()
    readonly success: number;
    
    @Expose()
    @IsNumber()
    readonly failed: number;

    constructor(total: number, success: number, failed: number) {
        this.total = total;
        this.success = success;
        this.failed = failed;
    }
}

/**
 * 批量操作回應 DTO
 */
export class BatchUserResponseDto {
    @Expose()
    @IsArray()
    @IsString({ each: true })
    readonly successIds: string[];
    
    @Expose()
    @IsArray()
    @IsString({ each: true })
    readonly failedIds: string[];
    
    @Expose()
    @IsOptional()
    @IsArray()
    @Type(() => BatchOperationErrorDto)
    readonly errors?: BatchOperationErrorDto[];
    
    @Expose()
    @Type(() => BatchOperationSummaryDto)
    readonly summary: BatchOperationSummaryDto;

    constructor(
        successIds: string[],
        failedIds: string[],
        errors?: BatchOperationErrorDto[]
    ) {
        this.successIds = successIds;
        this.failedIds = failedIds;
        this.errors = errors;
        this.summary = new BatchOperationSummaryDto(
            successIds.length + failedIds.length,
            successIds.length,
            failedIds.length
        );
    }

    static fromResult(result: any): BatchUserResponseDto {
        const errors = result.errors?.map((error: any) => new BatchOperationErrorDto(error.userId, error.reason));
        return new BatchUserResponseDto(result.successIds, result.failedIds, errors);
    }
}
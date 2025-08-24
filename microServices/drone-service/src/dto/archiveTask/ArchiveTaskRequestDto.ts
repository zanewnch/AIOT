/**
 * @fileoverview 歸檔任務請求 DTO
 * 
 * 定義所有與歸檔任務相關的請求資料結構
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { 
    IsString, 
    IsOptional, 
    IsNotEmpty, 
    IsEnum, 
    IsObject, 
    IsDateString, 
    IsArray,
    ValidateNested,
    IsNumber,
    Min
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';
import { ArchiveJobType, ArchiveTaskStatus } from '../../models/ArchiveTaskModel';

/**
 * 創建歸檔任務請求 DTO
 */
export class CreateArchiveTaskRequestDto extends BaseRequestDto {
    @IsEnum(ArchiveJobType, { message: 'Invalid job type' })
    @IsNotEmpty()
    readonly jobType: ArchiveJobType = ArchiveJobType.POSITIONS;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsOptional()
    @IsString()
    readonly batchId?: string;

    @IsOptional()
    @IsObject()
    readonly parameters?: Record<string, any>;

    @IsOptional()
    @IsDateString()
    readonly scheduledAt?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly priority?: number;
}

/**
 * 更新歸檔任務請求 DTO
 */
export class UpdateArchiveTaskRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsEnum(ArchiveTaskStatus, { message: 'Invalid task status' })
    readonly status?: ArchiveTaskStatus;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsOptional()
    @IsObject()
    readonly parameters?: Record<string, any>;

    @IsOptional()
    @IsDateString()
    readonly scheduledAt?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly priority?: number;
}

/**
 * 歸檔任務狀態更新請求 DTO
 */
export class UpdateArchiveTaskStatusRequestDto extends BaseRequestDto {
    @IsEnum(ArchiveTaskStatus, { message: 'Invalid task status' })
    @IsNotEmpty()
    readonly status: ArchiveTaskStatus = ArchiveTaskStatus.PENDING;

    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsObject()
    readonly metadata?: Record<string, any>;
}

/**
 * 執行歸檔任務請求 DTO
 */
export class ExecuteArchiveTaskRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsObject()
    readonly executionParameters?: Record<string, any>;

    @IsOptional()
    @IsString()
    readonly executorId?: string;
}

/**
 * 歸檔任務查詢請求 DTO
 */
export class ArchiveTaskQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @IsEnum(ArchiveTaskStatus)
    readonly status?: ArchiveTaskStatus;

    @IsOptional()
    @IsEnum(ArchiveJobType)
    readonly jobType?: ArchiveJobType;

    @IsOptional()
    @IsString()
    readonly batchId?: string;

    @IsOptional()
    @IsDateString()
    readonly dateRangeStart?: string;

    @IsOptional()
    @IsDateString()
    readonly dateRangeEnd?: string;

    @IsOptional()
    @IsString()
    readonly executorId?: string;
}

/**
 * 批次操作請求 DTO
 */
export class BatchArchiveTaskRequestDto extends BaseRequestDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    readonly taskIds: string[] = [];

    @IsEnum(ArchiveTaskStatus, { message: 'Invalid target status' })
    @IsNotEmpty()
    readonly targetStatus: ArchiveTaskStatus = ArchiveTaskStatus.PENDING;

    @IsOptional()
    @IsString()
    readonly reason?: string;
}
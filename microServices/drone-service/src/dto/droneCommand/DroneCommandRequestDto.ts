/**
 * @fileoverview 無人機指令請求 DTO
 * 
 * 定義所有與無人機指令相關的請求資料結構
 * 基於 DroneCommandCommandsSvc 和 DroneCommandQueriesSvc 的業務需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { 
    IsString, 
    IsOptional, 
    IsNotEmpty, 
    IsObject, 
    IsDateString, 
    IsArray,
    IsEnum,
    IsNumber,
    Min,
    Max,
    ValidateNested
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';

/**
 * 創建無人機指令請求 DTO
 */
export class CreateDroneCommandRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    readonly droneId: string = '';

    @IsString()
    @IsNotEmpty()
    readonly commandType: string = '';

    @IsOptional()
    @IsObject()
    readonly parameters?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    readonly priority?: number = 5;

    @IsOptional()
    @IsDateString()
    readonly scheduledAt?: string;

    @IsOptional()
    @IsString()
    readonly userId?: string;

    @IsOptional()
    @IsString()
    readonly description?: string;
}

/**
 * 更新無人機指令請求 DTO
 */
export class UpdateDroneCommandRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    readonly commandType?: string;

    @IsOptional()
    @IsObject()
    readonly parameters?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    readonly priority?: number;

    @IsOptional()
    @IsDateString()
    readonly scheduledAt?: string;

    @IsOptional()
    @IsString()
    readonly description?: string;
}

/**
 * 執行無人機指令請求 DTO
 */
export class ExecuteDroneCommandRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsObject()
    readonly executionContext?: Record<string, any>;

    @IsOptional()
    @IsString()
    readonly executorId?: string;

    @IsOptional()
    @IsNumber()
    readonly timeoutSeconds?: number;
}

/**
 * 取消無人機指令請求 DTO
 */
export class CancelDroneCommandRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsString()
    readonly cancelledBy?: string;
}

/**
 * 無人機指令查詢請求 DTO
 */
export class DroneCommandQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @IsString()
    readonly droneId?: string;

    @IsOptional()
    @IsString()
    readonly commandType?: string;

    @IsOptional()
    @IsString()
    readonly status?: string;

    @IsOptional()
    @IsString()
    readonly userId?: string;

    @IsOptional()
    @IsDateString()
    readonly dateRangeStart?: string;

    @IsOptional()
    @IsDateString()
    readonly dateRangeEnd?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    readonly priorityMin?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    readonly priorityMax?: number;
}

/**
 * 批次無人機指令操作請求 DTO
 */
export class BatchDroneCommandRequestDto extends BaseRequestDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    readonly commandIds: string[] = [];

    @IsString()
    @IsNotEmpty()
    readonly action: 'execute' | 'cancel' | 'delete' | 'retry' = 'execute';

    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsObject()
    readonly parameters?: Record<string, any>;
}
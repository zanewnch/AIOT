/**
 * @fileoverview 無人機指令佇列請求 DTO
 * 
 * 定義所有與無人機指令佇列相關的請求資料結構
 * 基於 DroneCommandQueueCommandsService 和 DroneCommandQueueQueriesService 的業務需求設計
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
    IsEnum,
    IsObject,
    IsArray,
    Min,
    Max
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';
import { DroneCommandQueueStatus } from '../../models/DroneCommandQueueModel';

/**
 * 創建無人機指令佇列請求 DTO
 */
export class CreateDroneCommandQueueRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    readonly name!: string;

    @IsNumber()
    @Min(1)
    readonly droneId!: number;

    @IsString()
    @IsNotEmpty()
    readonly commandType!: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    readonly priority?: number = 5;

    @IsOptional()
    @IsBoolean()
    readonly autoExecute?: boolean = true;

    @IsOptional()
    @IsObject()
    readonly executionConditions?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly maxLoops?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly createdBy?: number;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsOptional()
    @IsArray()
    readonly commandSequence?: any[];
}

/**
 * 更新無人機指令佇列請求 DTO
 */
export class UpdateDroneCommandQueueRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    readonly name?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    readonly priority?: number;

    @IsOptional()
    @IsEnum(DroneCommandQueueStatus)
    readonly status?: DroneCommandQueueStatus;

    @IsOptional()
    @IsBoolean()
    readonly autoExecute?: boolean;

    @IsOptional()
    @IsObject()
    readonly executionConditions?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly maxLoops?: number;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsOptional()
    @IsArray()
    readonly commandSequence?: any[];
}

/**
 * 執行無人機指令佇列請求 DTO
 */
export class ExecuteDroneCommandQueueRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsObject()
    readonly executionContext?: Record<string, any>;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly executorId?: number;

    @IsOptional()
    @IsNumber()
    readonly timeoutSeconds?: number;

    @IsOptional()
    @IsBoolean()
    readonly forceExecute?: boolean = false;
}

/**
 * 暫停無人機指令佇列請求 DTO
 */
export class PauseDroneCommandQueueRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly pausedBy?: number;

    @IsOptional()
    @IsBoolean()
    readonly allowResume?: boolean = true;
}

/**
 * 取消無人機指令佇列請求 DTO
 */
export class CancelDroneCommandQueueRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly cancelledBy?: number;

    @IsOptional()
    @IsBoolean()
    readonly forceCancel?: boolean = false;
}

/**
 * 無人機指令佇列查詢請求 DTO
 */
export class DroneCommandQueueQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    readonly droneId?: number;

    @IsOptional()
    @IsString()
    readonly commandType?: string;

    @IsOptional()
    @IsEnum(DroneCommandQueueStatus)
    readonly status?: DroneCommandQueueStatus;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    @Transform(({ value }) => parseInt(value))
    readonly priority?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    readonly createdBy?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    readonly autoExecute?: boolean;

    @IsOptional()
    @IsString()
    readonly searchTerm?: string;
}

/**
 * 批次無人機指令佇列操作請求 DTO
 */
export class BatchDroneCommandQueueRequestDto extends BaseRequestDto {
    @IsArray()
    @IsNumber({}, { each: true })
    @Min(1, { each: true })
    readonly queueIds!: number[];

    @IsString()
    @IsNotEmpty()
    readonly action!: 'execute' | 'pause' | 'cancel' | 'delete' | 'reset';

    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly operatorId?: number;

    @IsOptional()
    @IsObject()
    readonly parameters?: Record<string, any>;
}
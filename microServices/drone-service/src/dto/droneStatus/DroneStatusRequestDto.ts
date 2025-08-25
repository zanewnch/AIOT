/**
 * @fileoverview 無人機狀態請求 DTO
 * 
 * 定義所有與無人機狀態相關的請求資料結構
 * 基於 DroneStatusCommandsService 和 DroneStatusQueriesService 的業務需求設計
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
    IsNumber,
    IsBoolean,
    Min
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';
import { DroneStatus } from '../../models/DroneStatusModel';

/**
 * 創建無人機狀態請求 DTO
 */
export class CreateDroneStatusRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    readonly droneSerial!: string;

    @IsString()
    @IsNotEmpty()
    readonly droneName!: string;

    @IsEnum(DroneStatus)
    readonly status!: DroneStatus;

    @IsOptional()
    @IsString()
    readonly model?: string;

    @IsOptional()
    @IsString()
    readonly manufacturer?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly ownerUserId?: number;

    @IsOptional()
    @IsString()
    readonly firmwareVersion?: string;

    @IsOptional()
    @IsNumber()
    readonly batteryLevel?: number;

    @IsOptional()
    @IsString()
    readonly notes?: string;

    @IsOptional()
    @IsBoolean()
    readonly isActive?: boolean = true;
}

/**
 * 更新無人機狀態請求 DTO
 */
export class UpdateDroneStatusRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsString()
    readonly droneName?: string;

    @IsOptional()
    @IsEnum(DroneStatus)
    readonly status?: DroneStatus;

    @IsOptional()
    @IsString()
    readonly model?: string;

    @IsOptional()
    @IsString()
    readonly manufacturer?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly ownerUserId?: number;

    @IsOptional()
    @IsString()
    readonly firmwareVersion?: string;

    @IsOptional()
    @IsNumber()
    readonly batteryLevel?: number;

    @IsOptional()
    @IsString()
    readonly notes?: string;

    @IsOptional()
    @IsBoolean()
    readonly isActive?: boolean;
}

/**
 * 無人機狀態查詢請求 DTO
 */
export class DroneStatusQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @IsString()
    readonly droneSerial?: string;

    @IsOptional()
    @IsEnum(DroneStatus)
    readonly status?: DroneStatus;

    @IsOptional()
    @IsString()
    readonly manufacturer?: string;

    @IsOptional()
    @IsString()
    readonly model?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly ownerUserId?: number;

    @IsOptional()
    @IsString()
    readonly searchTerm?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    readonly isActive?: boolean;
}

/**
 * 無人機狀態搜尋請求 DTO
 */
export class DroneStatusSearchRequestDto extends BaseRequestDto {
    @IsString()
    @IsNotEmpty()
    readonly searchTerm!: string;

    @IsOptional()
    @IsEnum(DroneStatus)
    readonly status?: DroneStatus;

    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly limit?: number = 10;
}

/**
 * 批次無人機狀態操作請求 DTO
 */
export class BatchDroneStatusRequestDto extends BaseRequestDto {
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    readonly droneSerials!: string[];

    @IsString()
    @IsNotEmpty()
    readonly action!: 'activate' | 'deactivate' | 'maintenance' | 'delete';

    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsEnum(DroneStatus)
    readonly newStatus?: DroneStatus;
}
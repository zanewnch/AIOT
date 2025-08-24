/**
 * @fileoverview 無人機即時狀態請求 DTO
 * 
 * 定義所有與無人機即時狀態相關的請求資料結構
 * 基於 DroneRealTimeStatusCommandsSvc 和 DroneRealTimeStatusQueriesSvc 的業務需求設計
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
    IsDateString,
    IsObject,
    IsArray,
    Min,
    Max
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';
import { DroneRealTimeStatus } from '../../models/DroneRealTimeStatusModel';

/**
 * 創建無人機即時狀態請求 DTO
 */
export class CreateDroneRealTimeStatusRequestDto extends BaseRequestDto {
    @IsNumber()
    @Min(1)
    readonly droneId!: number;

    @IsEnum(DroneRealTimeStatus)
    readonly status!: DroneRealTimeStatus;

    @IsNumber()
    @Min(0)
    @Max(100)
    readonly batteryLevel!: number;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    readonly latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    readonly longitude?: number;

    @IsOptional()
    @IsNumber()
    readonly altitude?: number;

    @IsOptional()
    @IsNumber()
    readonly speed?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(360)
    readonly heading?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    readonly signalStrength?: number;

    @IsOptional()
    @IsNumber()
    readonly temperature?: number;

    @IsOptional()
    @IsNumber()
    readonly humidity?: number;

    @IsOptional()
    @IsNumber()
    readonly windSpeed?: number;

    @IsOptional()
    @IsBoolean()
    readonly isConnected?: boolean = true;

    @IsOptional()
    @IsDateString()
    readonly lastSeen?: string;

    @IsOptional()
    @IsString()
    readonly errorMessage?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    readonly flightTimeToday?: number;
}

/**
 * 更新無人機即時狀態請求 DTO
 */
export class UpdateDroneRealTimeStatusRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsEnum(DroneRealTimeStatus)
    readonly status?: DroneRealTimeStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    readonly batteryLevel?: number;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    readonly latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    readonly longitude?: number;

    @IsOptional()
    @IsNumber()
    readonly altitude?: number;

    @IsOptional()
    @IsNumber()
    readonly speed?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(360)
    readonly heading?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    readonly signalStrength?: number;

    @IsOptional()
    @IsNumber()
    readonly temperature?: number;

    @IsOptional()
    @IsNumber()
    readonly humidity?: number;

    @IsOptional()
    @IsNumber()
    readonly windSpeed?: number;

    @IsOptional()
    @IsBoolean()
    readonly isConnected?: boolean;

    @IsOptional()
    @IsDateString()
    readonly lastSeen?: string;

    @IsOptional()
    @IsString()
    readonly errorMessage?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    readonly flightTimeToday?: number;
}

/**
 * 無人機即時狀態查詢請求 DTO
 */
export class DroneRealTimeStatusQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    readonly droneId?: number;

    @IsOptional()
    @IsEnum(DroneRealTimeStatus)
    readonly status?: DroneRealTimeStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Transform(({ value }) => parseInt(value))
    readonly minBatteryLevel?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Transform(({ value }) => parseInt(value))
    readonly maxBatteryLevel?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    readonly isConnected?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    readonly offlineThresholdMinutes?: number = 5;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    readonly onlineOnly?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    readonly lowBatteryOnly?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Transform(({ value }) => parseInt(value))
    readonly lowBatteryThreshold?: number = 20;
}

/**
 * 儀表板摘要查詢請求 DTO
 */
export class DashboardSummaryRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    readonly offlineThresholdMinutes?: number = 5;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    readonly lowBatteryThreshold?: number = 20;

    @IsOptional()
    @IsBoolean()
    readonly includeHistory?: boolean = false;
}

/**
 * 電池統計查詢請求 DTO
 */
export class BatteryStatisticsRequestDto extends BaseRequestDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    readonly lowBatteryThreshold?: number = 20;

    @IsOptional()
    @IsBoolean()
    readonly groupByDrone?: boolean = false;

    @IsOptional()
    @IsDateString()
    readonly dateRangeStart?: string;

    @IsOptional()
    @IsDateString()
    readonly dateRangeEnd?: string;
}

/**
 * 批次即時狀態操作請求 DTO
 */
export class BatchDroneRealTimeStatusRequestDto extends BaseRequestDto {
    @IsNumber({}, { each: true })
    @Min(1, { each: true })
    readonly droneIds!: number[];

    @IsString()
    @IsNotEmpty()
    readonly action!: 'reconnect' | 'disconnect' | 'reset' | 'update' | 'refresh';

    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsObject()
    readonly updateData?: Record<string, any>;

    @IsOptional()
    @IsBoolean()
    readonly forceAction?: boolean = false;
}
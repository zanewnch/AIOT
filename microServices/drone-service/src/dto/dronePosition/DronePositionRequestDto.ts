/**
 * @fileoverview 無人機位置請求 DTO
 * 
 * 定義所有與無人機位置相關的請求資料結構
 * 基於 DronePositionCommandsService 和 DronePositionQueriesService 的業務需求設計
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
    IsDateString,
    Min,
    Max,
    IsBoolean
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseRequestDto, PaginationRequestDto } from '../common';

/**
 * 創建無人機位置請求 DTO
 */
export class CreateDronePositionRequestDto extends BaseRequestDto {
    @IsNumber()
    @Min(1)
    readonly droneId!: number;

    @IsNumber()
    @Min(-90)
    @Max(90)
    readonly latitude!: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    readonly longitude!: number;

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
    readonly accuracy?: number;

    @IsOptional()
    @IsDateString()
    readonly timestamp?: string;

    @IsOptional()
    @IsString()
    readonly source?: string = 'GPS';

    @IsOptional()
    @IsNumber()
    readonly batteryLevel?: number;

    @IsOptional()
    @IsString()
    readonly flightMode?: string;
}

/**
 * 更新無人機位置請求 DTO
 */
export class UpdateDronePositionRequestDto extends BaseRequestDto {
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
    readonly accuracy?: number;

    @IsOptional()
    @IsDateString()
    readonly timestamp?: string;

    @IsOptional()
    @IsString()
    readonly source?: string;

    @IsOptional()
    @IsNumber()
    readonly batteryLevel?: number;

    @IsOptional()
    @IsString()
    readonly flightMode?: string;
}

/**
 * 無人機位置查詢請求 DTO
 */
export class DronePositionQueryRequestDto extends PaginationRequestDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    readonly droneId?: number;

    @IsOptional()
    @IsDateString()
    readonly dateRangeStart?: string;

    @IsOptional()
    @IsDateString()
    readonly dateRangeEnd?: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Transform(({ value }) => parseFloat(value))
    readonly minLatitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    @Transform(({ value }) => parseFloat(value))
    readonly maxLatitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Transform(({ value }) => parseFloat(value))
    readonly minLongitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    @Transform(({ value }) => parseFloat(value))
    readonly maxLongitude?: number;

    @IsOptional()
    @IsString()
    readonly source?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000)
    @Transform(({ value }) => parseInt(value))
    readonly limit?: number = 50;
}

/**
 * 無人機軌跡查詢請求 DTO
 */
export class DroneTrackQueryRequestDto extends BaseRequestDto {
    @IsNumber()
    @Min(1)
    readonly droneId!: number;

    @IsDateString()
    readonly startTime!: string;

    @IsDateString()
    readonly endTime!: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000)
    readonly maxPoints?: number = 100;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    readonly includeStationary?: boolean = false;
}

/**
 * 批次無人機位置操作請求 DTO
 */
export class BatchDronePositionRequestDto extends BaseRequestDto {
    @IsNumber({}, { each: true })
    @Min(1, { each: true })
    readonly positionIds!: number[];

    @IsString()
    @IsNotEmpty()
    readonly action!: 'delete' | 'export' | 'archive';

    @IsOptional()
    @IsString()
    readonly reason?: string;

    @IsOptional()
    @IsString()
    readonly exportFormat?: 'json' | 'csv' | 'kml';
}
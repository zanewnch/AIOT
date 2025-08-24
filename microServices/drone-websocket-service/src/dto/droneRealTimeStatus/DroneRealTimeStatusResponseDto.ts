/**
 * @fileoverview 無人機即時狀態回應 DTO
 * 
 * 定義所有與無人機即時狀態相關的回應資料結構
 * 基於 WebSocket 即時通訊的業務需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose, Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsOptional, IsObject, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { PaginatedListResponseDto, PaginationResponseDto } from '../common';

/**
 * 無人機健康狀態類型
 */
export enum DroneHealthStatus {
    HEALTHY = 'healthy',
    WARNING = 'warning',
    CRITICAL = 'critical',
    OFFLINE = 'offline'
}

/**
 * 連線品質類型
 */
export enum ConnectionQuality {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor',
    DISCONNECTED = 'disconnected'
}

/**
 * 無人機即時狀態回應 DTO
 */
export class DroneRealTimeStatusResponseDto {
    @Expose()
    @IsString()
    readonly id: string;
    
    @Expose()
    @IsString()
    readonly droneId: string;
    
    @Expose()
    @IsString()
    readonly currentStatus: string;
    
    @Expose()
    @IsNumber()
    @Min(0, { message: 'Battery level cannot be negative' })
    @Max(100, { message: 'Battery level cannot exceed 100' })
    readonly batteryLevel: number;
    
    @Expose()
    @IsNumber()
    @Min(0, { message: 'Signal strength cannot be negative' })
    @Max(100, { message: 'Signal strength cannot exceed 100' })
    readonly signalStrength: number;
    
    @Expose()
    @IsBoolean()
    readonly isConnected: boolean;
    
    @Expose()
    @IsDateString()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    readonly lastSeen: string;
    
    @Expose()
    @IsDateString()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    readonly createdAt: string;
    
    @Expose()
    @IsDateString()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    readonly updatedAt: string;

    constructor(status: any) {
        this.id = status.id?.toString();
        this.droneId = status.droneId?.toString();
        this.currentStatus = status.currentStatus;
        this.batteryLevel = status.batteryLevel;
        this.signalStrength = status.signalStrength;
        this.isConnected = status.isConnected;
        this.lastSeen = status.lastSeen instanceof Date ? status.lastSeen.toISOString() : status.lastSeen;
        this.createdAt = status.createdAt instanceof Date ? status.createdAt.toISOString() : status.createdAt;
        this.updatedAt = status.updatedAt instanceof Date ? status.updatedAt.toISOString() : status.updatedAt;
    }

    static fromModel(status: any): DroneRealTimeStatusResponseDto {
        return new DroneRealTimeStatusResponseDto(status);
    }

    static fromModels(statuses: any[]): DroneRealTimeStatusResponseDto[] {
        return statuses.map(status => new DroneRealTimeStatusResponseDto(status));
    }
}

/**
 * 無人機即時狀態詳細回應 DTO
 */
export class DroneRealTimeStatusDetailResponseDto extends DroneRealTimeStatusResponseDto {
    @Expose()
    @IsEnum(ConnectionQuality, { message: 'Connection quality must be one of: excellent, good, fair, poor, disconnected' })
    readonly connectionQuality: ConnectionQuality;
    
    @Expose()
    @IsOptional()
    @IsString()
    readonly errorMessage?: string;
    
    @Expose()
    @IsOptional()
    @IsObject()
    readonly metadata?: Record<string, any>;

    constructor(status: any) {
        super(status);
        this.connectionQuality = status.connectionQuality;
        this.errorMessage = status.errorMessage;
        this.metadata = status.metadata || {};
    }

    static fromModel(status: any): DroneRealTimeStatusDetailResponseDto {
        return new DroneRealTimeStatusDetailResponseDto(status);
    }
}

/**
 * 無人機健康狀態回應 DTO
 */
export class DroneHealthSummaryResponseDto {
    @Expose()
    @IsNumber()
    readonly droneId: number;
    
    @Expose()
    @IsBoolean()
    readonly isOnline: boolean;
    
    @Expose()
    @IsNumber()
    @Min(0, { message: 'Battery level cannot be negative' })
    @Max(100, { message: 'Battery level cannot exceed 100' })
    readonly batteryLevel: number;
    
    @Expose()
    @IsNumber()
    @Min(0, { message: 'Signal strength cannot be negative' })
    @Max(100, { message: 'Signal strength cannot exceed 100' })
    readonly signalStrength: number;
    
    @Expose()
    @IsDateString()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    readonly lastUpdate: string;
    
    @Expose()
    @IsEnum(DroneHealthStatus, { message: 'Health status must be one of: healthy, warning, critical, offline' })
    readonly healthStatus: DroneHealthStatus;

    constructor(summary: any) {
        this.droneId = summary.droneId;
        this.isOnline = summary.isOnline;
        this.batteryLevel = summary.batteryLevel;
        this.signalStrength = summary.signalStrength;
        this.lastUpdate = summary.lastUpdate instanceof Date ? summary.lastUpdate.toISOString() : summary.lastUpdate;
        this.healthStatus = summary.healthStatus;
    }

    static fromModel(summary: any): DroneHealthSummaryResponseDto {
        return new DroneHealthSummaryResponseDto(summary);
    }

    static fromModels(summaries: any[]): DroneHealthSummaryResponseDto[] {
        return summaries.map(summary => new DroneHealthSummaryResponseDto(summary));
    }
}

/**
 * 無人機即時狀態列表回應 DTO
 */
export class DroneRealTimeStatusListResponseDto extends PaginatedListResponseDto<DroneRealTimeStatusResponseDto> {
    static fromPaginatedData(
        statuses: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): DroneRealTimeStatusListResponseDto {
        const statusDtos = DroneRealTimeStatusResponseDto.fromModels(statuses);
        return PaginatedListResponseDto.create(statusDtos, currentPage, pageSize, totalCount);
    }
}
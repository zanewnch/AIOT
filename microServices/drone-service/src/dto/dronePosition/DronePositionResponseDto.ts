/**
 * @fileoverview 無人機位置回應 DTO
 * 
 * 定義所有與無人機位置相關的回應資料結構
 * 基於 DronePositionCommandsSvc 和 DronePositionQueriesSvc 的回應需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose } from 'class-transformer';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';

/**
 * 無人機位置基本回應 DTO
 */
export class DronePositionResponseDto extends BaseResponseDto {
    @Expose()
    readonly droneId: number;

    @Expose()
    readonly latitude: number;

    @Expose()
    readonly longitude: number;

    @Expose()
    readonly altitude?: number;

    @Expose()
    readonly speed?: number;

    @Expose()
    readonly heading?: number;

    @Expose()
    readonly accuracy?: number;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly timestamp: string;

    @Expose()
    readonly source: string;

    @Expose()
    readonly batteryLevel?: number;

    @Expose()
    readonly flightMode?: string;

    constructor(position: any) {
        super(position.id.toString(), position.createdAt, position.updatedAt);
        this.droneId = position.drone_id;
        this.latitude = position.latitude;
        this.longitude = position.longitude;
        this.altitude = position.altitude;
        this.speed = position.speed;
        this.heading = position.heading;
        this.accuracy = position.accuracy;
        this.timestamp = position.timestamp?.toISOString() || position.createdAt?.toISOString();
        this.source = position.source || 'GPS';
        this.batteryLevel = position.battery_level;
        this.flightMode = position.flight_mode;
    }

    static fromModel(position: any): DronePositionResponseDto {
        return new DronePositionResponseDto(position);
    }

    static fromModels(positions: any[]): DronePositionResponseDto[] {
        return positions.map(position => new DronePositionResponseDto(position));
    }
}

/**
 * 無人機位置詳細回應 DTO
 */
export class DronePositionDetailResponseDto extends DronePositionResponseDto {
    @Expose()
    readonly droneSerial?: string;

    @Expose()
    readonly droneName?: string;

    @Expose()
    readonly distanceFromLastPosition?: number;

    @Expose()
    readonly timeFromLastPosition?: number;

    @Expose()
    readonly locationDescription?: string;

    constructor(position: any) {
        super(position);
        this.droneSerial = position.drone_serial;
        this.droneName = position.drone_name;
        this.distanceFromLastPosition = position.distance_from_last;
        this.timeFromLastPosition = position.time_from_last;
        this.locationDescription = position.location_description;
    }

    static fromModel(position: any): DronePositionDetailResponseDto {
        return new DronePositionDetailResponseDto(position);
    }
}

/**
 * 無人機軌跡回應 DTO
 */
export class DroneTrackResponseDto {
    @Expose()
    readonly droneId: number;

    @Expose()
    readonly droneSerial?: string;

    @Expose()
    readonly droneName?: string;

    @Expose()
    readonly positions: DronePositionResponseDto[];

    @Expose()
    readonly totalDistance?: number;

    @Expose()
    readonly totalFlightTime?: number;

    @Expose()
    readonly averageSpeed?: number;

    @Expose()
    readonly maxAltitude?: number;

    @Expose()
    readonly minAltitude?: number;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly startTime: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly endTime: string;

    constructor(track: any) {
        this.droneId = track.droneId;
        this.droneSerial = track.droneSerial;
        this.droneName = track.droneName;
        this.positions = DronePositionResponseDto.fromModels(track.positions || []);
        this.totalDistance = track.totalDistance;
        this.totalFlightTime = track.totalFlightTime;
        this.averageSpeed = track.averageSpeed;
        this.maxAltitude = track.maxAltitude;
        this.minAltitude = track.minAltitude;
        this.startTime = track.startTime?.toISOString();
        this.endTime = track.endTime?.toISOString();
    }
}

/**
 * 無人機位置統計回應 DTO
 */
export class DronePositionStatisticsResponseDto {
    @Expose()
    readonly totalPositions: number;

    @Expose()
    readonly totalDrones: number;

    @Expose()
    readonly positionsToday: number;

    @Expose()
    readonly positionsThisWeek: number;

    @Expose()
    readonly positionsThisMonth: number;

    @Expose()
    readonly averageAccuracy?: number;

    @Expose()
    readonly sourceBreakdown: Record<string, number>;

    @Expose()
    readonly droneActivityBreakdown: Record<string, number>;

    constructor(stats: any) {
        this.totalPositions = stats.totalPositions || 0;
        this.totalDrones = stats.totalDrones || 0;
        this.positionsToday = stats.positionsToday || 0;
        this.positionsThisWeek = stats.positionsThisWeek || 0;
        this.positionsThisMonth = stats.positionsThisMonth || 0;
        this.averageAccuracy = stats.averageAccuracy;
        this.sourceBreakdown = stats.sourceBreakdown || {};
        this.droneActivityBreakdown = stats.droneActivityBreakdown || {};
    }
}

/**
 * 無人機位置列表回應 DTO
 */
export class DronePositionListResponseDto extends PaginatedListResponseDto<DronePositionResponseDto> {
    static fromPaginatedData(
        positions: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): DronePositionListResponseDto {
        const positionDtos = DronePositionResponseDto.fromModels(positions);
        return PaginatedListResponseDto.create(positionDtos, currentPage, pageSize, totalCount);
    }
}

/**
 * 批次操作回應 DTO
 */
export class BatchDronePositionResponseDto {
    @Expose()
    readonly totalRequested!: number;

    @Expose()
    readonly successfulOperations!: number;

    @Expose()
    readonly failedOperations!: number;

    @Expose()
    readonly errors!: string[];

    @Expose()
    readonly processedPositionIds!: number[];

    @Expose()
    readonly skippedPositionIds!: number[];

    @Expose()
    readonly exportUrl?: string;

    constructor(result: any) {
        Object.assign(this, result);
    }
}
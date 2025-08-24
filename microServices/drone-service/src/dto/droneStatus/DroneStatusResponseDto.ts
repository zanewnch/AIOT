/**
 * @fileoverview 無人機狀態回應 DTO
 * 
 * 定義所有與無人機狀態相關的回應資料結構
 * 基於 DroneStatusCommandsSvc 和 DroneStatusQueriesSvc 的回應需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose } from 'class-transformer';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';
import { DroneStatus } from '../../models/DroneStatusModel';

/**
 * 無人機狀態基本回應 DTO
 */
export class DroneStatusResponseDto extends BaseResponseDto {
    @Expose()
    readonly droneSerial: string;

    @Expose()
    readonly droneName: string;

    @Expose()
    readonly status: DroneStatus;

    @Expose()
    readonly model?: string;

    @Expose()
    readonly manufacturer?: string;

    @Expose()
    readonly ownerUserId?: number;

    @Expose()
    readonly firmwareVersion?: string;

    @Expose()
    readonly batteryLevel?: number;

    @Expose()
    readonly notes?: string;

    @Expose()
    readonly isActive: boolean;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly lastSeen?: string;

    constructor(droneStatus: any) {
        super(droneStatus.id.toString(), droneStatus.createdAt, droneStatus.updatedAt);
        this.droneSerial = droneStatus.drone_serial;
        this.droneName = droneStatus.drone_name;
        this.status = droneStatus.status;
        this.model = droneStatus.model;
        this.manufacturer = droneStatus.manufacturer;
        this.ownerUserId = droneStatus.owner_user_id;
        this.firmwareVersion = droneStatus.firmware_version;
        this.batteryLevel = droneStatus.battery_level;
        this.notes = droneStatus.notes;
        this.isActive = droneStatus.is_active ?? true;
        this.lastSeen = droneStatus.last_seen?.toISOString();
    }

    static fromModel(droneStatus: any): DroneStatusResponseDto {
        return new DroneStatusResponseDto(droneStatus);
    }

    static fromModels(droneStatuses: any[]): DroneStatusResponseDto[] {
        return droneStatuses.map(status => new DroneStatusResponseDto(status));
    }
}

/**
 * 無人機狀態統計回應 DTO
 */
export class DroneStatusStatisticsResponseDto {
    @Expose()
    readonly totalDrones: number;

    @Expose()
    readonly activeDrones: number;

    @Expose()
    readonly inactiveDrones: number;

    @Expose()
    readonly flyingDrones: number;

    @Expose()
    readonly maintenanceDrones: number;

    @Expose()
    readonly statusBreakdown: Record<DroneStatus, number>;

    @Expose()
    readonly manufacturerBreakdown: Record<string, number>;

    @Expose()
    readonly modelBreakdown: Record<string, number>;

    constructor(stats: any) {
        this.totalDrones = stats.totalDrones || 0;
        this.activeDrones = stats.activeDrones || 0;
        this.inactiveDrones = stats.inactiveDrones || 0;
        this.flyingDrones = stats.flyingDrones || 0;
        this.maintenanceDrones = stats.maintenanceDrones || 0;
        this.statusBreakdown = stats.statusBreakdown || {};
        this.manufacturerBreakdown = stats.manufacturerBreakdown || {};
        this.modelBreakdown = stats.modelBreakdown || {};
    }
}

/**
 * 無人機狀態列表回應 DTO
 */
export class DroneStatusListResponseDto extends PaginatedListResponseDto<DroneStatusResponseDto> {
    static fromPaginatedData(
        droneStatuses: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): DroneStatusListResponseDto {
        const statusDtos = DroneStatusResponseDto.fromModels(droneStatuses);
        return PaginatedListResponseDto.create(statusDtos, currentPage, pageSize, totalCount);
    }
}

/**
 * 批次操作回應 DTO
 */
export class BatchDroneStatusResponseDto {
    @Expose()
    readonly totalRequested!: number;

    @Expose()
    readonly successfulOperations!: number;

    @Expose()
    readonly failedOperations!: number;

    @Expose()
    readonly errors!: string[];

    @Expose()
    readonly processedDroneSerials!: string[];

    @Expose()
    readonly skippedDroneSerials!: string[];

    constructor(result: any) {
        Object.assign(this, result);
    }
}
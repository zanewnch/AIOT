/**
 * @fileoverview 無人機即時狀態回應 DTO
 * 
 * 定義所有與無人機即時狀態相關的回應資料結構
 * 基於 DroneRealTimeStatusCommandsService 和 DroneRealTimeStatusQueriesService 的回應需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose } from 'class-transformer';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';
import { DroneRealTimeStatus } from '../../models/DroneRealTimeStatusModel';

/**
 * 無人機即時狀態基本回應 DTO
 */
export class DroneRealTimeStatusResponseDto extends BaseResponseDto {
    @Expose()
    readonly droneId: number;

    @Expose()
    readonly status: DroneRealTimeStatus;

    @Expose()
    readonly batteryLevel: number;

    @Expose()
    readonly latitude?: number;

    @Expose()
    readonly longitude?: number;

    @Expose()
    readonly altitude?: number;

    @Expose()
    readonly speed?: number;

    @Expose()
    readonly heading?: number;

    @Expose()
    readonly signalStrength?: number;

    @Expose()
    readonly temperature?: number;

    @Expose()
    readonly humidity?: number;

    @Expose()
    readonly windSpeed?: number;

    @Expose()
    readonly isConnected: boolean;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly lastSeen?: string;

    @Expose()
    readonly errorMessage?: string;

    @Expose()
    readonly flightTimeToday?: number;

    constructor(realTimeStatus: any) {
        super(realTimeStatus.id.toString(), realTimeStatus.createdAt, realTimeStatus.updatedAt);
        this.droneId = realTimeStatus.drone_id;
        this.status = realTimeStatus.current_status || realTimeStatus.status;
        this.batteryLevel = realTimeStatus.current_battery_level || realTimeStatus.battery_level;
        this.latitude = realTimeStatus.latitude;
        this.longitude = realTimeStatus.longitude;
        this.altitude = realTimeStatus.current_altitude || realTimeStatus.altitude;
        this.speed = realTimeStatus.current_speed || realTimeStatus.speed;
        this.heading = realTimeStatus.current_heading || realTimeStatus.heading;
        this.signalStrength = realTimeStatus.signal_strength;
        this.temperature = realTimeStatus.temperature;
        this.humidity = realTimeStatus.humidity;
        this.windSpeed = realTimeStatus.wind_speed;
        this.isConnected = realTimeStatus.is_connected ?? true;
        this.lastSeen = realTimeStatus.last_seen?.toISOString();
        this.errorMessage = realTimeStatus.error_message;
        this.flightTimeToday = realTimeStatus.flight_time_today;
    }

    static fromModel(realTimeStatus: any): DroneRealTimeStatusResponseDto {
        return new DroneRealTimeStatusResponseDto(realTimeStatus);
    }

    static fromModels(realTimeStatuses: any[]): DroneRealTimeStatusResponseDto[] {
        return realTimeStatuses.map(status => new DroneRealTimeStatusResponseDto(status));
    }
}

/**
 * 無人機即時狀態詳細回應 DTO
 */
export class DroneRealTimeStatusDetailResponseDto extends DroneRealTimeStatusResponseDto {
    @Expose()
    readonly droneSerial?: string;

    @Expose()
    readonly droneName?: string;

    @Expose()
    readonly droneModel?: string;

    @Expose()
    readonly firmwareVersion?: string;

    @Expose()
    readonly connectionHistory?: any[];

    @Expose()
    readonly batteryHistory?: any[];

    @Expose()
    readonly performanceMetrics?: Record<string, any>;

    @Expose()
    readonly maintenanceStatus?: string;

    constructor(realTimeStatus: any) {
        super(realTimeStatus);
        this.droneSerial = realTimeStatus.drone_serial;
        this.droneName = realTimeStatus.drone_name;
        this.droneModel = realTimeStatus.drone_model;
        this.firmwareVersion = realTimeStatus.firmware_version;
        this.connectionHistory = realTimeStatus.connection_history;
        this.batteryHistory = realTimeStatus.battery_history;
        this.performanceMetrics = realTimeStatus.performance_metrics;
        this.maintenanceStatus = realTimeStatus.maintenance_status;
    }

    static fromModel(realTimeStatus: any): DroneRealTimeStatusDetailResponseDto {
        return new DroneRealTimeStatusDetailResponseDto(realTimeStatus);
    }
}

/**
 * 儀表板摘要回應 DTO
 */
export class DashboardSummaryResponseDto {
    @Expose()
    readonly totalDrones: number;

    @Expose()
    readonly onlineCount: number;

    @Expose()
    readonly offlineCount: number;

    @Expose()
    readonly lowBatteryCount: number;

    @Expose()
    readonly criticalBatteryCount: number;

    @Expose()
    readonly flyingCount: number;

    @Expose()
    readonly idleCount: number;

    @Expose()
    readonly maintenanceCount: number;

    @Expose()
    readonly errorCount: number;

    @Expose()
    readonly batteryStatistics: {
        average: number;
        minimum: number;
        maximum: number;
        lowBatteryThreshold: number;
    };

    @Expose()
    readonly signalStatistics: {
        average: number;
        minimum: number;
        maximum: number;
    };

    @Expose()
    readonly statusBreakdown: Record<DroneRealTimeStatus, number>;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly lastUpdated: string;

    constructor(summary: any) {
        this.totalDrones = summary.totalDrones || 0;
        this.onlineCount = summary.onlineCount || 0;
        this.offlineCount = summary.offlineCount || 0;
        this.lowBatteryCount = summary.lowBatteryCount || 0;
        this.criticalBatteryCount = summary.criticalBatteryCount || 0;
        this.flyingCount = summary.flyingCount || 0;
        this.idleCount = summary.idleCount || 0;
        this.maintenanceCount = summary.maintenanceCount || 0;
        this.errorCount = summary.errorCount || 0;
        this.batteryStatistics = summary.batteryStatistics || {};
        this.signalStatistics = summary.signalStatistics || {};
        this.statusBreakdown = summary.statusBreakdown || {};
        this.lastUpdated = summary.lastUpdated?.toISOString() || new Date().toISOString();
    }
}

/**
 * 電池統計回應 DTO
 */
export class BatteryStatisticsResponseDto {
    @Expose()
    readonly totalDrones: number;

    @Expose()
    readonly averageBatteryLevel: number;

    @Expose()
    readonly minimumBatteryLevel: number;

    @Expose()
    readonly maximumBatteryLevel: number;

    @Expose()
    readonly lowBatteryCount: number;

    @Expose()
    readonly criticalBatteryCount: number;

    @Expose()
    readonly goodBatteryCount: number;

    @Expose()
    readonly lowBatteryThreshold: number;

    @Expose()
    readonly criticalBatteryThreshold: number;

    @Expose()
    readonly batteryDistribution: Record<string, number>;

    @Expose()
    readonly dronesBatteryDetails?: Array<{
        droneId: number;
        droneSerial?: string;
        batteryLevel: number;
        status: string;
        lastUpdated: string;
    }>;

    constructor(stats: any) {
        this.totalDrones = stats.totalDrones || 0;
        this.averageBatteryLevel = stats.averageBatteryLevel || 0;
        this.minimumBatteryLevel = stats.minimumBatteryLevel || 0;
        this.maximumBatteryLevel = stats.maximumBatteryLevel || 0;
        this.lowBatteryCount = stats.lowBatteryCount || 0;
        this.criticalBatteryCount = stats.criticalBatteryCount || 0;
        this.goodBatteryCount = stats.goodBatteryCount || 0;
        this.lowBatteryThreshold = stats.lowBatteryThreshold || 20;
        this.criticalBatteryThreshold = stats.criticalBatteryThreshold || 10;
        this.batteryDistribution = stats.batteryDistribution || {};
        this.dronesBatteryDetails = stats.dronesBatteryDetails;
    }
}

/**
 * 狀態統計回應 DTO
 */
export class StatusStatisticsResponseDto {
    @Expose()
    readonly totalStatuses: number;

    @Expose()
    readonly activeStatuses: number;

    @Expose()
    readonly offlineStatuses: number;

    @Expose()
    readonly averageSignalStrength: number;

    @Expose()
    readonly statusBreakdown: Record<DroneRealTimeStatus, number>;

    @Expose()
    readonly connectionStatistics: {
        connected: number;
        disconnected: number;
        unstable: number;
    };

    @Expose()
    readonly performanceMetrics: {
        averageResponseTime: number;
        errorRate: number;
        uptime: number;
    };

    constructor(stats: any) {
        this.totalStatuses = stats.totalStatuses || 0;
        this.activeStatuses = stats.activeStatuses || 0;
        this.offlineStatuses = stats.offlineStatuses || 0;
        this.averageSignalStrength = stats.averageSignalStrength || 0;
        this.statusBreakdown = stats.statusBreakdown || {};
        this.connectionStatistics = stats.connectionStatistics || {};
        this.performanceMetrics = stats.performanceMetrics || {};
    }
}

/**
 * 無人機即時狀態列表回應 DTO
 */
export class DroneRealTimeStatusListResponseDto extends PaginatedListResponseDto<DroneRealTimeStatusResponseDto> {
    static fromPaginatedData(
        realTimeStatuses: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): DroneRealTimeStatusListResponseDto {
        const statusDtos = DroneRealTimeStatusResponseDto.fromModels(realTimeStatuses);
        return PaginatedListResponseDto.create(statusDtos, currentPage, pageSize, totalCount);
    }
}

/**
 * 批次操作回應 DTO
 */
export class BatchDroneRealTimeStatusResponseDto {
    @Expose()
    readonly totalRequested!: number;

    @Expose()
    readonly successfulOperations!: number;

    @Expose()
    readonly failedOperations!: number;

    @Expose()
    readonly errors!: string[];

    @Expose()
    readonly processedDroneIds!: number[];

    @Expose()
    readonly skippedDroneIds!: number[];

    @Expose()
    readonly operationResults!: Record<string, any>;

    @Expose()
    readonly reconnectedDrones?: number[];

    @Expose()
    readonly disconnectedDrones?: number[];

    constructor(result: any) {
        Object.assign(this, result);
    }
}
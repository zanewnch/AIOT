/**
 * @fileoverview 無人機指令回應 DTO
 * 
 * 定義所有與無人機指令相關的回應資料結構
 * 基於 DroneCommandCommandsService 和 DroneCommandQueriesService 的回應需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose } from 'class-transformer';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';

/**
 * 無人機指令基本回應 DTO
 */
export class DroneCommandResponseDto extends BaseResponseDto {
    @Expose()
    readonly droneId: string;

    @Expose()
    readonly commandType: string;

    @Expose()
    readonly status: string;

    @Expose()
    readonly priority: number;

    @Expose()
    readonly description?: string;

    @Expose()
    readonly userId?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly scheduledAt?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly executedAt?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly completedAt?: string;

    @Expose()
    readonly executorId?: string;

    @Expose()
    readonly progress?: number;

    constructor(command: any) {
        super(command.id.toString(), command.createdAt, command.updatedAt);
        this.droneId = command.droneId;
        this.commandType = command.commandType;
        this.status = command.status;
        this.priority = command.priority;
        this.description = command.description;
        this.userId = command.userId;
        this.scheduledAt = command.scheduledAt?.toISOString();
        this.executedAt = command.executedAt?.toISOString();
        this.completedAt = command.completedAt?.toISOString();
        this.executorId = command.executorId;
        this.progress = command.progress;
    }

    static fromModel(command: any): DroneCommandResponseDto {
        return new DroneCommandResponseDto(command);
    }

    static fromModels(commands: any[]): DroneCommandResponseDto[] {
        return commands.map(command => new DroneCommandResponseDto(command));
    }
}

/**
 * 無人機指令詳細回應 DTO
 */
export class DroneCommandDetailResponseDto extends DroneCommandResponseDto {
    @Expose()
    readonly parameters?: Record<string, any>;

    @Expose()
    readonly executionResult?: Record<string, any>;

    @Expose()
    readonly errorMessage?: string;

    @Expose()
    readonly executionLog?: string;

    @Expose()
    readonly retryCount?: number;

    @Expose()
    readonly maxRetries?: number;

    constructor(command: any) {
        super(command);
        this.parameters = command.parameters;
        this.executionResult = command.executionResult;
        this.errorMessage = command.errorMessage;
        this.executionLog = command.executionLog;
        this.retryCount = command.retryCount;
        this.maxRetries = command.maxRetries;
    }

    static fromModel(command: any): DroneCommandDetailResponseDto {
        return new DroneCommandDetailResponseDto(command);
    }
}

/**
 * 無人機指令統計回應 DTO
 */
export class DroneCommandStatisticsResponseDto {
    @Expose()
    readonly totalCommands: number = 0;

    @Expose()
    readonly pendingCommands: number = 0;

    @Expose()
    readonly runningCommands: number = 0;

    @Expose()
    readonly completedCommands: number = 0;

    @Expose()
    readonly failedCommands: number = 0;

    @Expose()
    readonly cancelledCommands: number = 0;

    @Expose()
    readonly todayCommands: number = 0;

    @Expose()
    readonly thisWeekCommands: number = 0;

    @Expose()
    readonly thisMonthCommands: number = 0;

    @Expose()
    readonly averageExecutionTime?: number;

    @Expose()
    readonly commandsByType: Record<string, number> = {};

    @Expose()
    readonly commandsByDrone: Record<string, number> = {};

    constructor(stats: any) {
        Object.assign(this, stats);
    }
}

/**
 * 無人機指令列表回應 DTO
 */
export class DroneCommandListResponseDto extends PaginatedListResponseDto<DroneCommandResponseDto> {
    static fromPaginatedData(
        commands: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): DroneCommandListResponseDto {
        const commandDtos = DroneCommandResponseDto.fromModels(commands);
        return PaginatedListResponseDto.create(commandDtos, currentPage, pageSize, totalCount);
    }
}

/**
 * 批次操作回應 DTO
 */
export class BatchDroneCommandResponseDto {
    @Expose()
    readonly totalRequested: number = 0;

    @Expose()
    readonly successfulOperations: number = 0;

    @Expose()
    readonly failedOperations: number = 0;

    @Expose()
    readonly errors: string[] = [];

    @Expose()
    readonly processedCommandIds: string[] = [];

    @Expose()
    readonly skippedCommandIds: string[] = [];

    constructor(result: any) {
        Object.assign(this, result);
    }
}
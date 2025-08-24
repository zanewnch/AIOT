/**
 * @fileoverview 無人機指令佇列回應 DTO
 * 
 * 定義所有與無人機指令佇列相關的回應資料結構
 * 基於 DroneCommandQueueCommandsSvc 和 DroneCommandQueueQueriesSvc 的回應需求設計
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose } from 'class-transformer';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';
import { DroneCommandQueueStatus } from '../../models/DroneCommandQueueModel';

/**
 * 無人機指令佇列基本回應 DTO
 */
export class DroneCommandQueueResponseDto extends BaseResponseDto {
    @Expose()
    readonly name: string;

    @Expose()
    readonly droneId: number;

    @Expose()
    readonly commandType: string;

    @Expose()
    readonly priority: number;

    @Expose()
    readonly status: DroneCommandQueueStatus;

    @Expose()
    readonly currentIndex: number;

    @Expose()
    readonly autoExecute: boolean;

    @Expose()
    readonly executionConditions?: Record<string, any>;

    @Expose()
    readonly loopCount?: number;

    @Expose()
    readonly maxLoops?: number;

    @Expose()
    readonly createdBy?: number;

    @Expose()
    readonly description?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly startedAt?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly completedAt?: string;

    @Expose()
    readonly errorMessage?: string;

    constructor(queue: any) {
        super(queue.id.toString(), queue.createdAt, queue.updatedAt);
        this.name = queue.name;
        this.droneId = queue.drone_id;
        this.commandType = queue.command_type;
        this.priority = queue.priority;
        this.status = queue.status;
        this.currentIndex = queue.current_index;
        this.autoExecute = queue.auto_execute;
        this.executionConditions = queue.execution_conditions;
        this.loopCount = queue.loop_count;
        this.maxLoops = queue.max_loops;
        this.createdBy = queue.created_by;
        this.description = queue.description;
        this.startedAt = queue.started_at?.toISOString();
        this.completedAt = queue.completed_at?.toISOString();
        this.errorMessage = queue.error_message;
    }

    static fromModel(queue: any): DroneCommandQueueResponseDto {
        return new DroneCommandQueueResponseDto(queue);
    }

    static fromModels(queues: any[]): DroneCommandQueueResponseDto[] {
        return queues.map(queue => new DroneCommandQueueResponseDto(queue));
    }
}

/**
 * 無人機指令佇列詳細回應 DTO
 */
export class DroneCommandQueueDetailResponseDto extends DroneCommandQueueResponseDto {
    @Expose()
    readonly droneSerial?: string;

    @Expose()
    readonly droneName?: string;

    @Expose()
    readonly commandSequence?: any[];

    @Expose()
    readonly executionHistory?: any[];

    @Expose()
    readonly estimatedDuration?: number;

    @Expose()
    readonly actualDuration?: number;

    @Expose()
    readonly progressPercentage: number;

    @Expose()
    readonly nextCommand?: any;

    constructor(queue: any) {
        super(queue);
        this.droneSerial = queue.drone_serial;
        this.droneName = queue.drone_name;
        this.commandSequence = queue.command_sequence;
        this.executionHistory = queue.execution_history;
        this.estimatedDuration = queue.estimated_duration;
        this.actualDuration = queue.actual_duration;
        this.progressPercentage = this.calculateProgress(queue);
        this.nextCommand = queue.next_command;
    }

    private calculateProgress(queue: any): number {
        if (!queue.command_sequence || queue.command_sequence.length === 0) {
            return 0;
        }
        return Math.round((queue.current_index / queue.command_sequence.length) * 100);
    }

    static fromModel(queue: any): DroneCommandQueueDetailResponseDto {
        return new DroneCommandQueueDetailResponseDto(queue);
    }
}

/**
 * 無人機指令佇列統計回應 DTO
 */
export class DroneCommandQueueStatisticsResponseDto {
    @Expose()
    readonly totalQueues: number;

    @Expose()
    readonly pendingQueues: number;

    @Expose()
    readonly runningQueues: number;

    @Expose()
    readonly executingQueues: number;

    @Expose()
    readonly completedQueues: number;

    @Expose()
    readonly failedQueues: number;

    @Expose()
    readonly pausedQueues: number;

    @Expose()
    readonly cancelledQueues: number;

    @Expose()
    readonly queuesByPriority: Record<number, number>;

    @Expose()
    readonly queuesByCommandType: Record<string, number>;

    @Expose()
    readonly queuesByDrone: Record<string, number>;

    @Expose()
    readonly averageExecutionTime?: number;

    @Expose()
    readonly totalExecutionTime?: number;

    constructor(stats: any) {
        this.totalQueues = stats.totalQueues || 0;
        this.pendingQueues = stats.pendingQueues || 0;
        this.runningQueues = stats.runningQueues || 0;
        this.executingQueues = stats.executingQueues || 0;
        this.completedQueues = stats.completedQueues || 0;
        this.failedQueues = stats.failedQueues || 0;
        this.pausedQueues = stats.pausedQueues || 0;
        this.cancelledQueues = stats.cancelledQueues || 0;
        this.queuesByPriority = stats.queuesByPriority || {};
        this.queuesByCommandType = stats.queuesByCommandType || {};
        this.queuesByDrone = stats.queuesByDrone || {};
        this.averageExecutionTime = stats.averageExecutionTime;
        this.totalExecutionTime = stats.totalExecutionTime;
    }
}

/**
 * 無人機指令佇列列表回應 DTO
 */
export class DroneCommandQueueListResponseDto extends PaginatedListResponseDto<DroneCommandQueueResponseDto> {
    static fromPaginatedData(
        queues: any[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): DroneCommandQueueListResponseDto {
        const queueDtos = DroneCommandQueueResponseDto.fromModels(queues);
        return PaginatedListResponseDto.create(queueDtos, currentPage, pageSize, totalCount);
    }
}

/**
 * 下一個指令回應 DTO
 */
export class NextDroneCommandResponseDto {
    @Expose()
    readonly queueId!: number;

    @Expose()
    readonly queueName!: string;

    @Expose()
    readonly droneId!: number;

    @Expose()
    readonly commandType!: string;

    @Expose()
    readonly priority!: number;

    @Expose()
    readonly currentIndex!: number;

    @Expose()
    readonly nextCommand?: any;

    @Expose()
    readonly estimatedExecutionTime?: number;

    constructor(data: any) {
        Object.assign(this, data);
    }
}

/**
 * 批次操作回應 DTO
 */
export class BatchDroneCommandQueueResponseDto {
    @Expose()
    readonly totalRequested!: number;

    @Expose()
    readonly successfulOperations!: number;

    @Expose()
    readonly failedOperations!: number;

    @Expose()
    readonly errors!: string[];

    @Expose()
    readonly processedQueueIds!: number[];

    @Expose()
    readonly skippedQueueIds!: number[];

    @Expose()
    readonly operationResults!: Record<string, any>;

    constructor(result: any) {
        Object.assign(this, result);
    }
}
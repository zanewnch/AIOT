/**
 * @fileoverview 歸檔任務回應 DTO
 * 
 * 定義所有與歸檔任務相關的回應資料結構
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform, Expose } from 'class-transformer';
import { BaseResponseDto, PaginatedListResponseDto } from '../common';
import { ArchiveTaskModel, ArchiveJobType, ArchiveTaskStatus } from '../../models/ArchiveTaskModel';

/**
 * 歸檔任務基本回應 DTO
 */
export class ArchiveTaskResponseDto extends BaseResponseDto {
    @Expose()
    readonly jobType: ArchiveJobType;

    @Expose()
    readonly status: ArchiveTaskStatus;

    @Expose()
    readonly description?: string;

    @Expose()
    readonly batchId?: string;

    @Expose()
    readonly priority: number;

    @Expose()
    readonly progress: number;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly scheduledAt?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly startedAt?: string;

    @Expose()
    @Transform(({ value }) => value ? new Date(value).toISOString() : null)
    readonly completedAt?: string;

    @Expose()
    readonly executorId?: string;

    constructor(task: ArchiveTaskModel) {
        super(task.id.toString(), task.createdAt, task.updatedAt);
        this.jobType = task.job_type;
        this.status = task.status;
        this.description = ''; // Model doesn't have this property
        this.batchId = task.batch_id;
        this.priority = 0; // Model doesn't have this property
        this.progress = task.getProgressPercentage();
        this.scheduledAt = undefined; // Model doesn't have this property
        this.startedAt = task.started_at?.toISOString();
        this.completedAt = task.completed_at?.toISOString();
        this.executorId = ''; // Model doesn't have this property
    }

    /**
     * 從 ArchiveTaskModel 創建 DTO
     */
    static fromModel(task: ArchiveTaskModel): ArchiveTaskResponseDto {
        return new ArchiveTaskResponseDto(task);
    }

    /**
     * 從 ArchiveTaskModel 陣列創建 DTO 陣列
     */
    static fromModels(tasks: ArchiveTaskModel[]): ArchiveTaskResponseDto[] {
        return tasks.map(task => new ArchiveTaskResponseDto(task));
    }
}

/**
 * 歷史任務詳細回應 DTO
 * 包含更多敏感資訊，用於內部或管理員API
 */
export class ArchiveTaskDetailResponseDto extends ArchiveTaskResponseDto {
    @Expose()
    readonly parameters?: Record<string, any>;

    @Expose()
    readonly executionResult?: Record<string, any>;

    @Expose()
    readonly errorMessage?: string;

    @Expose()
    readonly executionLog?: string;

    constructor(task: ArchiveTaskModel) {
        super(task);
        this.parameters = undefined; // Model doesn't have this property
        this.executionResult = undefined; // Model doesn't have this property
        this.errorMessage = task.error_message || undefined;
        this.executionLog = undefined; // Model doesn't have this property
    }

    /**
     * 從 ArchiveTaskModel 創建詳細 DTO
     */
    static fromModel(task: ArchiveTaskModel): ArchiveTaskDetailResponseDto {
        return new ArchiveTaskDetailResponseDto(task);
    }
}

/**
 * 歸檔任務統計回應 DTO
 */
export class ArchiveTaskStatisticsResponseDto {
    @Expose()
    readonly totalTasks: number = 0;

    @Expose()
    readonly completedTasks: number = 0;

    @Expose()
    readonly failedTasks: number = 0;

    @Expose()
    readonly runningTasks: number = 0;

    @Expose()
    readonly pendingTasks: number = 0;

    @Expose()
    readonly todayTasks: number = 0;

    @Expose()
    readonly thisWeekTasks: number = 0;

    @Expose()
    readonly thisMonthTasks: number = 0;

    @Expose()
    readonly averageExecutionTime?: number;

    constructor(stats: {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        runningTasks: number;
        pendingTasks: number;
        todayTasks: number;
        thisWeekTasks: number;
        thisMonthTasks: number;
        averageExecutionTime?: number;
    }) {
        Object.assign(this, stats);
    }
}

/**
 * 歸檔任務列表回應 DTO
 */
export class ArchiveTaskListResponseDto extends PaginatedListResponseDto<ArchiveTaskResponseDto> {
    /**
     * 從分頁資料創建任務列表回應
     */
    static fromPaginatedData(
        tasks: ArchiveTaskModel[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): ArchiveTaskListResponseDto {
        const taskDtos = ArchiveTaskResponseDto.fromModels(tasks);
        return PaginatedListResponseDto.create(taskDtos, currentPage, pageSize, totalCount);
    }
}

/**
 * 批次操作回應 DTO
 */
export class BatchOperationResponseDto {
    @Expose()
    readonly totalRequested: number = 0;

    @Expose()
    readonly successfulUpdates: number = 0;

    @Expose()
    readonly failedUpdates: number = 0;

    @Expose()
    readonly errors: string[] = [];

    @Expose()
    readonly updatedTaskIds: string[] = [];

    constructor(result: {
        totalRequested: number;
        successfulUpdates: number;
        failedUpdates: number;
        errors: string[];
        updatedTaskIds: string[];
    }) {
        Object.assign(this, result);
    }
}
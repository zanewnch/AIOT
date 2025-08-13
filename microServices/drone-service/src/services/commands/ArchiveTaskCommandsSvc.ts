/**
 * @fileoverview 歸檔任務命令 Service 實作
 *
 * 此文件實作了歸檔任務命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module ArchiveTaskCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types/dependency-injection.js';
import type { ArchiveTaskModel } from '../../models/ArchiveTaskModel.js';
import { ArchiveJobType, ArchiveTaskStatus } from '../../models/ArchiveTaskModel.js';
import type {
    CreateArchiveTaskRequest,
    ArchiveTaskExecutionResult,
    BatchArchiveResult
} from '../../types/services/IArchiveTaskService.js';
import type {
    IArchiveTaskRepository
} from '../../types/repositories/IArchiveTaskRepository.js';
import { ArchiveTaskCommandsRepository } from '../../repo/commands/ArchiveTaskCommandsRepo.js';
import { ArchiveTaskQueriesRepository } from '../../repo/queries/ArchiveTaskQueriesRepo.js';
import { ArchiveTaskQueriesSvc } from '../queries/ArchiveTaskQueriesSvc.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

/**
 * 歸檔任務命令 Service 實作類別
 *
 * 專門處理歸檔任務相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class ArchiveTaskCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class ArchiveTaskCommandsSvc {
    private readonly logger = createLogger('ArchiveTaskCommandsSvc');
    private readonly repository: IArchiveTaskRepository; // 組合介面

    constructor(
        @inject(TYPES.ArchiveTaskCommandsSvc) 
        private readonly commandsRepository: ArchiveTaskCommandsRepository,
        
        @inject(TYPES.ArchiveTaskQueriesSvc) 
        private readonly queriesRepository: ArchiveTaskQueriesRepository,
        
        @inject(TYPES.ArchiveTaskQueriesSvc) 
        private readonly queryService: ArchiveTaskQueriesSvc
    ) {
        // 創建組合repository，支持完整的IArchiveTaskRepository接口
        this.repository = Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IArchiveTaskRepository;
    }

    /**
     * 創建新的歸檔任務
     *
     * @param request - 歸檔任務創建請求
     * @returns Promise<ArchiveTaskModel> 創建的歸檔任務
     * @throws {Error} 當請求資料無效或創建失敗時拋出錯誤
     */
    @LogService()
    createTask = async (request: CreateArchiveTaskRequest): Promise<ArchiveTaskModel> => {
        try {
            this.logger.info('開始創建歸檔任務', { request });

            // 驗證請求資料
            this.validateCreateRequest(request);

            // 生成批次ID（如果未提供）
            const batchId = request.batch_id || this.generateBatchId(request.job_type);

            // 創建任務資料
            const taskData = {
                job_type: request.job_type,
                table_name: request.table_name,
                archive_table_name: request.archive_table_name,
                date_range_start: request.date_range_start,
                date_range_end: request.date_range_end,
                batch_id: batchId,
                total_records: 0,
                archived_records: 0,
                status: ArchiveTaskStatus.PENDING,
                started_at: null,
                completed_at: null,
                error_message: null,
                created_by: request.created_by
            };

            const task = await this.repository.create(taskData);

            this.logger.info('歸檔任務創建成功', {
                id: task.id,
                batchId,
                jobType: request.job_type
            });

            return task;
        } catch (error) {
            this.logger.error('創建歸檔任務失敗', { request, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * 批次創建歸檔任務
     *
     * @param requests - 歸檔任務創建請求列表
     * @returns Promise<BatchArchiveResult> 批次創建結果
     * @throws {Error} 當批次創建失敗時拋出錯誤
     */
    @LogService()
    createBatchTasks = async (requests: CreateArchiveTaskRequest[]): Promise<BatchArchiveResult> => {
        try {
            this.logger.info('開始批次創建歸檔任務', { count: requests.length });

            const result: BatchArchiveResult = {
                batch_id: '',
                tasks: [],
                successCount: 0,
                failureCount: 0,
                errors: []
            };

            // 生成統一的批次ID前綴
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const baseBatchId = `BATCH_${timestamp}`;
            result.batch_id = baseBatchId;

            for (let i = 0; i < requests.length; i++) {
                try {
                    const request = requests[i];
                    // 為每個任務設置唯一的批次ID
                    request.batch_id = `${baseBatchId}_${String(i + 1).padStart(3, '0')}`;

                    const task = await this.createTask(request);
                    result.tasks.push(task);
                    result.successCount++;
                } catch (error) {
                    result.failureCount++;
                    result.errors.push(`任務 ${i + 1}: ${(error as Error).message}`);
                    this.logger.error(`批次創建任務 ${i + 1} 失敗`, {
                        request: requests[i],
                        error: (error as Error).message
                    });
                }
            }

            this.logger.info('批次創建歸檔任務完成', {
                total: requests.length,
                success: result.successCount,
                failure: result.failureCount
            });

            return result;
        } catch (error) {
            this.logger.error('批次創建歸檔任務失敗', { error: (error as Error).message });
            throw new Error(`Failed to create batch tasks: ${(error as Error).message}`);
        }
    }

    /**
     * 開始執行歸檔任務
     *
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskExecutionResult> 執行結果
     * @throws {Error} 當任務執行失敗時拋出錯誤
     */
    @LogService()
    executeTask = async (id: number): Promise<ArchiveTaskExecutionResult> => {
        try {
            this.logger.info('開始執行歸檔任務', { id: id });

            const task = await this.queryService.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }

            // 檢查任務是否可以執行
            const canExecute = await this.queryService.canExecuteTask(id);
            if (!canExecute) {
                throw new Error(`任務 ${id} 無法執行，當前狀態: ${task.status}`);
            }

            const startTime = Date.now();

            try {
                // 模擬歸檔執行邏輯
                await this.performArchiving(task);

                const endTime = Date.now();
                const executionTime = endTime - startTime;

                const result: ArchiveTaskExecutionResult = {
                    id: id,
                    status: task.status,
                    totalRecords: task.total_records,
                    archivedRecords: task.archived_records,
                    executionTime
                };

                this.logger.info('歸檔任務執行完成', {
                    id: id,
                    status: task.status,
                    executionTime
                });

                return result;
            } catch (executionError) {
                // 標記任務為失敗
                await this.failTask(id, (executionError as Error).message);
                throw executionError;
            }
        } catch (error) {
            this.logger.error('執行歸檔任務失敗', { id: id, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * 批次執行歸檔任務
     *
     * @param ids - 任務 ID 列表
     * @returns Promise<ArchiveTaskExecutionResult[]> 執行結果列表
     * @throws {Error} 當批次執行失敗時拋出錯誤
     */
    @LogService()
    executeBatchTasks = async (ids: number[]): Promise<ArchiveTaskExecutionResult[]> => {
        try {
            this.logger.info('開始批次執行歸檔任務', { taskIds: ids });

            const results: ArchiveTaskExecutionResult[] = [];

            for (const id of ids) {
                try {
                    const result = await this.executeTask(id);
                    results.push(result);
                } catch (error) {
                    this.logger.error(`批次執行任務 ${id} 失敗`, { error: (error as Error).message });
                    // 繼續執行其他任務
                    results.push({
                        id: id,
                        status: ArchiveTaskStatus.FAILED,
                        totalRecords: 0,
                        archivedRecords: 0,
                        executionTime: 0,
                        errorMessage: (error as Error).message
                    });
                }
            }

            this.logger.info('批次執行歸檔任務完成', {
                total: ids.length,
                results: results.length
            });

            return results;
        } catch (error) {
            this.logger.error('批次執行歸檔任務失敗', { error: (error as Error).message });
            throw new Error(`Failed to execute batch tasks: ${(error as Error).message}`);
        }
    }

    /**
     * 取消歸檔任務
     *
     * @param id - 任務 ID
     * @param reason - 取消原因
     * @returns Promise<ArchiveTaskModel> 更新後的任務
     * @throws {Error} 當取消失敗時拋出錯誤
     */
    @LogService()
    cancelTask = async (id: number, reason: string): Promise<ArchiveTaskModel> => {
        try {
            this.logger.info('取消歸檔任務', { id: id, reason });

            const canCancel = await this.queryService.canCancelTask(id);
            if (!canCancel) {
                throw new Error(`任務 ${id} 無法取消`);
            }

            const updatedTask = await this.repository.update(id, {
                status: ArchiveTaskStatus.FAILED,
                completed_at: new Date(),
                error_message: `任務已取消: ${reason}`
            });

            if (!updatedTask) {
                throw new Error(`任務 ${id} 不存在`);
            }

            this.logger.info('歸檔任務取消成功', { id: id, reason });
            return updatedTask;
        } catch (error) {
            this.logger.error('取消歸檔任務失敗', {
                id: id,
                reason,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * 重試失敗的歸檔任務
     *
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskExecutionResult> 重試執行結果
     * @throws {Error} 當重試失敗時拋出錯誤
     */
    @LogService()
    retryTask = async (id: number): Promise<ArchiveTaskExecutionResult> => {
        try {
            this.logger.info('重試歸檔任務', { id: id });

            const task = await this.queryService.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }

            if (task.status !== ArchiveTaskStatus.FAILED) {
                throw new Error(`只能重試失敗的任務，當前狀態: ${task.status}`);
            }

            // 重置任務狀態
            await this.repository.update(id, {
                status: ArchiveTaskStatus.PENDING,
                started_at: null,
                completed_at: null,
                error_message: null,
                archived_records: 0
            });

            // 執行任務
            return await this.executeTask(id);
        } catch (error) {
            this.logger.error('重試歸檔任務失敗', { id: id, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * 更新任務進度
     *
     * @param id - 任務 ID
     * @param archivedCount - 已歸檔記錄數
     * @returns Promise<ArchiveTaskModel> 更新後的任務
     * @throws {Error} 當更新失敗時拋出錯誤
     */
    @LogService()
    updateTaskProgress = async (id: number, archivedCount: number): Promise<ArchiveTaskModel> => {
        try {
            this.logger.debug('更新任務進度', { id: id, archivedCount });

            const task = await this.queryService.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }

            return await task.updateProgress(archivedCount);
        } catch (error) {
            this.logger.error('更新任務進度失敗', {
                id: id,
                archivedCount,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * 標記任務為完成
     *
     * @param id - 任務 ID
     * @param finalCount - 最終歸檔記錄數
     * @returns Promise<ArchiveTaskModel> 完成的任務
     * @throws {Error} 當標記失敗時拋出錯誤
     */
    @LogService()
    completeTask = async (id: number, finalCount: number): Promise<ArchiveTaskModel> => {
        try {
            this.logger.info('標記任務為完成', { id: id, finalCount });

            const updatedTask = await this.repository.update(id, {
                status: ArchiveTaskStatus.COMPLETED,
                completed_at: new Date(),
                archived_records: finalCount
            });

            if (!updatedTask) {
                throw new Error(`任務 ${id} 不存在`);
            }

            this.logger.info('任務標記為完成成功', { id: id, finalCount });
            return updatedTask;
        } catch (error) {
            this.logger.error('標記任務為完成失敗', {
                id: id,
                finalCount,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * 標記任務為失敗
     *
     * @param id - 任務 ID
     * @param errorMessage - 錯誤訊息
     * @returns Promise<ArchiveTaskModel> 失敗的任務
     * @throws {Error} 當標記失敗時拋出錯誤
     */
    @LogService()
    failTask = async (id: number, errorMessage: string): Promise<ArchiveTaskModel> => {
        try {
            this.logger.info('標記任務為失敗', { id: id, errorMessage });

            const task = await this.queryService.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }

            return await task.markAsFailed(errorMessage);
        } catch (error) {
            this.logger.error('標記任務為失敗失敗', {
                id: id,
                errorMessage,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * 清理舊的歸檔任務記錄
     *
     * @param daysOld - 保留天數
     * @param status - 要清理的任務狀態（可選）
     * @returns Promise<number> 清理的任務數量
     */
    @LogService()
    cleanupOldTasks = async (daysOld: number, status?: ArchiveTaskStatus): Promise<number> => {
        try {
            this.logger.info('開始清理舊的歸檔任務記錄', { daysOld, status });

            const cleanedCount = await this.repository.cleanup(daysOld, status);

            this.logger.info('舊歸檔任務記錄清理完成', {
                daysOld,
                status,
                cleanedCount
            });

            return cleanedCount;
        } catch (error) {
            this.logger.error('清理舊歸檔任務記錄失敗', {
                daysOld,
                status,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * 驗證歸檔任務請求
     *
     * @param request - 創建請求
     * @throws {Error} 當驗證失敗時拋出錯誤
     */
    validateCreateRequest = (request: CreateArchiveTaskRequest): void => {
        if (!request.job_type) {
            throw new Error('任務類型不能為空');
        }

        if (!Object.values(ArchiveJobType).includes(request.job_type)) {
            throw new Error(`無效的任務類型: ${request.job_type}`);
        }

        if (!request.table_name || !request.table_name.trim()) {
            throw new Error('目標資料表名稱不能為空');
        }

        if (!request.archive_table_name || !request.archive_table_name.trim()) {
            throw new Error('歸檔表名稱不能為空');
        }

        if (!request.date_range_start) {
            throw new Error('起始日期不能為空');
        }

        if (!request.date_range_end) {
            throw new Error('結束日期不能為空');
        }

        if (request.date_range_start >= request.date_range_end) {
            throw new Error('起始日期必須早於結束日期');
        }

        if (!request.created_by || !request.created_by.trim()) {
            throw new Error('創建者不能為空');
        }

        // 檢查日期範圍是否合理（不能超過1年）
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        if (request.date_range_end.getTime() - request.date_range_start.getTime() > oneYear) {
            throw new Error('歸檔日期範圍不能超過1年');
        }
    }

    /**
     * 生成批次 ID
     *
     * @param jobType - 任務類型
     * @returns string 生成的批次 ID
     */
    generateBatchId = (jobType: ArchiveJobType): string => {
        const typePrefix = {
            [ArchiveJobType.POSITIONS]: 'POS',
            [ArchiveJobType.COMMANDS]: 'CMD',
            [ArchiveJobType.STATUS]: 'STA'
        };

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();

        return `${typePrefix[jobType]}_BATCH_${dateStr}_${timeStr}_${randomStr}`;
    }

    /**
     * 執行實際的歸檔操作
     *
     * @private
     * @param task - 歸檔任務
     */
    @LogService()
    private performArchiving = async (task: ArchiveTaskModel): Promise<void> => {
        // 標記任務開始執行
        await task.startExecution(0);

        // 模擬歸檔過程
        const simulatedRecordCount = Math.floor(Math.random() * 10000) + 1000;
        await task.update({ total_records: simulatedRecordCount });

        // 模擬分批處理
        const batchSize = 1000;
        let processed = 0;

        while (processed < simulatedRecordCount) {
            // 模擬處理時間
            await new Promise(resolve => setTimeout(resolve, 100));

            processed += Math.min(batchSize, simulatedRecordCount - processed);
            await this.updateTaskProgress(task.id, processed);
        }

        // 標記完成
        await this.completeTask(task.id, simulatedRecordCount);
    }
}
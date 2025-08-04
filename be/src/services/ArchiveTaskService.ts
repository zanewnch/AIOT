/**
 * @fileoverview 歸檔任務 Service 實作
 * 
 * 此文件實作了歸檔任務業務邏輯層，
 * 提供歸檔任務相關的業務操作實作。
 * 
 * @module ArchiveTaskService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { 
    ArchiveTaskModel, 
    ArchiveJobType,
    ArchiveTaskStatus 
} from '../models/ArchiveTaskModel';
import { 
    IArchiveTaskService,
    CreateArchiveTaskRequest,
    ArchiveTaskExecutionResult,
    ArchiveTaskStatistics,
    BatchArchiveResult
} from '../types/services/IArchiveTaskService';
import { 
    IArchiveTaskRepository,
    ArchiveTaskQueryOptions 
} from '../types/repositories/IArchiveTaskRepository';
import { ArchiveTaskRepository } from '../repo/ArchiveTaskRepo';
import { createLogger } from '../utils/logger';

/**
 * 歸檔任務 Service 實作類別
 * 
 * 實作 IArchiveTaskService 介面，提供歸檔任務的業務邏輯功能。
 * 包含任務創建、執行、監控、統計等業務操作的具體實作。
 * 
 * @class ArchiveTaskService
 * @implements {IArchiveTaskService}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const service = new ArchiveTaskService();
 * 
 * // 創建新任務
 * const task = await service.createTask({
 *   jobType: ArchiveJobType.POSITIONS,
 *   tableName: 'drone_positions',
 *   archiveTableName: 'drone_positions_archive',
 *   dateRangeStart: new Date('2025-07-01'),
 *   dateRangeEnd: new Date('2025-07-28'),
 *   createdBy: 'system'
 * });
 * 
 * // 執行任務
 * const result = await service.executeTask(task.id);
 * ```
 */
export class ArchiveTaskService implements IArchiveTaskService {
    private readonly logger = createLogger('ArchiveTaskService');
    private readonly repository: IArchiveTaskRepository;

    constructor(repository?: IArchiveTaskRepository) {
        this.repository = repository || new ArchiveTaskRepository();
    }

    /**
     * 創建新的歸檔任務
     * 
     * @param request - 歸檔任務創建請求
     * @returns Promise<ArchiveTaskModel> 創建的歸檔任務
     * @throws {Error} 當請求資料無效或創建失敗時拋出錯誤
     */
    async createTask(request: CreateArchiveTaskRequest): Promise<ArchiveTaskModel> {
        try {
            this.logger.info('開始創建歸檔任務', { request });
            
            // 驗證請求資料
            this.validateCreateRequest(request);
            
            // 生成批次ID（如果未提供）
            const batchId = request.batchId || this.generateBatchId(request.jobType);
            
            // 創建任務資料
            const taskData = {
                job_type: request.jobType,
                table_name: request.tableName,
                archive_table_name: request.archiveTableName,
                date_range_start: request.dateRangeStart,
                date_range_end: request.dateRangeEnd,
                batch_id: batchId,
                total_records: 0,
                archived_records: 0,
                status: ArchiveTaskStatus.PENDING,
                started_at: null,
                completed_at: null,
                error_message: null,
                created_by: request.createdBy
            };
            
            const task = await this.repository.create(taskData);
            
            this.logger.info('歸檔任務創建成功', { 
                taskId: task.id, 
                batchId,
                jobType: request.jobType 
            });
            
            return task;
        } catch (error) {
            this.logger.error('創建歸檔任務失敗', { request, error: error.message });
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
    async createBatchTasks(requests: CreateArchiveTaskRequest[]): Promise<BatchArchiveResult> {
        try {
            this.logger.info('開始批次創建歸檔任務', { count: requests.length });
            
            const result: BatchArchiveResult = {
                batchId: '',
                tasks: [],
                successCount: 0,
                failureCount: 0,
                errors: []
            };
            
            // 生成統一的批次ID前綴
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const baseBatchId = `BATCH_${timestamp}`;
            result.batchId = baseBatchId;
            
            for (let i = 0; i < requests.length; i++) {
                try {
                    const request = requests[i];
                    // 為每個任務設置唯一的批次ID
                    request.batchId = `${baseBatchId}_${String(i + 1).padStart(3, '0')}`;
                    
                    const task = await this.createTask(request);
                    result.tasks.push(task);
                    result.successCount++;
                } catch (error) {
                    result.failureCount++;
                    result.errors.push(`任務 ${i + 1}: ${error.message}`);
                    this.logger.error(`批次創建任務 ${i + 1} 失敗`, { 
                        request: requests[i], 
                        error: error.message 
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
            this.logger.error('批次創建歸檔任務失敗', { error: error.message });
            throw new Error(`Failed to create batch tasks: ${error.message}`);
        }
    }

    /**
     * 根據 ID 獲取歸檔任務
     * 
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskModel | null> 歸檔任務或 null
     */
    async getTaskById(id: number): Promise<ArchiveTaskModel | null> {
        try {
            this.logger.debug('根據 ID 獲取歸檔任務', { taskId: id });
            return await this.repository.findById(id);
        } catch (error) {
            this.logger.error('獲取歸檔任務失敗', { taskId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 獲取所有歸檔任務
     * 
     * @param options - 查詢選項
     * @returns Promise<ArchiveTaskModel[]> 歸檔任務列表
     */
    async getAllTasks(options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('獲取所有歸檔任務', { options });
            return await this.repository.findAll(options);
        } catch (error) {
            this.logger.error('獲取歸檔任務列表失敗', { options, error: error.message });
            throw error;
        }
    }

    /**
     * 根據狀態獲取歸檔任務
     * 
     * @param status - 任務狀態
     * @param limit - 限制數量（可選）
     * @returns Promise<ArchiveTaskModel[]> 指定狀態的歸檔任務列表
     */
    async getTasksByStatus(status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據狀態獲取歸檔任務', { status, limit });
            return await this.repository.findByStatus(status, limit);
        } catch (error) {
            this.logger.error('根據狀態獲取歸檔任務失敗', { 
                status, 
                limit, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 根據批次 ID 獲取歸檔任務
     * 
     * @param batchId - 批次 ID
     * @returns Promise<ArchiveTaskModel[]> 該批次的歸檔任務列表
     */
    async getTasksByBatchId(batchId: string): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據批次 ID 獲取歸檔任務', { batchId });
            return await this.repository.findByBatchId(batchId);
        } catch (error) {
            this.logger.error('根據批次 ID 獲取歸檔任務失敗', { 
                batchId, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 開始執行歸檔任務
     * 
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskExecutionResult> 執行結果
     * @throws {Error} 當任務執行失敗時拋出錯誤
     */
    async executeTask(id: number): Promise<ArchiveTaskExecutionResult> {
        try {
            this.logger.info('開始執行歸檔任務', { taskId: id });
            
            const task = await this.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }
            
            // 檢查任務是否可以執行
            const canExecute = await this.canExecuteTask(id);
            if (!canExecute) {
                throw new Error(`任務 ${id} 無法執行，當前狀態: ${task.status}`);
            }
            
            const startTime = Date.now();
            
            try {
                // 模擬歸檔執行邏輯
                // 在實際實作中，這裡會包含真正的資料歸檔邏輯
                await this.performArchiving(task);
                
                const endTime = Date.now();
                const executionTime = endTime - startTime;
                
                const result: ArchiveTaskExecutionResult = {
                    taskId: id,
                    status: task.status,
                    totalRecords: task.total_records,
                    archivedRecords: task.archived_records,
                    executionTime
                };
                
                this.logger.info('歸檔任務執行完成', { 
                    taskId: id,
                    status: task.status,
                    executionTime 
                });
                
                return result;
            } catch (executionError) {
                // 標記任務為失敗
                await this.failTask(id, executionError.message);
                throw executionError;
            }
        } catch (error) {
            this.logger.error('執行歸檔任務失敗', { taskId: id, error: error.message });
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
    async executeBatchTasks(ids: number[]): Promise<ArchiveTaskExecutionResult[]> {
        try {
            this.logger.info('開始批次執行歸檔任務', { taskIds: ids });
            
            const results: ArchiveTaskExecutionResult[] = [];
            
            for (const id of ids) {
                try {
                    const result = await this.executeTask(id);
                    results.push(result);
                } catch (error) {
                    this.logger.error(`批次執行任務 ${id} 失敗`, { error: error.message });
                    // 繼續執行其他任務
                    results.push({
                        taskId: id,
                        status: ArchiveTaskStatus.FAILED,
                        totalRecords: 0,
                        archivedRecords: 0,
                        executionTime: 0,
                        errorMessage: error.message
                    });
                }
            }
            
            this.logger.info('批次執行歸檔任務完成', { 
                total: ids.length,
                results: results.length 
            });
            
            return results;
        } catch (error) {
            this.logger.error('批次執行歸檔任務失敗', { error: error.message });
            throw new Error(`Failed to execute batch tasks: ${error.message}`);
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
    async cancelTask(id: number, reason: string): Promise<ArchiveTaskModel> {
        try {
            this.logger.info('取消歸檔任務', { taskId: id, reason });
            
            const canCancel = await this.canCancelTask(id);
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
            
            this.logger.info('歸檔任務取消成功', { taskId: id, reason });
            return updatedTask;
        } catch (error) {
            this.logger.error('取消歸檔任務失敗', { 
                taskId: id, 
                reason, 
                error: error.message 
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
    async retryTask(id: number): Promise<ArchiveTaskExecutionResult> {
        try {
            this.logger.info('重試歸檔任務', { taskId: id });
            
            const task = await this.getTaskById(id);
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
            this.logger.error('重試歸檔任務失敗', { taskId: id, error: error.message });
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
    async updateTaskProgress(id: number, archivedCount: number): Promise<ArchiveTaskModel> {
        try {
            this.logger.debug('更新任務進度', { taskId: id, archivedCount });
            
            const task = await this.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }
            
            return await task.updateProgress(archivedCount);
        } catch (error) {
            this.logger.error('更新任務進度失敗', { 
                taskId: id, 
                archivedCount, 
                error: error.message 
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
    async completeTask(id: number, finalCount: number): Promise<ArchiveTaskModel> {
        try {
            this.logger.info('標記任務為完成', { taskId: id, finalCount });
            
            const updatedTask = await this.repository.update(id, {
                status: ArchiveTaskStatus.COMPLETED,
                completed_at: new Date(),
                archived_records: finalCount
            });
            
            if (!updatedTask) {
                throw new Error(`任務 ${id} 不存在`);
            }
            
            this.logger.info('任務標記為完成成功', { taskId: id, finalCount });
            return updatedTask;
        } catch (error) {
            this.logger.error('標記任務為完成失敗', { 
                taskId: id, 
                finalCount, 
                error: error.message 
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
    async failTask(id: number, errorMessage: string): Promise<ArchiveTaskModel> {
        try {
            this.logger.info('標記任務為失敗', { taskId: id, errorMessage });
            
            const task = await this.getTaskById(id);
            if (!task) {
                throw new Error(`任務 ${id} 不存在`);
            }
            
            return await task.markAsFailed(errorMessage);
        } catch (error) {
            this.logger.error('標記任務為失敗失敗', { 
                taskId: id, 
                errorMessage, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * 獲取歸檔任務統計資訊
     * 
     * @returns Promise<ArchiveTaskStatistics> 統計資訊
     */
    async getTaskStatistics(): Promise<ArchiveTaskStatistics> {
        try {
            this.logger.debug('獲取歸檔任務統計資訊');
            
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const [
                totalTasks,
                pendingTasks,
                runningTasks,
                completedTasks,
                failedTasks,
                todayTasks,
                weekTasks,
                monthTasks,
                positionTasks,
                commandTasks,
                statusTasks
            ] = await Promise.all([
                this.repository.count(),
                this.repository.count({ status: ArchiveTaskStatus.PENDING }),
                this.repository.count({ status: ArchiveTaskStatus.RUNNING }),
                this.repository.count({ status: ArchiveTaskStatus.COMPLETED }),
                this.repository.count({ status: ArchiveTaskStatus.FAILED }),
                this.repository.count({ dateRangeStart: todayStart }),
                this.repository.count({ dateRangeStart: weekStart }),
                this.repository.count({ dateRangeStart: monthStart }),
                this.repository.count({ jobType: ArchiveJobType.POSITIONS }),
                this.repository.count({ jobType: ArchiveJobType.COMMANDS }),
                this.repository.count({ jobType: ArchiveJobType.STATUS })
            ]);
            
            const statistics: ArchiveTaskStatistics = {
                totalTasks,
                pendingTasks,
                runningTasks,
                completedTasks,
                failedTasks,
                tasksByType: {
                    [ArchiveJobType.POSITIONS]: positionTasks,
                    [ArchiveJobType.COMMANDS]: commandTasks,
                    [ArchiveJobType.STATUS]: statusTasks
                },
                todayTasks,
                weekTasks,
                monthTasks
            };
            
            this.logger.debug('歸檔任務統計資訊獲取完成', { statistics });
            return statistics;
        } catch (error) {
            this.logger.error('獲取歸檔任務統計資訊失敗', { error: error.message });
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
    async cleanupOldTasks(daysOld: number, status?: ArchiveTaskStatus): Promise<number> {
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
                error: error.message 
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
    validateCreateRequest(request: CreateArchiveTaskRequest): void {
        if (!request.jobType) {
            throw new Error('任務類型不能為空');
        }
        
        if (!Object.values(ArchiveJobType).includes(request.jobType)) {
            throw new Error(`無效的任務類型: ${request.jobType}`);
        }
        
        if (!request.tableName || !request.tableName.trim()) {
            throw new Error('目標資料表名稱不能為空');
        }
        
        if (!request.archiveTableName || !request.archiveTableName.trim()) {
            throw new Error('歸檔表名稱不能為空');
        }
        
        if (!request.dateRangeStart) {
            throw new Error('起始日期不能為空');
        }
        
        if (!request.dateRangeEnd) {
            throw new Error('結束日期不能為空');
        }
        
        if (request.dateRangeStart >= request.dateRangeEnd) {
            throw new Error('起始日期必須早於結束日期');
        }
        
        if (!request.createdBy || !request.createdBy.trim()) {
            throw new Error('創建者不能為空');
        }
        
        // 檢查日期範圍是否合理（不能超過1年）
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        if (request.dateRangeEnd.getTime() - request.dateRangeStart.getTime() > oneYear) {
            throw new Error('歸檔日期範圍不能超過1年');
        }
    }

    /**
     * 生成批次 ID
     * 
     * @param jobType - 任務類型
     * @returns string 生成的批次 ID
     */
    generateBatchId(jobType: ArchiveJobType): string {
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
     * 檢查任務是否可以執行
     * 
     * @param id - 任務 ID
     * @returns Promise<boolean> 是否可以執行
     */
    async canExecuteTask(id: number): Promise<boolean> {
        try {
            const task = await this.getTaskById(id);
            if (!task) {
                return false;
            }
            
            return task.status === ArchiveTaskStatus.PENDING;
        } catch (error) {
            this.logger.error('檢查任務執行權限失敗', { taskId: id, error: error.message });
            return false;
        }
    }

    /**
     * 檢查任務是否可以取消
     * 
     * @param id - 任務 ID
     * @returns Promise<boolean> 是否可以取消
     */
    async canCancelTask(id: number): Promise<boolean> {
        try {
            const task = await this.getTaskById(id);
            if (!task) {
                return false;
            }
            
            return task.status === ArchiveTaskStatus.PENDING || 
                   task.status === ArchiveTaskStatus.RUNNING;
        } catch (error) {
            this.logger.error('檢查任務取消權限失敗', { taskId: id, error: error.message });
            return false;
        }
    }

    /**
     * 執行實際的歸檔操作
     * 
     * @private
     * @param task - 歸檔任務
     */
    private async performArchiving(task: ArchiveTaskModel): Promise<void> {
        // 標記任務開始執行
        await task.startExecution(0);
        
        // 模擬歸檔過程
        // 在實際實作中，這裡會包含：
        // 1. 查詢要歸檔的資料數量
        // 2. 分批移動資料到歸檔表
        // 3. 更新進度
        // 4. 刪除原始資料（可選）
        
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
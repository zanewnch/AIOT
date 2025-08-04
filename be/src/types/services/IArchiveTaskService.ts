/**
 * @fileoverview 歸檔任務 Service 介面定義
 * 
 * 此文件定義了歸檔任務業務邏輯層的介面規範，
 * 提供歸檔任務相關的業務操作方法定義。
 * 
 * @module IArchiveTaskService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { 
    ArchiveTaskModel, 
    ArchiveTaskAttributes, 
    ArchiveTaskCreationAttributes,
    ArchiveJobType,
    ArchiveTaskStatus 
} from '../../models/ArchiveTaskModel';
import { ArchiveTaskQueryOptions } from '../repositories/IArchiveTaskRepository';

/**
 * 歸檔任務創建請求介面
 * 
 * 定義創建歸檔任務時的請求結構
 * 
 * @interface CreateArchiveTaskRequest
 * @since 1.0.0
 */
export interface CreateArchiveTaskRequest {
    /** 任務類型 */
    jobType: ArchiveJobType;
    /** 目標資料表名稱 */
    tableName: string;
    /** 歸檔表名稱 */
    archiveTableName: string;
    /** 歸檔資料起始時間 */
    dateRangeStart: Date;
    /** 歸檔資料結束時間 */
    dateRangeEnd: Date;
    /** 創建者 */
    createdBy: string;
    /** 批次ID（可選，系統會自動生成） */
    batchId?: string;
}

/**
 * 歸檔任務執行結果介面
 * 
 * 定義歸檔任務執行後的結果結構
 * 
 * @interface ArchiveTaskExecutionResult
 * @since 1.0.0
 */
export interface ArchiveTaskExecutionResult {
    /** 任務ID */
    taskId: number;
    /** 執行狀態 */
    status: ArchiveTaskStatus;
    /** 總記錄數 */
    totalRecords: number;
    /** 已歸檔記錄數 */
    archivedRecords: number;
    /** 執行時間（毫秒） */
    executionTime: number;
    /** 錯誤訊息（如果有） */
    errorMessage?: string;
}

/**
 * 歸檔任務統計資訊介面
 * 
 * 定義歸檔任務統計資訊的結構
 * 
 * @interface ArchiveTaskStatistics
 * @since 1.0.0
 */
export interface ArchiveTaskStatistics {
    /** 總任務數 */
    totalTasks: number;
    /** 待執行任務數 */
    pendingTasks: number;
    /** 執行中任務數 */
    runningTasks: number;
    /** 已完成任務數 */
    completedTasks: number;
    /** 失敗任務數 */
    failedTasks: number;
    /** 各類型任務統計 */
    tasksByType: Record<ArchiveJobType, number>;
    /** 今日任務數 */
    todayTasks: number;
    /** 本週任務數 */
    weekTasks: number;
    /** 本月任務數 */
    monthTasks: number;
}

/**
 * 批次歸檔操作結果介面
 * 
 * 定義批次歸檔操作的結果結構
 * 
 * @interface BatchArchiveResult
 * @since 1.0.0
 */
export interface BatchArchiveResult {
    /** 批次ID */
    batchId: string;
    /** 創建的任務列表 */
    tasks: ArchiveTaskModel[];
    /** 成功創建的任務數 */
    successCount: number;
    /** 失敗的任務數 */
    failureCount: number;
    /** 錯誤訊息列表 */
    errors: string[];
}

/**
 * 歸檔任務 Service 介面
 * 
 * 定義歸檔任務業務邏輯層的標準介面，包含業務操作和驗證邏輯。
 * 此介面確保業務邏輯的一致性和可測試性。
 * 
 * @interface IArchiveTaskService
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 實作範例
 * class ArchiveTaskService implements IArchiveTaskService {
 *   constructor(private repository: IArchiveTaskRepository) {}
 *   
 *   async createTask(request: CreateArchiveTaskRequest): Promise<ArchiveTaskModel> {
 *     // 驗證請求資料
 *     this.validateCreateRequest(request);
 *     
 *     // 生成批次ID
 *     const batchId = this.generateBatchId(request.jobType);
 *     
 *     // 創建任務
 *     return await this.repository.create({
 *       ...request,
 *       batch_id: batchId,
 *       status: ArchiveTaskStatus.PENDING
 *     });
 *   }
 *   // ... 其他方法實作
 * }
 * ```
 */
export interface IArchiveTaskService {
    /**
     * 創建新的歸檔任務
     * 
     * @param request - 歸檔任務創建請求
     * @returns Promise<ArchiveTaskModel> 創建的歸檔任務
     * @throws {Error} 當請求資料無效或創建失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const task = await service.createTask({
     *   jobType: ArchiveJobType.POSITIONS,
     *   tableName: 'drone_positions',
     *   archiveTableName: 'drone_positions_archive',
     *   dateRangeStart: new Date('2025-07-01'),
     *   dateRangeEnd: new Date('2025-07-28'),
     *   createdBy: 'system'
     * });
     * ```
     */
    createTask(request: CreateArchiveTaskRequest): Promise<ArchiveTaskModel>;

    /**
     * 批次創建歸檔任務
     * 
     * @param requests - 歸檔任務創建請求列表
     * @returns Promise<BatchArchiveResult> 批次創建結果
     * @throws {Error} 當批次創建失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const result = await service.createBatchTasks([
     *   { jobType: ArchiveJobType.POSITIONS, ... },
     *   { jobType: ArchiveJobType.COMMANDS, ... }
     * ]);
     * console.log(`成功創建 ${result.successCount} 個任務`);
     * ```
     */
    createBatchTasks(requests: CreateArchiveTaskRequest[]): Promise<BatchArchiveResult>;

    /**
     * 根據 ID 獲取歸檔任務
     * 
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskModel | null> 歸檔任務或 null
     * 
     * @example
     * ```typescript
     * const task = await service.getTaskById(123);
     * if (task) {
     *   console.log(`任務進度: ${task.getProgressPercentage()}%`);
     * }
     * ```
     */
    getTaskById(id: number): Promise<ArchiveTaskModel | null>;

    /**
     * 獲取所有歸檔任務
     * 
     * @param options - 查詢選項
     * @returns Promise<ArchiveTaskModel[]> 歸檔任務列表
     * 
     * @example
     * ```typescript
     * const activeTasks = await service.getAllTasks({
     *   status: ArchiveTaskStatus.RUNNING,
     *   limit: 10
     * });
     * ```
     */
    getAllTasks(options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]>;

    /**
     * 根據狀態獲取歸檔任務
     * 
     * @param status - 任務狀態
     * @param limit - 限制數量（可選）
     * @returns Promise<ArchiveTaskModel[]> 指定狀態的歸檔任務列表
     * 
     * @example
     * ```typescript
     * const pendingTasks = await service.getTasksByStatus(ArchiveTaskStatus.PENDING);
     * ```
     */
    getTasksByStatus(status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]>;

    /**
     * 根據批次 ID 獲取歸檔任務
     * 
     * @param batchId - 批次 ID
     * @returns Promise<ArchiveTaskModel[]> 該批次的歸檔任務列表
     * 
     * @example
     * ```typescript
     * const batchTasks = await service.getTasksByBatchId('POS_BATCH_20250729_001');
     * ```
     */
    getTasksByBatchId(batchId: string): Promise<ArchiveTaskModel[]>;

    /**
     * 開始執行歸檔任務
     * 
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskExecutionResult> 執行結果
     * @throws {Error} 當任務執行失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const result = await service.executeTask(123);
     * console.log(`歸檔了 ${result.archivedRecords} 筆記錄`);
     * ```
     */
    executeTask(id: number): Promise<ArchiveTaskExecutionResult>;

    /**
     * 批次執行歸檔任務
     * 
     * @param ids - 任務 ID 列表
     * @returns Promise<ArchiveTaskExecutionResult[]> 執行結果列表
     * @throws {Error} 當批次執行失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const results = await service.executeBatchTasks([1, 2, 3]);
     * const totalArchived = results.reduce((sum, r) => sum + r.archivedRecords, 0);
     * ```
     */
    executeBatchTasks(ids: number[]): Promise<ArchiveTaskExecutionResult[]>;

    /**
     * 取消歸檔任務
     * 
     * @param id - 任務 ID
     * @param reason - 取消原因
     * @returns Promise<ArchiveTaskModel> 更新後的任務
     * @throws {Error} 當取消失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const cancelledTask = await service.cancelTask(123, '手動取消');
     * ```
     */
    cancelTask(id: number, reason: string): Promise<ArchiveTaskModel>;

    /**
     * 重試失敗的歸檔任務
     * 
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskExecutionResult> 重試執行結果
     * @throws {Error} 當重試失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const result = await service.retryTask(123);
     * console.log(`重試結果: ${result.status}`);
     * ```
     */
    retryTask(id: number): Promise<ArchiveTaskExecutionResult>;

    /**
     * 更新任務進度
     * 
     * @param id - 任務 ID
     * @param archivedCount - 已歸檔記錄數
     * @returns Promise<ArchiveTaskModel> 更新後的任務
     * @throws {Error} 當更新失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const updatedTask = await service.updateTaskProgress(123, 2500);
     * console.log(`進度: ${updatedTask.getProgressPercentage()}%`);
     * ```
     */
    updateTaskProgress(id: number, archivedCount: number): Promise<ArchiveTaskModel>;

    /**
     * 標記任務為完成
     * 
     * @param id - 任務 ID
     * @param finalCount - 最終歸檔記錄數
     * @returns Promise<ArchiveTaskModel> 完成的任務
     * @throws {Error} 當標記失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const completedTask = await service.completeTask(123, 5000);
     * ```
     */
    completeTask(id: number, finalCount: number): Promise<ArchiveTaskModel>;

    /**
     * 標記任務為失敗
     * 
     * @param id - 任務 ID
     * @param errorMessage - 錯誤訊息
     * @returns Promise<ArchiveTaskModel> 失敗的任務
     * @throws {Error} 當標記失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const failedTask = await service.failTask(123, '資料庫連接失敗');
     * ```
     */
    failTask(id: number, errorMessage: string): Promise<ArchiveTaskModel>;

    /**
     * 獲取歸檔任務統計資訊
     * 
     * @returns Promise<ArchiveTaskStatistics> 統計資訊
     * 
     * @example
     * ```typescript
     * const stats = await service.getTaskStatistics();
     * console.log(`總任務數: ${stats.totalTasks}`);
     * console.log(`執行中: ${stats.runningTasks}`);
     * ```
     */
    getTaskStatistics(): Promise<ArchiveTaskStatistics>;

    /**
     * 清理舊的歸檔任務記錄
     * 
     * @param daysOld - 保留天數
     * @param status - 要清理的任務狀態（可選）
     * @returns Promise<number> 清理的任務數量
     * 
     * @example
     * ```typescript
     * // 清理 30 天前的已完成任務
     * const cleanedCount = await service.cleanupOldTasks(30, ArchiveTaskStatus.COMPLETED);
     * ```
     */
    cleanupOldTasks(daysOld: number, status?: ArchiveTaskStatus): Promise<number>;

    /**
     * 驗證歸檔任務請求
     * 
     * @param request - 創建請求
     * @throws {Error} 當驗證失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * try {
     *   service.validateCreateRequest(request);
     *   // 請求有效，繼續處理
     * } catch (error) {
     *   console.error('請求驗證失敗:', error.message);
     * }
     * ```
     */
    validateCreateRequest(request: CreateArchiveTaskRequest): void;

    /**
     * 生成批次 ID
     * 
     * @param jobType - 任務類型
     * @returns string 生成的批次 ID
     * 
     * @example
     * ```typescript
     * const batchId = service.generateBatchId(ArchiveJobType.POSITIONS);
     * // 返回: "POS_BATCH_20250729_001"
     * ```
     */
    generateBatchId(jobType: ArchiveJobType): string;

    /**
     * 檢查任務是否可以執行
     * 
     * @param id - 任務 ID
     * @returns Promise<boolean> 是否可以執行
     * 
     * @example
     * ```typescript
     * const canExecute = await service.canExecuteTask(123);
     * if (canExecute) {
     *   await service.executeTask(123);
     * }
     * ```
     */
    canExecuteTask(id: number): Promise<boolean>;

    /**
     * 檢查任務是否可以取消
     * 
     * @param id - 任務 ID
     * @returns Promise<boolean> 是否可以取消
     * 
     * @example
     * ```typescript
     * const canCancel = await service.canCancelTask(123);
     * if (canCancel) {
     *   await service.cancelTask(123, '用戶要求');
     * }
     * ```
     */
    canCancelTask(id: number): Promise<boolean>;
}
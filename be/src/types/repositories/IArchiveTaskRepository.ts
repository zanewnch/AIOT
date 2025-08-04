/**
 * @fileoverview 歸檔任務 Repository 介面定義
 * 
 * 此文件定義了歸檔任務資料存取層的介面規範，
 * 提供歸檔任務相關的資料庫操作方法定義。
 * 
 * @module IArchiveTaskRepository
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

/**
 * 歸檔任務查詢選項介面
 * 
 * 定義查詢歸檔任務時可使用的篩選和排序選項
 * 
 * @interface ArchiveTaskQueryOptions
 * @since 1.0.0
 */
export interface ArchiveTaskQueryOptions {
    /** 任務類型篩選 */
    jobType?: ArchiveJobType;
    /** 任務狀態篩選 */
    status?: ArchiveTaskStatus;
    /** 批次ID篩選 */
    batchId?: string;
    /** 創建者篩選 */
    createdBy?: string;
    /** 開始日期範圍 */
    dateRangeStart?: Date;
    /** 結束日期範圍 */
    dateRangeEnd?: Date;
    /** 排序欄位 */
    sortBy?: keyof ArchiveTaskAttributes;
    /** 排序順序 */
    sortOrder?: 'ASC' | 'DESC';
    /** 分頁限制 */
    limit?: number;
    /** 分頁偏移 */
    offset?: number;
}

/**
 * 歸檔任務 Repository 介面
 * 
 * 定義歸檔任務資料存取層的標準介面，包含 CRUD 操作和查詢方法。
 * 此介面確保資料存取的一致性和可測試性。
 * 
 * @interface IArchiveTaskRepository
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 實作範例
 * class ArchiveTaskRepository implements IArchiveTaskRepository {
 *   async create(data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel> {
 *     return await ArchiveTaskModel.create(data);
 *   }
 *   
 *   async findById(id: number): Promise<ArchiveTaskModel | null> {
 *     return await ArchiveTaskModel.findByPk(id);
 *   }
 *   // ... 其他方法實作
 * }
 * ```
 */
export interface IArchiveTaskRepository {
    /**
     * 創建新的歸檔任務
     * 
     * @param data - 歸檔任務創建資料
     * @returns Promise<ArchiveTaskModel> 創建的歸檔任務實例
     * @throws {Error} 當創建失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const newTask = await repository.create({
     *   job_type: ArchiveJobType.POSITIONS,
     *   table_name: 'drone_positions',
     *   archive_table_name: 'drone_positions_archive',
     *   date_range_start: new Date('2025-07-01'),
     *   date_range_end: new Date('2025-07-28'),
     *   batch_id: 'POS_BATCH_20250729_001',
     *   created_by: 'system'
     * });
     * ```
     */
    create(data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel>;

    /**
     * 根據 ID 查找歸檔任務
     * 
     * @param id - 歸檔任務 ID
     * @returns Promise<ArchiveTaskModel | null> 找到的歸檔任務或 null
     * 
     * @example
     * ```typescript
     * const task = await repository.findById(123);
     * if (task) {
     *   console.log(`任務狀態: ${task.status}`);
     * }
     * ```
     */
    findById(id: number): Promise<ArchiveTaskModel | null>;

    /**
     * 查找所有歸檔任務
     * 
     * @param options - 查詢選項
     * @returns Promise<ArchiveTaskModel[]> 歸檔任務列表
     * 
     * @example
     * ```typescript
     * // 查找所有執行中的任務
     * const runningTasks = await repository.findAll({
     *   status: ArchiveTaskStatus.RUNNING,
     *   sortBy: 'started_at',
     *   sortOrder: 'ASC'
     * });
     * ```
     */
    findAll(options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]>;

    /**
     * 根據批次 ID 查找歸檔任務
     * 
     * @param batchId - 批次 ID
     * @returns Promise<ArchiveTaskModel[]> 該批次的歸檔任務列表
     * 
     * @example
     * ```typescript
     * const batchTasks = await repository.findByBatchId('POS_BATCH_20250729_001');
     * console.log(`批次包含 ${batchTasks.length} 個任務`);
     * ```
     */
    findByBatchId(batchId: string): Promise<ArchiveTaskModel[]>;

    /**
     * 根據狀態查找歸檔任務
     * 
     * @param status - 任務狀態
     * @param limit - 限制返回數量（可選）
     * @returns Promise<ArchiveTaskModel[]> 指定狀態的歸檔任務列表
     * 
     * @example
     * ```typescript
     * // 查找最近 10 個失敗的任務
     * const failedTasks = await repository.findByStatus(ArchiveTaskStatus.FAILED, 10);
     * ```
     */
    findByStatus(status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]>;

    /**
     * 根據任務類型查找歸檔任務
     * 
     * @param jobType - 任務類型
     * @param options - 額外查詢選項
     * @returns Promise<ArchiveTaskModel[]> 指定類型的歸檔任務列表
     * 
     * @example
     * ```typescript
     * // 查找所有位置資料歸檔任務
     * const posTasks = await repository.findByJobType(ArchiveJobType.POSITIONS, {
     *   status: ArchiveTaskStatus.COMPLETED,
     *   limit: 50
     * });
     * ```
     */
    findByJobType(jobType: ArchiveJobType, options?: Partial<ArchiveTaskQueryOptions>): Promise<ArchiveTaskModel[]>;

    /**
     * 根據創建者查找歸檔任務
     * 
     * @param createdBy - 創建者
     * @param options - 額外查詢選項
     * @returns Promise<ArchiveTaskModel[]> 該創建者的歸檔任務列表
     * 
     * @example
     * ```typescript
     * // 查找用戶創建的任務
     * const userTasks = await repository.findByCreatedBy('user_123');
     * ```
     */
    findByCreatedBy(createdBy: string, options?: Partial<ArchiveTaskQueryOptions>): Promise<ArchiveTaskModel[]>;

    /**
     * 根據日期範圍查找歸檔任務
     * 
     * @param startDate - 開始日期
     * @param endDate - 結束日期
     * @param options - 額外查詢選項
     * @returns Promise<ArchiveTaskModel[]> 指定日期範圍內的歸檔任務列表
     * 
     * @example
     * ```typescript
     * // 查找本週創建的任務
     * const weekTasks = await repository.findByDateRange(
     *   new Date('2025-07-28'),
     *   new Date('2025-08-04')
     * );
     * ```
     */
    findByDateRange(startDate: Date, endDate: Date, options?: Partial<ArchiveTaskQueryOptions>): Promise<ArchiveTaskModel[]>;

    /**
     * 更新歸檔任務
     * 
     * @param id - 歸檔任務 ID
     * @param data - 更新資料
     * @returns Promise<ArchiveTaskModel | null> 更新後的歸檔任務或 null
     * @throws {Error} 當更新失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const updatedTask = await repository.update(123, {
     *   status: ArchiveTaskStatus.RUNNING,
     *   started_at: new Date(),
     *   total_records: 5000
     * });
     * ```
     */
    update(id: number, data: Partial<ArchiveTaskAttributes>): Promise<ArchiveTaskModel | null>;

    /**
     * 刪除歸檔任務
     * 
     * @param id - 歸檔任務 ID
     * @returns Promise<boolean> 是否成功刪除
     * @throws {Error} 當刪除失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const isDeleted = await repository.delete(123);
     * console.log(`任務刪除${isDeleted ? '成功' : '失敗'}`);
     * ```
     */
    delete(id: number): Promise<boolean>;

    /**
     * 統計歸檔任務數量
     * 
     * @param options - 查詢選項
     * @returns Promise<number> 符合條件的任務數量
     * 
     * @example
     * ```typescript
     * // 統計待執行的任務數量
     * const pendingCount = await repository.count({
     *   status: ArchiveTaskStatus.PENDING
     * });
     * ```
     */
    count(options?: ArchiveTaskQueryOptions): Promise<number>;

    /**
     * 批量更新歸檔任務狀態
     * 
     * @param ids - 任務 ID 列表
     * @param status - 新狀態
     * @param additionalData - 額外更新資料
     * @returns Promise<number> 更新的任務數量
     * @throws {Error} 當批量更新失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 批量取消待執行的任務
     * const updatedCount = await repository.bulkUpdateStatus(
     *   [1, 2, 3, 4],
     *   ArchiveTaskStatus.FAILED,
     *   { error_message: '手動取消', completed_at: new Date() }
     * );
     * ```
     */
    bulkUpdateStatus(
        ids: number[], 
        status: ArchiveTaskStatus, 
        additionalData?: Partial<ArchiveTaskAttributes>
    ): Promise<number>;

    /**
     * 清理舊的歸檔任務記錄
     * 
     * @param daysOld - 保留天數
     * @param status - 要清理的任務狀態（可選）
     * @returns Promise<number> 清理的任務數量
     * @throws {Error} 當清理失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 清理 30 天前的已完成任務
     * const cleanedCount = await repository.cleanup(30, ArchiveTaskStatus.COMPLETED);
     * console.log(`清理了 ${cleanedCount} 個舊任務`);
     * ```
     */
    cleanup(daysOld: number, status?: ArchiveTaskStatus): Promise<number>;
}
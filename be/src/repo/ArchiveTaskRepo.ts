/**
 * @fileoverview 歸檔任務 Repository 實作
 *
 * 此文件實作了歸檔任務資料存取層，
 * 提供歸檔任務相關的資料庫操作實作。
 *
 * @module ArchiveTaskRepository
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Op, WhereOptions, OrderItem } from 'sequelize';
import {
    ArchiveTaskModel,
    ArchiveTaskAttributes,
    ArchiveTaskCreationAttributes,
    ArchiveJobType,
    ArchiveTaskStatus
} from '../models/drone/ArchiveTaskModel.js';
import {
    IArchiveTaskRepository,
    ArchiveTaskQueryOptions
} from '../types/repositories/IArchiveTaskRepository.js';
import { createLogger } from '../configs/loggerConfig.js';

/**
 * 歸檔任務 Repository 實作類別
 *
 * 實作 IArchiveTaskRepository 介面，提供歸檔任務的資料存取功能。
 * 包含 CRUD 操作、查詢、統計等功能的具體實作。
 *
 * @class ArchiveTaskRepository
 * @implements {IArchiveTaskRepository}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const repository = new ArchiveTaskRepository();
 *
 * // 創建新任務
 * const task = await repository.create({
 *   job_type: ArchiveJobType.POSITIONS,
 *   table_name: 'drone_positions',
 *   archive_table_name: 'drone_positions_archive',
 *   date_range_start: new Date('2025-07-01'),
 *   date_range_end: new Date('2025-07-28'),
 *   batch_id: 'POS_BATCH_20250729_001',
 *   created_by: 'system'
 * });
 *
 * // 查詢任務
 * const runningTasks = await repository.findByStatus(ArchiveTaskStatus.RUNNING);
 * ```
 */
export class ArchiveTaskRepository implements IArchiveTaskRepository {
    private readonly logger = createLogger('ArchiveTaskRepository');

    /**
     * 創建新的歸檔任務
     *
     * @param data - 歸檔任務創建資料
     * @returns Promise<ArchiveTaskModel> 創建的歸檔任務實例
     * @throws {Error} 當創建失敗時拋出錯誤
     */
    async create(data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel> {
        try {
            this.logger.info('創建新的歸檔任務', {
                jobType: data.job_type,
                tableName: data.table_name,
                batchId: data.batch_id
            });

            const task = await ArchiveTaskModel.create(data);

            this.logger.info('歸檔任務創建成功', {
                taskId: task.id,
                batchId: task.batch_id
            });

            return task;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('歸檔任務創建失敗', { error: errorMessage, data });
            throw new Error(`創建歸檔任務失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據 ID 查找歸檔任務
     *
     * @param id - 歸檔任務 ID
     * @returns Promise<ArchiveTaskModel | null> 找到的歸檔任務或 null
     */
    async findById(id: number): Promise<ArchiveTaskModel | null> {
        try {
            this.logger.debug('根據 ID 查找歸檔任務', { taskId: id });

            const task = await ArchiveTaskModel.findByPk(id);

            if (task) {
                this.logger.debug('歸檔任務查找成功', {
                    taskId: id,
                    status: task.status,
                    jobType: task.job_type
                });
            } else {
                this.logger.debug('未找到指定的歸檔任務', { taskId: id });
            }

            return task;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('查找歸檔任務失敗', { taskId: id, error: errorMessage });
            throw new Error(`查找歸檔任務失敗: ${errorMessage}`);
        }
    }

    /**
     * 查找所有歸檔任務
     *
     * @param options - 查詢選項
     * @returns Promise<ArchiveTaskModel[]> 歸檔任務列表
     */
    async findAll(options: ArchiveTaskQueryOptions = {}): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('查找所有歸檔任務', { options });

            const where: WhereOptions = this.buildWhereClause(options);
            const order: OrderItem[] = this.buildOrderClause(options);

            const queryOptions: any = {
                where,
                order,
                limit: options.limit,
                offset: options.offset
            };

            const tasks = await ArchiveTaskModel.findAll(queryOptions);

            this.logger.debug('歸檔任務查找完成', {
                count: tasks.length,
                options
            });

            return tasks;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('查找歸檔任務失敗', { options, error: errorMessage });
            throw new Error(`查找歸檔任務失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據批次 ID 查找歸檔任務
     *
     * @param batchId - 批次 ID
     * @returns Promise<ArchiveTaskModel[]> 該批次的歸檔任務列表
     */
    async findByBatchId(batchId: string): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據批次 ID 查找歸檔任務', { batchId });

            const tasks = await ArchiveTaskModel.findAll({
                where: { batch_id: batchId },
                order: [['createdAt', 'ASC']]
            });

            this.logger.debug('批次歸檔任務查找完成', {
                batchId,
                count: tasks.length
            });

            return tasks;
        } catch (error) {
            this.logger.error('根據批次 ID 查找歸檔任務失敗', {
                batchId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`根據批次 ID 查找歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據狀態查找歸檔任務
     *
     * @param status - 任務狀態
     * @param limit - 限制返回數量（可選）
     * @returns Promise<ArchiveTaskModel[]> 指定狀態的歸檔任務列表
     */
    async findByStatus(status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據狀態查找歸檔任務', { status, limit });

            const queryOptions: any = {
                where: { status },
                order: [['createdAt', 'DESC']]
            };

            if (limit) {
                queryOptions.limit = limit;
            }

            const tasks = await ArchiveTaskModel.findAll(queryOptions);

            this.logger.debug('狀態歸檔任務查找完成', {
                status,
                count: tasks.length,
                limit
            });

            return tasks;
        } catch (error) {
            this.logger.error('根據狀態查找歸檔任務失敗', {
                status,
                limit,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`根據狀態查找歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據任務類型查找歸檔任務
     *
     * @param jobType - 任務類型
     * @param options - 額外查詢選項
     * @returns Promise<ArchiveTaskModel[]> 指定類型的歸檔任務列表
     */
    async findByJobType(jobType: ArchiveJobType, options: Partial<ArchiveTaskQueryOptions> = {}): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據任務類型查找歸檔任務', { jobType, options });

            const fullOptions: ArchiveTaskQueryOptions = {
                ...options,
                jobType
            };

            return await this.findAll(fullOptions);
        } catch (error) {
            this.logger.error('根據任務類型查找歸檔任務失敗', {
                jobType,
                options,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`根據任務類型查找歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據創建者查找歸檔任務
     *
     * @param createdBy - 創建者
     * @param options - 額外查詢選項
     * @returns Promise<ArchiveTaskModel[]> 該創建者的歸檔任務列表
     */
    async findByCreatedBy(createdBy: string, options: Partial<ArchiveTaskQueryOptions> = {}): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據創建者查找歸檔任務', { createdBy, options });

            const fullOptions: ArchiveTaskQueryOptions = {
                ...options,
                createdBy
            };

            return await this.findAll(fullOptions);
        } catch (error) {
            this.logger.error('根據創建者查找歸檔任務失敗', {
                createdBy,
                options,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`根據創建者查找歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據日期範圍查找歸檔任務
     *
     * @param startDate - 開始日期
     * @param endDate - 結束日期
     * @param options - 額外查詢選項
     * @returns Promise<ArchiveTaskModel[]> 指定日期範圍內的歸檔任務列表
     */
    async findByDateRange(startDate: Date, endDate: Date, options: Partial<ArchiveTaskQueryOptions> = {}): Promise<ArchiveTaskModel[]> {
        try {
            this.logger.debug('根據日期範圍查找歸檔任務', { startDate, endDate, options });

            const fullOptions: ArchiveTaskQueryOptions = {
                ...options,
                dateRangeStart: startDate,
                dateRangeEnd: endDate
            };

            return await this.findAll(fullOptions);
        } catch (error) {
            this.logger.error('根據日期範圍查找歸檔任務失敗', {
                startDate,
                endDate,
                options,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`根據日期範圍查找歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 更新歸檔任務
     *
     * @param id - 歸檔任務 ID
     * @param data - 更新資料
     * @returns Promise<ArchiveTaskModel | null> 更新後的歸檔任務或 null
     * @throws {Error} 當更新失敗時拋出錯誤
     */
    async update(id: number, data: Partial<ArchiveTaskAttributes>): Promise<ArchiveTaskModel | null> {
        try {
            this.logger.info('更新歸檔任務', { taskId: id, updateData: data });

            const task = await this.findById(id);
            if (!task) {
                this.logger.warn('嘗試更新不存在的歸檔任務', { taskId: id });
                return null;
            }

            const updatedTask = await task.update(data);

            this.logger.info('歸檔任務更新成功', {
                taskId: id,
                updatedFields: Object.keys(data)
            });

            return updatedTask;
        } catch (error) {
            this.logger.error('更新歸檔任務失敗', {
                taskId: id,
                updateData: data,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`更新歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 刪除歸檔任務
     *
     * @param id - 歸檔任務 ID
     * @returns Promise<boolean> 是否成功刪除
     * @throws {Error} 當刪除失敗時拋出錯誤
     */
    async delete(id: number): Promise<boolean> {
        try {
            this.logger.info('刪除歸檔任務', { taskId: id });

            const task = await this.findById(id);
            if (!task) {
                this.logger.warn('嘗試刪除不存在的歸檔任務', { taskId: id });
                return false;
            }

            await task.destroy();

            this.logger.info('歸檔任務刪除成功', { taskId: id });
            return true;
        } catch (error) {
            this.logger.error('刪除歸檔任務失敗', {
                taskId: id,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`刪除歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 統計歸檔任務數量
     *
     * @param options - 查詢選項
     * @returns Promise<number> 符合條件的任務數量
     */
    async count(options: ArchiveTaskQueryOptions = {}): Promise<number> {
        try {
            this.logger.debug('統計歸檔任務數量', { options });

            const where: WhereOptions = this.buildWhereClause(options);

            const count = await ArchiveTaskModel.count({ where });

            this.logger.debug('歸檔任務統計完成', { count, options });

            return count;
        } catch (error) {
            this.logger.error('統計歸檔任務數量失敗', {
                options,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`統計歸檔任務數量失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 批量更新歸檔任務狀態
     *
     * @param ids - 任務 ID 列表
     * @param status - 新狀態
     * @param additionalData - 額外更新資料
     * @returns Promise<number> 更新的任務數量
     * @throws {Error} 當批量更新失敗時拋出錯誤
     */
    async bulkUpdateStatus(
        ids: number[],
        status: ArchiveTaskStatus,
        additionalData: Partial<ArchiveTaskAttributes> = {}
    ): Promise<number> {
        try {
            this.logger.info('批量更新歸檔任務狀態', {
                taskIds: ids,
                newStatus: status,
                additionalData
            });

            const updateData = {
                status,
                ...additionalData
            };

            const [affectedCount] = await ArchiveTaskModel.update(updateData, {
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            });

            this.logger.info('批量更新歸檔任務狀態完成', {
                requestedCount: ids.length,
                affectedCount,
                newStatus: status
            });

            return affectedCount;
        } catch (error) {
            this.logger.error('批量更新歸檔任務狀態失敗', {
                taskIds: ids,
                newStatus: status,
                additionalData,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`批量更新歸檔任務狀態失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 清理舊的歸檔任務記錄
     *
     * @param daysOld - 保留天數
     * @param status - 要清理的任務狀態（可選）
     * @returns Promise<number> 清理的任務數量
     * @throws {Error} 當清理失敗時拋出錯誤
     */
    async cleanup(daysOld: number, status?: ArchiveTaskStatus): Promise<number> {
        try {
            this.logger.info('開始清理舊的歸檔任務記錄', { daysOld, status });

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const where: WhereOptions = {
                createdAt: {
                    [Op.lt]: cutoffDate
                }
            };

            if (status) {
                where.status = status;
            }

            const deletedCount = await ArchiveTaskModel.destroy({ where });

            this.logger.info('舊歸檔任務記錄清理完成', {
                daysOld,
                status,
                deletedCount,
                cutoffDate
            });

            return deletedCount;
        } catch (error) {
            this.logger.error('清理舊歸檔任務記錄失敗', {
                daysOld,
                status,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`清理舊歸檔任務記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 建構 WHERE 子句
     *
     * @private
     * @param options - 查詢選項
     * @returns WhereOptions Sequelize WHERE 子句
     */
    private buildWhereClause(options: ArchiveTaskQueryOptions): WhereOptions {
        const where: WhereOptions = {};

        if (options.jobType) {
            where.job_type = options.jobType;
        }

        if (options.status) {
            where.status = options.status;
        }

        if (options.batchId) {
            where.batch_id = options.batchId;
        }

        if (options.createdBy) {
            where.created_by = options.createdBy;
        }

        if (options.dateRangeStart || options.dateRangeEnd) {
            const dateRange: any = {};

            if (options.dateRangeStart) {
                dateRange[Op.gte] = options.dateRangeStart;
            }

            if (options.dateRangeEnd) {
                dateRange[Op.lte] = options.dateRangeEnd;
            }

            where.createdAt = dateRange;
        }

        return where;
    }

    /**
     * 建構 ORDER BY 子句
     *
     * @private
     * @param options - 查詢選項
     * @returns OrderItem[] Sequelize ORDER BY 子句
     */
    private buildOrderClause(options: ArchiveTaskQueryOptions): OrderItem[] {
        const order: OrderItem[] = [];

        if (options.sortBy) {
            const sortOrder = options.sortOrder || 'DESC';
            order.push([options.sortBy, sortOrder]);
        } else {
            // 預設按創建時間降序排列
            order.push(['createdAt', 'DESC']);
        }

        return order;
    }
}
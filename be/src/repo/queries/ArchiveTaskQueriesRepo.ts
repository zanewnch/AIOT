/**
 * @fileoverview 歸檔任務查詢 Repository - CQRS 查詢端
 *
 * 專門處理歸檔任務資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import { Op, WhereOptions, OrderItem } from 'sequelize';
import {
    ArchiveTaskModel,
    ArchiveTaskAttributes,
    ArchiveJobType,
    ArchiveTaskStatus
} from '../../models/drone/ArchiveTaskModel.js';
import {
    ArchiveTaskQueryOptions
} from '../../types/repositories/IArchiveTaskRepository.js';
import { createLogger } from '../../configs/loggerConfig.js';

/**
 * 歸檔任務查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理歸檔任務資料的查詢操作，遵循 CQRS 模式
 *
 * @class ArchiveTaskQueriesRepository
 */
export class ArchiveTaskQueriesRepository {
    private readonly logger = createLogger('ArchiveTaskQueriesRepository');

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
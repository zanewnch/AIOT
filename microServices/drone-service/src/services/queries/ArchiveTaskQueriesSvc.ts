/**
 * @fileoverview 歸檔任務查詢 Service 實作
 *
 * 此文件實作了歸檔任務查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module ArchiveTaskQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    ArchiveTaskModel,
    ArchiveTaskStatus,
    ArchiveJobType
} from '../../models/ArchiveTaskModel.js';
import type {
    ArchiveTaskStatistics
} from '../../types/services/IArchiveTaskService.js';
import type {
    IArchiveTaskRepository,
    ArchiveTaskQueryOptions
} from '../../types/repositories/IArchiveTaskRepository.js';
import { ArchiveTaskQueriesRepository } from '../../repo/queries/ArchiveTaskQueriesRepo.js';
import { ArchiveTaskCommandsRepository } from '../../repo/commands/ArchiveTaskCommandsRepo.js';
import { TYPES } from '../../container/types.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

/**
 * 歸檔任務查詢 Service 實作類別
 *
 * 專門處理歸檔任務相關的查詢請求，包含取得任務資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class ArchiveTaskQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class ArchiveTaskQueriesSvc {
    private readonly logger = createLogger('ArchiveTaskQueriesSvc');
    private readonly queriesRepository: ArchiveTaskQueriesRepository;
    private readonly commandsRepository: ArchiveTaskCommandsRepository;
    private readonly repository: IArchiveTaskRepository; // 組合介面

    constructor(
        @inject(TYPES.ArchiveTaskQueriesRepository) queriesRepository: ArchiveTaskQueriesRepository,
        @inject(TYPES.ArchiveTaskCommandsRepository) commandsRepository: ArchiveTaskCommandsRepository
    ) {
        this.queriesRepository = queriesRepository;
        this.commandsRepository = commandsRepository;
        
        // 創建組合repository
        this.repository = Object.assign(
            Object.create(Object.getPrototypeOf(this.queriesRepository)),
            this.queriesRepository,
            this.commandsRepository
        ) as IArchiveTaskRepository;
    }

    /**
     * 根據 ID 獲取歸檔任務
     *
     * @param id - 任務 ID
     * @returns Promise<ArchiveTaskModel | null> 歸檔任務或 null
     */
    getTaskById = async (id: number): Promise<ArchiveTaskModel | null> => {
        try {
            this.logger.debug('根據 ID 獲取歸檔任務', { taskId: id });
            return await this.repository.findById(id);
        } catch (error) {
            this.logger.error('獲取歸檔任務失敗', { taskId: id, error: (error as Error).message });
            throw error;
        }
    }

    /**
     * 獲取所有歸檔任務
     *
     * @param options - 查詢選項
     * @returns Promise<ArchiveTaskModel[]> 歸檔任務列表
     */
    getAllTasks = async (options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]> => {
        try {
            this.logger.debug('獲取所有歸檔任務', { options });
            return await this.repository.findAll(options);
        } catch (error) {
            this.logger.error('獲取歸檔任務列表失敗', { options, error: (error as Error).message });
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
    getTasksByStatus = async (status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]> => {
        try {
            this.logger.debug('根據狀態獲取歸檔任務', { status, limit });
            return await this.repository.findByStatus(status, limit);
        } catch (error) {
            this.logger.error('根據狀態獲取歸檔任務失敗', {
                status,
                limit,
                error: (error as Error).message
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
    getTasksByBatchId = async (batchId: string): Promise<ArchiveTaskModel[]> => {
        try {
            this.logger.debug('根據批次 ID 獲取歸檔任務', { batchId });
            return await this.repository.findByBatchId(batchId);
        } catch (error) {
            this.logger.error('根據批次 ID 獲取歸檔任務失敗', {
                batchId,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * 獲取歸檔任務統計資訊
     *
     * @returns Promise<ArchiveTaskStatistics> 統計資訊
     */
    getTaskStatistics = async (): Promise<ArchiveTaskStatistics> => {
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
                this.repository.count({ jobType: 'POSITIONS' as any }),
                this.repository.count({ jobType: 'COMMANDS' as any }),
                this.repository.count({ jobType: 'STATUS' as any })
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
            this.logger.error('獲取歸檔任務統計資訊失敗', { error: (error as Error).message });
            throw error;
        }
    }

    /**
     * 檢查任務是否可以執行
     *
     * @param id - 任務 ID
     * @returns Promise<boolean> 是否可以執行
     */
    canExecuteTask = async (id: number): Promise<boolean> => {
        try {
            const task = await this.getTaskById(id);
            if (!task) {
                return false;
            }

            return task.status === ArchiveTaskStatus.PENDING;
        } catch (error) {
            this.logger.error('檢查任務執行權限失敗', { taskId: id, error: (error as Error).message });
            return false;
        }
    }

    /**
     * 檢查任務是否可以取消
     *
     * @param id - 任務 ID
     * @returns Promise<boolean> 是否可以取消
     */
    canCancelTask = async (id: number): Promise<boolean> => {
        try {
            const task = await this.getTaskById(id);
            if (!task) {
                return false;
            }

            return task.status === ArchiveTaskStatus.PENDING ||
                task.status === ArchiveTaskStatus.RUNNING;
        } catch (error) {
            this.logger.error('檢查任務取消權限失敗', { taskId: id, error: (error as Error).message });
            return false;
        }
    }
}
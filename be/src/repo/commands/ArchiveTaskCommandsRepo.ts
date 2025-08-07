/**
 * @fileoverview 歸檔任務命令 Repository - CQRS 命令端
 *
 * 專門處理歸檔任務資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import {
    ArchiveTaskModel,
    ArchiveTaskAttributes,
    ArchiveTaskCreationAttributes,
    ArchiveTaskStatus
} from '../../models/drone/ArchiveTaskModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

/**
 * 歸檔任務命令 Repository 實現類別 - CQRS 命令端
 *
 * 專門處理歸檔任務資料的寫入操作，遵循 CQRS 模式
 *
 * @class ArchiveTaskCommandsRepository
 */
@injectable()
export class ArchiveTaskCommandsRepository {
    private readonly logger = createLogger('ArchiveTaskCommandsRepository');

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

            const [updatedRowsCount] = await ArchiveTaskModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const task = await ArchiveTaskModel.findByPk(id);
                if (task) {
                    this.logger.info('歸檔任務更新成功', {
                        taskId: id,
                        updatedFields: Object.keys(data)
                    });
                    return task;
                }
            }

            this.logger.warn('嘗試更新不存在的歸檔任務', { taskId: id });
            return null;
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

            const deletedRowsCount = await ArchiveTaskModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                this.logger.info('歸檔任務刪除成功', { taskId: id });
            } else {
                this.logger.warn('嘗試刪除不存在的歸檔任務', { taskId: id });
            }

            return success;
        } catch (error) {
            this.logger.error('刪除歸檔任務失敗', {
                taskId: id,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`刪除歸檔任務失敗: ${error instanceof Error ? error.message : String(error)}`);
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

            const where: any = {
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
}
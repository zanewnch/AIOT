/**
 * @fileoverview 無人機狀態歷史命令 Service 實現
 *
 * 此文件實作了無人機狀態歷史命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneStatusArchiveCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusArchiveCommandsRepository } from '../../repo/commands/DroneStatusArchiveCommandsRepo.js';
import { DroneStatusArchiveQueriesRepository } from '../../repo/queries/DroneStatusArchiveQueriesRepo.js';
import type { DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes } from '../../models/DroneStatusArchiveModel.js';
import { DroneStatus } from '../../models/DroneStatusModel.js';
import type { IDroneStatusArchiveRepository } from '../../types/repositories/IDroneStatusArchiveRepository.js';
import { DroneStatusArchiveQueriesSvc } from '../queries/DroneStatusArchiveQueriesSvc.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneStatusArchiveCommandsSvc');

/**
 * 無人機狀態歷史命令 Service 實現類別
 *
 * 專門處理無人機狀態歷史相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneStatusArchiveCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DroneStatusArchiveCommandsSvc {
    private commandsRepository: DroneStatusArchiveCommandsRepository;
    private queriesRepository: DroneStatusArchiveQueriesRepository;
    private archiveRepository: IDroneStatusArchiveRepository; // 組合介面
    private queryService: DroneStatusArchiveQueriesSvc;

    constructor(archiveRepository?: IDroneStatusArchiveRepository) {
        this.commandsRepository = new DroneStatusArchiveCommandsRepository();
        this.queriesRepository = new DroneStatusArchiveQueriesRepository();
        
        // 創建組合repository
        this.archiveRepository = archiveRepository || Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IDroneStatusArchiveRepository;
        
        this.queryService = new DroneStatusArchiveQueriesSvc();
    }

    /**
     * 建立新的狀態歷史記錄
     *
     * @param {DroneStatusArchiveCreationAttributes} data - 狀態歷史建立資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態歷史資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    @LogService()
    async createStatusArchive(data: DroneStatusArchiveCreationAttributes): Promise<DroneStatusArchiveAttributes> {
        try {
            // 驗證必要欄位
            this.validateStatusArchiveData(data);

            // 設定預設時間戳記
            if (!data.timestamp) {
                data.timestamp = new Date();
            }

            logger.info('Creating new status archive', { data });
            const archive = await this.archiveRepository.create(data);

            logger.info('Successfully created status archive', { id: archive.id });
            return archive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @param {Partial<DroneStatusArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 更新後的狀態歷史資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    @LogService()
    async updateStatusArchive(id: number, data: Partial<DroneStatusArchiveCreationAttributes>): Promise<DroneStatusArchiveAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的狀態歷史資料 ID');
            }

            // 檢查記錄是否存在
            const existingArchive = await this.queryService.getStatusArchiveById(id);
            if (!existingArchive) {
                throw new Error(`找不到 ID 為 ${id} 的狀態歷史資料`);
            }

            // 驗證更新資料
            this.validatePartialStatusArchiveData(data);

            logger.info('Updating status archive', { id, data });
            const updatedArchive = await this.archiveRepository.update(id, data);

            if (!updatedArchive) {
                throw new Error(`找不到 ID 為 ${id} 的狀態歷史資料`);
            }

            logger.info('Successfully updated status archive', { id });
            return updatedArchive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    @LogService()
    async deleteStatusArchive(id: number): Promise<void> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的狀態歷史資料 ID');
            }

            // 檢查記錄是否存在
            const existsArchive = await this.queryService.isArchiveExists(id);
            if (!existsArchive) {
                throw new Error(`找不到 ID 為 ${id} 的狀態歷史資料`);
            }

            logger.info('Deleting status archive', { id });
            await this.archiveRepository.delete(id);

            logger.info('Successfully deleted status archive', { id });
        } catch (error) {
            throw error;
        }
    }

    /**
     * 記錄無人機狀態變更
     *
     * @param {number} droneId - 無人機 ID
     * @param {DroneStatus} newStatus - 新狀態
     * @param {DroneStatus | null} previousStatus - 前一狀態
     * @param {string} reason - 變更原因
     * @param {object} details - 詳細資訊（可選）
     * @param {number} createdBy - 操作者用戶 ID（可選）
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態變更記錄
     * @throws {Error} 當參數無效或記錄失敗時
     */
    @LogService()
    async recordStatusChange(
        droneId: number,
        newStatus: DroneStatus,
        previousStatus: DroneStatus | null,
        reason: string,
        details?: object,
        createdBy?: number
    ): Promise<DroneStatusArchiveAttributes> {
        try {
            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }
            if (!Object.values(DroneStatus).includes(newStatus)) {
                throw new Error('無效的新狀態');
            }
            if (previousStatus !== null && !Object.values(DroneStatus).includes(previousStatus)) {
                throw new Error('無效的前一狀態');
            }
            if (!reason || reason.trim() === '') {
                throw new Error('變更原因不能為空');
            }
            if (createdBy !== undefined && createdBy <= 0) {
                throw new Error('無效的操作者用戶 ID');
            }

            // 檢查狀態轉換是否有效
            const isValid = await this.isValidStatusTransition(previousStatus, newStatus);
            if (!isValid) {
                logger.warn('Invalid status transition attempted', { previousStatus, newStatus, droneId });
                // 不拋出錯誤，但記錄警告
            }

            const archiveData: DroneStatusArchiveCreationAttributes = {
                drone_id: droneId,
                status: newStatus,
                previous_status: previousStatus,
                reason: reason.trim(),
                details: details || null,
                timestamp: new Date(),
                created_by: createdBy || null
            };

            logger.info('Recording status change', { archiveData });
            const archive = await this.archiveRepository.create(archiveData);

            logger.info('Successfully recorded status change', {
                id: archive.id,
                droneId,
                transition: `${previousStatus} -> ${newStatus}`
            });

            return archive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量刪除狀態歷史記錄
     *
     * @param {number[]} ids - 要刪除的記錄 ID 陣列
     * @returns {Promise<number>} 成功刪除的記錄數量
     * @throws {Error} 當 ID 陣列為空或刪除失敗時
     */
    @LogService()
    async bulkDeleteStatusArchives(ids: number[]): Promise<number> {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('記錄 ID 陣列不能為空');
            }

            logger.info('Bulk deleting status archives', { ids });

            let successCount = 0;
            const errors: string[] = [];

            for (const id of ids) {
                try {
                    await this.deleteStatusArchive(id);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to delete archive ${id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
                    errors.push(errorMessage);
                    logger.warn(errorMessage);
                }
            }

            logger.info('Bulk delete completed', { total: ids.length, success: successCount, errors: errors.length });

            if (errors.length > 0) {
                logger.warn('Some deletions failed', { errors });
            }

            return successCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除指定無人機的所有歷史記錄
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 刪除的記錄數量
     * @throws {Error} 當無人機 ID 無效或刪除失敗時
     */
    @LogService()
    async deleteAllArchivesByDroneId(droneId: number): Promise<number> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Deleting all archives by drone ID', { droneId });

            // 獲取該無人機的所有歷史記錄
            const archives = await this.queryService.getStatusArchivesByDroneId(droneId, 10000); // 大量限制以獲取所有記錄
            const archiveIds = archives.map(archive => archive.id);

            if (archiveIds.length === 0) {
                logger.info('No archives found for drone', { droneId });
                return 0;
            }

            const deletedCount = await this.bulkDeleteStatusArchives(archiveIds);

            logger.info('Successfully deleted all archives for drone', { droneId, deletedCount });
            return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除指定時間範圍外的舊記錄
     *
     * @param {Date} beforeDate - 刪除此日期之前的記錄
     * @returns {Promise<number>} 刪除的記錄數量
     * @throws {Error} 當日期無效或刪除失敗時
     */
    @LogService()
    async deleteOldArchives(beforeDate: Date): Promise<number> {
        try {
            if (!beforeDate || isNaN(beforeDate.getTime())) {
                throw new Error('無效的日期');
            }

            logger.info('Deleting old archives', { beforeDate });

            // 獲取指定日期之前的所有記錄
            const oldDate = new Date('1970-01-01');
            const archives = await this.queryService.getStatusArchivesByDateRange(oldDate, beforeDate, 10000);
            const archiveIds = archives.map(archive => archive.id);

            if (archiveIds.length === 0) {
                logger.info('No old archives found', { beforeDate });
                return 0;
            }

            const deletedCount = await this.bulkDeleteStatusArchives(archiveIds);

            logger.info('Successfully deleted old archives', { beforeDate, deletedCount });
            return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 檢查狀態變更的有效性
     *
     * @param {DroneStatus | null} fromStatus - 轉換前狀態
     * @param {DroneStatus} toStatus - 轉換後狀態
     * @returns {Promise<boolean>} 是否為有效的狀態轉換
     */
    @LogService()
    async isValidStatusTransition(fromStatus: DroneStatus | null, toStatus: DroneStatus): Promise<boolean> {
        try {
            // 定義有效的狀態轉換規則
            const validTransitions: { [key: string]: DroneStatus[] } = {
                'null': [DroneStatus.ACTIVE, DroneStatus.INACTIVE], // 初始狀態
                [DroneStatus.ACTIVE]: [DroneStatus.FLYING, DroneStatus.MAINTENANCE, DroneStatus.INACTIVE],
                [DroneStatus.INACTIVE]: [DroneStatus.ACTIVE, DroneStatus.MAINTENANCE],
                [DroneStatus.FLYING]: [DroneStatus.ACTIVE, DroneStatus.MAINTENANCE],
                [DroneStatus.MAINTENANCE]: [DroneStatus.ACTIVE, DroneStatus.INACTIVE]
            };

            const fromKey = fromStatus || 'null';
            const allowedTransitions = validTransitions[fromKey];

            const isValid = allowedTransitions ? allowedTransitions.includes(toStatus) : false;

            logger.debug('Status transition validation', {
                fromStatus,
                toStatus,
                isValid,
                allowedTransitions
            });

            return isValid;
        } catch (error) {
            return false;
        }
    }

    /**
     * 驗證狀態歷史資料
     *
     * @private
     * @param {DroneStatusArchiveCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料驗證失敗時
     */
    private validateStatusArchiveData(data: DroneStatusArchiveCreationAttributes): void {
        // 驗證必要欄位
        if (!data.drone_id || data.drone_id <= 0) {
            throw new Error('無人機 ID 必須是正整數');
        }

        if (!data.status || !Object.values(DroneStatus).includes(data.status)) {
            throw new Error('無效的無人機狀態');
        }

        if (data.previous_status !== null && data.previous_status !== undefined &&
            !Object.values(DroneStatus).includes(data.previous_status)) {
            throw new Error('無效的前一狀態');
        }

        if (!data.reason || data.reason.trim() === '') {
            throw new Error('變更原因為必填欄位');
        }

        if (data.created_by !== null && data.created_by !== undefined && data.created_by <= 0) {
            throw new Error('操作者用戶 ID 必須是正整數');
        }

        if (data.timestamp && (!(data.timestamp instanceof Date) || isNaN(data.timestamp.getTime()))) {
            throw new Error('無效的時間戳記');
        }
    }

    /**
     * 驗證部分狀態歷史資料
     *
     * @private
     * @param {Partial<DroneStatusArchiveCreationAttributes>} data - 要驗證的部分資料
     * @throws {Error} 當資料驗證失敗時
     */
    private validatePartialStatusArchiveData(data: Partial<DroneStatusArchiveCreationAttributes>): void {
        if (data.drone_id !== undefined && data.drone_id <= 0) {
            throw new Error('無人機 ID 必須是正整數');
        }

        if (data.status !== undefined && !Object.values(DroneStatus).includes(data.status)) {
            throw new Error('無效的無人機狀態');
        }

        if (data.previous_status !== undefined && data.previous_status !== null &&
            !Object.values(DroneStatus).includes(data.previous_status)) {
            throw new Error('無效的前一狀態');
        }

        if (data.reason !== undefined && (!data.reason || data.reason.trim() === '')) {
            throw new Error('變更原因不能為空');
        }

        if (data.created_by !== undefined && data.created_by !== null && data.created_by <= 0) {
            throw new Error('操作者用戶 ID 必須是正整數');
        }

        if (data.timestamp !== undefined && (!(data.timestamp instanceof Date) || isNaN(data.timestamp.getTime()))) {
            throw new Error('無效的時間戳記');
        }
    }
}
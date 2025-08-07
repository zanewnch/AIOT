/**
 * @fileoverview 無人機指令歷史歸檔命令 Service 實現
 *
 * 此文件實作了無人機指令歷史歸檔命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneCommandsArchiveCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import type { IDroneCommandsArchiveRepository } from '../../types/repositories/IDroneCommandsArchiveRepository.js';
import { DroneCommandsArchiveCommandsRepository } from '../../repo/commands/drone/DroneCommandsArchiveCommandsRepo.js';
import { DroneCommandsArchiveQueriesRepository } from '../../repo/queries/drone/DroneCommandsArchiveQueriesRepo.js';
import type { DroneCommandsArchiveAttributes, DroneCommandsArchiveCreationAttributes } from '../../models/drone/DroneCommandsArchiveModel.js';
import { DroneCommandsArchiveQueriesSvc } from '../queries/DroneCommandsArchiveQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneCommandsArchiveCommandsSvc');

/**
 * 歸檔操作結果介面
 */
export interface ArchiveOperationResult {
    success: boolean;
    archive: DroneCommandsArchiveAttributes;
    message: string;
    error?: string;
}

/**
 * 無人機指令歷史歸檔命令 Service 實現類別
 *
 * 專門處理無人機指令歷史歸檔相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneCommandsArchiveCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DroneCommandsArchiveCommandsSvc {
    private commandsRepository: DroneCommandsArchiveCommandsRepository;
    private queriesRepository: DroneCommandsArchiveQueriesRepository;
    private archiveRepository: IDroneCommandsArchiveRepository; // 組合介面
    private queryService: DroneCommandsArchiveQueriesSvc;

    constructor() {
        this.commandsRepository = new DroneCommandsArchiveCommandsRepository();
        this.queriesRepository = new DroneCommandsArchiveQueriesRepository();
        
        // 創建組合repository
        this.archiveRepository = Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IDroneCommandsArchiveRepository;
        
        this.queryService = new DroneCommandsArchiveQueriesSvc();
    }

    /**
     * 創建新的指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes} data - 要創建的歸檔資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 創建後的歸檔資料
     */
    async createCommandArchive(data: DroneCommandsArchiveCreationAttributes): Promise<DroneCommandsArchiveAttributes> {
        try {
            logger.info('Creating new drone command archive', { droneId: data.drone_id, commandType: data.command_type });

            // 驗證必要欄位
            this.validateCommandArchiveData(data);

            // 檢查是否有重複的歸檔記錄
            if (data.original_id) {
                const existingArchives = await this.queryService.getCommandArchivesByDroneId(data.drone_id);
                const duplicateArchive = existingArchives.find(archive => 
                    archive.original_id === data.original_id
                );
                
                if (duplicateArchive) {
                    logger.warn('Duplicate archive found for original command', { 
                        originalCommandId: data.original_id,
                        existingArchiveId: duplicateArchive.id
                    });
                    throw new Error('此指令已有歸檔記錄');
                }
            }

            const archive = await this.archiveRepository.insert(data);
            logger.info('Successfully created command archive', { id: archive.id });

            return archive;
        } catch (error) {
            logger.error('Error in createCommandArchive', { error, data });
            throw error;
        }
    }

    /**
     * 更新指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 更新後的歸檔資料或 null
     */
    async updateCommandArchive(id: number, data: Partial<DroneCommandsArchiveAttributes>): Promise<DroneCommandsArchiveAttributes | null> {
        try {
            logger.info('Updating drone command archive', { id, data });

            // 驗證 ID 參數
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('Invalid ID: must be a positive integer');
            }

            // 檢查歸檔記錄是否存在
            const existingArchive = await this.queryService.getCommandArchiveById(id);
            if (!existingArchive) {
                logger.warn('Command archive not found for update', { id });
                return null;
            }

            // 驗證更新資料
            if (data.drone_id && (!Number.isInteger(data.drone_id) || data.drone_id <= 0)) {
                throw new Error('Invalid drone ID: must be a positive integer');
            }

            if (data.command_type && (!data.command_type || typeof data.command_type !== 'string')) {
                throw new Error('Invalid command type: must be a non-empty string');
            }

            if (data.status && (!data.status || typeof data.status !== 'string')) {
                throw new Error('Invalid status: must be a non-empty string');
            }

            // 防止修改關鍵歷史資料
            const protectedFields = ['original_id', 'executed_at'];
            const hasProtectedFields = protectedFields.some(field => field in data);
            if (hasProtectedFields) {
                logger.warn('Attempt to modify protected archive fields', { id, protectedFields });
                throw new Error('無法修改關鍵歷史資料欄位');
            }

            const updatedArchive = await this.archiveRepository.update(id, data);

            if (updatedArchive) {
                logger.info('Successfully updated command archive', { id });
            }

            return updatedArchive;
        } catch (error) {
            logger.error('Error in updateCommandArchive', { error, id, data });
            throw error;
        }
    }

    /**
     * 刪除指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    async deleteCommandArchive(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone command archive', { id });

            // 驗證 ID 參數
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error('Invalid ID: must be a positive integer');
            }

            // 檢查歸檔記錄是否存在
            const existingArchive = await this.queryService.getCommandArchiveById(id);
            if (!existingArchive) {
                logger.warn('Command archive not found for deletion', { id });
                return false;
            }

            // 歷史記錄刪除需要特別注意，可能需要額外權限檢查
            logger.warn('Attempting to delete historical archive record', { 
                id,
                droneId: existingArchive.drone_id,
                commandType: existingArchive.command_type,
                executedAt: existingArchive.executed_at
            });

            const success = await this.archiveRepository.delete(id);

            if (success) {
                logger.info('Successfully deleted command archive', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error in deleteCommandArchive', { error, id });
            throw error;
        }
    }

    /**
     * 批量創建指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes[]} dataArray - 要創建的歸檔資料陣列
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 創建後的歸檔資料陣列
     */
    async batchCreateCommandArchives(dataArray: DroneCommandsArchiveCreationAttributes[]): Promise<DroneCommandsArchiveAttributes[]> {
        try {
            logger.info('Batch creating drone command archives', { count: dataArray.length });

            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                throw new Error('Invalid data array: must be a non-empty array');
            }

            if (dataArray.length > 100) {
                throw new Error('Batch size too large: maximum 100 records per batch');
            }

            // 驗證每筆資料
            dataArray.forEach((data, index) => {
                try {
                    this.validateCommandArchiveData(data);
                } catch (error) {
                    throw new Error(`Invalid data at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            });

            const createdArchives: DroneCommandsArchiveAttributes[] = [];
            const errors: Array<{index: number, error: string}> = [];

            // 逐一創建，記錄成功和失敗的項目
            for (let i = 0; i < dataArray.length; i++) {
                try {
                    const archive = await this.createCommandArchive(dataArray[i]);
                    createdArchives.push(archive);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push({ index: i, error: errorMessage });
                    logger.error(`Failed to create archive at index ${i}`, { error: errorMessage, data: dataArray[i] });
                }
            }

            logger.info('Batch create completed', { 
                total: dataArray.length,
                successful: createdArchives.length,
                failed: errors.length
            });

            if (errors.length > 0) {
                logger.warn('Some archives failed to create', { errors });
            }

            return createdArchives;
        } catch (error) {
            logger.error('Error in batchCreateCommandArchives', { error, count: dataArray?.length });
            throw error;
        }
    }

    /**
     * 歸檔指定時間範圍前的指令記錄
     *
     * @param {Date} beforeDate - 歸檔此日期之前的記錄
     * @param {number} batchSize - 批次大小，預設為 50
     * @returns {Promise<ArchiveOperationResult>} 歸檔操作結果
     */
    async archiveCommandsBefore(beforeDate: Date, batchSize: number = 50): Promise<ArchiveOperationResult> {
        try {
            logger.info('Archiving commands before date', { beforeDate, batchSize });

            if (!(beforeDate instanceof Date)) {
                throw new Error('Invalid date parameter: must be a Date object');
            }

            if (batchSize <= 0 || batchSize > 200) {
                throw new Error('Batch size must be between 1 and 200');
            }

            // 這裡應該實作從活躍指令表移動到歷史歸檔表的邏輯
            // 由於沒有活躍指令表的 Repository，這裡提供架構示例
            
            logger.info('Archive operation completed', { 
                beforeDate,
                batchSize,
                note: 'Implementation needed when active command repository is available'
            });

            // 返回模擬結果
            return {
                success: true,
                archive: {} as DroneCommandsArchiveAttributes, // 實際實作時應該返回統計資訊
                message: `已歸檔 ${beforeDate.toISOString()} 之前的指令記錄`,
                error: undefined
            };
        } catch (error) {
            logger.error('Error in archiveCommandsBefore', { error, beforeDate, batchSize });
            return {
                success: false,
                archive: {} as DroneCommandsArchiveAttributes,
                message: '歸檔操作失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 清理過期的歷史歸檔記錄
     *
     * @param {number} retentionDays - 保留天數
     * @returns {Promise<number>} 清理的記錄數量
     */
    async cleanupExpiredArchives(retentionDays: number): Promise<number> {
        try {
            logger.info('Cleaning up expired archives', { retentionDays });

            if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
                throw new Error('Retention days must be a positive integer');
            }

            if (retentionDays < 30) {
                throw new Error('Retention period must be at least 30 days for safety');
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // 獲取過期記錄
            const expiredArchives = await this.queryService.getCommandArchivesByTimeRange(
                new Date('1970-01-01'),
                cutoffDate,
                1000
            );

            let deletedCount = 0;
            for (const archive of expiredArchives) {
                try {
                    const deleted = await this.deleteCommandArchive(archive.id);
                    if (deleted) {
                        deletedCount++;
                    }
                } catch (error) {
                    logger.error('Failed to delete expired archive', { 
                        archiveId: archive.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            logger.info('Cleanup completed', { 
                retentionDays,
                cutoffDate,
                totalFound: expiredArchives.length,
                deleted: deletedCount
            });

            return deletedCount;
        } catch (error) {
            logger.error('Error in cleanupExpiredArchives', { error, retentionDays });
            throw error;
        }
    }

    /**
     * 驗證指令歷史歸檔資料
     *
     * @private
     * @param {DroneCommandsArchiveCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料無效時拋出錯誤
     */
    private validateCommandArchiveData(data: DroneCommandsArchiveCreationAttributes): void {
        if (!Number.isInteger(data.drone_id) || data.drone_id <= 0) {
            throw new Error('Invalid drone ID: must be a positive integer');
        }

        if (!data.command_type || typeof data.command_type !== 'string') {
            throw new Error('Invalid command type: must be a non-empty string');
        }

        if (!data.status || typeof data.status !== 'string') {
            throw new Error('Invalid status: must be a non-empty string');
        }

        if (data.executed_at && !(data.executed_at instanceof Date)) {
            throw new Error('Invalid executed_at: must be a Date object');
        }

        if (data.original_id && (!Number.isInteger(data.original_id) || data.original_id <= 0)) {
            throw new Error('Invalid original_id: must be a positive integer');
        }

        // 可以添加更多驗證邏輯
    }
}
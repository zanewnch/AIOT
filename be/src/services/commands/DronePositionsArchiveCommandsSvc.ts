/**
 * @fileoverview 無人機位置歷史歸檔命令 Service 實現
 *
 * 此文件實作了無人機位置歷史歸檔命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DronePositionsArchiveCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import type { IDronePositionsArchiveRepository } from '../../types/repositories/IDronePositionsArchiveRepository.js';
import { DronePositionsArchiveRepository } from '../../repo/drone/DronePositionsArchiveRepo.js';
import type { DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes } from '../../models/drone/DronePositionsArchiveModel.js';
import { DronePositionsArchiveQueriesSvc } from '../queries/DronePositionsArchiveQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DronePositionsArchiveCommandsSvc');

/**
 * 無人機位置歷史歸檔命令 Service 實現類別
 *
 * 專門處理無人機位置歷史歸檔相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DronePositionsArchiveCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveCommandsSvc {
    private archiveRepository: IDronePositionsArchiveRepository;
    private queryService: DronePositionsArchiveQueriesSvc;

    constructor() {
        this.archiveRepository = new DronePositionsArchiveRepository();
        this.queryService = new DronePositionsArchiveQueriesSvc();
    }

    /**
     * 建立新的位置歷史歸檔記錄
     */
    async createPositionArchive(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveAttributes> {
        try {
            logger.info('Creating position archive', { data });

            // 驗證資料完整性
            if (!await this.validateArchiveData(data)) {
                throw new Error('歸檔資料驗證失敗');
            }

            // 驗證座標有效性
            if (!await this.queryService.validateCoordinates(data.latitude, data.longitude)) {
                throw new Error('無效的座標資料');
            }

            const createdArchive = await this.archiveRepository.create(data);

            logger.info('Position archive created successfully', { id: createdArchive.id });
            return createdArchive;
        } catch (error) {
            logger.error('Error in createPositionArchive', { data, error });
            throw error;
        }
    }

    /**
     * 批量建立位置歷史歸檔記錄
     */
    async bulkCreatePositionArchives(dataArray: DronePositionsArchiveCreationAttributes[]): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Bulk creating position archives', { count: dataArray.length });

            // 驗證批量資料
            if (!dataArray || dataArray.length === 0) {
                throw new Error('批量建立資料不能為空');
            }

            if (dataArray.length > 1000) {
                throw new Error('批量建立記錄數不能超過 1000 筆');
            }

            // 驗證每筆資料
            for (const data of dataArray) {
                if (!await this.validateArchiveData(data)) {
                    throw new Error('批量資料中包含無效的歸檔記錄');
                }
                if (!await this.queryService.validateCoordinates(data.latitude, data.longitude)) {
                    throw new Error(`無效的座標資料: ${data.latitude}, ${data.longitude}`);
                }
            }

            const createdArchives = await this.archiveRepository.bulkCreate(dataArray);

            logger.info('Position archives bulk created successfully', { count: createdArchives.length });
            return createdArchives;
        } catch (error) {
            logger.error('Error in bulkCreatePositionArchives', { count: dataArray?.length, error });
            throw error;
        }
    }

    /**
     * 更新位置歷史歸檔資料
     */
    async updatePositionArchive(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveAttributes | null> {
        try {
            logger.info('Updating position archive', { id, data });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查記錄是否存在
            const existingArchive = await this.queryService.getPositionArchiveById(id);
            if (!existingArchive) {
                throw new Error('指定的位置歷史歸檔不存在');
            }

            // 如果有座標更新，驗證座標有效性
            if ((data.latitude !== undefined && data.longitude !== undefined) ||
                (data.latitude !== undefined || data.longitude !== undefined)) {
                if (data.latitude === undefined || data.longitude === undefined) {
                    throw new Error('緯度和經度必須同時提供');
                }
                if (!await this.queryService.validateCoordinates(data.latitude, data.longitude)) {
                    throw new Error('無效的座標資料');
                }
            }

            const updatedArchive = await this.archiveRepository.update(id, data);

            if (updatedArchive) {
                logger.info('Position archive updated successfully', { id });
            } else {
                logger.warn('Position archive not found for update', { id });
            }

            return updatedArchive;
        } catch (error) {
            logger.error('Error in updatePositionArchive', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除位置歷史歸檔資料
     */
    async deletePositionArchive(id: number): Promise<boolean> {
        try {
            logger.info('Deleting position archive', { id });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查記錄是否存在
            const existingArchive = await this.queryService.getPositionArchiveById(id);
            if (!existingArchive) {
                throw new Error('指定的位置歷史歸檔不存在');
            }

            const success = await this.archiveRepository.delete(id);

            if (success) {
                logger.info('Position archive deleted successfully', { id });
            } else {
                logger.warn('Position archive not found for deletion', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error in deletePositionArchive', { id, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的歸檔資料
     */
    async deleteArchivesBeforeDate(beforeDate: Date): Promise<number> {
        try {
            logger.info('Deleting archives before date', { beforeDate });

            // 驗證日期
            if (!beforeDate || beforeDate > new Date()) {
                throw new Error('無效的刪除日期');
            }

            const deletedCount = await this.archiveRepository.deleteBeforeDate(beforeDate);

            logger.info(`Deleted ${deletedCount} position archive records before ${beforeDate}`);
            return deletedCount;
        } catch (error) {
            logger.error('Error in deleteArchivesBeforeDate', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 刪除指定批次的歸檔資料
     */
    async deleteArchiveBatch(batchId: string): Promise<number> {
        try {
            logger.info('Deleting archive batch', { batchId });

            // 驗證批次 ID
            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
            }

            // 檢查批次是否存在
            const batchData = await this.queryService.getPositionArchivesByBatchId(batchId);
            if (batchData.length === 0) {
                throw new Error('指定的歸檔批次不存在');
            }

            const deletedCount = await this.archiveRepository.deleteBatch(batchId);

            logger.info(`Deleted ${deletedCount} position archive records for batch ${batchId}`);
            return deletedCount;
        } catch (error) {
            logger.error('Error in deleteArchiveBatch', { batchId, error });
            throw error;
        }
    }

    /**
     * 批量刪除位置歷史歸檔資料
     */
    async bulkDeletePositionArchives(ids: number[]): Promise<number> {
        try {
            logger.info('Bulk deleting position archives', { ids });

            if (!ids || ids.length === 0) {
                throw new Error('刪除 ID 陣列不能為空');
            }

            if (ids.length > 1000) {
                throw new Error('批量刪除記錄數不能超過 1000 筆');
            }

            // 驗證所有 ID 都是正整數
            for (const id of ids) {
                if (!id || id <= 0) {
                    throw new Error(`無效的 ID: ${id}`);
                }
            }

            let deletedCount = 0;
            for (const id of ids) {
                try {
                    const success = await this.archiveRepository.delete(id);
                    if (success) {
                        deletedCount++;
                    }
                } catch (error) {
                    logger.warn('Failed to delete position archive', { id, error });
                }
            }

            logger.info('Bulk position archives deletion completed', { total: ids.length, deleted: deletedCount });
            return deletedCount;
        } catch (error) {
            logger.error('Error in bulkDeletePositionArchives', { ids, error });
            throw error;
        }
    }

    /**
     * 根據條件批量刪除歷史歸檔資料
     */
    async deleteArchivesByConditions(conditions: {
        droneId?: number;
        beforeDate?: Date;
        minBattery?: number;
        maxBattery?: number;
    }): Promise<number> {
        try {
            logger.info('Deleting archives by conditions', { conditions });

            let deletedCount = 0;

            // 根據無人機 ID 刪除
            if (conditions.droneId) {
                const archives = await this.queryService.getPositionArchivesByDroneId(conditions.droneId, 10000);
                const ids = archives
                    .filter(archive => {
                        if (conditions.beforeDate && archive.timestamp >= conditions.beforeDate) {
                            return false;
                        }
                        if (conditions.minBattery !== undefined && archive.battery_level < conditions.minBattery) {
                            return false;
                        }
                        if (conditions.maxBattery !== undefined && archive.battery_level > conditions.maxBattery) {
                            return false;
                        }
                        return true;
                    })
                    .map(archive => archive.id);

                deletedCount = await this.bulkDeletePositionArchives(ids);
            }
            // 根據時間刪除
            else if (conditions.beforeDate) {
                deletedCount = await this.deleteArchivesBeforeDate(conditions.beforeDate);
            }

            logger.info('Archives deleted by conditions', { conditions, deletedCount });
            return deletedCount;
        } catch (error) {
            logger.error('Error in deleteArchivesByConditions', { conditions, error });
            throw error;
        }
    }

    /**
     * 清理過時的歸檔資料
     */
    async cleanupOldArchives(daysOld: number): Promise<number> {
        try {
            logger.info('Cleaning up old archives', { daysOld });

            if (daysOld <= 0) {
                throw new Error('清理天數必須是正整數');
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const deletedCount = await this.deleteArchivesBeforeDate(cutoffDate);

            logger.info('Old archives cleaned up', { daysOld, cutoffDate, deletedCount });
            return deletedCount;
        } catch (error) {
            logger.error('Error in cleanupOldArchives', { daysOld, error });
            throw error;
        }
    }

    /**
     * 優化歷史歸檔儲存（刪除重複或異常資料）
     */
    async optimizeArchiveStorage(droneId: number, timeRange: { start: Date; end: Date }): Promise<{
        duplicatesRemoved: number;
        anomaliesRemoved: number;
        totalRemoved: number;
    }> {
        try {
            logger.info('Optimizing archive storage', { droneId, timeRange });

            const trajectory = await this.queryService.getTrajectoryByDroneAndTime(
                droneId, timeRange.start, timeRange.end, 10000
            );

            if (trajectory.length === 0) {
                return { duplicatesRemoved: 0, anomaliesRemoved: 0, totalRemoved: 0 };
            }

            // 檢測異常資料
            const anomalies = await this.queryService.detectAnomalousPositions(
                droneId, timeRange.start, timeRange.end
            );

            // 檢測重複資料（相同時間戳和位置的記錄）
            const duplicates: DronePositionsArchiveAttributes[] = [];
            const seen = new Set<string>();

            for (const point of trajectory) {
                const key = `${point.timestamp.getTime()}_${point.latitude}_${point.longitude}`;
                if (seen.has(key)) {
                    duplicates.push(point);
                } else {
                    seen.add(key);
                }
            }

            // 刪除重複和異常資料
            const toDelete = [...duplicates, ...anomalies];
            const uniqueIds = [...new Set(toDelete.map(item => item.id))];

            const totalRemoved = await this.bulkDeletePositionArchives(uniqueIds);

            const result = {
                duplicatesRemoved: duplicates.length,
                anomaliesRemoved: anomalies.length,
                totalRemoved
            };

            logger.info('Archive storage optimized', { droneId, timeRange, result });
            return result;
        } catch (error) {
            logger.error('Error in optimizeArchiveStorage', { droneId, timeRange, error });
            throw error;
        }
    }

    /**
     * 批量更新歸檔資料的批次 ID
     */
    async updateArchiveBatchId(oldBatchId: string, newBatchId: string): Promise<number> {
        try {
            logger.info('Updating archive batch ID', { oldBatchId, newBatchId });

            if (!oldBatchId || oldBatchId.trim() === '') {
                throw new Error('舊批次 ID 不能為空');
            }
            if (!newBatchId || newBatchId.trim() === '') {
                throw new Error('新批次 ID 不能為空');
            }

            // 檢查舊批次是否存在
            const oldBatchData = await this.queryService.getPositionArchivesByBatchId(oldBatchId);
            if (oldBatchData.length === 0) {
                throw new Error('指定的舊批次不存在');
            }

            let updatedCount = 0;
            for (const archive of oldBatchData) {
                try {
                    const updated = await this.archiveRepository.update(archive.id, {
                        archive_batch_id: newBatchId
                    });
                    if (updated) {
                        updatedCount++;
                    }
                } catch (error) {
                    logger.warn('Failed to update archive batch ID', { archiveId: archive.id, error });
                }
            }

            logger.info('Archive batch ID updated', { oldBatchId, newBatchId, updatedCount });
            return updatedCount;
        } catch (error) {
            logger.error('Error in updateArchiveBatchId', { oldBatchId, newBatchId, error });
            throw error;
        }
    }

    /**
     * 驗證歸檔資料完整性
     */
    private async validateArchiveData(data: DronePositionsArchiveCreationAttributes): Promise<boolean> {
        try {
            // 檢查必填欄位
            const requiredFields = [
                'original_id', 'drone_id', 'latitude', 'longitude',
                'altitude', 'timestamp', 'signal_strength', 'speed',
                'heading', 'battery_level', 'temperature', 'archived_at',
                'archive_batch_id', 'created_at'
            ];

            for (const field of requiredFields) {
                if (data[field as keyof DronePositionsArchiveCreationAttributes] === undefined ||
                    data[field as keyof DronePositionsArchiveCreationAttributes] === null) {
                    logger.warn(`Missing required field: ${field}`, { data });
                    return false;
                }
            }

            // 驗證數值範圍
            if (data.battery_level < 0 || data.battery_level > 100) {
                logger.warn('Invalid battery level', { battery_level: data.battery_level });
                return false;
            }

            if (data.signal_strength < 0 || data.signal_strength > 100) {
                logger.warn('Invalid signal strength', { signal_strength: data.signal_strength });
                return false;
            }

            if (data.speed < 0) {
                logger.warn('Invalid speed', { speed: data.speed });
                return false;
            }

            if (data.heading < 0 || data.heading >= 360) {
                logger.warn('Invalid heading', { heading: data.heading });
                return false;
            }

            // 驗證字串欄位
            if (!data.archive_batch_id || data.archive_batch_id.trim() === '') {
                logger.warn('Invalid archive batch ID', { archive_batch_id: data.archive_batch_id });
                return false;
            }

            logger.debug('Archive data validated successfully', { data });
            return true;
        } catch (error) {
            logger.error('Error in validateArchiveData', { data, error });
            return false;
        }
    }
}
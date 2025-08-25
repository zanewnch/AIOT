/**
 * @fileoverview 無人機位置歷史歸檔命令 Service 實現
 *
 * 此文件實作了無人機位置歷史歸檔命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DronePositionsArchiveCommandsService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import type { IDronePositionsArchiveRepository } from '../../types/repositories/IDronePositionsArchiveRepository.js';
import type { DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes } from '../../models/DronePositionsArchiveModel.js';
import { DronePositionsArchiveQueriesService } from '../queries/DronePositionsArchiveQueriesService.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DronePositionsArchiveCommandsService');

/**
 * 無人機位置歷史歸檔命令 Service 實現類別
 *
 * 專門處理無人機位置歷史歸檔相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DronePositionsArchiveCommandsService
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveCommandsService {
    constructor(
        @inject(TYPES.DronePositionsArchiveCommandsRepositorysitorysitory)
        private readonly archiveRepositorysitory: IDronePositionsArchiveRepositorysitorysitory,
        @inject(TYPES.DronePositionsArchiveQueriesService)
        private readonly queryService: DronePositionsArchiveQueriesService
    ) {}

    /**
     * 建立新的位置歷史歸檔記錄
     */
    createPositionArchive = async (data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveAttributes> => {
        try {
// 驗證資料完整性
            if (!await this.validateArchiveData(data)) {
                throw new Error('歸檔資料驗證失敗');
            }

            // 驗證座標有效性
            if (!await this.queryService.validateCoordinates(data.latitude, data.longitude)) {
                throw new Error('無效的座標資料');
            }

            const createdArchive = await this.archiveRepositorysitory.create(data);
return createdArchive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量建立位置歷史歸檔記錄
     */
    bulkCreatePositionArchives = async (dataArray: DronePositionsArchiveCreationAttributes[]): Promise<DronePositionsArchiveAttributes[]> => {
        try {
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

            const createdArchives = await this.archiveRepositorysitory.bulkCreate(dataArray);
return createdArchives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新位置歷史歸檔資料
     */
    updatePositionArchive = async (id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveAttributes | null> => {
        try {
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

            const updatedArchive = await this.archiveRepositorysitory.update(id, data);

            if (updatedArchive) {
} else {
}

            return updatedArchive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除位置歷史歸檔資料
     */
    deletePositionArchive = async (id: number): Promise<boolean> => {
        try {
// 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查記錄是否存在
            const existingArchive = await this.queryService.getPositionArchiveById(id);
            if (!existingArchive) {
                throw new Error('指定的位置歷史歸檔不存在');
            }

            await this.archiveRepositorysitory.delete(id);
return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的歸檔資料
     */
    deleteArchivesBeforeDate = async (beforeDate: Date): Promise<number> => {
        try {
// 驗證日期
            if (!beforeDate || beforeDate > new Date()) {
                throw new Error('無效的刪除日期');
            }

            const deletedCount = await this.archiveRepositorysitory.deleteBeforeDate(beforeDate);
return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除指定批次的歸檔資料
     */
    deleteArchiveBatch = async (batchId: string): Promise<number> => {
        try {
// 驗證批次 ID
            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
            }

            // 檢查批次是否存在
            const batchData = await this.queryService.getPositionArchivesByBatchId(batchId);
            if (batchData.length === 0) {
                throw new Error('指定的歸檔批次不存在');
            }

            const deletedCount = await this.archiveRepositorysitory.deleteBatch(batchId);
return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量刪除位置歷史歸檔資料
     */
    bulkDeletePositionArchives = async (ids: number[]): Promise<number> => {
        try {
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
                    await this.archiveRepositorysitory.delete(id);
                    deletedCount++;
                } catch (error) {
}
            }
return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據條件批量刪除歷史歸檔資料
     */
    deleteArchivesByConditions = async (conditions: {
        droneId?: number;
        beforeDate?: Date;
        minBattery?: number;
        maxBattery?: number;
    }): Promise<number> => {
        try {
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
return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 清理過時的歸檔資料
     */
    cleanupOldArchives = async (daysOld: number): Promise<number> => {
        try {
if (daysOld <= 0) {
                throw new Error('清理天數必須是正整數');
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const deletedCount = await this.deleteArchivesBeforeDate(cutoffDate);
return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 優化歷史歸檔儲存（刪除重複或異常資料）
     */
    optimizeArchiveStorage = async (droneId: number, timeRange: { start: Date; end: Date }): Promise<{
        duplicatesRemoved: number;
        anomaliesRemoved: number;
        totalRemoved: number;
    }> => {
        try {
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
return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量更新歸檔資料的批次 ID
     */
    updateArchiveBatchId = async (oldBatchId: string, newBatchId: string): Promise<number> => {
        try {
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
                    const updated = await this.archiveRepositorysitory.update(archive.id, {
                        archive_batch_id: newBatchId
                    });
                    if (updated) {
                        updatedCount++;
                    }
                } catch (error) {
}
            }
return updatedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證歸檔資料完整性
     */
    private validateArchiveData = async (data: DronePositionsArchiveCreationAttributes): Promise<boolean> => {
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
return false;
                }
            }

            // 驗證數值範圍
            if (data.battery_level < 0 || data.battery_level > 100) {
return false;
            }

            if (data.signal_strength < 0 || data.signal_strength > 100) {
return false;
            }

            if (data.speed < 0) {
return false;
            }

            if (data.heading < 0 || data.heading >= 360) {
return false;
            }

            // 驗證字串欄位
            if (!data.archive_batch_id || data.archive_batch_id.trim() === '') {
return false;
            }
return true;
        } catch (error) {
            return false;
        }
    }
}
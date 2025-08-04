/**
 * @fileoverview 無人機位置歷史歸檔 Service 實現
 *
 * 實現無人機位置歷史歸檔業務邏輯層的具體邏輯，處理資料驗證、業務規則和複雜查詢。
 * 遵循 Service Layer Pattern，封裝所有與位置歷史歸檔相關的業務邏輯。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type {
    IDronePositionsArchiveService,
    TrajectoryStatistics,
    BatteryUsageStatistics,
    PositionDistributionStatistics,
    ArchiveBatchStatistics
} from '../../types/services/IDronePositionsArchiveService.js';
import type { IDronePositionsArchiveRepository } from '../../types/repositories/IDronePositionsArchiveRepository.js';
import { DronePositionsArchiveRepository } from '../../repo/drone/DronePositionsArchiveRepo.js';
import type { DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes } from '../../models/drone/DronePositionsArchiveModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('DronePositionsArchiveService');

/**
 * 無人機位置歷史歸檔 Service 實現類別
 *
 * 實現 IDronePositionsArchiveService 介面，提供位置歷史歸檔的業務邏輯處理
 *
 * @class DronePositionsArchiveService
 * @implements {IDronePositionsArchiveService}
 */
export class DronePositionsArchiveService implements IDronePositionsArchiveService {
    private archiveRepository: IDronePositionsArchiveRepository;

    /**
     * 建構子
     *
     * @param {IDronePositionsArchiveRepository} archiveRepository - 位置歷史歸檔 Repository 實例
     */
    constructor() {
        this.archiveRepository = new DronePositionsArchiveRepository();
    }

    /**
     * 取得所有位置歷史歸檔資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 位置歷史歸檔資料陣列
     */
    async getAllPositionArchives(limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting all position archives', { limit });

            // 驗證 limit 參數
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.selectAll(limit);

            logger.info(`Successfully retrieved ${archives.length} position archives`);
            return archives;
        } catch (error) {
            logger.error('Error in getAllPositionArchives', { limit, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆位置歷史歸檔資料
     *
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    async getPositionArchiveById(id: number): Promise<DronePositionsArchiveAttributes | null> {
        try {
            logger.info('Getting position archive by ID', { id });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            const archive = await this.archiveRepository.findById(id);

            if (archive) {
                logger.info('Position archive found', { id });
            } else {
                logger.warn('Position archive not found', { id });
            }

            return archive;
        } catch (error) {
            logger.error('Error in getPositionArchiveById', { id, error });
            throw error;
        }
    }

    /**
     * 根據原始 ID 取得歸檔資料
     *
     * @param {number} originalId - 原始資料表的 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    async getPositionArchiveByOriginalId(originalId: number): Promise<DronePositionsArchiveAttributes | null> {
        try {
            logger.info('Getting position archive by original ID', { originalId });

            // 驗證 originalId 參數
            if (!originalId || originalId <= 0) {
                throw new Error('原始 ID 必須是正整數');
            }

            const archive = await this.archiveRepository.findByOriginalId(originalId);

            if (archive) {
                logger.info('Position archive found by original ID', { originalId });
            } else {
                logger.warn('Position archive not found by original ID', { originalId });
            }

            return archive;
        } catch (error) {
            logger.error('Error in getPositionArchiveByOriginalId', { originalId, error });
            throw error;
        }
    }

    /**
     * 建立新的位置歷史歸檔記錄
     *
     * @param {DronePositionsArchiveCreationAttributes} data - 位置歷史歸檔建立資料
     * @returns {Promise<DronePositionsArchiveAttributes>} 建立的位置歷史歸檔資料
     */
    async createPositionArchive(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveAttributes> {
        try {
            logger.info('Creating position archive', { data });

            // 驗證資料完整性
            await this.validateArchiveData(data);

            // 驗證座標有效性
            if (!await this.validateCoordinates(data.latitude, data.longitude)) {
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
     *
     * @param {DronePositionsArchiveCreationAttributes[]} dataArray - 位置歷史歸檔建立資料陣列
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 建立的位置歷史歸檔資料陣列
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
                await this.validateArchiveData(data);
                if (!await this.validateCoordinates(data.latitude, data.longitude)) {
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
     *
     * @param {number} id - 位置歷史歸檔資料 ID
     * @param {Partial<DronePositionsArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 更新後的位置歷史歸檔資料或 null
     */
    async updatePositionArchive(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveAttributes | null> {
        try {
            logger.info('Updating position archive', { id, data });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 如果有座標更新，驗證座標有效性
            if ((data.latitude !== undefined && data.longitude !== undefined) ||
                (data.latitude !== undefined || data.longitude !== undefined)) {
                if (data.latitude === undefined || data.longitude === undefined) {
                    throw new Error('緯度和經度必須同時提供');
                }
                if (!await this.validateCoordinates(data.latitude, data.longitude)) {
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
     *
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async deletePositionArchive(id: number): Promise<boolean> {
        try {
            logger.info('Deleting position archive', { id });

            // 驗證 ID 參數
            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
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
     * 根據無人機 ID 查詢位置歷史歸檔
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定無人機的位置歷史歸檔陣列
     */
    async getPositionArchivesByDroneId(droneId: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by drone ID', { droneId, limit });

            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByDroneId(droneId, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives for drone ${droneId}`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByDroneId', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢位置歷史歸檔
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 500
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定時間範圍的位置歷史歸檔陣列
     */
    async getPositionArchivesByTimeRange(startTime: Date, endTime: Date, limit: number = 500): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by time range', { startTime, endTime, limit });

            // 驗證時間範圍
            if (!await this.validateTimeRange(startTime, endTime)) {
                throw new Error('無效的時間範圍');
            }
            if (limit <= 0 || limit > 2000) {
                throw new Error('限制筆數必須在 1 到 2000 之間');
            }

            const archives = await this.archiveRepository.findByTimeRange(startTime, endTime, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in time range`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByTimeRange', { startTime, endTime, limit, error });
            throw error;
        }
    }

    /**
     * 根據歸檔批次 ID 查詢資料
     *
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定批次的位置歷史歸檔陣列
     */
    async getPositionArchivesByBatchId(batchId: string): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by batch ID', { batchId });

            // 驗證批次 ID
            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
            }

            const archives = await this.archiveRepository.findByBatchId(batchId);

            logger.info(`Successfully retrieved ${archives.length} position archives for batch ${batchId}`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByBatchId', { batchId, error });
            throw error;
        }
    }

    /**
     * 根據歸檔時間範圍查詢資料
     *
     * @param {Date} startDate - 開始歸檔時間
     * @param {Date} endDate - 結束歸檔時間
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定歸檔時間範圍的資料陣列
     */
    async getPositionArchivesByArchivedDateRange(startDate: Date, endDate: Date, limit: number = 200): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by archived date range', { startDate, endDate, limit });

            // 驗證時間範圍
            if (!await this.validateTimeRange(startDate, endDate)) {
                throw new Error('無效的歸檔時間範圍');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByArchivedDateRange(startDate, endDate, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in archived date range`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByArchivedDateRange', { startDate, endDate, limit, error });
            throw error;
        }
    }

    /**
     * 根據地理邊界查詢位置歷史歸檔
     *
     * @param {number} minLat - 最小緯度
     * @param {number} maxLat - 最大緯度
     * @param {number} minLng - 最小經度
     * @param {number} maxLng - 最大經度
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定地理邊界內的位置歷史歸檔陣列
     */
    async getPositionArchivesByGeoBounds(minLat: number, maxLat: number, minLng: number, maxLng: number, limit: number = 200): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by geo bounds', { minLat, maxLat, minLng, maxLng, limit });

            // 驗證地理邊界
            if (!await this.validateCoordinates(minLat, minLng) || !await this.validateCoordinates(maxLat, maxLng)) {
                throw new Error('無效的地理邊界座標');
            }
            if (minLat >= maxLat || minLng >= maxLng) {
                throw new Error('地理邊界範圍無效');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByGeoBounds(minLat, maxLat, minLng, maxLng, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in geo bounds`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByGeoBounds', { minLat, maxLat, minLng, maxLng, limit, error });
            throw error;
        }
    }

    /**
     * 根據無人機和時間範圍查詢軌跡
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 1000
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 無人機軌跡資料陣列（按時間排序）
     */
    async getTrajectoryByDroneAndTime(droneId: number, startTime: Date, endTime: Date, limit: number = 1000): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting trajectory by drone and time', { droneId, startTime, endTime, limit });

            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }
            if (!await this.validateTimeRange(startTime, endTime)) {
                throw new Error('無效的時間範圍');
            }
            if (limit <= 0 || limit > 5000) {
                throw new Error('限制筆數必須在 1 到 5000 之間');
            }

            const trajectory = await this.archiveRepository.findTrajectoryByDroneAndTime(droneId, startTime, endTime, limit);

            logger.info(`Successfully retrieved ${trajectory.length} trajectory points for drone ${droneId}`);
            return trajectory;
        } catch (error) {
            logger.error('Error in getTrajectoryByDroneAndTime', { droneId, startTime, endTime, limit, error });
            throw error;
        }
    }

    /**
     * 根據電池電量範圍查詢資料
     *
     * @param {number} minBattery - 最小電池電量
     * @param {number} maxBattery - 最大電池電量
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定電池電量範圍的資料陣列
     */
    async getPositionArchivesByBatteryRange(minBattery: number, maxBattery: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by battery range', { minBattery, maxBattery, limit });

            // 驗證電池電量範圍
            if (minBattery < 0 || maxBattery > 100 || minBattery >= maxBattery) {
                throw new Error('電池電量範圍無效 (0-100%)');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByBatteryRange(minBattery, maxBattery, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in battery range`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByBatteryRange', { minBattery, maxBattery, limit, error });
            throw error;
        }
    }

    /**
     * 根據飛行速度範圍查詢資料
     *
     * @param {number} minSpeed - 最小速度
     * @param {number} maxSpeed - 最大速度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定速度範圍的資料陣列
     */
    async getPositionArchivesBySpeedRange(minSpeed: number, maxSpeed: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by speed range', { minSpeed, maxSpeed, limit });

            // 驗證速度範圍
            if (minSpeed < 0 || maxSpeed < 0 || minSpeed >= maxSpeed) {
                throw new Error('速度範圍無效');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findBySpeedRange(minSpeed, maxSpeed, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in speed range`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesBySpeedRange', { minSpeed, maxSpeed, limit, error });
            throw error;
        }
    }

    /**
     * 根據高度範圍查詢資料
     *
     * @param {number} minAltitude - 最小高度
     * @param {number} maxAltitude - 最大高度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定高度範圍的資料陣列
     */
    async getPositionArchivesByAltitudeRange(minAltitude: number, maxAltitude: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by altitude range', { minAltitude, maxAltitude, limit });

            // 驗證高度範圍
            if (minAltitude >= maxAltitude) {
                throw new Error('高度範圍無效');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByAltitudeRange(minAltitude, maxAltitude, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in altitude range`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByAltitudeRange', { minAltitude, maxAltitude, limit, error });
            throw error;
        }
    }

    /**
     * 根據溫度範圍查詢資料
     *
     * @param {number} minTemp - 最小溫度
     * @param {number} maxTemp - 最大溫度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定溫度範圍的資料陣列
     */
    async getPositionArchivesByTemperatureRange(minTemp: number, maxTemp: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting position archives by temperature range', { minTemp, maxTemp, limit });

            // 驗證溫度範圍
            if (minTemp >= maxTemp) {
                throw new Error('溫度範圍無效');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByTemperatureRange(minTemp, maxTemp, limit);

            logger.info(`Successfully retrieved ${archives.length} position archives in temperature range`);
            return archives;
        } catch (error) {
            logger.error('Error in getPositionArchivesByTemperatureRange', { minTemp, maxTemp, limit, error });
            throw error;
        }
    }

    /**
     * 取得最新的歷史歸檔記錄
     *
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 最新的歷史歸檔記錄陣列
     */
    async getLatestPositionArchives(limit: number = 50): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Getting latest position archives', { limit });

            // 驗證 limit 參數
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            const archives = await this.archiveRepository.findLatest(limit);

            logger.info(`Successfully retrieved ${archives.length} latest position archives`);
            return archives;
        } catch (error) {
            logger.error('Error in getLatestPositionArchives', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 最新的歷史歸檔記錄或 null
     */
    async getLatestPositionArchiveByDroneId(droneId: number): Promise<DronePositionsArchiveAttributes | null> {
        try {
            logger.info('Getting latest position archive by drone ID', { droneId });

            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const archive = await this.archiveRepository.findLatestByDroneId(droneId);

            if (archive) {
                logger.info('Latest position archive found for drone', { droneId });
            } else {
                logger.warn('No position archive records found for drone', { droneId });
            }

            return archive;
        } catch (error) {
            logger.error('Error in getLatestPositionArchiveByDroneId', { droneId, error });
            throw error;
        }
    }

    /**
     * 統計總記錄數
     *
     * @returns {Promise<number>} 總記錄數
     */
    async getTotalArchiveCount(): Promise<number> {
        try {
            logger.info('Getting total archive count');

            const count = await this.archiveRepository.count();

            logger.info(`Total position archive records: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error in getTotalArchiveCount', { error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計記錄數
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的記錄數
     */
    async getArchiveCountByDroneId(droneId: number): Promise<number> {
        try {
            logger.info('Getting archive count by drone ID', { droneId });

            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const count = await this.archiveRepository.countByDroneId(droneId);

            logger.info(`Position archive records for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error in getArchiveCountByDroneId', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍統計記錄數
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<number>} 指定時間範圍的記錄數
     */
    async getArchiveCountByTimeRange(startTime: Date, endTime: Date): Promise<number> {
        try {
            logger.info('Getting archive count by time range', { startTime, endTime });

            // 驗證時間範圍
            if (!await this.validateTimeRange(startTime, endTime)) {
                throw new Error('無效的時間範圍');
            }

            const count = await this.archiveRepository.countByTimeRange(startTime, endTime);

            logger.info(`Position archive records in time range: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error in getArchiveCountByTimeRange', { startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 根據歸檔批次統計記錄數
     *
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 指定批次的記錄數
     */
    async getArchiveCountByBatchId(batchId: string): Promise<number> {
        try {
            logger.info('Getting archive count by batch ID', { batchId });

            // 驗證批次 ID
            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
            }

            const count = await this.archiveRepository.countByBatchId(batchId);

            logger.info(`Position archive records for batch ${batchId}: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error in getArchiveCountByBatchId', { batchId, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的歸檔資料
     *
     * @param {Date} beforeDate - 刪除此時間之前的資料
     * @returns {Promise<number>} 刪除的記錄數
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
     *
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteArchiveBatch(batchId: string): Promise<number> {
        try {
            logger.info('Deleting archive batch', { batchId });

            // 驗證批次 ID
            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
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
     * 驗證位置座標有效性
     *
     * @param {number} latitude - 緯度
     * @param {number} longitude - 經度
     * @returns {Promise<boolean>} 是否有效
     */
    async validateCoordinates(latitude: number, longitude: number): Promise<boolean> {
        try {
            // 驗證緯度範圍 (-90 到 90)
            if (latitude < -90 || latitude > 90) {
                logger.warn('Invalid latitude', { latitude });
                return false;
            }

            // 驗證經度範圍 (-180 到 180)
            if (longitude < -180 || longitude > 180) {
                logger.warn('Invalid longitude', { longitude });
                return false;
            }

            // 檢查是否為有效數字
            if (isNaN(latitude) || isNaN(longitude)) {
                logger.warn('Coordinates are not valid numbers', { latitude, longitude });
                return false;
            }

            logger.debug('Coordinates validated successfully', { latitude, longitude });
            return true;
        } catch (error) {
            logger.error('Error in validateCoordinates', { latitude, longitude, error });
            return false;
        }
    }

    /**
     * 驗證時間範圍有效性
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<boolean>} 是否有效
     */
    async validateTimeRange(startTime: Date, endTime: Date): Promise<boolean> {
        try {
            // 檢查是否為有效日期
            if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
                logger.warn('Invalid date objects', { startTime, endTime });
                return false;
            }

            // 檢查日期是否有效
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                logger.warn('Invalid date values', { startTime, endTime });
                return false;
            }

            // 檢查開始時間是否早於結束時間
            if (startTime >= endTime) {
                logger.warn('Start time must be before end time', { startTime, endTime });
                return false;
            }

            // 檢查時間範圍是否過長（超過 1 年）
            const oneYear = 365 * 24 * 60 * 60 * 1000;
            if (endTime.getTime() - startTime.getTime() > oneYear) {
                logger.warn('Time range too long (max 1 year)', { startTime, endTime });
                return false;
            }

            logger.debug('Time range validated successfully', { startTime, endTime });
            return true;
        } catch (error) {
            logger.error('Error in validateTimeRange', { startTime, endTime, error });
            return false;
        }
    }

    /**
     * 驗證歸檔資料完整性
     *
     * @param {DronePositionsArchiveCreationAttributes} data - 歸檔資料
     * @returns {Promise<boolean>} 是否完整
     */
    async validateArchiveData(data: DronePositionsArchiveCreationAttributes): Promise<boolean> {
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

    /**
     * 計算軌跡統計資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<TrajectoryStatistics>} 軌跡統計資料
     */
    async calculateTrajectoryStatistics(droneId: number, startTime: Date, endTime: Date): Promise<TrajectoryStatistics> {
        try {
            logger.info('Calculating trajectory statistics', { droneId, startTime, endTime });

            // 取得軌跡資料
            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);

            if (trajectory.length === 0) {
                throw new Error('無軌跡資料可供統計');
            }

            // 計算統計資料
            let totalDistance = 0;
            let totalSpeed = 0;
            let maxSpeed = 0;
            let minSpeed = Number.MAX_VALUE;
            let maxAltitude = Number.MIN_VALUE;
            let minAltitude = Number.MAX_VALUE;
            let totalAltitude = 0;

            for (let i = 0; i < trajectory.length; i++) {
                const point = trajectory[i];

                // 速度統計
                totalSpeed += point.speed;
                maxSpeed = Math.max(maxSpeed, point.speed);
                minSpeed = Math.min(minSpeed, point.speed);

                // 高度統計
                totalAltitude += point.altitude;
                maxAltitude = Math.max(maxAltitude, point.altitude);
                minAltitude = Math.min(minAltitude, point.altitude);

                // 距離計算（與下一點的距離）
                if (i < trajectory.length - 1) {
                    const nextPoint = trajectory[i + 1];
                    const distance = this.calculateDistance(
                        point.latitude, point.longitude,
                        nextPoint.latitude, nextPoint.longitude
                    );
                    totalDistance += distance;
                }
            }

            const flightDuration = trajectory.length > 1 ?
                (trajectory[trajectory.length - 1].timestamp.getTime() - trajectory[0].timestamp.getTime()) / 1000 : 0;

            const statistics: TrajectoryStatistics = {
                totalPoints: trajectory.length,
                totalDistance,
                averageSpeed: totalSpeed / trajectory.length,
                maxSpeed,
                minSpeed: minSpeed === Number.MAX_VALUE ? 0 : minSpeed,
                maxAltitude: maxAltitude === Number.MIN_VALUE ? 0 : maxAltitude,
                minAltitude: minAltitude === Number.MAX_VALUE ? 0 : minAltitude,
                averageAltitude: totalAltitude / trajectory.length,
                flightDuration,
                startTime: trajectory[0].timestamp,
                endTime: trajectory[trajectory.length - 1].timestamp
            };

            logger.info('Trajectory statistics calculated successfully', { droneId, statistics });
            return statistics;
        } catch (error) {
            logger.error('Error in calculateTrajectoryStatistics', { droneId, startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 計算電池使用統計資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<BatteryUsageStatistics>} 電池使用統計資料
     */
    async calculateBatteryUsageStatistics(droneId: number, startTime: Date, endTime: Date): Promise<BatteryUsageStatistics> {
        try {
            logger.info('Calculating battery usage statistics', { droneId, startTime, endTime });

            // 取得軌跡資料
            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);

            if (trajectory.length === 0) {
                throw new Error('無軌跡資料可供統計');
            }

            // 計算電池統計
            const initialBattery = trajectory[0].battery_level;
            const finalBattery = trajectory[trajectory.length - 1].battery_level;
            const batteryConsumed = initialBattery - finalBattery;

            let totalBattery = 0;
            let lowBatteryWarnings = 0;

            for (const point of trajectory) {
                totalBattery += point.battery_level;
                if (point.battery_level < 20) {
                    lowBatteryWarnings++;
                }
            }

            const averageBattery = totalBattery / trajectory.length;
            const flightHours = trajectory.length > 1 ?
                (trajectory[trajectory.length - 1].timestamp.getTime() - trajectory[0].timestamp.getTime()) / (1000 * 60 * 60) : 0;
            const consumptionRate = flightHours > 0 ? batteryConsumed / flightHours : 0;

            const statistics: BatteryUsageStatistics = {
                initialBattery,
                finalBattery,
                batteryConsumed,
                averageBattery,
                lowBatteryWarnings,
                consumptionRate
            };

            logger.info('Battery usage statistics calculated successfully', { droneId, statistics });
            return statistics;
        } catch (error) {
            logger.error('Error in calculateBatteryUsageStatistics', { droneId, startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 計算位置分佈統計資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<PositionDistributionStatistics>} 位置分佈統計資料
     */
    async calculatePositionDistributionStatistics(droneId: number, startTime: Date, endTime: Date): Promise<PositionDistributionStatistics> {
        try {
            logger.info('Calculating position distribution statistics', { droneId, startTime, endTime });

            // 取得軌跡資料
            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);

            if (trajectory.length === 0) {
                throw new Error('無軌跡資料可供統計');
            }

            // 計算地理邊界
            let north = Number.MIN_VALUE;
            let south = Number.MAX_VALUE;
            let east = Number.MIN_VALUE;
            let west = Number.MAX_VALUE;
            let totalLat = 0;
            let totalLng = 0;

            for (const point of trajectory) {
                north = Math.max(north, point.latitude);
                south = Math.min(south, point.latitude);
                east = Math.max(east, point.longitude);
                west = Math.min(west, point.longitude);
                totalLat += point.latitude;
                totalLng += point.longitude;
            }

            const centerLat = totalLat / trajectory.length;
            const centerLng = totalLng / trajectory.length;

            // 計算覆蓋區域（簡化為矩形面積）
            const latDistance = this.calculateDistance(south, west, north, west);
            const lngDistance = this.calculateDistance(south, west, south, east);
            const coverageArea = latDistance * lngDistance;

            // 計算活動範圍半徑（最遠點到中心的距離）
            let maxDistanceFromCenter = 0;
            for (const point of trajectory) {
                const distance = this.calculateDistance(centerLat, centerLng, point.latitude, point.longitude);
                maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distance);
            }

            const statistics: PositionDistributionStatistics = {
                bounds: {
                    north: north === Number.MIN_VALUE ? 0 : north,
                    south: south === Number.MAX_VALUE ? 0 : south,
                    east: east === Number.MIN_VALUE ? 0 : east,
                    west: west === Number.MAX_VALUE ? 0 : west
                },
                center: {
                    latitude: centerLat,
                    longitude: centerLng
                },
                coverageArea,
                activityRadius: maxDistanceFromCenter
            };

            logger.info('Position distribution statistics calculated successfully', { droneId, statistics });
            return statistics;
        } catch (error) {
            logger.error('Error in calculatePositionDistributionStatistics', { droneId, startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 取得歸檔批次統計資料
     *
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<ArchiveBatchStatistics>} 歸檔批次統計資料
     */
    async getArchiveBatchStatistics(batchId: string): Promise<ArchiveBatchStatistics> {
        try {
            logger.info('Getting archive batch statistics', { batchId });

            // 取得批次資料
            const batchData = await this.getPositionArchivesByBatchId(batchId);

            if (batchData.length === 0) {
                throw new Error('批次資料不存在');
            }

            // 計算統計資料
            const droneIds = new Set(batchData.map(item => item.drone_id));
            const timestamps = batchData.map(item => item.timestamp).sort((a, b) => a.getTime() - b.getTime());

            const statistics: ArchiveBatchStatistics = {
                batchId,
                recordCount: batchData.length,
                archivedAt: batchData[0].archived_at,
                droneCount: droneIds.size,
                timeRange: {
                    start: timestamps[0],
                    end: timestamps[timestamps.length - 1]
                }
            };

            logger.info('Archive batch statistics calculated successfully', { batchId, statistics });
            return statistics;
        } catch (error) {
            logger.error('Error in getArchiveBatchStatistics', { batchId, error });
            throw error;
        }
    }

    /**
     * 分析飛行模式
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<string[]>} 飛行模式陣列
     */
    async analyzeFlightPatterns(droneId: number, startTime: Date, endTime: Date): Promise<string[]> {
        try {
            logger.info('Analyzing flight patterns', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);
            const patterns: string[] = [];

            if (trajectory.length < 2) {
                return patterns;
            }

            // 分析不同的飛行模式
            const statistics = await this.calculateTrajectoryStatistics(droneId, startTime, endTime);

            // 高速飛行
            if (statistics.maxSpeed > 20) {
                patterns.push('high_speed_flight');
            }

            // 低速巡航
            if (statistics.averageSpeed < 5) {
                patterns.push('low_speed_cruise');
            }

            // 高空飛行
            if (statistics.maxAltitude > 100) {
                patterns.push('high_altitude_flight');
            }

            // 低空飛行
            if (statistics.maxAltitude < 30) {
                patterns.push('low_altitude_flight');
            }

            // 長時間飛行
            if (statistics.flightDuration > 3600) { // 超過 1 小時
                patterns.push('long_duration_flight');
            }

            // 短時間飛行
            if (statistics.flightDuration < 300) { // 少於 5 分鐘
                patterns.push('short_duration_flight');
            }

            logger.info('Flight patterns analyzed successfully', { droneId, patterns });
            return patterns;
        } catch (error) {
            logger.error('Error in analyzeFlightPatterns', { droneId, startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 檢測異常位置資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 異常位置資料陣列
     */
    async detectAnomalousPositions(droneId: number, startTime: Date, endTime: Date): Promise<DronePositionsArchiveAttributes[]> {
        try {
            logger.info('Detecting anomalous positions', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);
            const anomalous: DronePositionsArchiveAttributes[] = [];

            for (let i = 0; i < trajectory.length; i++) {
                const point = trajectory[i];
                let isAnomalous = false;

                // 檢測異常條件

                // 1. GPS 信號強度過低
                if (point.signal_strength < 30) {
                    isAnomalous = true;
                }

                // 2. 速度異常（過高或瞬間變化過大）
                if (point.speed > 50) { // 超過 50 m/s
                    isAnomalous = true;
                }

                if (i > 0) {
                    const prevPoint = trajectory[i - 1];
                    const speedChange = Math.abs(point.speed - prevPoint.speed);
                    if (speedChange > 30) { // 速度變化超過 30 m/s
                        isAnomalous = true;
                    }

                    // 3. 位置跳躍異常
                    const distance = this.calculateDistance(
                        prevPoint.latitude, prevPoint.longitude,
                        point.latitude, point.longitude
                    );
                    const timeDiff = (point.timestamp.getTime() - prevPoint.timestamp.getTime()) / 1000; // 秒
                    if (timeDiff > 0 && distance / timeDiff > 100) { // 瞬間移動速度超過 100 m/s
                        isAnomalous = true;
                    }
                }

                // 4. 高度異常
                if (point.altitude < -100 || point.altitude > 1000) {
                    isAnomalous = true;
                }

                // 5. 電池電量異常變化
                if (i > 0) {
                    const prevPoint = trajectory[i - 1];
                    const batteryChange = prevPoint.battery_level - point.battery_level;
                    const timeDiff = (point.timestamp.getTime() - prevPoint.timestamp.getTime()) / (1000 * 60); // 分鐘
                    if (timeDiff > 0 && batteryChange / timeDiff > 10) { // 電量消耗速度超過 10%/分鐘
                        isAnomalous = true;
                    }
                }

                if (isAnomalous) {
                    anomalous.push(point);
                }
            }

            logger.info('Anomalous positions detected', { droneId, anomalousCount: anomalous.length });
            return anomalous;
        } catch (error) {
            logger.error('Error in detectAnomalousPositions', { droneId, startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 產生軌跡摘要報告
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<object>} 軌跡摘要報告
     */
    async generateTrajectorySummaryReport(droneId: number, startTime: Date, endTime: Date): Promise<object> {
        try {
            logger.info('Generating trajectory summary report', { droneId, startTime, endTime });

            const [
                trajectoryStats,
                batteryStats,
                positionStats,
                flightPatterns,
                anomalousPositions
            ] = await Promise.all([
                this.calculateTrajectoryStatistics(droneId, startTime, endTime),
                this.calculateBatteryUsageStatistics(droneId, startTime, endTime),
                this.calculatePositionDistributionStatistics(droneId, startTime, endTime),
                this.analyzeFlightPatterns(droneId, startTime, endTime),
                this.detectAnomalousPositions(droneId, startTime, endTime)
            ]);

            const report = {
                droneId,
                timeRange: {
                    start: startTime,
                    end: endTime
                },
                trajectory: trajectoryStats,
                battery: batteryStats,
                position: positionStats,
                flightPatterns,
                anomalousPositions: {
                    count: anomalousPositions.length,
                    data: anomalousPositions.slice(0, 10) // 只返回前 10 筆異常資料
                },
                generatedAt: new Date()
            };

            logger.info('Trajectory summary report generated successfully', { droneId, reportSize: JSON.stringify(report).length });
            return report;
        } catch (error) {
            logger.error('Error in generateTrajectorySummaryReport', { droneId, startTime, endTime, error });
            throw error;
        }
    }

    /**
     * 計算兩點間距離（Haversine 公式）
     *
     * @private
     * @param {number} lat1 - 第一點緯度
     * @param {number} lng1 - 第一點經度
     * @param {number} lat2 - 第二點緯度
     * @param {number} lng2 - 第二點經度
     * @returns {number} 距離（公尺）
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // 地球半徑（公尺）
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }
}
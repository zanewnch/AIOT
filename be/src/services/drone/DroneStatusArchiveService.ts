/**
 * @fileoverview 無人機狀態歷史業務邏輯服務
 *
 * 處理無人機狀態變更歷史相關的業務邏輯，作為 Controller 和 Repository 之間的中介層。
 * 實現業務規則驗證、資料處理和錯誤處理。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DroneStatusArchiveRepository } from '../../repo/drone/DroneStatusArchiveRepo.js';
import type { DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes } from '../../models/drone/DroneStatusArchiveModel.js';
import { DroneStatus } from '../../models/drone/DroneStatusModel.js';
import type { IDroneStatusArchiveRepository } from '../../types/repositories/IDroneStatusArchiveRepository.js';
import type { IDroneStatusArchiveService } from '../../types/services/IDroneStatusArchiveService.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('DroneStatusArchiveService');

/**
 * 無人機狀態歷史 Service 類別
 *
 * 處理無人機狀態變更歷史相關的業務邏輯，包含資料驗證、業務規則和錯誤處理
 *
 * @class DroneStatusArchiveService
 * @implements {IDroneStatusArchiveService}
 */
export class DroneStatusArchiveService implements IDroneStatusArchiveService {
    private archiveRepository: IDroneStatusArchiveRepository;

    /**
     * 建構子
     *
     * @param {IDroneStatusArchiveRepository} archiveRepository - 狀態歷史 Repository 實例
     */
    constructor(archiveRepository: IDroneStatusArchiveRepository = new DroneStatusArchiveRepository()) {
        this.archiveRepository = archiveRepository;
    }

    /**
     * 取得所有狀態歷史資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 狀態歷史資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    async getAllStatusArchives(limit: number = 100): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證 limit 參數
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            logger.info('Getting all status archive data', { limit });
            const archives = await this.archiveRepository.selectAll(limit);

            logger.info(`Retrieved ${archives.length} status archive records`);
            return archives;
        } catch (error) {
            logger.error('Failed to get all status archive data', { limit, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<DroneStatusArchiveAttributes>} 狀態歷史資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    async getStatusArchiveById(id: number): Promise<DroneStatusArchiveAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的狀態歷史資料 ID');
            }

            logger.info('Getting status archive by ID', { id });
            const archive = await this.archiveRepository.findById(id);

            if (!archive) {
                throw new Error(`找不到 ID 為 ${id} 的狀態歷史資料`);
            }

            logger.info('Successfully retrieved status archive', { id });
            return archive;
        } catch (error) {
            logger.error('Failed to get status archive by ID', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的狀態歷史記錄
     *
     * @param {DroneStatusArchiveCreationAttributes} data - 狀態歷史建立資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態歷史資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
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
            logger.error('Failed to create status archive', { data, error });
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
    async updateStatusArchive(id: number, data: Partial<DroneStatusArchiveCreationAttributes>): Promise<DroneStatusArchiveAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的狀態歷史資料 ID');
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
            logger.error('Failed to update status archive', { id, data, error });
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
    async deleteStatusArchive(id: number): Promise<void> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的狀態歷史資料 ID');
            }

            logger.info('Deleting status archive', { id });
            const success = await this.archiveRepository.delete(id);

            if (!success) {
                throw new Error(`找不到 ID 為 ${id} 的狀態歷史資料`);
            }

            logger.info('Successfully deleted status archive', { id });
        } catch (error) {
            logger.error('Failed to delete status archive', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢狀態歷史
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定無人機的狀態歷史陣列
     * @throws {Error} 當無人機 ID 無效或查詢失敗時
     */
    async getStatusArchivesByDroneId(droneId: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by drone ID', { droneId, limit });
            const archives = await this.archiveRepository.findByDroneId(droneId, limit);

            logger.info(`Retrieved ${archives.length} status archives for drone ${droneId}`);
            return archives;
        } catch (error) {
            logger.error('Failed to get status archives by drone ID', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 根據狀態查詢歷史記錄
     *
     * @param {DroneStatus} status - 無人機狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定狀態的歷史記錄陣列
     * @throws {Error} 當狀態無效或查詢失敗時
     */
    async getStatusArchivesByStatus(status: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證狀態
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by status', { status, limit });
            const archives = await this.archiveRepository.findByStatus(status, limit);

            logger.info(`Retrieved ${archives.length} status archives with status ${status}`);
            return archives;
        } catch (error) {
            logger.error('Failed to get status archives by status', { status, limit, error });
            throw error;
        }
    }

    /**
     * 根據操作者查詢歷史記錄
     *
     * @param {number} createdBy - 操作者用戶 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定操作者的歷史記錄陣列
     * @throws {Error} 當用戶 ID 無效或查詢失敗時
     */
    async getStatusArchivesByCreatedBy(createdBy: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證參數
            if (!createdBy || createdBy <= 0) {
                throw new Error('無效的操作者用戶 ID');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by created by', { createdBy, limit });
            const archives = await this.archiveRepository.findByCreatedBy(createdBy, limit);

            logger.info(`Retrieved ${archives.length} status archives created by user ${createdBy}`);
            return archives;
        } catch (error) {
            logger.error('Failed to get status archives by created by', { createdBy, limit, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢歷史記錄
     *
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定時間範圍的歷史記錄陣列
     * @throws {Error} 當時間範圍無效或查詢失敗時
     */
    async getStatusArchivesByDateRange(startDate: Date, endDate: Date, limit: number = 100): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證時間範圍
            if (!startDate || !endDate) {
                throw new Error('開始時間和結束時間不能為空');
            }
            if (startDate >= endDate) {
                throw new Error('開始時間必須早於結束時間');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            logger.info('Getting status archives by date range', { startDate, endDate, limit });
            const archives = await this.archiveRepository.findByDateRange(startDate, endDate, limit);

            logger.info(`Retrieved ${archives.length} status archives in date range`);
            return archives;
        } catch (error) {
            logger.error('Failed to get status archives by date range', { startDate, endDate, limit, error });
            throw error;
        }
    }

    /**
     * 根據變更原因查詢歷史記錄
     *
     * @param {string} reason - 變更原因（支援模糊搜尋）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 包含指定原因的歷史記錄陣列
     * @throws {Error} 當原因字串無效或查詢失敗時
     */
    async getStatusArchivesByReason(reason: string, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證參數
            if (!reason || reason.trim() === '') {
                throw new Error('變更原因不能為空');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by reason', { reason, limit });
            const archives = await this.archiveRepository.findByReason(reason, limit);

            logger.info(`Retrieved ${archives.length} status archives with reason containing "${reason}"`);
            return archives;
        } catch (error) {
            logger.error('Failed to get status archives by reason', { reason, limit, error });
            throw error;
        }
    }

    /**
     * 取得最新的狀態變更記錄
     *
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 最新的狀態變更記錄陣列
     * @throws {Error} 當資料取得失敗時
     */
    async getLatestStatusArchives(limit: number = 20): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證 limit 參數
            if (limit <= 0 || limit > 100) {
                throw new Error('限制筆數必須在 1 到 100 之間');
            }

            logger.info('Getting latest status archives', { limit });
            const archives = await this.archiveRepository.findLatest(limit);

            logger.info(`Retrieved ${archives.length} latest status archives`);
            return archives;
        } catch (error) {
            logger.error('Failed to get latest status archives', { limit, error });
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新狀態變更
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 最新的狀態變更記錄或 null
     * @throws {Error} 當無人機 ID 無效或查詢失敗時
     */
    async getLatestStatusArchiveByDroneId(droneId: number): Promise<DroneStatusArchiveAttributes | null> {
        try {
            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Getting latest status archive by drone ID', { droneId });
            const archive = await this.archiveRepository.findLatestByDroneId(droneId);

            if (archive) {
                logger.info('Latest status archive found for drone', { droneId });
            } else {
                logger.info('No status archive found for drone', { droneId });
            }

            return archive;
        } catch (error) {
            logger.error('Failed to get latest status archive by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據狀態轉換查詢歷史記錄
     *
     * @param {DroneStatus | null} fromStatus - 轉換前狀態
     * @param {DroneStatus} toStatus - 轉換後狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 符合狀態轉換的歷史記錄陣列
     * @throws {Error} 當狀態無效或查詢失敗時
     */
    async getStatusArchivesByTransition(fromStatus: DroneStatus | null, toStatus: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> {
        try {
            // 驗證狀態
            if (fromStatus !== null && !Object.values(DroneStatus).includes(fromStatus)) {
                throw new Error('無效的來源狀態');
            }
            if (!Object.values(DroneStatus).includes(toStatus)) {
                throw new Error('無效的目標狀態');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by transition', { fromStatus, toStatus, limit });
            const archives = await this.archiveRepository.findByStatusTransition(fromStatus, toStatus, limit);

            logger.info(`Retrieved ${archives.length} status archives for transition ${fromStatus} -> ${toStatus}`);
            return archives;
        } catch (error) {
            logger.error('Failed to get status archives by transition', { fromStatus, toStatus, limit, error });
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
            logger.error('Failed to record status change', {
                droneId,
                newStatus,
                previousStatus,
                reason,
                error
            });
            throw error;
        }
    }

    /**
     * 取得狀態變更統計
     *
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<{[key: string]: number}>} 狀態變更統計資料
     * @throws {Error} 當時間範圍無效或統計失敗時
     */
    async getStatusChangeStatistics(startDate?: Date, endDate?: Date): Promise<{ [key: string]: number }> {
        try {
            // 驗證時間範圍
            if (startDate && endDate && startDate >= endDate) {
                throw new Error('開始時間必須早於結束時間');
            }

            logger.info('Getting status change statistics', { startDate, endDate });
            const statistics = await this.archiveRepository.getStatusChangeStatistics(startDate, endDate);

            logger.info('Successfully retrieved status change statistics', {
                statisticsCount: Object.keys(statistics).length
            });

            return statistics;
        } catch (error) {
            logger.error('Failed to get status change statistics', { startDate, endDate, error });
            throw error;
        }
    }

    /**
     * 取得無人機狀態變更趨勢分析
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} days - 分析天數，預設為 30
     * @returns {Promise<{date: string, changes: number}[]>} 狀態變更趨勢資料
     * @throws {Error} 當參數無效或分析失敗時
     */
    async getStatusChangeTrend(droneId: number, days: number = 30): Promise<{ date: string, changes: number }[]> {
        try {
            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }
            if (days <= 0 || days > 365) {
                throw new Error('分析天數必須在 1 到 365 之間');
            }

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            logger.info('Getting status change trend', { droneId, days, startDate, endDate });

            const archives = await this.archiveRepository.findByDroneId(droneId, days * 10); // 假設每天最多10次變更

            // 按日期分組統計
            const trendMap = new Map<string, number>();

            // 初始化所有日期為0
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                trendMap.set(dateStr, 0);
            }

            // 統計每天的變更次數
            archives.forEach(archive => {
                if (archive.timestamp >= startDate && archive.timestamp <= endDate) {
                    const dateStr = archive.timestamp.toISOString().split('T')[0];
                    const currentCount = trendMap.get(dateStr) || 0;
                    trendMap.set(dateStr, currentCount + 1);
                }
            });

            const trend = Array.from(trendMap.entries()).map(([date, changes]) => ({
                date,
                changes
            }));

            logger.info(`Successfully calculated status change trend for ${days} days`, {
                droneId,
                totalDataPoints: trend.length
            });

            return trend;
        } catch (error) {
            logger.error('Failed to get status change trend', { droneId, days, error });
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
            logger.error('Error validating status transition', { fromStatus, toStatus, error });
            return false;
        }
    }

    /**
     * 取得無人機活動摘要
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} days - 分析天數，預設為 7
     * @returns {Promise<{totalChanges: number, mostCommonStatus: DroneStatus, lastChange: Date}>} 活動摘要
     * @throws {Error} 當參數無效或查詢失敗時
     */
    async getDroneActivitySummary(droneId: number, days: number = 7): Promise<{
        totalChanges: number;
        mostCommonStatus: DroneStatus;
        lastChange: Date;
    }> {
        try {
            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }
            if (days <= 0 || days > 90) {
                throw new Error('分析天數必須在 1 到 90 之間');
            }

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            logger.info('Getting drone activity summary', { droneId, days });

            // 獲取時間範圍內的所有變更記錄
            const archives = await this.archiveRepository.findByDateRange(startDate, endDate, 1000);
            const droneArchives = archives.filter(archive => archive.drone_id === droneId);

            // 計算總變更次數
            const totalChanges = droneArchives.length;

            // 找出最常見的狀態
            const statusCount: { [key in DroneStatus]: number } = {
                [DroneStatus.ACTIVE]: 0,
                [DroneStatus.INACTIVE]: 0,
                [DroneStatus.MAINTENANCE]: 0,
                [DroneStatus.FLYING]: 0
            };

            droneArchives.forEach(archive => {
                statusCount[archive.status]++;
            });

            const mostCommonStatus = Object.entries(statusCount).reduce((a, b) =>
                statusCount[a[0] as DroneStatus] > statusCount[b[0] as DroneStatus] ? a : b
            )[0] as DroneStatus;

            // 找出最後變更時間
            const latestArchive = await this.archiveRepository.findLatestByDroneId(droneId);
            const lastChange = latestArchive ? latestArchive.timestamp : new Date(0);

            const summary = {
                totalChanges,
                mostCommonStatus,
                lastChange
            };

            logger.info('Successfully calculated drone activity summary', {
                droneId,
                summary
            });

            return summary;
        } catch (error) {
            logger.error('Failed to get drone activity summary', { droneId, days, error });
            throw error;
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
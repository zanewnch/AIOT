/**
 * @fileoverview 無人機狀態歷史查詢 Service 實現
 *
 * 此文件實作了無人機狀態歷史查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusArchiveQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusArchiveQueriesRepository } from '../../repo/queries/DroneStatusArchiveQueriesRepo.js';
import { DroneStatusArchiveCommandsRepository } from '../../repo/commands/DroneStatusArchiveCommandsRepo.js';
import type { DroneStatusArchiveAttributes } from '../../models/DroneStatusArchiveModel.js';
import { DroneStatus } from '../../models/DroneStatusModel.js';
import type { IDroneStatusArchiveRepository } from '../../types/repositories/IDroneStatusArchiveRepository.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneStatusArchiveQueriesSvc');

/**
 * 無人機狀態歷史查詢 Service 實現類別
 *
 * 專門處理無人機狀態歷史相關的查詢請求，包含取得狀態歷史資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusArchiveQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneStatusArchiveQueriesSvc {
    private archiveRepository: IDroneStatusArchiveRepository;
    private queriesRepository: DroneStatusArchiveQueriesRepository;
    private commandsRepository: DroneStatusArchiveCommandsRepository;

    constructor(archiveRepository?: IDroneStatusArchiveRepository) {
        this.queriesRepository = new DroneStatusArchiveQueriesRepository();
        this.commandsRepository = new DroneStatusArchiveCommandsRepository();
        
        // 創建組合repository來滿足IDroneStatusArchiveRepository接口
        this.archiveRepository = archiveRepository || Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IDroneStatusArchiveRepository;
    }

    /**
     * 取得所有狀態歷史資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 狀態歷史資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    @LogService()
    getAllStatusArchives = async (limit: number = 100): Promise<DroneStatusArchiveAttributes[]> => {
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
    @LogService()
    getStatusArchiveById = async (id: number): Promise<DroneStatusArchiveAttributes> => {
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
    @LogService()
    getStatusArchivesByDroneId = async (droneId: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            // 驗證參數
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by drone ID', { droneId, limit });
            const archives = await this.archiveRepository.findByDroneId(droneId);
            // 如果需要限制結果數量，可以在這裡截取
            const limitedArchives = limit ? archives.slice(0, limit) : archives;

            logger.info(`Retrieved ${limitedArchives.length} status archives for drone ${droneId}`);
            return limitedArchives;
        } catch (error) {
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
    @LogService()
    getStatusArchivesByStatus = async (status: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            // 驗證狀態
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by status', { status, limit });
            const archives = await this.archiveRepository.findByStatus(status);
            // 如果需要限制結果數量，可以在這裡截取
            const limitedArchives = limit ? archives.slice(0, limit) : archives;

            logger.info(`Retrieved ${limitedArchives.length} status archives with status ${status}`);
            return limitedArchives;
        } catch (error) {
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
    @LogService()
    getStatusArchivesByCreatedBy = async (createdBy: number, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
        try {
            // 驗證參數
            if (!createdBy || createdBy <= 0) {
                throw new Error('無效的操作者用戶 ID');
            }
            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            logger.info('Getting status archives by created by', { createdBy, limit });
            const archives = await this.archiveRepository.findByCreatedBy(createdBy);
            // 如果需要限制結果數量，可以在這裡截取
            const limitedArchives = limit ? archives.slice(0, limit) : archives;

            logger.info(`Retrieved ${limitedArchives.length} status archives created by user ${createdBy}`);
            return limitedArchives;
        } catch (error) {
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
    @LogService()
    getStatusArchivesByDateRange = async (startDate: Date, endDate: Date, limit: number = 100): Promise<DroneStatusArchiveAttributes[]> => {
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
    @LogService()
    getStatusArchivesByReason = async (reason: string, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
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
    @LogService()
    getLatestStatusArchives = async (limit: number = 20): Promise<DroneStatusArchiveAttributes[]> => {
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
    @LogService()
    getLatestStatusArchiveByDroneId = async (droneId: number): Promise<DroneStatusArchiveAttributes | null> => {
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
    @LogService()
    getStatusArchivesByTransition = async (fromStatus: DroneStatus | null, toStatus: DroneStatus, limit: number = 50): Promise<DroneStatusArchiveAttributes[]> => {
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
    @LogService()
    getStatusChangeStatistics = async (startDate?: Date, endDate?: Date): Promise<{ [key: string]: number }> => {
        try {
            // 驗證必需參數
            if (!startDate || !endDate) {
                throw new Error('開始時間和結束時間都是必需的');
            }

            // 驗證時間範圍
            if (startDate >= endDate) {
                throw new Error('開始時間必須早於結束時間');
            }

            logger.info('Getting status change statistics', { startDate, endDate });
            const statistics = await this.archiveRepository.getStatusChangeStatistics(startDate, endDate);

            logger.info('Successfully retrieved status change statistics', {
                statisticsCount: Object.keys(statistics).length
            });

            return statistics;
        } catch (error) {
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
    @LogService()
    getStatusChangeTrend = async (droneId: number, days: number = 30): Promise<{ date: string, changes: number }[]> => {
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
            throw error;
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
    @LogService()
    getDroneActivitySummary = async (droneId: number, days: number = 7): Promise<{
        totalChanges: number;
        mostCommonStatus: DroneStatus;
        lastChange: Date;
    }> => {
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
                // 確保 status 是有效的枚舉值
                if (archive.status && archive.status in statusCount) {
                    statusCount[archive.status as DroneStatus]++;
                }
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
            throw error;
        }
    }

    /**
     * 檢查記錄是否存在
     *
     * @param {number} id - 記錄 ID
     * @returns {Promise<boolean>} 記錄是否存在
     */
    @LogService()
    isArchiveExists = async (id: number): Promise<boolean> => {
        try {
            if (!id || id <= 0) {
                return false;
            }

            const archive = await this.archiveRepository.findById(id);
            return !!archive;
        } catch (error) {
            return false;
        }
    }
}
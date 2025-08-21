/**
 * @fileoverview 無人機位置歷史歸檔查詢 Service 實現
 *
 * 此文件實作了無人機位置歷史歸檔查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionsArchiveQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import type {
    TrajectoryStatistics,
    BatteryUsageStatistics,
    PositionDistributionStatistics,
    ArchiveBatchStatistics
} from '../../types/services/IDronePositionsArchiveService.js';
import type { IDronePositionsArchiveRepository } from '../../types/repositories/IDronePositionsArchiveRepository.js';
import type { DronePositionsArchiveAttributes } from '../../models/DronePositionsArchiveModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DronePositionsArchiveQueriesSvc');

/**
 * 無人機位置歷史歸檔查詢 Service 實現類別
 *
 * 專門處理無人機位置歷史歸檔相關的查詢請求，包含取得歷史資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionsArchiveQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveQueriesSvc {
    constructor(
        @inject(TYPES.DronePositionsArchiveQueriesRepo)
        private readonly archiveRepo: IDronePositionsArchiveRepository
    ) {}

    /**
     * 取得所有位置歷史歸檔資料
     */
    getAllPositionArchives = async (limit: number = 100): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting all position archives', { limit });

            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.selectAll(limit);
            logger.info(`Successfully retrieved ${archives.length} position archives`);
            return archives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆位置歷史歸檔資料
     */
    getPositionArchiveById = async (id: number): Promise<DronePositionsArchiveAttributes | null> => {
        try {
            logger.info('Getting position archive by ID', { id });

            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            const archive = await this.archiveRepository.findById(id);

            if (archive) {
                logger.info('Position archive found', { id });
            } else {
                logger.info('Position archive not found', { id });
            }

            return archive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據原始 ID 取得歸檔資料
     */
    getPositionArchiveByOriginalId = async (originalId: number): Promise<DronePositionsArchiveAttributes | null> => {
        try {
            logger.info('Getting position archive by original ID', { originalId });

            if (!originalId || originalId <= 0) {
                throw new Error('原始 ID 必須是正整數');
            }

            const archive = await this.archiveRepository.findByOriginalId(originalId);

            if (archive) {
                logger.info('Position archive found by original ID', { originalId });
            } else {
                logger.info('Position archive not found by original ID', { originalId });
            }

            return archive;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     */
    getPositionArchivesByDroneId = async (droneId: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by drone ID', { droneId, limit });

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
            throw error;
        }
    }

    /**
     * 根據時間範圍查詢位置歷史歸檔
     */
    getPositionArchivesByTimeRange = async (startTime: Date, endTime: Date, limit: number = 500): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by time range', { startTime, endTime, limit });

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
            throw error;
        }
    }

    /**
     * 根據歸檔批次 ID 查詢資料
     */
    getPositionArchivesByBatchId = async (batchId: string): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by batch ID', { batchId });

            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
            }

            const archives = await this.archiveRepository.findByBatchId(batchId);
            logger.info(`Successfully retrieved ${archives.length} position archives for batch ${batchId}`);
            return archives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據歸檔時間範圍查詢資料
     */
    getPositionArchivesByArchivedDateRange = async (startDate: Date, endDate: Date, limit: number = 200): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by archived date range', { startDate, endDate, limit });

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
            throw error;
        }
    }

    /**
     * 根據地理邊界查詢位置歷史歸檔
     */
    getPositionArchivesByGeoBounds = async (minLat: number, maxLat: number, minLng: number, maxLng: number, limit: number = 200): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by geo bounds', { minLat, maxLat, minLng, maxLng, limit });

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
            throw error;
        }
    }

    /**
     * 根據無人機和時間範圍查詢軌跡
     */
    getTrajectoryByDroneAndTime = async (droneId: number, startTime: Date, endTime: Date, limit: number = 1000): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting trajectory by drone and time', { droneId, startTime, endTime, limit });

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
            throw error;
        }
    }

    /**
     * 根據電池電量範圍查詢資料
     */
    getPositionArchivesByBatteryRange = async (minBattery: number, maxBattery: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by battery range', { minBattery, maxBattery, limit });

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
            throw error;
        }
    }

    /**
     * 根據飛行速度範圍查詢資料
     */
    getPositionArchivesBySpeedRange = async (minSpeed: number, maxSpeed: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by speed range', { minSpeed, maxSpeed, limit });

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
            throw error;
        }
    }

    /**
     * 根據高度範圍查詢資料
     */
    getPositionArchivesByAltitudeRange = async (minAltitude: number, maxAltitude: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by altitude range', { minAltitude, maxAltitude, limit });

            if (minAltitude >= maxAltitude) {
                throw new Error('高度範圍無效');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByAltitudeRange(minAltitude, maxAltitude);
            // 如果需要限制結果數量，可以在這裡截取
            const limitedArchives = limit ? archives.slice(0, limit) : archives;
            logger.info(`Successfully retrieved ${limitedArchives.length} position archives in altitude range`);
            return limitedArchives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據溫度範圍查詢資料
     */
    getPositionArchivesByTemperatureRange = async (minTemp: number, maxTemp: number, limit: number = 100): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting position archives by temperature range', { minTemp, maxTemp, limit });

            if (minTemp >= maxTemp) {
                throw new Error('溫度範圍無效');
            }
            if (limit <= 0 || limit > 1000) {
                throw new Error('限制筆數必須在 1 到 1000 之間');
            }

            const archives = await this.archiveRepository.findByTemperatureRange(minTemp, maxTemp);
            // 如果需要限制結果數量，可以在這裡截取
            const limitedArchives = limit ? archives.slice(0, limit) : archives;
            logger.info(`Successfully retrieved ${limitedArchives.length} position archives in temperature range`);
            return limitedArchives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得最新的歷史歸檔記錄
     */
    getLatestPositionArchives = async (limit: number = 50): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Getting latest position archives', { limit });

            if (limit <= 0 || limit > 500) {
                throw new Error('限制筆數必須在 1 到 500 之間');
            }

            const archives = await this.archiveRepository.findLatest(limit);
            logger.info(`Successfully retrieved ${archives.length} latest position archives`);
            return archives;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     */
    getLatestPositionArchiveByDroneId = async (droneId: number): Promise<DronePositionsArchiveAttributes | null> => {
        try {
            logger.info('Getting latest position archive by drone ID', { droneId });

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
            throw error;
        }
    }

    /**
     * 統計總記錄數
     */
    getTotalArchiveCount = async (): Promise<number> => {
        try {
            logger.info('Getting total archive count');
            const count = await this.archiveRepository.count();
            logger.info(`Total position archive records: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計記錄數
     */
    getArchiveCountByDroneId = async (droneId: number): Promise<number> => {
        try {
            logger.info('Getting archive count by drone ID', { droneId });

            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const count = await this.archiveRepository.countByDroneId(droneId);
            logger.info(`Position archive records for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據時間範圍統計記錄數
     */
    getArchiveCountByTimeRange = async (startTime: Date, endTime: Date): Promise<number> => {
        try {
            logger.info('Getting archive count by time range', { startTime, endTime });

            if (!await this.validateTimeRange(startTime, endTime)) {
                throw new Error('無效的時間範圍');
            }

            const count = await this.archiveRepository.countByTimeRange(startTime, endTime);
            logger.info(`Position archive records in time range: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據歸檔批次統計記錄數
     */
    getArchiveCountByBatchId = async (batchId: string): Promise<number> => {
        try {
            logger.info('Getting archive count by batch ID', { batchId });

            if (!batchId || batchId.trim() === '') {
                throw new Error('歸檔批次 ID 不能為空');
            }

            const count = await this.archiveRepository.countByBatchId(batchId);
            logger.info(`Position archive records for batch ${batchId}: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 計算軌跡統計資料
     */
    calculateTrajectoryStatistics = async (droneId: number, startTime: Date, endTime: Date): Promise<TrajectoryStatistics> => {
        try {
            logger.info('Calculating trajectory statistics', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);

            if (trajectory.length === 0) {
                throw new Error('無軌跡資料可供統計');
            }

            let totalDistance = 0;
            let totalSpeed = 0;
            let maxSpeed = 0;
            let minSpeed = Number.MAX_VALUE;
            let maxAltitude = Number.MIN_VALUE;
            let minAltitude = Number.MAX_VALUE;
            let totalAltitude = 0;

            for (let i = 0; i < trajectory.length; i++) {
                const point = trajectory[i];

                totalSpeed += point.speed;
                maxSpeed = Math.max(maxSpeed, point.speed);
                minSpeed = Math.min(minSpeed, point.speed);

                totalAltitude += point.altitude;
                maxAltitude = Math.max(maxAltitude, point.altitude);
                minAltitude = Math.min(minAltitude, point.altitude);

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
            throw error;
        }
    }

    /**
     * 計算電池使用統計資料
     */
    calculateBatteryUsageStatistics = async (droneId: number, startTime: Date, endTime: Date): Promise<BatteryUsageStatistics> => {
        try {
            logger.info('Calculating battery usage statistics', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);

            if (trajectory.length === 0) {
                throw new Error('無軌跡資料可供統計');
            }

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
            throw error;
        }
    }

    /**
     * 計算位置分佈統計資料
     */
    calculatePositionDistributionStatistics = async (droneId: number, startTime: Date, endTime: Date): Promise<PositionDistributionStatistics> => {
        try {
            logger.info('Calculating position distribution statistics', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);

            if (trajectory.length === 0) {
                throw new Error('無軌跡資料可供統計');
            }

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

            const latDistance = this.calculateDistance(south, west, north, west);
            const lngDistance = this.calculateDistance(south, west, south, east);
            const coverageArea = latDistance * lngDistance;

            let maxDistanceFromCenter = 0;
            for (const point of trajectory) {
                const distance = this.calculateDistance(centerLat, centerLng, point.latitude, point.longitude);
                maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distance);
            }

            const statistics: PositionDistributionStatistics = {
                bounds: {
                    northEast: { lat: north === Number.MIN_VALUE ? 0 : north, lng: east === Number.MIN_VALUE ? 0 : east },
                    southWest: { lat: south === Number.MAX_VALUE ? 0 : south, lng: west === Number.MAX_VALUE ? 0 : west }
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
            throw error;
        }
    }

    /**
     * 取得歸檔批次統計資料
     */
    getArchiveBatchStatistics = async (batchId: string): Promise<ArchiveBatchStatistics> => {
        try {
            logger.info('Getting archive batch statistics', { batchId });

            const batchData = await this.getPositionArchivesByBatchId(batchId);

            if (batchData.length === 0) {
                throw new Error('批次資料不存在');
            }

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
            throw error;
        }
    }

    /**
     * 分析飛行模式
     */
    analyzeFlightPatterns = async (droneId: number, startTime: Date, endTime: Date): Promise<string[]> => {
        try {
            logger.info('Analyzing flight patterns', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);
            const patterns: string[] = [];

            if (trajectory.length < 2) {
                return patterns;
            }

            const statistics = await this.calculateTrajectoryStatistics(droneId, startTime, endTime);

            if (statistics.maxSpeed > 20) {
                patterns.push('high_speed_flight');
            }
            if (statistics.averageSpeed < 5) {
                patterns.push('low_speed_cruise');
            }
            if (statistics.maxAltitude > 100) {
                patterns.push('high_altitude_flight');
            }
            if (statistics.maxAltitude < 30) {
                patterns.push('low_altitude_flight');
            }
            if (statistics.flightDuration > 3600) {
                patterns.push('long_duration_flight');
            }
            if (statistics.flightDuration < 300) {
                patterns.push('short_duration_flight');
            }

            logger.info('Flight patterns analyzed successfully', { droneId, patterns });
            return patterns;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 檢測異常位置資料
     */
    detectAnomalousPositions = async (droneId: number, startTime: Date, endTime: Date): Promise<DronePositionsArchiveAttributes[]> => {
        try {
            logger.info('Detecting anomalous positions', { droneId, startTime, endTime });

            const trajectory = await this.getTrajectoryByDroneAndTime(droneId, startTime, endTime, 5000);
            const anomalous: DronePositionsArchiveAttributes[] = [];

            for (let i = 0; i < trajectory.length; i++) {
                const point = trajectory[i];
                let isAnomalous = false;

                // GPS 信號強度過低
                if (point.signal_strength < 30) {
                    isAnomalous = true;
                }

                // 速度異常
                if (point.speed > 50) {
                    isAnomalous = true;
                }

                if (i > 0) {
                    const prevPoint = trajectory[i - 1];
                    const speedChange = Math.abs(point.speed - prevPoint.speed);
                    if (speedChange > 30) {
                        isAnomalous = true;
                    }

                    // 位置跳躍異常
                    const distance = this.calculateDistance(
                        prevPoint.latitude, prevPoint.longitude,
                        point.latitude, point.longitude
                    );
                    const timeDiff = (point.timestamp.getTime() - prevPoint.timestamp.getTime()) / 1000;
                    if (timeDiff > 0 && distance / timeDiff > 100) {
                        isAnomalous = true;
                    }
                }

                // 高度異常
                if (point.altitude < -100 || point.altitude > 1000) {
                    isAnomalous = true;
                }

                // 電池電量異常變化
                if (i > 0) {
                    const prevPoint = trajectory[i - 1];
                    const batteryChange = prevPoint.battery_level - point.battery_level;
                    const timeDiff = (point.timestamp.getTime() - prevPoint.timestamp.getTime()) / (1000 * 60);
                    if (timeDiff > 0 && batteryChange / timeDiff > 10) {
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
            throw error;
        }
    }

    /**
     * 產生軌跡摘要報告
     */
    generateTrajectorySummaryReport = async (droneId: number, startTime: Date, endTime: Date): Promise<object> => {
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
                    data: anomalousPositions.slice(0, 10)
                },
                generatedAt: new Date()
            };

            logger.info('Trajectory summary report generated successfully', { droneId, reportSize: JSON.stringify(report).length });
            return report;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證位置座標有效性
     */
    validateCoordinates = async (latitude: number, longitude: number): Promise<boolean> => {
        try {
            if (latitude < -90 || latitude > 90) {
                logger.warn('Invalid latitude', { latitude });
                return false;
            }

            if (longitude < -180 || longitude > 180) {
                logger.warn('Invalid longitude', { longitude });
                return false;
            }

            if (isNaN(latitude) || isNaN(longitude)) {
                logger.warn('Coordinates are not valid numbers', { latitude, longitude });
                return false;
            }

            logger.debug('Coordinates validated successfully', { latitude, longitude });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 驗證時間範圍有效性
     */
    validateTimeRange = async (startTime: Date, endTime: Date): Promise<boolean> => {
        try {
            if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
                logger.warn('Invalid date objects', { startTime, endTime });
                return false;
            }

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                logger.warn('Invalid date values', { startTime, endTime });
                return false;
            }

            if (startTime >= endTime) {
                logger.warn('Start time must be before end time', { startTime, endTime });
                return false;
            }

            const oneYear = 365 * 24 * 60 * 60 * 1000;
            if (endTime.getTime() - startTime.getTime() > oneYear) {
                logger.warn('Time range too long (max 1 year)', { startTime, endTime });
                return false;
            }

            logger.debug('Time range validated successfully', { startTime, endTime });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 計算兩點間距離（Haversine 公式）
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000;
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
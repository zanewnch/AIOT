/**
 * @fileoverview 無人機位置查詢 Service 實現
 *
 * 此文件實作了無人機位置查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import type { DronePositionQueriesRepo } from '../../repo/queries/DronePositionQueriesRepo.js';
import type { DronePositionAttributes } from '../../models/DronePositionModel.js';
import type { IDronePositionQueriesSvc } from '../../types/services/IDronePositionService.js';
import { TYPES } from '../../container/types.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DronePositionQueriesSvc');

/**
 * 無人機位置查詢 Service 實現類別
 *
 * 專門處理無人機位置相關的查詢請求，包含取得位置資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DronePositionQueriesSvc implements IDronePositionQueriesSvc {
    constructor(
        @inject(TYPES.DronePositionQueriesRepo) private readonly dronePositionRepo: DronePositionQueriesRepo
    ) {}


    /**
     * 根據 ID 取得無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<DronePositionAttributes>} 無人機位置資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    getDronePositionById = async (id: number): Promise<DronePositionAttributes> => {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機位置資料 ID');
            }

            logger.info('Getting drone position data by ID', { id });
            const dronePosition = await this.dronePositionRepo.findById(id);

            if (!dronePosition) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            logger.info('Successfully retrieved drone position data', { id });
            return dronePosition;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得最新的無人機位置資料
     *
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 最新的無人機位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getLatestDronePositions = async (limit: number = 10): Promise<DronePositionAttributes[]> => {
        try {
            // 驗證 limit 參數
            if (limit <= 0 || limit > 100) {
                throw new Error('限制筆數必須在 1 到 100 之間');
            }

            logger.info('Getting latest drone position data', { limit });
            const dronePositions = await this.dronePositionRepo.findLatest(limit);

            logger.info(`Retrieved ${dronePositions.length} latest drone position records`);
            return dronePositions;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得特定無人機的位置資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 特定無人機的位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getDronePositionsByDroneId = async (droneId: number, limit: number = 10): Promise<DronePositionAttributes[]> => {
        try {
            // 驗證 droneId
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            // 驗證 limit 參數
            if (limit <= 0 || limit > 100) {
                throw new Error('限制筆數必須在 1 到 100 之間');
            }

            logger.info('Getting drone positions by drone ID', { droneId, limit });
            const dronePositions = await this.dronePositionRepo.findByDroneId(droneId, limit);

            logger.info(`Retrieved ${dronePositions.length} positions for drone ${droneId}`);
            return dronePositions;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得特定無人機的最新位置
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DronePositionAttributes | null>} 最新的位置資料
     * @throws {Error} 當資料取得失敗時
     */
    getLatestDronePosition = async (droneId: number): Promise<DronePositionAttributes | null> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Getting latest position for drone', { droneId });
            const positions = await this.dronePositionRepo.findByDroneId(droneId, 1);
            
            if (positions.length === 0) {
                logger.info('No position found for drone', { droneId });
                return null;
            }

            return positions[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據時間範圍取得無人機位置
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<DronePositionAttributes[]>} 時間範圍內的位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getDronePositionsByTimeRange = async (droneId: number, startTime: Date, endTime: Date): Promise<DronePositionAttributes[]> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            if (!startTime || !endTime) {
                throw new Error('開始時間和結束時間為必填');
            }

            if (startTime >= endTime) {
                throw new Error('開始時間必須早於結束時間');
            }

            logger.info('Getting drone positions by time range', { droneId, startTime, endTime });
            // TODO: 實作時間範圍查詢邏輯
            // 目前先返回空陣列，待倉庫層實作相應方法
            logger.warn('Time range query not implemented yet, returning empty array');
            return [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證座標
     *
     * @param {number | undefined} latitude - 緯度
     * @param {number | undefined} longitude - 經度
     * @throws {Error} 當座標無效時
     */
    validateCoordinates = (latitude?: number, longitude?: number): void => {
        if (latitude !== undefined) {
            if (latitude < -90 || latitude > 90) {
                throw new Error('緯度必須在 -90 到 90 度之間');
            }
        }

        if (longitude !== undefined) {
            if (longitude < -180 || longitude > 180) {
                throw new Error('經度必須在 -180 到 180 度之間');
            }
        }
    }

    /**
     * 檢查無人機位置是否存在
     *
     * @param {number} id - 位置記錄 ID
     * @returns {Promise<boolean>} 是否存在
     */
    isDronePositionExists = async (id: number): Promise<boolean> => {
        try {
            if (!id || id <= 0) {
                return false;
            }

            const position = await this.dronePositionRepo.findById(id);
            return !!position;
        } catch (error) {
            return false;
        }
    }

    /**
     * 取得無人機位置統計資料
     *
     * @returns {Promise<{total: number}>} 統計資料
     */
    getDronePositionStatistics = async (): Promise<{total: number}> => {
        try {
            logger.info('Getting drone position statistics');
            const total = await this.dronePositionRepo.count();
            
            const statistics = {
                total
            };

            logger.info('Successfully retrieved drone position statistics', { statistics });
            return statistics;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得總位置記錄數量
     *
     * @returns {Promise<number>} 總位置記錄數量
     */
    getTotalPositionCount = async (): Promise<number> => {
        try {
            logger.info('Getting total position count');
            const count = await this.dronePositionRepo.count();
            
            logger.info(`Total position count: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據無人機 ID 取得位置記錄數量
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 該無人機的位置記錄數量
     */
    getPositionCountByDrone = async (droneId: number): Promise<number> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Getting position count by drone', { droneId });
            const count = await this.dronePositionRepo.countByDroneId(droneId);
            
            logger.info(`Position count for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 獲取所有無人機位置列表（支持分頁）
     * 
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁無人機位置結果
     */
    public async getAllDronePositions(params: any = { page: 1, pageSize: 20, sortBy: 'timestamp', sortOrder: 'DESC' }): Promise<any> {
        try {
            logger.debug('Getting drone positions with pagination', params);

            // 使用 Repository 的安全分頁方法
            const paginatedResponse = await this.dronePositionRepo.selectPagination(params);

            logger.info('Successfully fetched drone positions with pagination', {
                page: paginatedResponse.pagination.page,
                limit: paginatedResponse.pagination.limit,
                total: paginatedResponse.pagination.totalItems,
                totalPages: paginatedResponse.pagination.totalPages
            });

            return paginatedResponse;
        } catch (error) {
            logger.error('Error fetching drone positions with pagination:', error);
            throw new Error('Failed to fetch drone positions with pagination');
        }
    }
}
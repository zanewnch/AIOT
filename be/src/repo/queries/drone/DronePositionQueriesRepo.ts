/**
 * @fileoverview 無人機位置查詢 Repository - CQRS 查詢端
 *
 * 專門處理無人機位置資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DronePositionModel, type DronePositionAttributes } from '../../../models/drone/DronePositionModel.js';
import type { PaginationParams, PaginatedResponse } from '../../../types/ApiResponseType.js';
import { createLogger } from '../../../configs/loggerConfig.js';

/**
 * 無人機位置查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機位置資料的查詢操作，遵循 CQRS 模式
 *
 * @class DronePositionQueriesRepository
 */
@injectable()
export class DronePositionQueriesRepository {
    private readonly logger = createLogger('DronePositionQueriesRepository');

    /**
     * 取得所有無人機位置資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionAttributes[]>} 無人機位置資料陣列
     */
    async selectAll(limit: number = 100): Promise<DronePositionAttributes[]> {
        try {
            this.logger.info('Fetching all drone position data');
            const dronePositions = await DronePositionModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${dronePositions.length} drone position records`);
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            this.logger.error('Error fetching all drone position data', { error });
            throw error;
        }
    }

    /**
     * 取得分頁無人機位置資料
     *
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DronePositionAttributes>>} 分頁無人機位置資料
     */
    async selectPagination(params: PaginationParams): Promise<PaginatedResponse<DronePositionAttributes>> {
        try {
            const { page, limit, sortBy = 'timestamp', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;

            this.logger.info('Fetching paginated drone position data', { page, limit, sortBy, sortOrder });

            // 統計總數
            const totalItems = await DronePositionModel.count();
            const totalPages = Math.ceil(totalItems / limit);

            // 取得分頁資料
            const dronePositions = await DronePositionModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });

            const data = dronePositions.map(item => item.toJSON() as DronePositionAttributes);

            const response: PaginatedResponse<DronePositionAttributes> = {
                data,
                pagination: {
                    currentPage: page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

            this.logger.info(`Successfully fetched paginated drone position data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            this.logger.error('Error fetching paginated drone position data', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<DronePositionAttributes | null>} 無人機位置資料或 null
     */
    async findById(id: number): Promise<DronePositionAttributes | null> {
        try {
            this.logger.info('Fetching drone position data by ID', { id });
            const dronePosition = await DronePositionModel.findByPk(id);

            if (dronePosition) {
                this.logger.info('Drone position data found', { id });
                return dronePosition.toJSON() as DronePositionAttributes;
            } else {
                this.logger.warn('Drone position data not found', { id });
                return null;
            }
        } catch (error) {
            this.logger.error('Error fetching drone position data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 取得最新的無人機位置資料
     *
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 最新的無人機位置資料陣列
     */
    async findLatest(limit: number = 10): Promise<DronePositionAttributes[]> {
        try {
            this.logger.info('Fetching latest drone position data', { limit });

            const dronePositions = await DronePositionModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${dronePositions.length} latest drone position records`);
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            this.logger.error('Error fetching latest drone position data', { limit, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 取得位置資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 特定無人機的位置資料陣列
     */
    async findByDroneId(droneId: number, limit: number = 10): Promise<DronePositionAttributes[]> {
        try {
            this.logger.info('Fetching drone positions by drone ID', { droneId, limit });

            const dronePositions = await DronePositionModel.findAll({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${dronePositions.length} positions for drone ${droneId}`);
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            this.logger.error('Error fetching drone positions by drone ID', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 統計總記錄數
     * 
     * @returns {Promise<number>} 總記錄數
     */
    async count(): Promise<number> {
        try {
            this.logger.info('Counting total drone position records');
            const count = await DronePositionModel.count();
            
            this.logger.info(`Total drone position records: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting total drone position records', { error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 統計記錄數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的記錄數
     */
    async countByDroneId(droneId: number): Promise<number> {
        try {
            this.logger.info('Counting drone position records by drone ID', { droneId });
            const count = await DronePositionModel.count({
                where: { drone_id: droneId }
            });
            
            this.logger.info(`Position records for drone ${droneId}: ${count}`);
            return count;
        } catch (error) {
            this.logger.error('Error counting drone position records by drone ID', { droneId, error });
            throw error;
        }
    }
}
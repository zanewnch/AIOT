/**
 * @fileoverview 無人機位置 Repository 實現
 *
 * 實現無人機位置資料存取層的具體邏輯，使用 Sequelize ORM 進行資料庫操作。
 * 遵循 Repository Pattern，提供清晰的資料存取介面。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DronePositionModel, type DronePositionAttributes, type DronePositionCreationAttributes } from '../../models/drone/DronePositionModel.js';
import type { IDronePositionRepository } from '../../types/repositories/IDronePositionRepository.js';
import type { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DronePositionRepository');

/**
 * 無人機位置 Repository 實現類別
 *
 * 實現 IDronePositionRepository 介面，提供無人機位置資料的具體存取方法
 *
 * @class DronePositionRepository
 * @implements {IDronePositionRepository}
 */
export class DronePositionRepository implements IDronePositionRepository {
    /**
     * 取得所有無人機位置資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionAttributes[]>} 無人機位置資料陣列
     */
    async selectAll(limit: number = 100): Promise<DronePositionAttributes[]> {
        try {
            logger.info('Fetching all drone position data');
            const dronePositions = await DronePositionModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${dronePositions.length} drone position records`);
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            logger.error('Error fetching all drone position data', { error });
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

            logger.info('Fetching paginated drone position data', { page, limit, sortBy, sortOrder });

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

            logger.info(`Successfully fetched paginated drone position data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            logger.error('Error fetching paginated drone position data', { params, error });
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
            logger.info('Fetching drone position data by ID', { id });
            const dronePosition = await DronePositionModel.findByPk(id);

            if (dronePosition) {
                logger.info('Drone position data found', { id });
                return dronePosition.toJSON() as DronePositionAttributes;
            } else {
                logger.warn('Drone position data not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone position data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的無人機位置資料
     *
     * @param {DronePositionCreationAttributes} data - 無人機位置建立資料
     * @returns {Promise<DronePositionAttributes>} 建立的無人機位置資料
     */
    async create(data: DronePositionCreationAttributes): Promise<DronePositionAttributes> {
        try {
            logger.info('Creating new drone position data', { data });
            const dronePosition = await DronePositionModel.create(data);

            logger.info('Drone position data created successfully', { id: dronePosition.id });
            return dronePosition.toJSON() as DronePositionAttributes;
        } catch (error) {
            logger.error('Error creating drone position data', { data, error });
            throw error;
        }
    }

    /**
     * 更新無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @param {Partial<DronePositionCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionAttributes | null>} 更新後的無人機位置資料或 null
     */
    async update(id: number, data: Partial<DronePositionCreationAttributes>): Promise<DronePositionAttributes | null> {
        try {
            logger.info('Updating drone position data', { id, data });

            const [updatedRowsCount] = await DronePositionModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedDronePosition = await DronePositionModel.findByPk(id);
                if (updatedDronePosition) {
                    logger.info('Drone position data updated successfully', { id });
                    return updatedDronePosition.toJSON() as DronePositionAttributes;
                }
            }

            logger.warn('Drone position data not found for update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating drone position data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone position data', { id });

            const deletedRowsCount = await DronePositionModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                logger.info('Drone position data deleted successfully', { id });
            } else {
                logger.warn('Drone position data not found for deletion', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error deleting drone position data', { id, error });
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
            logger.info('Fetching latest drone position data', { limit });

            const dronePositions = await DronePositionModel.findAll({
                order: [['timestamp', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${dronePositions.length} latest drone position records`);
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            logger.error('Error fetching latest drone position data', { limit, error });
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
            logger.info('Fetching drone positions by drone ID', { droneId, limit });

            const dronePositions = await DronePositionModel.findAll({
                where: { drone_id: droneId },
                order: [['timestamp', 'DESC']],
                limit
            });

            logger.info(`Successfully fetched ${dronePositions.length} positions for drone ${droneId}`);
            return dronePositions.map(item => item.toJSON() as DronePositionAttributes);
        } catch (error) {
            logger.error('Error fetching drone positions by drone ID', { droneId, limit, error });
            throw error;
        }
    }
}
/**
 * @fileoverview 無人機位置業務邏輯服務
 *
 * 處理無人機位置相關的業務邏輯，作為 Controller 和 Repository 之間的中介層。
 * 實現業務規則驗證、資料處理和錯誤處理。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DronePositionRepository } from '../repo/DronePositionRepo.js';
import type { DronePositionAttributes, DronePositionCreationAttributes } from '../../models/DronePositionModel.js';
import type { IDronePositionRepository } from '../../types/repositories/IDronePositionRepository.js';
import type { IDronePositionService } from '../../types/services/IDronePositionService.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('DronePositionService');

/**
 * 無人機位置 Service 類別
 *
 * 處理無人機位置相關的業務邏輯，包含資料驗證、業務規則和錯誤處理
 *
 * @class DronePositionService
 * @implements {IDronePositionService}
 */
export class DronePositionService implements IDronePositionService {
    private dronePositionRepository: IDronePositionRepository;

    /**
     * 建構子
     *
     * @param {IDronePositionRepository} dronePositionRepository - 無人機位置 Repository 實例
     */
    constructor(dronePositionRepository: IDronePositionRepository = new DronePositionRepository()) {
        this.dronePositionRepository = dronePositionRepository;
    }

    /**
     * 取得所有無人機位置資料
     *
     * @returns {Promise<DronePositionAttributes[]>} 無人機位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    async getAllDronePositions(): Promise<DronePositionAttributes[]> {
        try {
            logger.info('Getting all drone position data');
            const dronePositions = await this.dronePositionRepository.selectAll();

            logger.info(`Retrieved ${dronePositions.length} drone position records`);
            return dronePositions;
        } catch (error) {
            logger.error('Failed to get all drone position data', { error });
            throw new Error('無法取得無人機位置資料');
        }
    }

    /**
     * 根據 ID 取得無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<DronePositionAttributes>} 無人機位置資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    async getDronePositionById(id: number): Promise<DronePositionAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機位置資料 ID');
            }

            logger.info('Getting drone position data by ID', { id });
            const dronePosition = await this.dronePositionRepository.findById(id);

            if (!dronePosition) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            logger.info('Successfully retrieved drone position data', { id });
            return dronePosition;
        } catch (error) {
            logger.error('Failed to get drone position data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的無人機位置資料
     *
     * @param {DronePositionCreationAttributes} data - 無人機位置建立資料
     * @returns {Promise<DronePositionAttributes>} 建立的無人機位置資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    async createDronePosition(data: DronePositionCreationAttributes): Promise<DronePositionAttributes> {
        try {
            // 驗證必要欄位
            this.validateDronePositionData(data);

            logger.info('Creating new drone position data', { data });
            const dronePosition = await this.dronePositionRepository.create(data);

            logger.info('Successfully created drone position data', { id: dronePosition.id });
            return dronePosition;
        } catch (error) {
            logger.error('Failed to create drone position data', { data, error });
            throw error;
        }
    }

    /**
     * 更新無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @param {Partial<DronePositionCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionAttributes>} 更新後的無人機位置資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    async updateDronePosition(id: number, data: Partial<DronePositionCreationAttributes>): Promise<DronePositionAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機位置資料 ID');
            }

            // 驗證更新資料
            if (data.latitude !== undefined || data.longitude !== undefined) {
                this.validateCoordinates(data.latitude, data.longitude);
            }

            logger.info('Updating drone position data', { id, data });
            const updatedDronePosition = await this.dronePositionRepository.update(id, data);

            if (!updatedDronePosition) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            logger.info('Successfully updated drone position data', { id });
            return updatedDronePosition;
        } catch (error) {
            logger.error('Failed to update drone position data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    async deleteDronePosition(id: number): Promise<void> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機位置資料 ID');
            }

            logger.info('Deleting drone position data', { id });
            const success = await this.dronePositionRepository.delete(id);

            if (!success) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            logger.info('Successfully deleted drone position data', { id });
        } catch (error) {
            logger.error('Failed to delete drone position data', { id, error });
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
    async getLatestDronePositions(limit: number = 10): Promise<DronePositionAttributes[]> {
        try {
            // 驗證 limit 參數
            if (limit <= 0 || limit > 100) {
                throw new Error('限制筆數必須在 1 到 100 之間');
            }

            logger.info('Getting latest drone position data', { limit });
            const dronePositions = await this.dronePositionRepository.findLatest(limit);

            logger.info(`Retrieved ${dronePositions.length} latest drone position records`);
            return dronePositions;
        } catch (error) {
            logger.error('Failed to get latest drone position data', { limit, error });
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
    async getDronePositionsByDroneId(droneId: number, limit: number = 10): Promise<DronePositionAttributes[]> {
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
            const dronePositions = await this.dronePositionRepository.findByDroneId(droneId, limit);

            logger.info(`Retrieved ${dronePositions.length} positions for drone ${droneId}`);
            return dronePositions;
        } catch (error) {
            logger.error('Failed to get drone positions by drone ID', { droneId, limit, error });
            throw error;
        }
    }

    /**
     * 驗證無人機位置資料
     *
     * @private
     * @param {DronePositionCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料驗證失敗時
     */
    private validateDronePositionData(data: DronePositionCreationAttributes): void {
        // 驗證必要欄位
        if (!data.drone_id || data.drone_id <= 0) {
            throw new Error('無人機 ID 必須是正整數');
        }

        if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
            throw new Error('緯度和經度必須是數字');
        }

        if (typeof data.altitude !== 'number') {
            throw new Error('高度必須是數字');
        }

        if (data.signal_strength !== undefined && (typeof data.signal_strength !== 'number' || data.signal_strength < 0)) {
            throw new Error('信號強度必須是非負數');
        }

        if (data.speed !== undefined && (typeof data.speed !== 'number' || data.speed < 0)) {
            throw new Error('速度必須是非負數');
        }

        if (data.heading !== undefined && (typeof data.heading !== 'number' || data.heading < 0 || data.heading >= 360)) {
            throw new Error('航向角度必須在 0-360 度之間');
        }

        if (data.battery_level !== undefined && (typeof data.battery_level !== 'number' || data.battery_level < 0 || data.battery_level > 100)) {
            throw new Error('電池電量必須在 0-100% 之間');
        }

        this.validateCoordinates(data.latitude, data.longitude);
    }

    /**
     * 驗證座標
     *
     * @private
     * @param {number | undefined} latitude - 緯度
     * @param {number | undefined} longitude - 經度
     * @throws {Error} 當座標無效時
     */
    private validateCoordinates(latitude?: number, longitude?: number): void {
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
}
/**
 * @fileoverview RTK 業務邏輯服務
 *
 * 處理 RTK 相關的業務邏輯，作為 Controller 和 Repository 之間的中介層。
 * 實現業務規則驗證、資料處理和錯誤處理。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { RTKRepository } from '../repo/RTKRepo.js';
import type { RTKAttributes, RTKCreationAttributes } from '../models/RTKModel.js';
import type { IRTKRepository } from '../types/repositories/IRTKRepository.js';
import type { IRTKService } from '../types/services/IRTKService.js';
import { createLogger } from '../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('RTKService');

/**
 * RTK Service 類別
 *
 * 處理 RTK 相關的業務邏輯，包含資料驗證、業務規則和錯誤處理
 *
 * @class RTKService
 * @implements {IRTKService}
 */
export class RTKService implements IRTKService {
    private rtkRepository: IRTKRepository;

    /**
     * 建構子
     *
     * @param {IRTKRepository} rtkRepository - RTK Repository 實例
     */
    constructor(rtkRepository: IRTKRepository = new RTKRepository()) {
        this.rtkRepository = rtkRepository;
    }

    /**
     * 取得所有 RTK 資料
     *
     * @returns {Promise<RTKAttributes[]>} RTK 資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    async getAllRTKData(): Promise<RTKAttributes[]> {
        try {
            logger.info('Getting all RTK data');
            const rtkData = await this.rtkRepository.findAll();

            logger.info(`Retrieved ${rtkData.length} RTK records`);
            return rtkData;
        } catch (error) {
            logger.error('Failed to get all RTK data', { error });
            throw new Error('無法取得 RTK 資料');
        }
    }

    /**
     * 根據 ID 取得 RTK 資料
     *
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<RTKAttributes>} RTK 資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    async getRTKDataById(id: number): Promise<RTKAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的 RTK 資料 ID');
            }

            logger.info('Getting RTK data by ID', { id });
            const rtkData = await this.rtkRepository.findById(id);

            if (!rtkData) {
                throw new Error(`找不到 ID 為 ${id} 的 RTK 資料`);
            }

            logger.info('Successfully retrieved RTK data', { id });
            return rtkData;
        } catch (error) {
            logger.error('Failed to get RTK data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的 RTK 資料
     *
     * @param {RTKCreationAttributes} data - RTK 建立資料
     * @returns {Promise<RTKAttributes>} 建立的 RTK 資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    async createRTKData(data: RTKCreationAttributes): Promise<RTKAttributes> {
        try {
            // 驗證必要欄位
            this.validateRTKData(data);

            logger.info('Creating new RTK data', { data });
            const rtkData = await this.rtkRepository.create(data);

            logger.info('Successfully created RTK data', { id: rtkData.id });
            return rtkData;
        } catch (error) {
            logger.error('Failed to create RTK data', { data, error });
            throw error;
        }
    }

    /**
     * 更新 RTK 資料
     *
     * @param {number} id - RTK 資料 ID
     * @param {Partial<RTKCreationAttributes>} data - 更新資料
     * @returns {Promise<RTKAttributes>} 更新後的 RTK 資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    async updateRTKData(id: number, data: Partial<RTKCreationAttributes>): Promise<RTKAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的 RTK 資料 ID');
            }

            // 驗證更新資料
            if (data.latitude !== undefined || data.longitude !== undefined) {
                this.validateCoordinates(data.latitude, data.longitude);
            }

            logger.info('Updating RTK data', { id, data });
            const updatedRtkData = await this.rtkRepository.update(id, data);

            if (!updatedRtkData) {
                throw new Error(`找不到 ID 為 ${id} 的 RTK 資料`);
            }

            logger.info('Successfully updated RTK data', { id });
            return updatedRtkData;
        } catch (error) {
            logger.error('Failed to update RTK data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除 RTK 資料
     *
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    async deleteRTKData(id: number): Promise<void> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的 RTK 資料 ID');
            }

            logger.info('Deleting RTK data', { id });
            const success = await this.rtkRepository.delete(id);

            if (!success) {
                throw new Error(`找不到 ID 為 ${id} 的 RTK 資料`);
            }

            logger.info('Successfully deleted RTK data', { id });
        } catch (error) {
            logger.error('Failed to delete RTK data', { id, error });
            throw error;
        }
    }

    /**
     * 取得最新的 RTK 資料
     *
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<RTKAttributes[]>} 最新的 RTK 資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    async getLatestRTKData(limit: number = 10): Promise<RTKAttributes[]> {
        try {
            // 驗證 limit 參數
            if (limit <= 0 || limit > 100) {
                throw new Error('限制筆數必須在 1 到 100 之間');
            }

            logger.info('Getting latest RTK data', { limit });
            const rtkData = await this.rtkRepository.findLatest(limit);

            logger.info(`Retrieved ${rtkData.length} latest RTK records`);
            return rtkData;
        } catch (error) {
            logger.error('Failed to get latest RTK data', { limit, error });
            throw error;
        }
    }

    /**
     * 驗證 RTK 資料
     *
     * @private
     * @param {RTKCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料驗證失敗時
     */
    private validateRTKData(data: RTKCreationAttributes): void {
        if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
            throw new Error('緯度和經度必須是數字');
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
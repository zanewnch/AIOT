/**
 * @fileoverview 無人機狀態業務邏輯服務
 *
 * 處理無人機狀態相關的業務邏輯，作為 Controller 和 Repository 之間的中介層。
 * 實現業務規則驗證、資料處理和錯誤處理。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { DroneStatusRepository } from '../../repo/drone/DroneStatusRepo.js';
import type { DroneStatusAttributes, DroneStatusCreationAttributes } from '../../models/drone/DroneStatusModel.js';
import { DroneStatus } from '../../models/drone/DroneStatusModel.js';
import type { IDroneStatusRepository } from '../../types/repositories/IDroneStatusRepository.js';
import type { IDroneStatusService } from '../../types/services/IDroneStatusService.js';
import { createLogger } from '../../configs/loggerConfig.js';

// 創建 Service 專用的日誌記錄器
const logger = createLogger('DroneStatusService');

/**
 * 無人機狀態 Service 類別
 *
 * 處理無人機狀態相關的業務邏輯，包含資料驗證、業務規則和錯誤處理
 *
 * @class DroneStatusService
 * @implements {IDroneStatusService}
 */
export class DroneStatusService implements IDroneStatusService {
    private droneStatusRepository: IDroneStatusRepository;

    /**
     * 建構子
     *
     * @param {IDroneStatusRepository} droneStatusRepository - 無人機狀態 Repository 實例
     */
    constructor(droneStatusRepository: IDroneStatusRepository = new DroneStatusRepository()) {
        this.droneStatusRepository = droneStatusRepository;
    }

    /**
     * 取得所有無人機狀態資料
     *
     * @returns {Promise<DroneStatusAttributes[]>} 無人機狀態資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    async getAllDroneStatuses(): Promise<DroneStatusAttributes[]> {
        try {
            logger.info('Getting all drone status data');
            const droneStatuses = await this.droneStatusRepository.selectAll();

            logger.info(`Retrieved ${droneStatuses.length} drone status records`);
            return droneStatuses;
        } catch (error) {
            logger.error('Failed to get all drone status data', { error });
            throw new Error('無法取得無人機狀態資料');
        }
    }

    /**
     * 根據 ID 取得無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<DroneStatusAttributes>} 無人機狀態資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    async getDroneStatusById(id: number): Promise<DroneStatusAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機狀態資料 ID');
            }

            logger.info('Getting drone status data by ID', { id });
            const droneStatus = await this.droneStatusRepository.findById(id);

            if (!droneStatus) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            logger.info('Successfully retrieved drone status data', { id });
            return droneStatus;
        } catch (error) {
            logger.error('Failed to get drone status data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機序號取得無人機狀態資料
     *
     * @param {string} droneSerial - 無人機序號
     * @returns {Promise<DroneStatusAttributes>} 無人機狀態資料
     * @throws {Error} 當序號無效或資料不存在時
     */
    async getDroneStatusBySerial(droneSerial: string): Promise<DroneStatusAttributes> {
        try {
            // 驗證序號
            if (!droneSerial || droneSerial.trim() === '') {
                throw new Error('無效的無人機序號');
            }

            logger.info('Getting drone status data by serial', { droneSerial });
            const droneStatus = await this.droneStatusRepository.findByDroneSerial(droneSerial);

            if (!droneStatus) {
                throw new Error(`找不到序號為 ${droneSerial} 的無人機資料`);
            }

            logger.info('Successfully retrieved drone status data by serial', { droneSerial });
            return droneStatus;
        } catch (error) {
            logger.error('Failed to get drone status data by serial', { droneSerial, error });
            throw error;
        }
    }

    /**
     * 建立新的無人機狀態資料
     *
     * @param {DroneStatusCreationAttributes} data - 無人機狀態建立資料
     * @returns {Promise<DroneStatusAttributes>} 建立的無人機狀態資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    async createDroneStatus(data: DroneStatusCreationAttributes): Promise<DroneStatusAttributes> {
        try {
            // 驗證必要欄位
            await this.validateDroneStatusData(data);

            // 檢查序號是否已存在
            const isDuplicate = await this.isDroneSerialExists(data.drone_serial);
            if (isDuplicate) {
                throw new Error('無人機序號已存在');
            }

            logger.info('Creating new drone status data', { data });
            const droneStatus = await this.droneStatusRepository.create(data);

            logger.info('Successfully created drone status data', { id: droneStatus.id });
            return droneStatus;
        } catch (error) {
            logger.error('Failed to create drone status data', { data, error });
            throw error;
        }
    }

    /**
     * 更新無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @param {Partial<DroneStatusCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusAttributes>} 更新後的無人機狀態資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    async updateDroneStatus(id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機狀態資料 ID');
            }

            // 驗證更新資料
            if (data.drone_serial) {
                const isDuplicate = await this.isDroneSerialExists(data.drone_serial, id);
                if (isDuplicate) {
                    throw new Error('無人機序號已存在');
                }
            }

            // 驗證數值範圍
            this.validateNumericFields(data);

            logger.info('Updating drone status data', { id, data });
            const updatedDroneStatus = await this.droneStatusRepository.update(id, data);

            if (!updatedDroneStatus) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            logger.info('Successfully updated drone status data', { id });
            return updatedDroneStatus;
        } catch (error) {
            logger.error('Failed to update drone status data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    async deleteDroneStatus(id: number): Promise<void> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機狀態資料 ID');
            }

            logger.info('Deleting drone status data', { id });
            const success = await this.droneStatusRepository.delete(id);

            if (!success) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            logger.info('Successfully deleted drone status data', { id });
        } catch (error) {
            logger.error('Failed to delete drone status data', { id, error });
            throw error;
        }
    }

    /**
     * 根據狀態查詢無人機
     *
     * @param {DroneStatus} status - 無人機狀態
     * @returns {Promise<DroneStatusAttributes[]>} 指定狀態的無人機陣列
     * @throws {Error} 當狀態無效或查詢失敗時
     */
    async getDronesByStatus(status: DroneStatus): Promise<DroneStatusAttributes[]> {
        try {
            // 驗證狀態
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }

            logger.info('Getting drones by status', { status });
            const droneStatuses = await this.droneStatusRepository.findByStatus(status);

            logger.info(`Retrieved ${droneStatuses.length} drones with status ${status}`);
            return droneStatuses;
        } catch (error) {
            logger.error('Failed to get drones by status', { status, error });
            throw error;
        }
    }

    /**
     * 根據擁有者 ID 查詢無人機
     *
     * @param {number} ownerUserId - 擁有者用戶 ID
     * @returns {Promise<DroneStatusAttributes[]>} 指定擁有者的無人機陣列
     * @throws {Error} 當用戶 ID 無效或查詢失敗時
     */
    async getDronesByOwner(ownerUserId: number): Promise<DroneStatusAttributes[]> {
        try {
            // 驗證用戶 ID
            if (!ownerUserId || ownerUserId <= 0) {
                throw new Error('無效的擁有者用戶 ID');
            }

            logger.info('Getting drones by owner', { ownerUserId });
            const droneStatuses = await this.droneStatusRepository.findByOwner(ownerUserId);

            logger.info(`Retrieved ${droneStatuses.length} drones for owner ${ownerUserId}`);
            return droneStatuses;
        } catch (error) {
            logger.error('Failed to get drones by owner', { ownerUserId, error });
            throw error;
        }
    }

    /**
     * 根據製造商查詢無人機
     *
     * @param {string} manufacturer - 製造商名稱
     * @returns {Promise<DroneStatusAttributes[]>} 指定製造商的無人機陣列
     * @throws {Error} 當製造商名稱無效或查詢失敗時
     */
    async getDronesByManufacturer(manufacturer: string): Promise<DroneStatusAttributes[]> {
        try {
            // 驗證製造商名稱
            if (!manufacturer || manufacturer.trim() === '') {
                throw new Error('無效的製造商名稱');
            }

            logger.info('Getting drones by manufacturer', { manufacturer });
            const droneStatuses = await this.droneStatusRepository.findByManufacturer(manufacturer);

            logger.info(`Retrieved ${droneStatuses.length} drones from manufacturer ${manufacturer}`);
            return droneStatuses;
        } catch (error) {
            logger.error('Failed to get drones by manufacturer', { manufacturer, error });
            throw error;
        }
    }

    /**
     * 更新無人機狀態
     *
     * @param {number} id - 無人機 ID
     * @param {DroneStatus} status - 新狀態
     * @returns {Promise<DroneStatusAttributes>} 更新後的無人機資料
     * @throws {Error} 當 ID 或狀態無效、更新失敗時
     */
    async updateDroneStatusOnly(id: number, status: DroneStatus): Promise<DroneStatusAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機 ID');
            }

            // 驗證狀態
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }

            logger.info('Updating drone status only', { id, status });
            const updatedDroneStatus = await this.droneStatusRepository.updateStatus(id, status);

            if (!updatedDroneStatus) {
                throw new Error(`找不到 ID 為 ${id} 的無人機`);
            }

            logger.info('Successfully updated drone status', { id, status });
            return updatedDroneStatus;
        } catch (error) {
            logger.error('Failed to update drone status', { id, status, error });
            throw error;
        }
    }

    /**
     * 檢查無人機序號是否已存在
     *
     * @param {string} droneSerial - 無人機序號
     * @param {number} excludeId - 排除的 ID（用於更新時檢查）
     * @returns {Promise<boolean>} 是否已存在
     */
    async isDroneSerialExists(droneSerial: string, excludeId?: number): Promise<boolean> {
        try {
            const existingDrone = await this.droneStatusRepository.findByDroneSerial(droneSerial);

            if (!existingDrone) {
                return false;
            }

            // 如果有排除 ID，檢查是否為同一筆資料
            if (excludeId && existingDrone.id === excludeId) {
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Error checking drone serial existence', { droneSerial, excludeId, error });
            throw error;
        }
    }

    /**
     * 取得無人機狀態統計
     *
     * @returns {Promise<{[key in DroneStatus]: number}>} 各狀態的無人機數量統計
     */
    async getDroneStatusStatistics(): Promise<{ [key in DroneStatus]: number }> {
        try {
            logger.info('Getting drone status statistics');

            const statistics: { [key in DroneStatus]: number } = {
                [DroneStatus.ACTIVE]: 0,
                [DroneStatus.INACTIVE]: 0,
                [DroneStatus.MAINTENANCE]: 0,
                [DroneStatus.FLYING]: 0
            };

            // 並行查詢各狀態的數量
            const promises = Object.values(DroneStatus).map(async (status) => {
                const drones = await this.droneStatusRepository.findByStatus(status);
                return { status, count: drones.length };
            });

            const results = await Promise.all(promises);

            results.forEach(({ status, count }) => {
                statistics[status] = count;
            });

            logger.info('Successfully retrieved drone status statistics', { statistics });
            return statistics;
        } catch (error) {
            logger.error('Failed to get drone status statistics', { error });
            throw error;
        }
    }

    /**
     * 驗證無人機狀態資料
     *
     * @private
     * @param {DroneStatusCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料驗證失敗時
     */
    private async validateDroneStatusData(data: DroneStatusCreationAttributes): Promise<void> {
        // 驗證必要欄位
        if (!data.drone_serial || data.drone_serial.trim() === '') {
            throw new Error('無人機序號為必填欄位');
        }

        if (!data.drone_name || data.drone_name.trim() === '') {
            throw new Error('無人機名稱為必填欄位');
        }

        if (!data.model || data.model.trim() === '') {
            throw new Error('型號為必填欄位');
        }

        if (!data.manufacturer || data.manufacturer.trim() === '') {
            throw new Error('製造商為必填欄位');
        }

        if (!data.owner_user_id || data.owner_user_id <= 0) {
            throw new Error('擁有者用戶 ID 必須是正整數');
        }

        if (!data.status || !Object.values(DroneStatus).includes(data.status)) {
            throw new Error('無效的無人機狀態');
        }

        // 驗證數值範圍
        this.validateNumericFields(data);
    }

    /**
     * 驗證數值欄位
     *
     * @private
     * @param {Partial<DroneStatusCreationAttributes>} data - 要驗證的資料
     * @throws {Error} 當數值無效時
     */
    private validateNumericFields(data: Partial<DroneStatusCreationAttributes>): void {
        if (data.max_altitude !== undefined && (typeof data.max_altitude !== 'number' || data.max_altitude <= 0)) {
            throw new Error('最大飛行高度必須是正數');
        }

        if (data.max_range !== undefined && (typeof data.max_range !== 'number' || data.max_range <= 0)) {
            throw new Error('最大飛行距離必須是正數');
        }

        if (data.battery_capacity !== undefined && (typeof data.battery_capacity !== 'number' || data.battery_capacity <= 0)) {
            throw new Error('電池容量必須是正數');
        }

        if (data.weight !== undefined && (typeof data.weight !== 'number' || data.weight <= 0)) {
            throw new Error('重量必須是正數');
        }
    }
}
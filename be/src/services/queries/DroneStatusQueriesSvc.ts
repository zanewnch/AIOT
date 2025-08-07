/**
 * @fileoverview 無人機狀態查詢 Service 實現
 *
 * 此文件實作了無人機狀態查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusRepository } from '../../repo/drone/DroneStatusRepo.js';
import type { DroneStatusAttributes } from '../../models/drone/DroneStatusModel.js';
import { DroneStatus } from '../../models/drone/DroneStatusModel.js';
import type { IDroneStatusRepository } from '../../types/repositories/IDroneStatusRepository.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneStatusQueriesSvc');

/**
 * 無人機狀態查詢 Service 實現類別
 *
 * 專門處理無人機狀態相關的查詢請求，包含取得狀態資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneStatusQueriesSvc {
    private droneStatusRepository: IDroneStatusRepository;

    constructor(droneStatusRepository: IDroneStatusRepository = new DroneStatusRepository()) {
        this.droneStatusRepository = droneStatusRepository;
    }

    /**
     * 取得所有無人機狀態資料
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
     */
    async getDroneStatusById(id: number): Promise<DroneStatusAttributes> {
        try {
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
     */
    async getDroneStatusBySerial(droneSerial: string): Promise<DroneStatusAttributes> {
        try {
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
     * 根據狀態查詢無人機
     */
    async getDronesByStatus(status: DroneStatus): Promise<DroneStatusAttributes[]> {
        try {
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
     */
    async getDronesByOwner(ownerUserId: number): Promise<DroneStatusAttributes[]> {
        try {
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
     */
    async getDronesByManufacturer(manufacturer: string): Promise<DroneStatusAttributes[]> {
        try {
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
     * 檢查無人機序號是否已存在
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
     * 取得總無人機數量
     */
    async getTotalDroneCount(): Promise<number> {
        try {
            logger.info('Getting total drone count');
            const droneStatuses = await this.droneStatusRepository.selectAll();
            const count = droneStatuses.length;
            
            logger.info(`Total drone count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Failed to get total drone count', { error });
            throw error;
        }
    }

    /**
     * 取得活躍無人機數量
     */
    async getActiveDroneCount(): Promise<number> {
        try {
            logger.info('Getting active drone count');
            const activeDrones = await this.droneStatusRepository.findByStatus(DroneStatus.ACTIVE);
            const count = activeDrones.length;
            
            logger.info(`Active drone count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Failed to get active drone count', { error });
            throw error;
        }
    }

    /**
     * 取得飛行中無人機數量
     */
    async getFlyingDroneCount(): Promise<number> {
        try {
            logger.info('Getting flying drone count');
            const flyingDrones = await this.droneStatusRepository.findByStatus(DroneStatus.FLYING);
            const count = flyingDrones.length;
            
            logger.info(`Flying drone count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Failed to get flying drone count', { error });
            throw error;
        }
    }

    /**
     * 取得需要維護的無人機數量
     */
    async getMaintenanceDroneCount(): Promise<number> {
        try {
            logger.info('Getting maintenance drone count');
            const maintenanceDrones = await this.droneStatusRepository.findByStatus(DroneStatus.MAINTENANCE);
            const count = maintenanceDrones.length;
            
            logger.info(`Maintenance drone count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Failed to get maintenance drone count', { error });
            throw error;
        }
    }

    /**
     * 取得離線無人機數量
     */
    async getInactiveDroneCount(): Promise<number> {
        try {
            logger.info('Getting inactive drone count');
            const inactiveDrones = await this.droneStatusRepository.findByStatus(DroneStatus.INACTIVE);
            const count = inactiveDrones.length;
            
            logger.info(`Inactive drone count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Failed to get inactive drone count', { error });
            throw error;
        }
    }

    /**
     * 根據型號查詢無人機
     */
    async getDronesByModel(model: string): Promise<DroneStatusAttributes[]> {
        try {
            if (!model || model.trim() === '') {
                throw new Error('無效的型號名稱');
            }

            logger.info('Getting drones by model', { model });
            const droneStatuses = await this.droneStatusRepository.selectAll();
            const filteredDrones = droneStatuses.filter(drone => drone.model === model);

            logger.info(`Retrieved ${filteredDrones.length} drones with model ${model}`);
            return filteredDrones;
        } catch (error) {
            logger.error('Failed to get drones by model', { model, error });
            throw error;
        }
    }

    /**
     * 搜尋無人機（根據名稱或序號）
     */
    async searchDrones(searchTerm: string): Promise<DroneStatusAttributes[]> {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                throw new Error('搜尋條件不能為空');
            }

            logger.info('Searching drones', { searchTerm });
            const allDrones = await this.droneStatusRepository.selectAll();
            const searchResults = allDrones.filter(drone => 
                drone.drone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.drone_serial.toLowerCase().includes(searchTerm.toLowerCase())
            );

            logger.info(`Found ${searchResults.length} drones matching search term: ${searchTerm}`);
            return searchResults;
        } catch (error) {
            logger.error('Failed to search drones', { searchTerm, error });
            throw error;
        }
    }
}
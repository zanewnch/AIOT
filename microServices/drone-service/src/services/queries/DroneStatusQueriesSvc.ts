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
import { injectable, inject } from 'inversify';
import { DroneStatusQueriesRepo } from '../../repo/queries/DroneStatusQueriesRepo.js';
import { TYPES } from '../../container/types.js';
import type { DroneStatusAttributes } from '../../models/DroneStatusModel.js';
import { DroneStatus } from '../../models/DroneStatusModel.js';
import type { IDroneStatusRepository } from '../../types/repositories/IDroneStatusRepository.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';
import { PaginationParams, PaginatedResult, PaginationUtils } from '../../types/PaginationTypes.js';

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
    private droneStatusRepo: DroneStatusQueriesRepo;

    constructor(
        @inject(TYPES.DroneStatusQueriesRepo) droneStatusRepo: DroneStatusQueriesRepo
    ) {
        this.droneStatusRepo = droneStatusRepo;
    }


    /**
     * 根據 ID 取得無人機狀態資料
     */
    getDroneStatusById = async (id: number): Promise<DroneStatusAttributes> => {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的無人機狀態資料 ID');
            }

            logger.info('Getting drone status data by ID', { id });
            const droneStatus = await this.droneStatusRepo.findById(id);

            if (!droneStatus) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            logger.info('Successfully retrieved drone status data', { id });
            return droneStatus;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據無人機序號取得無人機狀態資料
     */
    getDroneStatusBySerial = async (droneSerial: string): Promise<DroneStatusAttributes> => {
        try {
            if (!droneSerial || droneSerial.trim() === '') {
                throw new Error('無效的無人機序號');
            }

            logger.info('Getting drone status data by serial', { droneSerial });
            const droneStatus = await this.droneStatusRepo.findByDroneSerial(droneSerial);

            if (!droneStatus) {
                throw new Error(`找不到序號為 ${droneSerial} 的無人機資料`);
            }

            logger.info('Successfully retrieved drone status data by serial', { droneSerial });
            return droneStatus;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據狀態查詢無人機
     */
    getDronesByStatus = async (status: DroneStatus): Promise<DroneStatusAttributes[]> => {
        try {
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }

            logger.info('Getting drones by status', { status });
            const droneStatuses = await this.droneStatusRepo.findByStatus(status);

            logger.info(`Retrieved ${droneStatuses.length} drones with status ${status}`);
            return droneStatuses;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據擁有者 ID 查詢無人機
     */
    getDronesByOwner = async (ownerUserId: number): Promise<DroneStatusAttributes[]> => {
        try {
            if (!ownerUserId || ownerUserId <= 0) {
                throw new Error('無效的擁有者用戶 ID');
            }

            logger.info('Getting drones by owner', { ownerUserId });
            const droneStatuses = await this.droneStatusRepo.findByOwner(ownerUserId);

            logger.info(`Retrieved ${droneStatuses.length} drones for owner ${ownerUserId}`);
            return droneStatuses;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據製造商查詢無人機
     */
    getDronesByManufacturer = async (manufacturer: string): Promise<DroneStatusAttributes[]> => {
        try {
            if (!manufacturer || manufacturer.trim() === '') {
                throw new Error('無效的製造商名稱');
            }

            logger.info('Getting drones by manufacturer', { manufacturer });
            const droneStatuses = await this.droneStatusRepo.findByManufacturer(manufacturer);

            logger.info(`Retrieved ${droneStatuses.length} drones from manufacturer ${manufacturer}`);
            return droneStatuses;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 檢查無人機序號是否已存在
     */
    isDroneSerialExists = async (droneSerial: string, excludeId?: number): Promise<boolean> => {
        try {
            const existingDrone = await this.droneStatusRepo.findByDroneSerial(droneSerial);

            if (!existingDrone) {
                return false;
            }

            // 如果有排除 ID，檢查是否為同一筆資料
            if (excludeId && existingDrone.id === excludeId) {
                return false;
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得無人機狀態統計
     */
    getDroneStatusStatistics = async (): Promise<{ [key in DroneStatus]: number }> => {
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
                const drones = await this.droneStatusRepo.findByStatus(status);
                return { status, count: drones.length };
            });

            const results = await Promise.all(promises);

            results.forEach(({ status, count }) => {
                statistics[status] = count;
            });

            logger.info('Successfully retrieved drone status statistics', { statistics });
            return statistics;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得總無人機數量
     */
    getTotalDroneCount = async (): Promise<number> => {
        try {
            logger.info('Getting total drone count');
            const droneStatuses = await this.droneStatusRepo.findAll();
            const count = droneStatuses.length;
            
            logger.info(`Total drone count: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得活躍無人機數量
     */
    getActiveDroneCount = async (): Promise<number> => {
        try {
            logger.info('Getting active drone count');
            const activeDrones = await this.droneStatusRepo.findByStatus(DroneStatus.ACTIVE);
            const count = activeDrones.length;
            
            logger.info(`Active drone count: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得飛行中無人機數量
     */
    getFlyingDroneCount = async (): Promise<number> => {
        try {
            logger.info('Getting flying drone count');
            const flyingDrones = await this.droneStatusRepo.findByStatus(DroneStatus.FLYING);
            const count = flyingDrones.length;
            
            logger.info(`Flying drone count: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得需要維護的無人機數量
     */
    getMaintenanceDroneCount = async (): Promise<number> => {
        try {
            logger.info('Getting maintenance drone count');
            const maintenanceDrones = await this.droneStatusRepo.findByStatus(DroneStatus.MAINTENANCE);
            const count = maintenanceDrones.length;
            
            logger.info(`Maintenance drone count: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得離線無人機數量
     */
    getInactiveDroneCount = async (): Promise<number> => {
        try {
            logger.info('Getting inactive drone count');
            const inactiveDrones = await this.droneStatusRepo.findByStatus(DroneStatus.INACTIVE);
            const count = inactiveDrones.length;
            
            logger.info(`Inactive drone count: ${count}`);
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據型號查詢無人機
     */
    getDronesByModel = async (model: string): Promise<DroneStatusAttributes[]> => {
        try {
            if (!model || model.trim() === '') {
                throw new Error('無效的型號名稱');
            }

            logger.info('Getting drones by model', { model });
            const droneStatuses = await this.droneStatusRepo.findAll();
            const filteredDrones = droneStatuses.filter((drone: any) => drone.model === model);

            logger.info(`Retrieved ${filteredDrones.length} drones with model ${model}`);
            return filteredDrones;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 搜尋無人機（根據名稱或序號）
     */
    searchDrones = async (searchTerm: string): Promise<DroneStatusAttributes[]> => {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                throw new Error('搜尋條件不能為空');
            }

            logger.info('Searching drones', { searchTerm });
            const allDrones = await this.droneStatusRepo.findAll();
            const searchResults = allDrones.filter((drone: any) => 
                drone.drone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.drone_serial.toLowerCase().includes(searchTerm.toLowerCase())
            );

            logger.info(`Found ${searchResults.length} drones matching search term: ${searchTerm}`);
            return searchResults;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 獲取所有無人機狀態列表（支持分頁）
     * 
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁無人機狀態結果
     */
    public async getAllDroneStatuses(params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'DESC' }): Promise<PaginatedResult<DroneStatusAttributes>> {
        try {
            logger.debug('Getting drone statuses with pagination', params);

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'id',
                defaultSortOrder: 'DESC',
                allowedSortFields: ['id', 'drone_name', 'drone_serial', 'status', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據
            const [droneStatuses, total] = await Promise.all([
                this.droneStatusRepo.findPaginatedUnified(
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.droneStatusRepo.count()
            ]);

            // 創建分頁結果
            const result = PaginationUtils.createPaginatedResult(
                droneStatuses,
                total,
                validatedParams.page,
                validatedParams.pageSize
            );

            logger.info('Successfully fetched drone statuses with pagination', {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error fetching drone statuses with pagination:', error);
            throw new Error('Failed to fetch drone statuses with pagination');
        }
    }
}
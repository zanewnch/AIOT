/**
 * @fileoverview 無人機狀態查詢 Repository - CQRS 查詢端
 * 
 * 專門處理無人機狀態資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusModel, type DroneStatusAttributes, DroneStatus } from '../../models/DroneStatusModel.js';
import type { PaginationParams, PaginatedResponse } from '../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneStatusQueriesRepo');

/**
 * 無人機狀態查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理無人機狀態資料的查詢操作，遵循 CQRS 模式
 * 
 * @class DroneStatusQueriesRepo
 */
@injectable()
export class DroneStatusQueriesRepo {
    /**
     * 取得所有無人機狀態資料（使用分頁方法以統一介面）
     *
     * **設計意圖說明：**
     * 此方法原本是獨立的 Sequelize 查詢實現，現已重構為使用 findPaginated 統一介面。
     * Drone 服務特定的重構考量：
     * 1. **IoT 資料查詢統一**：無人機狀態、位置、命令等查詢都使用相同的分頁模式
     * 2. **即時性與分頁兼容**：保持原有的 limit 參數，同時利用分頁機制的排序功能  
     * 3. **資料量管理**：無人機狀態資料可能大量增長，統一分頁有助於效能控制
     * 4. **返回格式一致**：通過 .data 取出純資料陣列，保持與原介面完全相同
     * 5. **監控與日誌整合**：利用 findPaginated 的統一日誌記錄機制
     * 
     * 實現策略：將 limit 參數直接對應到 PaginationParams.limit，保持向後兼容性
     *
     * @param {number} limit 限制筆數，預設為 100
     * @returns {Promise<DroneStatusAttributes[]>} 無人機狀態資料陣列
     */
    findAll = async (limit: number = 100): Promise<DroneStatusAttributes[]> => {
        // 統一使用 findPaginated 方法，只返回 data 部分以保持相同介面
        const params: PaginationParams = {
            page: 1,
            limit: limit,
            sortBy: 'createdAt',
            sortOrder: 'DESC'
        };
        const paginatedResult = await this.findPaginated(params);
        return paginatedResult.data;
    }

    /**
     * 取得分頁無人機狀態資料
     *
     * @param {PaginationParams} params 分頁參數
     * @returns {Promise<PaginatedResponse<DroneStatusAttributes>>} 分頁無人機狀態資料
     */
    findPaginated = async (params: PaginationParams): Promise<PaginatedResponse<DroneStatusAttributes>> => {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
            const offset = (page - 1) * limit;

            logger.info('Fetching paginated drone status data', { page, limit, sortBy, sortOrder });

            const totalItems = await DroneStatusModel.count();
            const totalPages = Math.ceil(totalItems / limit);

            const droneStatuses = await DroneStatusModel.findAll({
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });

            const data = droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);

            const response: PaginatedResponse<DroneStatusAttributes> = {
                data,
                pagination: {
                    page: page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

            logger.info(`Successfully fetched paginated drone status data: page ${page}/${totalPages}, ${data.length} records`);
            return response;
        } catch (error) {
            logger.error('Error fetching paginated drone status data', { params, error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆無人機狀態資料
     *
     * @param {number} id 無人機狀態資料 ID
     * @returns {Promise<DroneStatusAttributes | null>} 無人機狀態資料或 null
     */
    findById = async (id: number): Promise<DroneStatusAttributes | null> => {
        try {
            logger.info('Fetching drone status data by ID', { id });
            const droneStatus = await DroneStatusModel.findByPk(id);

            if (droneStatus) {
                logger.info('Drone status data found', { id });
                return droneStatus.toJSON() as DroneStatusAttributes;
            } else {
                logger.warn('Drone status data not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone status data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據無人機序號取得無人機狀態資料
     *
     * @param {string} droneSerial 無人機序號
     * @returns {Promise<DroneStatusAttributes | null>} 無人機狀態資料或 null
     */
    findByDroneSerial = async (droneSerial: string): Promise<DroneStatusAttributes | null> => {
        try {
            logger.info('Fetching drone status data by serial', { droneSerial });
            const droneStatus = await DroneStatusModel.findOne({
                where: { drone_serial: droneSerial }
            });

            if (droneStatus) {
                logger.info('Drone status data found by serial', { droneSerial });
                return droneStatus.toJSON() as DroneStatusAttributes;
            } else {
                logger.warn('Drone status data not found by serial', { droneSerial });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching drone status data by serial', { droneSerial, error });
            throw error;
        }
    }

    /**
     * 根據狀態查詢無人機
     *
     * @param {DroneStatus} status 無人機狀態
     * @returns {Promise<DroneStatusAttributes[]>} 指定狀態的無人機陣列
     */
    findByStatus = async (status: DroneStatus): Promise<DroneStatusAttributes[]> => {
        try {
            logger.info('Fetching drone status data by status', { status });

            const droneStatuses = await DroneStatusModel.findAll({
                where: { status },
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Successfully fetched ${droneStatuses.length} drones with status ${status}`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching drone status data by status', { status, error });
            throw error;
        }
    }

    /**
     * 根據擁有者 ID 查詢無人機
     *
     * @param {number} ownerUserId 擁有者用戶 ID
     * @returns {Promise<DroneStatusAttributes[]>} 指定擁有者的無人機陣列
     */
    findByOwner = async (ownerUserId: number): Promise<DroneStatusAttributes[]> => {
        try {
            logger.info('Fetching drone status data by owner', { ownerUserId });

            const droneStatuses = await DroneStatusModel.findAll({
                where: { owner_user_id: ownerUserId },
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Successfully fetched ${droneStatuses.length} drones for owner ${ownerUserId}`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching drone status data by owner', { ownerUserId, error });
            throw error;
        }
    }

    /**
     * 根據製造商查詢無人機
     *
     * @param {string} manufacturer 製造商名稱
     * @returns {Promise<DroneStatusAttributes[]>} 指定製造商的無人機陣列
     */
    findByManufacturer = async (manufacturer: string): Promise<DroneStatusAttributes[]> => {
        try {
            logger.info('Fetching drone status data by manufacturer', { manufacturer });

            const droneStatuses = await DroneStatusModel.findAll({
                where: { manufacturer },
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Successfully fetched ${droneStatuses.length} drones from manufacturer ${manufacturer}`);
            return droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
        } catch (error) {
            logger.error('Error fetching drone status data by manufacturer', { manufacturer, error });
            throw error;
        }
    }

    /**
     * 統計無人機狀態總數
     * 
     * @returns {Promise<number>} 無人機狀態總數
     */
    count = async (): Promise<number> => {
        try {
            logger.info('Counting total drone status records');
            const count = await DroneStatusModel.count();
            
            logger.info(`Total drone status count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting drone status records:', error);
            throw error;
        }
    }

    /**
     * 檢查無人機序號是否存在
     * 
     * @param {string} droneSerial 要檢查的無人機序號
     * @returns {Promise<boolean>} 是否存在
     */
    existsBySerial = async (droneSerial: string): Promise<boolean> => {
        try {
            logger.info('Checking if drone serial exists', { droneSerial });
            const count = await DroneStatusModel.count({ where: { drone_serial: droneSerial } });
            const exists = count > 0;
            
            logger.info('Drone serial existence check result', { droneSerial, exists });
            return exists;
        } catch (error) {
            logger.error('Error checking drone serial existence:', error);
            throw error;
        }
    }

    /**
     * 分頁查詢無人機狀態列表（統一架構）
     * @param pageSize 每頁數量
     * @param offset 偏移量
     * @param sortBy 排序欄位
     * @param sortOrder 排序方向
     * @returns 無人機狀態列表
     */
    findPaginatedUnified = async (
        pageSize: number,
        offset: number,
        sortBy: string = 'id',
        sortOrder: 'ASC' | 'DESC' = 'DESC'
    ): Promise<DroneStatusAttributes[]> => {
        try {
            logger.debug(`Finding drone statuses with pagination`, {
                pageSize,
                offset,
                sortBy,
                sortOrder
            });

            const droneStatuses = await DroneStatusModel.findAll({
                limit: pageSize,
                offset,
                order: [[sortBy, sortOrder]]
            });

            const results = droneStatuses.map(item => item.toJSON() as DroneStatusAttributes);
            logger.debug(`Found ${results.length} drone statuses with pagination`);
            return results;
        } catch (error) {
            logger.error('Error finding drone statuses with pagination:', error);
            throw error;
        }
    }
}
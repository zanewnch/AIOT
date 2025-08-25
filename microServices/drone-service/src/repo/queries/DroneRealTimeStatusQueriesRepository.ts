/**
 * @fileoverview 無人機即時狀態查詢 Repositorysitorysitory - CQRS 查詢端
 *
 * 專門處理無人機即時狀態資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatus
} from '../../models/DroneRealTimeStatusModel.js';
import { DroneStatusModel } from '../../models/DroneStatusModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';

/**
 * 統一分頁查詢結果接口
 */
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 無人機即時狀態查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機即時狀態資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneRealTimeStatusQueriesRepositorysitory
 */
@injectable()
export class DroneRealTimeStatusQueriesRepository {
    private readonly logger = createLogger('DroneRealTimeStatusQueriesRepositorysitory');

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<DroneRealTimeStatusModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<DroneRealTimeStatusModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'last_seen', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            this.logger.info('Fetching paginated real-time status', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 可以根據實際需求調整搜尋欄位
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { '$current_status$': { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await DroneRealTimeStatusModel.findAndCountAll({
                where: whereCondition,
                include: [DroneStatusModel],
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<DroneRealTimeStatusModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            this.logger.info(`Successfully fetched paginated real-time status: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            this.logger.error('Error fetching paginated real-time status', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢即時狀態
     * 
     * @param {number} droneId - 無人機 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneRealTimeStatusModel>>} 分頁結果
     */
    findByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneRealTimeStatusModel>> => {
        return this.findPaginated(pagination, { drone_id: droneId });
    };

    /**
     * 根據狀態分頁查詢即時狀態
     * 
     * @param {DroneRealTimeStatus} status - 即時狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneRealTimeStatusModel>>} 分頁結果
     */
    findByStatusPaginated = async (
        status: DroneRealTimeStatus,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneRealTimeStatusModel>> => {
        return this.findPaginated(pagination, { current_status: status });
    };

    /**
     * 根據連線狀態分頁查詢即時狀態
     * 
     * @param {boolean} isConnected - 是否連線
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneRealTimeStatusModel>>} 分頁結果
     */
    findByConnectionPaginated = async (
        isConnected: boolean,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneRealTimeStatusModel>> => {
        return this.findPaginated(pagination, { is_connected: isConnected });
    };
}
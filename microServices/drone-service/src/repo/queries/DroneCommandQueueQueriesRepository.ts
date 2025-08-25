/**
 * @fileoverview 無人機指令佇列查詢 Repositorysitorysitory - CQRS 查詢端
 *
 * 專門處理無人機指令佇列資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandQueueModel, DroneCommandQueueStatus } from '../../models/DroneCommandQueueModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repositorysitorysitory 專用的日誌記錄器
const logger = createLogger('DroneCommandQueueQueriesRepositorysitory');

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
 * 無人機指令佇列查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機指令佇列資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneCommandQueueQueriesRepositorysitory
 */
@injectable()
export class DroneCommandQueueQueriesRepository {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<DroneCommandQueueModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<DroneCommandQueueModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated drone command queues', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 可以根據實際需求調整搜尋欄位
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or as any]: [
                        { '$name$': { [Op.like]: `%${search}%` } },
                        { '$command_type$': { [Op.like]: `%${search}%` } },
                        { '$status$': { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await DroneCommandQueueModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<DroneCommandQueueModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated command queues: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated command queues', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢佇列
     * 
     * @param {number} droneId - 無人機 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneCommandQueueModel>>} 分頁結果
     */
    findByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneCommandQueueModel>> => {
        return this.findPaginated(pagination, { drone_id: droneId });
    };

    /**
     * 根據狀態分頁查詢佇列
     * 
     * @param {DroneCommandQueueStatus} status - 佇列狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneCommandQueueModel>>} 分頁結果
     */
    findByStatusPaginated = async (
        status: DroneCommandQueueStatus,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneCommandQueueModel>> => {
        return this.findPaginated(pagination, { status });
    };

    /**
     * 根據優先級分頁查詢佇列
     * 
     * @param {number} priority - 優先級
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneCommandQueueModel>>} 分頁結果
     */
    findByPriorityPaginated = async (
        priority: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneCommandQueueModel>> => {
        return this.findPaginated(pagination, { priority });
    };

}
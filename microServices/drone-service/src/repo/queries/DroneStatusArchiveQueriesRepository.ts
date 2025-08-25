/**
 * @fileoverview 無人機狀態歷史查詢 Repositorysitorysitory - CQRS 查詢端
 *
 * 專門處理無人機狀態變更歷史資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneStatusArchiveModel } from '../../models/DroneStatusArchiveModel.js';
import type { DroneStatus } from '../../models/DroneStatusModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

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
 * 無人機狀態歷史查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機狀態變更歷史資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneStatusArchiveQueriesRepositorysitory
 */
@injectable()
export class DroneStatusArchiveQueriesRepository {
    private readonly logger = createLogger('DroneStatusArchiveQueriesRepositorysitory');

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<DroneStatusArchiveModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<DroneStatusArchiveModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'archived_at', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            this.logger.info('Fetching paginated status archive', { pagination, filters });

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
            const { count: totalCount, rows: data } = await DroneStatusArchiveModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<DroneStatusArchiveModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            this.logger.info(`Successfully fetched paginated status archive: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            this.logger.error('Error fetching paginated status archive', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢狀態歷史
     * 
     * @param {number} droneId - 無人機 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneStatusArchiveModel>>} 分頁結果
     */
    findByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneStatusArchiveModel>> => {
        return this.findPaginated(pagination, { drone_id: droneId });
    };

    /**
     * 根據狀態分頁查詢歷史記錄
     * 
     * @param {DroneStatus} status - 無人機狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneStatusArchiveModel>>} 分頁結果
     */
    findByStatusPaginated = async (
        status: DroneStatus,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneStatusArchiveModel>> => {
        return this.findPaginated(pagination, { current_status: status });
    };

    /**
     * 根據時間範圍分頁查詢歷史記錄
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneStatusArchiveModel>>} 分頁結果
     */
    findByDateRangePaginated = async (
        startDate: Date,
        endDate: Date,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneStatusArchiveModel>> => {
        return this.findPaginated(pagination, {
            archived_at: {
                [Op.between]: [startDate, endDate]
            }
        });
    };
}
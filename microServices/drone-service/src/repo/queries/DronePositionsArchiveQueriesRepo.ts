/**
 * @fileoverview 無人機位置歷史歸檔查詢 Repositorysitory - CQRS 查詢端
 *
 * 專門處理無人機位置歷史歸檔資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DronePositionsArchiveModel } from '../../models/DronePositionsArchiveModel.js';
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
 * 無人機位置歷史歸檔查詢 Repositorysitory 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機位置歷史歸檔資料的查詢操作，遵循 CQRS 模式
 *
 * @class DronePositionsArchiveQueriesRepository
 */
@injectable()
export class DronePositionsArchiveQueriesRepo {
    private readonly logger = createLogger('DronePositionsArchiveQueriesRepository');

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<DronePositionsArchiveModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<DronePositionsArchiveModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'timestamp', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            this.logger.info('Fetching paginated drone positions archive', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 可以根據實際需求調整搜尋欄位
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { '$archive_batch_id$': { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await DronePositionsArchiveModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<DronePositionsArchiveModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            this.logger.info(`Successfully fetched paginated positions archive: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            this.logger.error('Error fetching paginated positions archive', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢位置歷史歸檔
     * 
     * @param {number} droneId - 無人機 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DronePositionsArchiveModel>>} 分頁結果
     */
    findByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DronePositionsArchiveModel>> => {
        return this.findPaginated(pagination, { drone_id: droneId });
    };

    /**
     * 根據批次 ID 分頁查詢位置歷史歸檔
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DronePositionsArchiveModel>>} 分頁結果
     */
    findByBatchIdPaginated = async (
        batchId: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DronePositionsArchiveModel>> => {
        return this.findPaginated(pagination, { archive_batch_id: batchId });
    };

    /**
     * 根據時間範圍分頁查詢位置歷史歸檔
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DronePositionsArchiveModel>>} 分頁結果
     */
    findByTimeRangePaginated = async (
        startTime: Date,
        endTime: Date,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DronePositionsArchiveModel>> => {
        return this.findPaginated(pagination, {
            timestamp: {
                [Op.between]: [startTime, endTime]
            }
        });
    };
}
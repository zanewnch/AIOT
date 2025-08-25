/**
 * @fileoverview 無人機指令歷史歸檔查詢 Repositorysitorysitory - CQRS 查詢端
 *
 * 專門處理無人機指令歷史歸檔資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandsArchiveModel } from '../../models/DroneCommandsArchiveModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repositorysitorysitory 專用的日誌記錄器
const logger = createLogger('DroneCommandsArchiveQueriesRepositorysitory');

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
 * 無人機指令歷史歸檔查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 *
 * 專門處理無人機指令歷史歸檔資料的查詢操作，遵循 CQRS 模式
 *
 * @class DroneCommandsArchiveQueriesRepositorysitory
 */
@injectable()
export class DroneCommandsArchiveQueriesRepositorysitorysitory {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<DroneCommandsArchiveModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<DroneCommandsArchiveModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated drone commands archive', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 可以根據實際需求調整搜尋欄位
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or as any]: [
                        { '$command_type$': { [Op.like]: `%${search}%` } },
                        { '$status$': { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await DroneCommandsArchiveModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<DroneCommandsArchiveModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated commands archive: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated commands archive', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢歷史歸檔
     * 
     * @param {number} droneId - 無人機 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneCommandsArchiveModel>>} 分頁結果
     */
    findByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneCommandsArchiveModel>> => {
        return this.findPaginated(pagination, { drone_id: droneId });
    };

    /**
     * 根據指令類型分頁查詢歷史歸檔
     * 
     * @param {string} commandType - 指令類型
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneCommandsArchiveModel>>} 分頁結果
     */
    findByCommandTypePaginated = async (
        commandType: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneCommandsArchiveModel>> => {
        return this.findPaginated(pagination, { command_type: commandType });
    };

    /**
     * 根據狀態分頁查詢歷史歸檔
     * 
     * @param {string} status - 指令狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneCommandsArchiveModel>>} 分頁結果
     */
    findByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneCommandsArchiveModel>> => {
        return this.findPaginated(pagination, { status });
    };
}
/**
 * @fileoverview 無人機狀態查詢 Repositorysitory - CQRS 查詢端
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
import { Op } from 'sequelize';
import { DroneStatusModel, DroneStatus } from '../../models/DroneStatusModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneStatusQueriesRepository');

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
 * 無人機狀態查詢 Repositorysitory 實現類別 - CQRS 查詢端
 * 
 * 專門處理無人機狀態資料的查詢操作，遵循 CQRS 模式
 * 
 * @class DroneStatusQueriesRepository
 */
@injectable()
export class DroneStatusQueriesRepo {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<DroneStatusModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<DroneStatusModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated drone statuses', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 可以根據實際需求調整搜尋欄位
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or as any]: [
                        { '$drone_name$': { [Op.like]: `%${search}%` } },
                        { '$drone_serial$': { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await DroneStatusModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<DroneStatusModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated drone statuses: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated drone statuses', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢無人機
     * 
     * @param {DroneStatus} status - 無人機狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<DroneStatusModel>>} 分頁結果
     */
    findByStatusPaginated = async (
        status: DroneStatus,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneStatusModel>> => {
        return this.findPaginated(pagination, { status });
    };

    /**
     * 根據無人機 ID 分頁查詢狀態
     */
    findByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<DroneStatusModel>> => {
        return this.findPaginated(pagination, { drone_id: droneId });
    };

    /**
     * 根據序列號查詢無人機狀態
     */
    findBySerial = async (serial: string): Promise<DroneStatusModel | null> => {
        try {
            const result = await DroneStatusModel.findOne({
                where: { drone_serial: serial }
            });
            return result;
        } catch (error) {
            logger.error('Error finding drone status by serial', { serial, error });
            throw error;
        }
    };

    /**
     * 根據 ID 查詢無人機狀態
     */
    findById = async (id: number): Promise<DroneStatusModel | null> => {
        try {
            const result = await DroneStatusModel.findByPk(id);
            return result;
        } catch (error) {
            logger.error('Error finding drone status by id', { id, error });
            throw error;
        }
    };

    /**
     * 根據狀態查詢所有無人機
     */
    findAllByStatus = async (status: DroneStatus): Promise<DroneStatusModel[]> => {
        try {
            const results = await DroneStatusModel.findAll({
                where: { status }
            });
            return results;
        } catch (error) {
            logger.error('Error finding all drones by status', { status, error });
            throw error;
        }
    };
}
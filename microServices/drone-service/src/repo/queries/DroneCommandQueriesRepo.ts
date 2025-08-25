/**
 * @fileoverview Drone Command Queries Repositorysitory
 * 
 * 無人機命令查詢儲存庫實作
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { DroneCommandModel } from '../../models/DroneCommandModel.js';
import { PaginationRequestDto } from '../../dto/index.js';

/**
 * 分頁查詢結果接口
 */
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

@injectable()
export class DroneCommandQueriesRepo {
  
  /**
   * 統一分頁查詢方法
   */
  findPaginated = async (
    pagination: PaginationRequestDto,
    filters: Record<string, any> = {}
  ): Promise<PaginatedResult<DroneCommandModel>> => {
    const whereConditions: Record<string, any> = {};

    // 搜尋條件
    if (pagination.search) {
      whereConditions[Op.or as any] = [
        { command_type: { [Op.like]: `%${pagination.search}%` } },
        { status: { [Op.like]: `%${pagination.search}%` } }
      ];
    }

    // 額外過濾條件
    Object.assign(whereConditions, filters);

    const { count: totalCount, rows: data } = await DroneCommandModel.findAndCountAll({
      where: whereConditions,
      order: [[pagination.sortBy || 'createdAt', pagination.sortOrder || 'DESC']],
      limit: pagination.pageSize || 20,
      offset: pagination.offset
    });

    return {
      data,
      totalCount,
      currentPage: pagination.page || 1,
      pageSize: pagination.pageSize || 20
    };
  };

  /**
   * 根據無人機 ID 分頁查詢
   */
  findByDroneIdPaginated = async (
    droneId: number,
    pagination: PaginationRequestDto
  ): Promise<PaginatedResult<DroneCommandModel>> => {
    return this.findPaginated(pagination, { drone_id: droneId });
  };

  /**
   * 根據狀態分頁查詢
   */
  findByStatusPaginated = async (
    status: string,
    pagination: PaginationRequestDto
  ): Promise<PaginatedResult<DroneCommandModel>> => {
    return this.findPaginated(pagination, { status });
  };

  /**
   * 根據指令類型分頁查詢
   */
  findByCommandTypePaginated = async (
    commandType: string,
    pagination: PaginationRequestDto
  ): Promise<PaginatedResult<DroneCommandModel>> => {
    return this.findPaginated(pagination, { command_type: commandType });
  };

}
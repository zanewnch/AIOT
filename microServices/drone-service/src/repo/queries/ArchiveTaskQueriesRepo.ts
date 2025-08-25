/**
 * @fileoverview Archive Task Queries Repositorysitory
 * 
 * 歷史任務查詢儲存庫實作
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { ArchiveTaskModel, ArchiveTaskStatus, ArchiveJobType } from '../../models/ArchiveTaskModel.js';
import { ArchiveTaskQueryOptions } from '../../types/repo/IArchiveTaskRepo.js';
import { Op, WhereOptions } from 'sequelize';
import { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import { PaginationRequestDto } from '../../dto/index.js';

/**
 * 統一分頁查詢結果接口
 */
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

@injectable()
export class ArchiveTaskQueriesRepo {
  

  /**
   * 統一分頁查詢方法（新版）
   */
  findPaginated = async (
    pagination: PaginationRequestDto,
    filters: Record<string, any> = {}
  ): Promise<PaginatedResult<ArchiveTaskModel>> => {
    const whereConditions: Record<string, any> = {};

    // 搜尋條件
    if (pagination.search) {
      whereConditions[Op.or as any] = [
        { status: { [Op.like]: `%${pagination.search}%` } },
        { job_type: { [Op.like]: `%${pagination.search}%` } },
        { description: { [Op.like]: `%${pagination.search}%` } }
      ];
    }

    // 額外過濾條件
    Object.assign(whereConditions, filters);

    const { count: totalCount, rows: data } = await ArchiveTaskModel.findAndCountAll({
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
   * 根據狀態分頁查詢（新版）
   */
  findByStatusPaginated = async (
    status: ArchiveTaskStatus,
    pagination: PaginationRequestDto
  ): Promise<PaginatedResult<ArchiveTaskModel>> => {
    return this.findPaginated(pagination, { status });
  };

  /**
   * 根據任務類型分頁查詢（新版）
   */
  findByJobTypePaginated = async (
    jobType: ArchiveJobType,
    pagination: PaginationRequestDto
  ): Promise<PaginatedResult<ArchiveTaskModel>> => {
    return this.findPaginated(pagination, { job_type: jobType });
  };

  /**
   * 根據批次 ID 分頁查詢（新版）
   */
  findByBatchIdPaginated = async (
    batchId: string,
    pagination: PaginationRequestDto
  ): Promise<PaginatedResult<ArchiveTaskModel>> => {
    return this.findPaginated(pagination, { batch_id: batchId });
  };

}
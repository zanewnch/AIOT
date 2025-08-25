/**
 * @fileoverview Archive Task Repositorysitorysitory Interface
 * 
 * 定義歷史任務儲存庫的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { ArchiveTaskModel, ArchiveTaskCreationAttributes, ArchiveTaskStatus, ArchiveJobType } from '../../models/ArchiveTaskModel.js';
import { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

export interface ArchiveTaskQueryOptions {
  status?: ArchiveTaskStatus;
  jobType?: ArchiveJobType;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface IArchiveTaskRepositorysitorysitorysitory {
  /**
   * 創建歷史任務
   */
  create(data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel>;

  /**
   * 根據 ID 查找歷史任務
   */
  findById(id: number): Promise<ArchiveTaskModel | null>;

  /**
   * 查找所有歷史任務
   */
  findAll(options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]>;

  /**
   * 分頁查找所有歷史任務
   */
  findAllPaginated(params: PaginationParams): Promise<PaginatedResponse<ArchiveTaskModel>>;

  /**
   * 根據狀態查找歷史任務
   */
  findByStatus(status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]>;

  /**
   * 根據狀態分頁查找歷史任務
   */
  findByStatusPaginated(status: ArchiveTaskStatus, params: PaginationParams): Promise<PaginatedResponse<ArchiveTaskModel>>;

  /**
   * 根據批次 ID 查找歷史任務
   */
  findByBatchId(batchId: string): Promise<ArchiveTaskModel[]>;

  /**
   * 根據批次 ID 分頁查找歷史任務
   */
  findByBatchIdPaginated(batchId: string, params: PaginationParams): Promise<PaginatedResponse<ArchiveTaskModel>>;

  /**
   * 統計歷史任務數量
   */
  count(options?: ArchiveTaskQueryOptions): Promise<number>;

  /**
   * 更新歷史任務
   */
  update(id: number, data: Partial<ArchiveTaskCreationAttributes>): Promise<ArchiveTaskModel | null>;

  /**
   * 刪除歷史任務
   */
  delete(id: number): Promise<void>;

  /**
   * 清理舊任務
   */
  cleanup(daysOld: number, status?: any): Promise<number>;
}
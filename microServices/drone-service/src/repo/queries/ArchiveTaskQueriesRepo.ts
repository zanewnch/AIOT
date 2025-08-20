/**
 * @fileoverview Archive Task Queries Repository
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
import { ArchiveTaskQueryOptions } from '../../types/repositories/IArchiveTaskRepository.js';
import { Op, WhereOptions } from 'sequelize';

@injectable()
export class ArchiveTaskQueriesRepo {
  
  findAll = async (options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]> => {
    const where: WhereOptions = {};
    
    // 構建查詢條件
    if (options?.status) {
      where.status = options.status;
    }
    
    if (options?.jobType) {
      where.job_type = options.jobType;
    }
    
    if (options?.dateRangeStart || options?.dateRangeEnd) {
      where.createdAt = {};
      if (options.dateRangeStart) {
        (where.createdAt as any)[Op.gte] = options.dateRangeStart;
      }
      if (options.dateRangeEnd) {
        (where.createdAt as any)[Op.lte] = options.dateRangeEnd;
      }
    }
    
    // 構建排序
    const order: any[] = [];
    if (options?.sortBy) {
      order.push([options.sortBy, options.sortOrder || 'ASC']);
    } else {
      order.push(['createdAt', 'DESC']);
    }
    
    return await ArchiveTaskModel.findAll({
      where,
      order,
      limit: options?.limit || 100,
      offset: options?.offset || 0
    });
  }

  findById = async (id: number): Promise<ArchiveTaskModel | null> => {
    return await ArchiveTaskModel.findByPk(id);
  }
  
  findByStatus = async (status: ArchiveTaskStatus, limit = 100): Promise<ArchiveTaskModel[]> => {
    return await ArchiveTaskModel.findAll({
      where: { status },
      order: [['createdAt', 'DESC']],
      limit
    });
  }
  
  count = async (options?: ArchiveTaskQueryOptions): Promise<number> => {
    const where: WhereOptions = {};
    
    if (options?.status) {
      where.status = options.status;
    }
    
    if (options?.jobType) {
      where.job_type = options.jobType;
    }
    
    if (options?.dateRangeStart || options?.dateRangeEnd) {
      where.createdAt = {};
      if (options.dateRangeStart) {
        (where.createdAt as any)[Op.gte] = options.dateRangeStart;
      }
      if (options.dateRangeEnd) {
        (where.createdAt as any)[Op.lte] = options.dateRangeEnd;
      }
    }
    
    return await ArchiveTaskModel.count({ where });
  }
}
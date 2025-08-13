/**
 * @fileoverview Archive Task Commands Repository
 * 
 * 歷史任務命令儲存庫實作
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { ArchiveTaskModel, ArchiveTaskCreationAttributes, ArchiveTaskStatus } from '../../models/ArchiveTaskModel.js';
import type { IArchiveTaskRepository, ArchiveTaskQueryOptions } from '../../types/repositories/IArchiveTaskRepository.js';
import { Op } from 'sequelize';

@injectable()
export class ArchiveTaskCommandsRepository implements IArchiveTaskRepository {
  
  create = async (data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel> => {
    return await ArchiveTaskModel.create(data);
  }

  findById = async (id: number): Promise<ArchiveTaskModel | null> => {
    return await ArchiveTaskModel.findByPk(id);
  }

  findAll = async (options?: ArchiveTaskQueryOptions): Promise<ArchiveTaskModel[]> => {
    const whereClause: any = {};
    
    if (options?.status) {
      whereClause.status = options.status;
    }
    
    if (options?.jobType) {
      whereClause.job_type = options.jobType;
    }
    
    if (options?.dateRangeStart && options?.dateRangeEnd) {
      whereClause.createdAt = {
        [Op.between]: [options.dateRangeStart, options.dateRangeEnd]
      };
    }
    
    return await ArchiveTaskModel.findAll({
      where: whereClause,
      limit: options?.limit,
      offset: options?.offset,
      order: [['createdAt', 'DESC']]
    });
  }

  findByStatus = async (status: ArchiveTaskStatus, limit?: number): Promise<ArchiveTaskModel[]> => {
    return await ArchiveTaskModel.findAll({
      where: { status },
      limit,
      order: [['createdAt', 'DESC']]
    });
  }

  findByBatchId = async (batchId: string): Promise<ArchiveTaskModel[]> => {
    return await ArchiveTaskModel.findAll({
      where: { batch_id: batchId },
      order: [['createdAt', 'DESC']]
    });
  }

  count = async (options?: ArchiveTaskQueryOptions): Promise<number> => {
    const whereClause: any = {};
    
    if (options?.status) {
      whereClause.status = options.status;
    }
    
    if (options?.jobType) {
      whereClause.job_type = options.jobType;
    }
    
    if (options?.dateRangeStart && options?.dateRangeEnd) {
      whereClause.createdAt = {
        [Op.between]: [options.dateRangeStart, options.dateRangeEnd]
      };
    }
    
    return await ArchiveTaskModel.count({
      where: whereClause
    });
  }

  update = async (id: number, data: Partial<ArchiveTaskCreationAttributes>): Promise<ArchiveTaskModel | null> => {
    const task = await this.findById(id);
    if (!task) return null;
    
    await task.update(data);
    return task;
  }

  delete = async (id: number): Promise<void> => {
    const task = await this.findById(id);
    if (task) {
      await task.destroy();
    }
  }

  cleanup = async (daysOld: number, status?: any): Promise<number> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const whereClause: any = {
      createdAt: {
        [Op.lt]: cutoffDate
      }
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    const result = await ArchiveTaskModel.destroy({
      where: whereClause
    });
    
    return result;
  }
}
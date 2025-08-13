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
import { ArchiveTaskModel } from '../../models/ArchiveTaskModel.js';

@injectable()
export class ArchiveTaskQueriesRepository {
  
  async findAll(limit = 100): Promise<ArchiveTaskModel[]> {
    return await ArchiveTaskModel.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  async findById(id: number): Promise<ArchiveTaskModel | null> {
    return await ArchiveTaskModel.findByPk(id);
  }
}
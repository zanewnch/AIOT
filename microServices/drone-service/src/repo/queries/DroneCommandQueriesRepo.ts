/**
 * @fileoverview Drone Command Queries Repository
 * 
 * 無人機命令查詢儲存庫實作
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandModel } from '../../models/DroneCommandModel.js';

@injectable()
export class DroneCommandQueriesRepository {
  
  findAll = async (limit = 100): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findById = async (id: number): Promise<DroneCommandModel | null> => {
    return await DroneCommandModel.findByPk(id);
  }
}
/**
 * @fileoverview Drone Command Queue Commands Repository
 * 
 * 無人機命令佇列命令儲存庫實作
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandQueueModel, DroneCommandQueueCreationAttributes, DroneCommandQueueStatus } from '../../models/DroneCommandQueueModel.js';
import type { IDroneCommandQueueRepo } from '../../types/repositories/IDroneCommandQueueRepo.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

@injectable()
export class DroneCommandQueueCommandsRepo implements IDroneCommandQueueRepo {
  
  create = loggerDecorator(async (data: DroneCommandQueueCreationAttributes): Promise<DroneCommandQueueModel> => {
    return await DroneCommandQueueModel.create(data);
  }, 'create')

  findById = loggerDecorator(async (id: number): Promise<DroneCommandQueueModel | null> => {
    return await DroneCommandQueueModel.findByPk(id);
  }, 'findById')

  update = loggerDecorator(async (id: number, data: Partial<DroneCommandQueueCreationAttributes>): Promise<DroneCommandQueueModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update(data);
    return command;
  }, 'update')

  delete = loggerDecorator(async (id: number): Promise<boolean> => {
    const command = await this.findById(id);
    if (command) {
      await command.destroy();
      return true;
    }
    return false;
  }, 'delete')

  markAsExecuting = async (id: number): Promise<DroneCommandQueueModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandQueueStatus.RUNNING,
      executed_at: new Date()
    });
    return command;
  }

  markAsCompleted = async (id: number, result?: string): Promise<DroneCommandQueueModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandQueueStatus.COMPLETED,
      result: result || null,
      completed_at: new Date()
    });
    return command;
  }

  markAsFailed = async (id: number, error: string): Promise<DroneCommandQueueModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandQueueStatus.FAILED,
      error_message: error,
      completed_at: new Date()
    });
    return command;
  }

  findByDroneId = async (droneId: number): Promise<DroneCommandQueueModel[]> => {
    return await DroneCommandQueueModel.findAll({
      where: { drone_id: droneId },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  }

  findByStatus = async (status: DroneCommandQueueStatus): Promise<DroneCommandQueueModel[]> => {
    return await DroneCommandQueueModel.findAll({
      where: { status },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  }

  findByPriority = async (priority: number): Promise<DroneCommandQueueModel[]> => {
    return await DroneCommandQueueModel.findAll({
      where: { priority },
      order: [['created_at', 'ASC']]
    });
  }

  findAll = async (): Promise<DroneCommandQueueModel[]> => {
    return await DroneCommandQueueModel.findAll({
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  }

  bulkCreate = async (data: DroneCommandQueueCreationAttributes[]): Promise<DroneCommandQueueModel[]> => {
    return await DroneCommandQueueModel.bulkCreate(data);
  }

  cleanup = async (daysOld: number, status?: DroneCommandQueueStatus): Promise<number> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const whereCondition: any = {
      created_at: {
        [Op.lt]: cutoffDate
      }
    };

    if (status) {
      whereCondition.status = status;
    }

    const result = await DroneCommandQueueModel.destroy({
      where: whereCondition
    });

    return result;
  }

  findAllPaginated = async (params: any): Promise<any> => {
    const offset = (params.page - 1) * params.pageSize;
    const result = await DroneCommandQueueModel.findAndCountAll({
      offset,
      limit: params.pageSize,
      order: [[params.sortBy || 'created_at', params.sortOrder || 'DESC']]
    });
    
    return {
      data: result.rows,
      totalCount: result.count,
      currentPage: params.page,
      pageSize: params.pageSize
    };
  }

  getNextPendingCommand = async (droneId: number): Promise<DroneCommandQueueModel | null> => {
    return await DroneCommandQueueModel.findOne({
      where: {
        drone_id: droneId,
        status: DroneCommandQueueStatus.PENDING
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  }
}
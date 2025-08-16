/**
 * @fileoverview Drone Command Commands Repository
 * 
 * 無人機命令命令儲存庫實作
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandModel, DroneCommandCreationAttributes, DroneCommandStatus } from '../../models/DroneCommandModel.js';
import type { IDroneCommandRepository } from '../../types/repositories/IDroneCommandRepository.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

@injectable()
export class DroneCommandCommandsRepository implements IDroneCommandRepository {
  
  create = loggerDecorator(async (data: DroneCommandCreationAttributes): Promise<DroneCommandModel> => {
    return await DroneCommandModel.create(data);
  }, 'create')

  findById = loggerDecorator(async (id: number): Promise<DroneCommandModel | null> => {
    return await DroneCommandModel.findByPk(id);
  }, 'findById')

  update = loggerDecorator(async (id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update(data);
    return command;
  }, 'update')

  delete = loggerDecorator(async (id: number): Promise<void> => {
    const command = await this.findById(id);
    if (command) {
      await command.destroy();
    }
  }, 'delete')

  markAsExecuting = async (id: number): Promise<DroneCommandModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandStatus.EXECUTING,
      executed_at: new Date()
    });
    return command;
  }

  markAsCompleted = async (id: number): Promise<DroneCommandModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandStatus.COMPLETED,
      completed_at: new Date()
    });
    return command;
  }

  markAsFailed = async (id: number, errorMessage?: string): Promise<DroneCommandModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandStatus.FAILED,
      completed_at: new Date(),
      error_message: errorMessage
    });
    return command;
  }

  deleteCompletedBefore = async (date: Date): Promise<number> => {
    const result = await DroneCommandModel.destroy({
      where: {
        status: DroneCommandStatus.COMPLETED,
        completed_at: {
          [Op.lt]: date
        }
      }
    });
    return result;
  }

  deleteBeforeDate = async (date: Date): Promise<number> => {
    const result = await DroneCommandModel.destroy({
      where: {
        createdAt: {
          [Op.lt]: date
        }
      }
    });
    return result;
  }

  updateStatus = async (id: number, status: any, errorMessage?: string): Promise<DroneCommandModel | null> => {
    const command = await this.findById(id);
    if (!command) return null;
    
    const updateData: any = { status };
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    await command.update(updateData);
    return command;
  }
}
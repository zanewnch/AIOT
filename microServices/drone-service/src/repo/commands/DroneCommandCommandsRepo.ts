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

@injectable()
export class DroneCommandCommandsRepository implements IDroneCommandRepository {
  
  async create(data: DroneCommandCreationAttributes): Promise<DroneCommandModel> {
    return await DroneCommandModel.create(data);
  }

  async findById(id: number): Promise<DroneCommandModel | null> {
    return await DroneCommandModel.findByPk(id);
  }

  async update(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandModel | null> {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update(data);
    return command;
  }

  async delete(id: number): Promise<void> {
    const command = await this.findById(id);
    if (command) {
      await command.destroy();
    }
  }

  async markAsExecuting(id: number): Promise<DroneCommandModel | null> {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandStatus.EXECUTING,
      executed_at: new Date()
    });
    return command;
  }

  async markAsCompleted(id: number): Promise<DroneCommandModel | null> {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandStatus.COMPLETED,
      completed_at: new Date()
    });
    return command;
  }

  async markAsFailed(id: number, errorMessage?: string): Promise<DroneCommandModel | null> {
    const command = await this.findById(id);
    if (!command) return null;
    
    await command.update({
      status: DroneCommandStatus.FAILED,
      completed_at: new Date(),
      error_message: errorMessage
    });
    return command;
  }

  async deleteCompletedBefore(date: Date): Promise<number> {
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

  async deleteBeforeDate(date: Date): Promise<number> {
    const result = await DroneCommandModel.destroy({
      where: {
        createdAt: {
          [Op.lt]: date
        }
      }
    });
    return result;
  }

  async updateStatus(id: number, status: any, errorMessage?: string): Promise<DroneCommandModel | null> {
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
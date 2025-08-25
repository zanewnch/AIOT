/**
 * @fileoverview Drone Command Commands Repositorysitory
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
import type { IDroneCommandRepo } from '../../types/repositories/IDroneCommandRepo.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

@injectable()
export class DroneCommandCommandsRepo implements IDroneCommandRepo {
  
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

  // Query methods needed by canReceiveNewCommand validation
  findExecutingCommandByDroneId = loggerDecorator(async (droneId: number): Promise<DroneCommandModel | null> => {
    return await DroneCommandModel.findOne({
      where: {
        drone_id: droneId,
        status: DroneCommandStatus.EXECUTING
      },
      order: [['createdAt', 'DESC']]
    });
  }, 'findExecutingCommandByDroneId')

  findPendingCommandsByDroneId = loggerDecorator(async (droneId: number): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: {
        drone_id: droneId,
        status: DroneCommandStatus.PENDING
      },
      order: [['createdAt', 'DESC']]
    });
  }, 'findPendingCommandsByDroneId')

  // Additional query methods required by IDroneCommandRepo interface
  selectAll = async (limit: number = 100): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findAll = async (limit: number = 100): Promise<DroneCommandModel[]> => {
    return await this.selectAll(limit);
  }

  findByDroneId = async (droneId: number, limit: number = 50): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: { drone_id: droneId },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findByStatus = async (status: string, limit: number = 50): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: { status },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findByCommandType = async (commandType: string, limit: number = 50): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: { command_type: commandType },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findByIssuedBy = async (issuedBy: number, limit: number = 50): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: { issued_by: issuedBy },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findByDateRange = async (start: Date, end: Date, limit: number = 100): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findLatest = async (limit: number = 20): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findLatestByDroneId = async (droneId: number): Promise<DroneCommandModel | null> => {
    return await DroneCommandModel.findOne({
      where: { drone_id: droneId },
      order: [['createdAt', 'DESC']]
    });
  }

  findFailedCommands = async (limit: number = 50): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: { status: DroneCommandStatus.FAILED },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findTimeoutCommands = async (timeoutMinutes: number, limit: number = 50): Promise<DroneCommandModel[]> => {
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

    return await DroneCommandModel.findAll({
      where: {
        status: {
          [Op.in]: [DroneCommandStatus.PENDING, DroneCommandStatus.EXECUTING]
        },
        issued_at: {
          [Op.lt]: timeoutDate
        }
      },
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  findByDroneIdAndStatus = async (droneId: number, status: string): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: {
        drone_id: droneId,
        status
      },
      order: [['createdAt', 'DESC']]
    });
  }

  findByDroneIdAndCommandType = async (droneId: number, commandType: string): Promise<DroneCommandModel[]> => {
    return await DroneCommandModel.findAll({
      where: {
        drone_id: droneId,
        command_type: commandType
      },
      order: [['createdAt', 'DESC']]
    });
  }

  count = async (): Promise<number> => {
    return await DroneCommandModel.count();
  }

  countByDateRange = async (start: Date, end: Date): Promise<number> => {
    return await DroneCommandModel.count({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      }
    });
  }

  countByStatus = async (status: string): Promise<number> => {
    return await DroneCommandModel.count({
      where: { status }
    });
  }

  countByCommandType = async (commandType: string): Promise<number> => {
    return await DroneCommandModel.count({
      where: { command_type: commandType }
    });
  }

  countByDroneId = async (droneId: number): Promise<number> => {
    return await DroneCommandModel.count({
      where: { drone_id: droneId }
    });
  }
}
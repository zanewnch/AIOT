/**
 * @fileoverview 無人機指令命令 Repository - CQRS 命令端
 * 
 * 專門處理無人機指令資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { DroneCommandModel, type DroneCommandAttributes, type DroneCommandCreationAttributes, DroneCommandStatus } from '../../models/drone/DroneCommandModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('DroneCommandCommandsRepository');

/**
 * 無人機指令命令 Repository 實現類別 - CQRS 命令端
 * 
 * 專門處理無人機指令資料的寫入操作，遵循 CQRS 模式
 * 
 * @class DroneCommandCommandsRepository
 */
export class DroneCommandCommandsRepository {
    /**
     * 建立新的無人機指令記錄
     * 
     * @param {DroneCommandCreationAttributes} data - 無人機指令建立資料
     * @returns {Promise<DroneCommandAttributes>} 建立的無人機指令資料
     */
    async create(data: DroneCommandCreationAttributes): Promise<DroneCommandAttributes> {
        try {
            logger.info('Creating new drone command', { data });
            const command = await DroneCommandModel.create(data);
            
            logger.info('Drone command created successfully', { id: command.id });
            return command.toJSON() as DroneCommandAttributes;
        } catch (error) {
            logger.error('Error creating drone command', { data, error });
            throw error;
        }
    }

    /**
     * 批量建立無人機指令記錄
     * 
     * @param {DroneCommandCreationAttributes[]} dataArray - 無人機指令建立資料陣列
     * @returns {Promise<DroneCommandAttributes[]>} 建立的無人機指令資料陣列
     */
    async bulkCreate(dataArray: DroneCommandCreationAttributes[]): Promise<DroneCommandAttributes[]> {
        try {
            logger.info('Bulk creating drone commands', { count: dataArray.length });
            const commands = await DroneCommandModel.bulkCreate(dataArray, {
                returning: true
            });
            
            logger.info('Drone commands bulk created successfully', { count: commands.length });
            return commands.map(item => item.toJSON() as DroneCommandAttributes);
        } catch (error) {
            logger.error('Error bulk creating drone commands', { count: dataArray.length, error });
            throw error;
        }
    }

    /**
     * 更新無人機指令資料
     * 
     * @param {number} id - 無人機指令 ID
     * @param {Partial<DroneCommandCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的無人機指令資料或 null
     */
    async update(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Updating drone command', { id, data });
            
            const [updatedRowsCount] = await DroneCommandModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedCommand = await DroneCommandModel.findByPk(id);
                if (updatedCommand) {
                    logger.info('Drone command updated successfully', { id });
                    return updatedCommand.toJSON() as DroneCommandAttributes;
                }
            }
            
            logger.warn('Drone command not found for update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating drone command', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機指令資料
     * 
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting drone command', { id });
            
            const deletedRowsCount = await DroneCommandModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                logger.info('Drone command deleted successfully', { id });
            } else {
                logger.warn('Drone command not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deleting drone command', { id, error });
            throw error;
        }
    }

    /**
     * 刪除指定時間之前的指令記錄
     * 
     * @param {Date} beforeDate - 刪除此時間之前的記錄
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteBeforeDate(beforeDate: Date): Promise<number> {
        try {
            logger.info('Deleting drone commands before date', { beforeDate });
            const deletedCount = await DroneCommandModel.destroy({
                where: {
                    issued_at: {
                        [Op.lt]: beforeDate
                    }
                }
            });
            
            logger.info(`Deleted ${deletedCount} commands before ${beforeDate}`);
            return deletedCount;
        } catch (error) {
            logger.error('Error deleting drone commands before date', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 刪除已完成的指令記錄
     * 
     * @param {Date} beforeDate - 刪除此時間之前完成的記錄
     * @returns {Promise<number>} 刪除的記錄數
     */
    async deleteCompletedBefore(beforeDate: Date): Promise<number> {
        try {
            logger.info('Deleting completed commands before date', { beforeDate });
            const deletedCount = await DroneCommandModel.destroy({
                where: {
                    status: {
                        [Op.in]: [DroneCommandStatus.COMPLETED, DroneCommandStatus.FAILED]
                    },
                    updatedAt: {
                        [Op.lt]: beforeDate
                    }
                }
            });
            
            logger.info(`Deleted ${deletedCount} completed commands before ${beforeDate}`);
            return deletedCount;
        } catch (error) {
            logger.error('Error deleting completed commands before date', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 更新指令狀態
     * 
     * @param {number} id - 指令 ID
     * @param {DroneCommandStatus} status - 新狀態
     * @param {string} errorMessage - 錯誤訊息（可選）
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    async updateStatus(id: number, status: DroneCommandStatus, errorMessage?: string): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Updating command status', { id, status, errorMessage });
            
            const updateData: any = { status };
            if (errorMessage) {
                updateData.error_message = errorMessage;
            }

            const [updatedRowsCount] = await DroneCommandModel.update(updateData, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedCommand = await DroneCommandModel.findByPk(id);
                if (updatedCommand) {
                    logger.info('Command status updated successfully', { id, status });
                    return updatedCommand.toJSON() as DroneCommandAttributes;
                }
            }
            
            logger.warn('Command not found for status update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating command status', { id, status, errorMessage, error });
            throw error;
        }
    }

    /**
     * 標記指令開始執行
     * 
     * @param {number} id - 指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    async markAsExecuting(id: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Marking command as executing', { id });
            
            const [updatedRowsCount] = await DroneCommandModel.update({
                status: DroneCommandStatus.EXECUTING,
                executed_at: new Date()
            }, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedCommand = await DroneCommandModel.findByPk(id);
                if (updatedCommand) {
                    logger.info('Command marked as executing successfully', { id });
                    return updatedCommand.toJSON() as DroneCommandAttributes;
                }
            }
            
            logger.warn('Command not found for execution marking', { id });
            return null;
        } catch (error) {
            logger.error('Error marking command as executing', { id, error });
            throw error;
        }
    }

    /**
     * 標記指令完成
     * 
     * @param {number} id - 指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    async markAsCompleted(id: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Marking command as completed', { id });
            
            const [updatedRowsCount] = await DroneCommandModel.update({
                status: DroneCommandStatus.COMPLETED,
                completed_at: new Date()
            }, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedCommand = await DroneCommandModel.findByPk(id);
                if (updatedCommand) {
                    logger.info('Command marked as completed successfully', { id });
                    return updatedCommand.toJSON() as DroneCommandAttributes;
                }
            }
            
            logger.warn('Command not found for completion marking', { id });
            return null;
        } catch (error) {
            logger.error('Error marking command as completed', { id, error });
            throw error;
        }
    }

    /**
     * 標記指令失敗
     * 
     * @param {number} id - 指令 ID
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    async markAsFailed(id: number, errorMessage: string): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Marking command as failed', { id, errorMessage });
            
            const [updatedRowsCount] = await DroneCommandModel.update({
                status: DroneCommandStatus.FAILED,
                completed_at: new Date(),
                error_message: errorMessage
            }, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedCommand = await DroneCommandModel.findByPk(id);
                if (updatedCommand) {
                    logger.info('Command marked as failed successfully', { id });
                    return updatedCommand.toJSON() as DroneCommandAttributes;
                }
            }
            
            logger.warn('Command not found for failure marking', { id });
            return null;
        } catch (error) {
            logger.error('Error marking command as failed', { id, errorMessage, error });
            throw error;
        }
    }

    /**
     * 批量更新指令狀態
     * 
     * @param {number[]} ids - 指令 ID 陣列
     * @param {DroneCommandStatus} status - 新狀態
     * @returns {Promise<number>} 更新的記錄數
     */
    async bulkUpdateStatus(ids: number[], status: DroneCommandStatus): Promise<number> {
        try {
            logger.info('Bulk updating command status', { ids, status, count: ids.length });
            
            const [updatedRowsCount] = await DroneCommandModel.update(
                { status },
                {
                    where: {
                        id: {
                            [Op.in]: ids
                        }
                    }
                }
            );
            
            logger.info(`Bulk updated ${updatedRowsCount} commands to status ${status}`);
            return updatedRowsCount;
        } catch (error) {
            logger.error('Error bulk updating command status', { ids, status, error });
            throw error;
        }
    }

    /**
     * 批量標記指令為失敗
     * 
     * @param {number[]} ids - 指令 ID 陣列
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<number>} 更新的記錄數
     */
    async bulkMarkAsFailed(ids: number[], errorMessage: string): Promise<number> {
        try {
            logger.info('Bulk marking commands as failed', { ids, errorMessage, count: ids.length });
            
            const [updatedRowsCount] = await DroneCommandModel.update(
                {
                    status: DroneCommandStatus.FAILED,
                    completed_at: new Date(),
                    error_message: errorMessage
                },
                {
                    where: {
                        id: {
                            [Op.in]: ids
                        }
                    }
                }
            );
            
            logger.info(`Bulk marked ${updatedRowsCount} commands as failed`);
            return updatedRowsCount;
        } catch (error) {
            logger.error('Error bulk marking commands as failed', { ids, errorMessage, error });
            throw error;
        }
    }

    /**
     * 重置超時的待執行指令
     * 
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<number>} 重置的指令數量
     */
    async resetTimeoutCommands(timeoutMinutes: number, errorMessage: string = '指令執行超時'): Promise<number> {
        try {
            logger.info('Resetting timeout commands', { timeoutMinutes, errorMessage });
            
            const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
            
            const [updatedRowsCount] = await DroneCommandModel.update(
                {
                    status: DroneCommandStatus.FAILED,
                    completed_at: new Date(),
                    error_message: errorMessage
                },
                {
                    where: {
                        status: DroneCommandStatus.PENDING,
                        issued_at: {
                            [Op.lt]: timeoutDate
                        }
                    }
                }
            );
            
            logger.info(`Reset ${updatedRowsCount} timeout commands`);
            return updatedRowsCount;
        } catch (error) {
            logger.error('Error resetting timeout commands', { timeoutMinutes, errorMessage, error });
            throw error;
        }
    }

    /**
     * 取消指定無人機的所有待執行指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {string} reason - 取消原因
     * @returns {Promise<number>} 取消的指令數量
     */
    async cancelPendingCommandsByDroneId(droneId: number, reason: string = '指令已取消'): Promise<number> {
        try {
            logger.info('Cancelling pending commands for drone', { droneId, reason });
            
            const [updatedRowsCount] = await DroneCommandModel.update(
                {
                    status: DroneCommandStatus.FAILED,
                    completed_at: new Date(),
                    error_message: reason
                },
                {
                    where: {
                        drone_id: droneId,
                        status: DroneCommandStatus.PENDING
                    }
                }
            );
            
            logger.info(`Cancelled ${updatedRowsCount} pending commands for drone ${droneId}`);
            return updatedRowsCount;
        } catch (error) {
            logger.error('Error cancelling pending commands for drone', { droneId, reason, error });
            throw error;
        }
    }

    /**
     * 重試失敗的指令
     * 
     * @param {number} id - 指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    async retryFailedCommand(id: number): Promise<DroneCommandAttributes | null> {
        try {
            logger.info('Retrying failed command', { id });
            
            const [updatedRowsCount] = await DroneCommandModel.update(
                {
                    status: DroneCommandStatus.PENDING,
                    error_message: null,
                    executed_at: null,
                    completed_at: null
                },
                {
                    where: {
                        id,
                        status: DroneCommandStatus.FAILED
                    }
                }
            );

            if (updatedRowsCount > 0) {
                const updatedCommand = await DroneCommandModel.findByPk(id);
                if (updatedCommand) {
                    logger.info('Command retry successful', { id });
                    return updatedCommand.toJSON() as DroneCommandAttributes;
                }
            }
            
            logger.warn('Command not found or not in failed status for retry', { id });
            return null;
        } catch (error) {
            logger.error('Error retrying failed command', { id, error });
            throw error;
        }
    }
}
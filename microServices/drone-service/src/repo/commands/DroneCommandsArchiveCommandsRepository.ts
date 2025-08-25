/**
 * @fileoverview 無人機指令歷史歸檔命令 Repositorysitorysitory - CQRS 命令端
 *
 * 專門處理無人機指令歷史歸檔資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneCommandsArchiveModel, type DroneCommandsArchiveAttributes, type DroneCommandsArchiveCreationAttributes } from '../../models/DroneCommandsArchiveModel.js';
import { DroneCommandStatus } from '../../models/DroneCommandModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

// 創建 Repositorysitorysitory 專用的日誌記錄器
const logger = createLogger('DroneCommandsArchiveCommandsRepositorysitorysitory');

/**
 * 無人機指令歷史歸檔命令 Repositorysitorysitory 實現類別 - CQRS 命令端
 *
 * 專門處理無人機指令歷史歸檔資料的寫入操作，遵循 CQRS 模式
 *
 * @class DroneCommandsArchiveCommandsRepositorysitorysitory
 */
@injectable()
export class DroneCommandsArchiveCommandsRepository {
    /**
     * 創建新的指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes} data - 要創建的歸檔資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 創建後的歸檔資料
     */
    insert = async (data: DroneCommandsArchiveCreationAttributes): Promise<DroneCommandsArchiveAttributes> => {
        try {
            logger.info('Creating new drone command archive', { droneId: data.drone_id, commandType: data.command_type });
            const archive = await DroneCommandsArchiveModel.create(data);

            logger.info('Successfully created command archive', { id: archive.id });
            return archive.toJSON() as DroneCommandsArchiveAttributes;
        } catch (error) {
            logger.error('Error creating drone command archive', { data, error });
            throw error;
        }
    }

    /**
     * 批量創建指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes[]} dataArray - 要創建的歸檔資料陣列
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 創建後的歸檔資料陣列
     */
    bulkInsert = async (dataArray: DroneCommandsArchiveCreationAttributes[]): Promise<DroneCommandsArchiveAttributes[]> => {
        try {
            logger.info('Bulk creating drone command archives', { count: dataArray.length });
            const archives = await DroneCommandsArchiveModel.bulkCreate(dataArray, {
                returning: true
            });

            logger.info('Successfully bulk created command archives', { count: archives.length });
            return archives.map(item => item.toJSON() as DroneCommandsArchiveAttributes);
        } catch (error) {
            logger.error('Error bulk creating drone command archives', { count: dataArray.length, error });
            throw error;
        }
    }

    /**
     * 更新指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 更新後的歸檔資料或 null
     */
    update = async (id: number, data: Partial<DroneCommandsArchiveAttributes>): Promise<DroneCommandsArchiveAttributes | null> => {
        try {
            logger.info('Updating drone command archive', { id, data });
            const [affectedRows] = await DroneCommandsArchiveModel.update(data, {
                where: { id }
            });

            if (affectedRows === 0) {
                logger.warn('Command archive not found for update', { id });
                return null;
            }

            const updatedArchive = await DroneCommandsArchiveModel.findByPk(id);
            if (updatedArchive) {
                logger.info('Successfully updated command archive', { id });
                return updatedArchive.toJSON() as DroneCommandsArchiveAttributes;
            } else {
                logger.error('Failed to fetch updated command archive', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error updating drone command archive', { id, data, error });
            throw error;
        }
    }

    /**
     * 批量更新指令歷史歸檔資料
     *
     * @param {number[]} ids - 歸檔資料 ID 陣列
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<number>} 更新的記錄數
     */
    bulkUpdate = async (ids: number[], data: Partial<DroneCommandsArchiveAttributes>): Promise<number> => {
        try {
            logger.info('Bulk updating drone command archives', { ids, data, count: ids.length });
            const [affectedRows] = await DroneCommandsArchiveModel.update(data, {
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            });

            logger.info(`Successfully bulk updated ${affectedRows} command archives`);
            return affectedRows;
        } catch (error) {
            logger.error('Error bulk updating drone command archives', { ids, data, error });
            throw error;
        }
    }

    /**
     * 刪除指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    delete = async (id: number): Promise<boolean> => {
        try {
            logger.info('Deleting drone command archive', { id });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: { id }
            });

            const success = deletedRows > 0;
            if (success) {
                logger.info('Successfully deleted command archive', { id });
            } else {
                logger.warn('Command archive not found for deletion', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error deleting drone command archive', { id, error });
            throw error;
        }
    }

    /**
     * 批量刪除指令歷史歸檔資料
     *
     * @param {number[]} ids - 歸檔資料 ID 陣列
     * @returns {Promise<number>} 刪除的記錄數
     */
    bulkDelete = async (ids: number[]): Promise<number> => {
        try {
            logger.info('Bulk deleting drone command archives', { ids, count: ids.length });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: {
                    id: {
                        [Op.in]: ids
                    }
                }
            });

            logger.info(`Successfully bulk deleted ${deletedRows} command archives`);
            return deletedRows;
        } catch (error) {
            logger.error('Error bulk deleting drone command archives', { ids, error });
            throw error;
        }
    }

    /**
     * 根據無人機 ID 刪除指令歷史歸檔資料
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByDroneId = async (droneId: number): Promise<number> => {
        try {
            logger.info('Deleting command archives by drone ID', { droneId });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: { drone_id: droneId }
            });

            logger.info(`Successfully deleted ${deletedRows} command archives for drone`, { droneId });
            return deletedRows;
        } catch (error) {
            logger.error('Error deleting command archives by drone ID', { droneId, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍刪除指令歷史歸檔資料
     *
     * @param {Date} beforeDate - 刪除此日期之前的資料
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteBeforeDate = async (beforeDate: Date): Promise<number> => {
        try {
            logger.info('Deleting command archives before date', { beforeDate });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: {
                    created_at: {
                        [Op.lt]: beforeDate
                    }
                }
            });

            logger.info(`Successfully deleted ${deletedRows} command archives before date`, { beforeDate });
            return deletedRows;
        } catch (error) {
            logger.error('Error deleting command archives before date', { beforeDate, error });
            throw error;
        }
    }

    /**
     * 根據時間範圍刪除指令歷史歸檔資料
     *
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByTimeRange = async (startDate: Date, endDate: Date): Promise<number> => {
        try {
            logger.info('Deleting command archives by time range', { startDate, endDate });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: {
                    created_at: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            logger.info(`Successfully deleted ${deletedRows} command archives in time range`);
            return deletedRows;
        } catch (error) {
            logger.error('Error deleting command archives by time range', { startDate, endDate, error });
            throw error;
        }
    }

    /**
     * 根據指令類型刪除指令歷史歸檔資料
     *
     * @param {string} commandType - 指令類型
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByCommandType = async (commandType: string): Promise<number> => {
        try {
            logger.info('Deleting command archives by command type', { commandType });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: { command_type: commandType }
            });

            logger.info(`Successfully deleted ${deletedRows} command archives of type`, { commandType });
            return deletedRows;
        } catch (error) {
            logger.error('Error deleting command archives by command type', { commandType, error });
            throw error;
        }
    }

    /**
     * 根據狀態刪除指令歷史歸檔資料
     *
     * @param {string} status - 指令狀態
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteByStatus = async (status: string): Promise<number> => {
        try {
            logger.info('Deleting command archives by status', { status });
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: { status }
            });

            logger.info(`Successfully deleted ${deletedRows} command archives with status`, { status });
            return deletedRows;
        } catch (error) {
            logger.error('Error deleting command archives by status', { status, error });
            throw error;
        }
    }

    /**
     * 清空所有指令歷史歸檔資料
     *
     * @returns {Promise<number>} 刪除的記錄數
     */
    truncate = async (): Promise<number> => {
        try {
            logger.info('Truncating all command archives');
            const deletedRows = await DroneCommandsArchiveModel.destroy({
                where: {},
                truncate: true
            });

            logger.info(`Successfully truncated command archives, deleted ${deletedRows} records`);
            return deletedRows;
        } catch (error) {
            logger.error('Error truncating command archives', { error });
            throw error;
        }
    }

    /**
     * 更新歸檔資料的狀態
     *
     * @param {number} id - 歸檔資料 ID
     * @param {string} status - 新狀態
     * @returns {Promise<boolean>} 是否更新成功
     */
    updateStatus = async (id: number, status: DroneCommandStatus): Promise<boolean> => {
        try {
            logger.info('Updating command archive status', { id, status });
            const [affectedRows] = await DroneCommandsArchiveModel.update(
                { status },
                {
                    where: { id }
                }
            );

            const success = affectedRows > 0;
            if (success) {
                logger.info('Successfully updated command archive status', { id, status });
            } else {
                logger.warn('Command archive not found for status update', { id });
            }

            return success;
        } catch (error) {
            logger.error('Error updating command archive status', { id, status, error });
            throw error;
        }
    }

    /**
     * 批量更新歸檔資料的狀態
     *
     * @param {number[]} ids - 歸檔資料 ID 陣列
     * @param {string} status - 新狀態
     * @returns {Promise<number>} 更新的記錄數
     */
    bulkUpdateStatus = async (ids: number[], status: DroneCommandStatus): Promise<number> => {
        try {
            logger.info('Bulk updating command archives status', { ids, status, count: ids.length });
            const [affectedRows] = await DroneCommandsArchiveModel.update(
                { status },
                {
                    where: {
                        id: {
                            [Op.in]: ids
                        }
                    }
                }
            );

            logger.info(`Successfully bulk updated ${affectedRows} command archives status to ${status}`);
            return affectedRows;
        } catch (error) {
            logger.error('Error bulk updating command archives status', { ids, status, error });
            throw error;
        }
    }
}
/**
 * @fileoverview RTK Repository 實現
 * 
 * 實現 RTK 資料存取層的具體邏輯，使用 Sequelize ORM 進行資料庫操作。
 * 遵循 Repository Pattern，提供清晰的資料存取介面。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { RTKModel, type RTKAttributes, type RTKCreationAttributes } from '../models/RTKModel.js';
import type { IRTKRepository } from '../types/repositories/IRTKRepository.js';
import { createLogger } from '../configs/loggerConfig.js';

// 創建 Repository 專用的日誌記錄器
const logger = createLogger('RTKRepository');

/**
 * RTK Repository 實現類別
 * 
 * 實現 IRTKRepository 介面，提供 RTK 資料的具體存取方法
 * 
 * @class RTKRepository
 * @implements {IRTKRepository}
 */
export class RTKRepository implements IRTKRepository {
    /**
     * 取得所有 RTK 資料
     * 
     * @returns {Promise<RTKAttributes[]>} RTK 資料陣列
     */
    async findAll(): Promise<RTKAttributes[]> {
        try {
            logger.info('Fetching all RTK data');
            const rtkData = await RTKModel.findAll({
                order: [['createdAt', 'DESC']]
            });
            
            logger.info(`Successfully fetched ${rtkData.length} RTK records`);
            return rtkData.map(item => item.toJSON() as RTKAttributes);
        } catch (error) {
            logger.error('Error fetching all RTK data', { error });
            throw error;
        }
    }

    /**
     * 根據 ID 取得單筆 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<RTKAttributes | null>} RTK 資料或 null
     */
    async findById(id: number): Promise<RTKAttributes | null> {
        try {
            logger.info('Fetching RTK data by ID', { id });
            const rtkData = await RTKModel.findByPk(id);
            
            if (rtkData) {
                logger.info('RTK data found', { id });
                return rtkData.toJSON() as RTKAttributes;
            } else {
                logger.warn('RTK data not found', { id });
                return null;
            }
        } catch (error) {
            logger.error('Error fetching RTK data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 建立新的 RTK 資料
     * 
     * @param {RTKCreationAttributes} data - RTK 建立資料
     * @returns {Promise<RTKAttributes>} 建立的 RTK 資料
     */
    async create(data: RTKCreationAttributes): Promise<RTKAttributes> {
        try {
            logger.info('Creating new RTK data', { data });
            const rtkData = await RTKModel.create(data);
            
            logger.info('RTK data created successfully', { id: rtkData.id });
            return rtkData.toJSON() as RTKAttributes;
        } catch (error) {
            logger.error('Error creating RTK data', { data, error });
            throw error;
        }
    }

    /**
     * 更新 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @param {Partial<RTKCreationAttributes>} data - 更新資料
     * @returns {Promise<RTKAttributes | null>} 更新後的 RTK 資料或 null
     */
    async update(id: number, data: Partial<RTKCreationAttributes>): Promise<RTKAttributes | null> {
        try {
            logger.info('Updating RTK data', { id, data });
            
            const [updatedRowsCount] = await RTKModel.update(data, {
                where: { id }
            });

            if (updatedRowsCount > 0) {
                const updatedRtkData = await RTKModel.findByPk(id);
                if (updatedRtkData) {
                    logger.info('RTK data updated successfully', { id });
                    return updatedRtkData.toJSON() as RTKAttributes;
                }
            }
            
            logger.warn('RTK data not found for update', { id });
            return null;
        } catch (error) {
            logger.error('Error updating RTK data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    async delete(id: number): Promise<boolean> {
        try {
            logger.info('Deleting RTK data', { id });
            
            const deletedRowsCount = await RTKModel.destroy({
                where: { id }
            });

            const success = deletedRowsCount > 0;
            if (success) {
                logger.info('RTK data deleted successfully', { id });
            } else {
                logger.warn('RTK data not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deleting RTK data', { id, error });
            throw error;
        }
    }

    /**
     * 取得最新的 RTK 資料
     * 
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<RTKAttributes[]>} 最新的 RTK 資料陣列
     */
    async findLatest(limit: number = 10): Promise<RTKAttributes[]> {
        try {
            logger.info('Fetching latest RTK data', { limit });
            
            const rtkData = await RTKModel.findAll({
                order: [['createdAt', 'DESC']],
                limit
            });
            
            logger.info(`Successfully fetched ${rtkData.length} latest RTK records`);
            return rtkData.map(item => item.toJSON() as RTKAttributes);
        } catch (error) {
            logger.error('Error fetching latest RTK data', { limit, error });
            throw error;
        }
    }
}
/**
 * @fileoverview 用戶偏好設定命令 Repository - CQRS 命令端
 *
 * 專門處理用戶偏好設定資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserPreferenceModel, type UserPreferenceAttributes, type UserPreferenceCreationAttributes } from '../../models/UserPreferenceModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

/**
 * 用戶偏好設定命令 Repository 實現類別 - CQRS 命令端
 *
 * 專門處理用戶偏好設定資料的寫入操作，遵循 CQRS 模式
 *
 * @class UserPreferenceCommandsRepository
 */
@injectable()
export class UserPreferenceCommandsRepository {
    private readonly logger = createLogger('UserPreferenceCommandsRepository');

    /**
     * 建立新的用戶偏好設定資料
     *
     * @param {UserPreferenceCreationAttributes} data - 用戶偏好設定建立資料
     * @returns {Promise<UserPreferenceAttributes>} 建立的用戶偏好設定資料
     */
    async create(data: UserPreferenceCreationAttributes): Promise<UserPreferenceAttributes> {
        try {
            this.logger.info('Creating new user preference data', { data });
            const userPreference = await UserPreferenceModel.create(data);

            this.logger.info('User preference data created successfully', { id: userPreference.id });
            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            this.logger.error('Error creating user preference data', { data, error });
            throw error;
        }
    }

    /**
     * 批量建立用戶偏好設定資料
     *
     * @param {UserPreferenceCreationAttributes[]} dataList - 用戶偏好設定資料列表
     * @returns {Promise<UserPreferenceAttributes[]>} 建立的用戶偏好設定資料列表
     */
    async bulkCreate(dataList: UserPreferenceCreationAttributes[]): Promise<UserPreferenceAttributes[]> {
        try {
            this.logger.info('Bulk creating user preference data', { count: dataList.length });
            const userPreferences = await UserPreferenceModel.bulkCreate(dataList);

            this.logger.info('User preference data bulk created successfully', { count: userPreferences.length });
            return userPreferences.map(item => item.toJSON() as UserPreferenceAttributes);
        } catch (error) {
            this.logger.error('Error bulk creating user preference data', { count: dataList.length, error });
            throw error;
        }
    }

    /**
     * 根據 ID 更新用戶偏好設定資料
     *
     * @param {number} id - 用戶偏好設定 ID
     * @param {Partial<UserPreferenceAttributes>} data - 要更新的資料
     * @returns {Promise<UserPreferenceAttributes | null>} 更新後的用戶偏好設定資料
     */
    async updateById(id: number, data: Partial<UserPreferenceAttributes>): Promise<UserPreferenceAttributes | null> {
        try {
            this.logger.info('Updating user preference data by ID', { id, data });

            const [affectedCount] = await UserPreferenceModel.update(data, {
                where: { id }
            });

            if (affectedCount === 0) {
                this.logger.warn('No user preference found with given ID', { id });
                return null;
            }

            // 取得更新後的資料
            const updatedUserPreference = await UserPreferenceModel.findByPk(id);
            if (!updatedUserPreference) {
                this.logger.error('Failed to retrieve updated user preference data', { id });
                return null;
            }

            this.logger.info('User preference data updated successfully', { id });
            return updatedUserPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            this.logger.error('Error updating user preference data by ID', { id, data, error });
            throw error;
        }
    }

    /**
     * 根據用戶 ID 更新用戶偏好設定資料
     *
     * @param {number} userId - 用戶 ID
     * @param {Partial<UserPreferenceAttributes>} data - 要更新的資料
     * @returns {Promise<UserPreferenceAttributes | null>} 更新後的用戶偏好設定資料
     */
    async updateByUserId(userId: number, data: Partial<UserPreferenceAttributes>): Promise<UserPreferenceAttributes | null> {
        try {
            this.logger.info('Updating user preference data by user ID', { userId, data });

            const [affectedCount] = await UserPreferenceModel.update(data, {
                where: { userId: userId }
            });

            if (affectedCount === 0) {
                this.logger.warn('No user preference found with given user ID', { userId });
                return null;
            }

            // 取得更新後的資料
            const updatedUserPreference = await UserPreferenceModel.findOne({
                where: { userId: userId }
            });

            if (!updatedUserPreference) {
                this.logger.error('Failed to retrieve updated user preference data', { userId });
                return null;
            }

            this.logger.info('User preference data updated successfully', { userId });
            return updatedUserPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            this.logger.error('Error updating user preference data by user ID', { userId, data, error });
            throw error;
        }
    }

    /**
     * 根據 ID 刪除用戶偏好設定資料
     *
     * @param {number} id - 用戶偏好設定 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    async deleteById(id: number): Promise<boolean> {
        try {
            this.logger.info('Deleting user preference data by ID', { id });

            const deletedCount = await UserPreferenceModel.destroy({
                where: { id }
            });

            if (deletedCount === 0) {
                this.logger.warn('No user preference found with given ID', { id });
                return false;
            }

            this.logger.info('User preference data deleted successfully', { id, deletedCount });
            return true;
        } catch (error) {
            this.logger.error('Error deleting user preference data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據用戶 ID 刪除用戶偏好設定資料
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    async deleteByUserId(userId: number): Promise<boolean> {
        try {
            this.logger.info('Deleting user preference data by user ID', { userId });

            const deletedCount = await UserPreferenceModel.destroy({
                where: { userId: userId }
            });

            if (deletedCount === 0) {
                this.logger.warn('No user preference found with given user ID', { userId });
                return false;
            }

            this.logger.info('User preference data deleted successfully', { userId, deletedCount });
            return true;
        } catch (error) {
            this.logger.error('Error deleting user preference data by user ID', { userId, error });
            throw error;
        }
    }

    /**
     * 建立或更新用戶偏好設定資料（upsert）
     *
     * @param {number} userId - 用戶 ID
     * @param {Partial<UserPreferenceAttributes>} data - 用戶偏好設定資料
     * @returns {Promise<UserPreferenceAttributes>} 建立或更新的用戶偏好設定資料
     */
    async upsertByUserId(userId: number, data: Partial<UserPreferenceAttributes>): Promise<UserPreferenceAttributes> {
        try {
            this.logger.info('Upserting user preference data by user ID', { userId, data });

            // 嘗試更新現有記錄
            const existingPreference = await UserPreferenceModel.findOne({
                where: { userId: userId }
            });

            let userPreference: UserPreferenceModel;

            if (existingPreference) {
                // 更新現有記錄
                await existingPreference.update(data);
                userPreference = existingPreference;
                this.logger.info('User preference data updated via upsert', { userId });
            } else {
                // 建立新記錄
                const createData = {
                    userId: userId,
                    ...data
                } as UserPreferenceCreationAttributes;

                userPreference = await UserPreferenceModel.create(createData);
                this.logger.info('User preference data created via upsert', { userId });
            }

            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            this.logger.error('Error upserting user preference data by user ID', { userId, data, error });
            throw error;
        }
    }
}
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
import { Logger, LogRepository } from '../../decorators/LoggerDecorator.js';
import { Op } from 'sequelize';

/**
 * 用戶偏好設定命令 Repository 實現類別 - CQRS 命令端
 *
 * 專門處理用戶偏好設定資料的寫入操作，遵循 CQRS 模式
 *
 * @class UserPreferenceCommandsRepository
 */
@injectable()
@Logger('UserPreferenceCommandsRepository')
export class UserPreferenceCommandsRepository {

    /**
     * 建立新的用戶偏好設定資料
     *
     * @param {UserPreferenceCreationAttributes} data - 用戶偏好設定建立資料
     * @returns {Promise<UserPreferenceAttributes>} 建立的用戶偏好設定資料
     */
    async create(data: UserPreferenceCreationAttributes): Promise<UserPreferenceAttributes> {
        try {
            const userPreference = await UserPreferenceModel.create(data);

            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
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
            const userPreferences = await UserPreferenceModel.bulkCreate(dataList);

            return userPreferences.map(item => item.toJSON() as UserPreferenceAttributes);
        } catch (error) {
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

            const [affectedCount] = await UserPreferenceModel.update(data, {
                where: { id }
            });

            if (affectedCount === 0) {
                return null;
            }

            // 取得更新後的資料
            const updatedUserPreference = await UserPreferenceModel.findByPk(id);
            if (!updatedUserPreference) {
                return null;
            }

            return updatedUserPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
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

            const [affectedCount] = await UserPreferenceModel.update(data, {
                where: { userId: userId }
            });

            if (affectedCount === 0) {
                return null;
            }

            // 取得更新後的資料
            const updatedUserPreference = await UserPreferenceModel.findOne({
                where: { userId: userId }
            });

            if (!updatedUserPreference) {
                return null;
            }

            return updatedUserPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
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

            const deletedCount = await UserPreferenceModel.destroy({
                where: { id }
            });

            if (deletedCount === 0) {
                return false;
            }

            return true;
        } catch (error) {
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

            const deletedCount = await UserPreferenceModel.destroy({
                where: { userId: userId }
            });

            if (deletedCount === 0) {
                return false;
            }

            return true;
        } catch (error) {
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

            // 嘗試更新現有記錄
            const existingPreference = await UserPreferenceModel.findOne({
                where: { userId: userId }
            });

            let userPreference: UserPreferenceModel;

            if (existingPreference) {
                // 更新現有記錄
                await existingPreference.update(data);
                userPreference = existingPreference;
            } else {
                // 建立新記錄
                const createData = {
                    userId: userId,
                    ...data
                } as UserPreferenceCreationAttributes;

                userPreference = await UserPreferenceModel.create(createData);
            }

            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            throw error;
        }
    }
}
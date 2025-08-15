/**
 * @fileoverview 用戶偏好設定命令 Service 實現
 *
 * 此文件實作了用戶偏好設定命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module UserPreferenceCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserPreferenceCommandsRepository } from '../../repo/commands/UserPreferenceCommandsRepo.js';
import { UserPreferenceQueriesRepository } from '../../repo/queries/UserPreferenceQueriesRepo.js';
import type { UserPreferenceAttributes, UserPreferenceCreationAttributes } from '../../models/UserPreferenceModel.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

/**
 * 用戶偏好設定預設值
 */
const DEFAULT_USER_PREFERENCES = {
    theme: 'auto' as 'light' | 'dark' | 'auto',
    language: 'zh-TW',
    timezone: 'Asia/Taipei',
    autoSave: true,
    notifications: true
};

/**
 * 用戶偏好設定命令 Service 實現類別
 *
 * 專門處理用戶偏好設定相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class UserPreferenceCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class UserPreferenceCommandsSvc {
    constructor(
        @inject(TYPES.UserPreferenceCommandsRepo) 
        private readonly commandsRepository: UserPreferenceCommandsRepository,
        
        @inject(TYPES.UserPreferenceQueriesRepo) 
        private readonly queriesRepository: UserPreferenceQueriesRepository
    ) {}

    /**
     * 創建新的用戶偏好設定
     *
     * @param {UserPreferenceCreationAttributes} preferenceData - 用戶偏好設定資料
     * @returns {Promise<UserPreferenceAttributes>} 創建的用戶偏好設定
     */
    createUserPreference = async (preferenceData: UserPreferenceCreationAttributes): Promise<UserPreferenceAttributes> => {
        try {

            // 檢查是否已存在該用戶的偏好設定
            const existingPreference = await this.queriesRepository.selectByUserId(preferenceData.userId);
            if (existingPreference) {
                throw new Error('用戶偏好設定已存在');
            }

            // 合併預設值和提供的資料
            const dataWithDefaults = {
                ...DEFAULT_USER_PREFERENCES,
                ...preferenceData
            };

            const createdPreference = await this.commandsRepository.create(dataWithDefaults);

            return createdPreference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量創建用戶偏好設定
     *
     * @param {UserPreferenceCreationAttributes[]} preferencesData - 用戶偏好設定資料列表
     * @returns {Promise<UserPreferenceAttributes[]>} 創建的用戶偏好設定列表
     */
    bulkCreateUserPreferences = async (preferencesData: UserPreferenceCreationAttributes[]): Promise<UserPreferenceAttributes[]> => {
        try {

            // 檢查重複的用戶 ID
            const userIds = preferencesData.map(pref => pref.userId);
            const uniqueUserIds = [...new Set(userIds)];
            
            if (userIds.length !== uniqueUserIds.length) {
                throw new Error('批次創建中存在重複的用戶 ID');
            }

            // 檢查是否有任何用戶已存在偏好設定
            const existingChecks = await Promise.all(
                uniqueUserIds.map(userId => this.queriesRepository.existsByUserId(userId))
            );

            const hasExisting = existingChecks.some(exists => exists);
            if (hasExisting) {
                throw new Error('部分用戶的偏好設定已存在');
            }

            // 為所有資料添加預設值
            const dataWithDefaults = preferencesData.map(pref => ({
                ...DEFAULT_USER_PREFERENCES,
                ...pref
            }));

            const createdPreferences = await this.commandsRepository.bulkCreate(dataWithDefaults);

            return createdPreferences;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新用戶偏好設定
     *
     * @param {number} id - 偏好設定 ID
     * @param {Partial<UserPreferenceAttributes>} updateData - 要更新的資料
     * @returns {Promise<UserPreferenceAttributes>} 更新後的用戶偏好設定
     */
    updateUserPreference = async (id: number, updateData: Partial<UserPreferenceAttributes>): Promise<UserPreferenceAttributes> => {
        try {

            // 驗證偏好設定是否存在
            const existingPreference = await this.queriesRepository.selectById(id);
            if (!existingPreference) {
                throw new Error('用戶偏好設定不存在');
            }

            // 驗證更新資料
            this.validatePreferenceData(updateData);

            const updatedPreference = await this.commandsRepository.updateById(id, updateData);
            if (!updatedPreference) {
                throw new Error('更新用戶偏好設定失敗');
            }

            return updatedPreference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據用戶 ID 更新用戶偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @param {Partial<UserPreferenceAttributes>} updateData - 要更新的資料
     * @returns {Promise<UserPreferenceAttributes>} 更新後的用戶偏好設定
     */
    updateUserPreferenceByUserId = async (userId: number, updateData: Partial<UserPreferenceAttributes>): Promise<UserPreferenceAttributes> => {
        try {

            // 驗證偏好設定是否存在
            const existingPreference = await this.queriesRepository.selectByUserId(userId);
            if (!existingPreference) {
                throw new Error('用戶偏好設定不存在');
            }

            // 驗證更新資料
            this.validatePreferenceData(updateData);

            const updatedPreference = await this.commandsRepository.updateByUserId(userId, updateData);
            if (!updatedPreference) {
                throw new Error('更新用戶偏好設定失敗');
            }

            return updatedPreference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除用戶偏好設定
     *
     * @param {number} id - 偏好設定 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    deleteUserPreference = async (id: number): Promise<boolean> => {
        try {

            // 驗證偏好設定是否存在
            const existingPreference = await this.queriesRepository.selectById(id);
            if (!existingPreference) {
                throw new Error('用戶偏好設定不存在');
            }

            const deleted = await this.commandsRepository.deleteById(id);

            return deleted;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據用戶 ID 刪除用戶偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    deleteUserPreferenceByUserId = async (userId: number): Promise<boolean> => {
        try {

            // 驗證偏好設定是否存在
            const existingPreference = await this.queriesRepository.selectByUserId(userId);
            if (!existingPreference) {
                throw new Error('用戶偏好設定不存在');
            }

            const deleted = await this.commandsRepository.deleteByUserId(userId);

            return deleted;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 創建或更新用戶偏好設定（upsert）
     *
     * @param {number} userId - 用戶 ID
     * @param {Partial<UserPreferenceAttributes>} preferenceData - 用戶偏好設定資料
     * @returns {Promise<UserPreferenceAttributes>} 創建或更新的用戶偏好設定
     */
    upsertUserPreference = async (userId: number, preferenceData: Partial<UserPreferenceAttributes>): Promise<UserPreferenceAttributes> => {
        try {

            // 驗證偏好設定資料
            this.validatePreferenceData(preferenceData);

            // 添加預設值（僅在創建時）
            const dataWithDefaults = {
                ...DEFAULT_USER_PREFERENCES,
                ...preferenceData
            };

            const upsertedPreference = await this.commandsRepository.upsertByUserId(userId, dataWithDefaults);

            return upsertedPreference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 重置用戶偏好設定為預設值
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<UserPreferenceAttributes>} 重置後的用戶偏好設定
     */
    resetUserPreferenceToDefault = async (userId: number): Promise<UserPreferenceAttributes> => {
        try {

            const resetPreference = await this.commandsRepository.upsertByUserId(userId, DEFAULT_USER_PREFERENCES);

            return resetPreference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證用戶偏好設定資料
     *
     * @private
     * @param {Partial<UserPreferenceAttributes>} data - 要驗證的資料
     * @throws {Error} 當資料格式不正確時拋出錯誤
     */
    private validatePreferenceData = (data: Partial<UserPreferenceAttributes>): void => {
        // 驗證主題偏好
        if (data.theme && !['light', 'dark', 'auto'].includes(data.theme)) {
            throw new Error('無效的主題偏好，必須為 light、dark 或 auto');
        }

        // 驗證語言偏好格式（簡單驗證）
        if (data.language && !/^[a-z]{2}-[A-Z]{2}$/.test(data.language)) {
            throw new Error('無效的語言偏好格式，應為 xx-XX 格式（如 zh-TW）');
        }

        // 驗證時區格式（簡單驗證）
        if (data.timezone && !data.timezone.includes('/')) {
            throw new Error('無效的時區格式，應為 Area/Location 格式（如 Asia/Taipei）');
        }
    }
}
/**
 * @fileoverview 用戶偏好設定查詢 Service 實現
 *
 * 此文件實作了用戶偏好設定查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，包含各種查詢和搜尋功能。
 *
 * @module UserPreferenceQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserPreferenceQueriesRepository } from '../../repo/queries/UserPreferenceQueriesRepo.js';
import type { UserPreferenceAttributes } from '../../models/UserPreferenceModel.js';
import type { PaginationParams, PaginatedData } from '../../types/ApiResponseType.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

/**
 * 搜尋條件介面
 */
export interface UserPreferenceSearchCriteria {
    userId?: number;
    theme?: string;
    language?: string;
    timezone?: string;
    autoSave?: boolean;
    notifications?: boolean;
}

/**
 * 統計資料介面
 */
export interface UserPreferenceStatistics {
    totalUsers: number;
    themeStats: { [key: string]: number };
    languageStats: { [key: string]: number };
    timezoneStats: { [key: string]: number };
    featureUsage: {
        autoSaveEnabled: number;
        notificationsEnabled: number;
    };
}

/**
 * 用戶偏好設定查詢 Service 實現類別
 *
 * 專門處理用戶偏好設定相關的查詢請求，包含各種查詢、搜尋和統計功能。
 * 所有方法都是唯讀操作，遵循 CQRS 模式的查詢端原則。
 *
 * @class UserPreferenceQueriesSvc
 * @since 1.0.0
 */
@injectable()
@Logger('UserPreferenceQueriesSvc')
export class UserPreferenceQueriesSvc {
    constructor(
        @inject(TYPES.UserPreferenceQueriesRepo) 
        private readonly queriesRepository: UserPreferenceQueriesRepository
    ) {}

    /**
     * 取得所有用戶偏好設定
     *
     * @param {number} limit - 限制回傳的數量
     * @returns {Promise<UserPreferenceAttributes[]>} 用戶偏好設定列表
     */
    async getAllUserPreferences(limit: number = 100): Promise<UserPreferenceAttributes[]> {
        try {
            const preferences = await this.queriesRepository.selectAll(limit);
            return preferences;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據 ID 取得用戶偏好設定
     *
     * @param {number} id - 偏好設定 ID
     * @returns {Promise<UserPreferenceAttributes | null>} 用戶偏好設定或 null
     */
    async getUserPreferenceById(id: number): Promise<UserPreferenceAttributes | null> {
        try {
            const preference = await this.queriesRepository.selectById(id);
            return preference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據用戶 ID 取得用戶偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<UserPreferenceAttributes | null>} 用戶偏好設定或 null
     */
    async getUserPreferenceByUserId(userId: number): Promise<UserPreferenceAttributes | null> {
        try {
            const preference = await this.queriesRepository.selectByUserId(userId);
            return preference;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據主題偏好取得用戶偏好設定
     *
     * @param {string} theme - 主題偏好
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定
     */
    async getUserPreferencesByTheme(
        theme: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> {
        try {
            const result = await this.queriesRepository.selectByTheme(theme, pagination);
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 分頁查詢用戶偏好設定
     *
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定
     */
    async getUserPreferencesWithPagination(
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> {
        try {
            const result = await this.queriesRepository.selectWithPagination(pagination);
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 搜尋用戶偏好設定
     *
     * @param {UserPreferenceSearchCriteria} searchCriteria - 搜尋條件
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的搜尋結果
     */
    async searchUserPreferences(
        searchCriteria: UserPreferenceSearchCriteria,
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> {
        try {
            const result = await this.queriesRepository.search(searchCriteria, pagination);
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 檢查用戶是否有偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<boolean>} 是否存在
     */
    async checkUserPreferenceExists(userId: number): Promise<boolean> {
        try {
            const exists = await this.queriesRepository.existsByUserId(userId);
            return exists;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得用戶偏好設定統計資料
     *
     * @returns {Promise<UserPreferenceStatistics>} 統計資料
     */
    async getUserPreferenceStatistics(): Promise<UserPreferenceStatistics> {
        try {
            const allPreferences = await this.queriesRepository.selectAll();
            
            const totalUsers = allPreferences.length;
            const themeStats: { [key: string]: number } = {};
            const languageStats: { [key: string]: number } = {};
            const timezoneStats: { [key: string]: number } = {};
            
            let autoSaveEnabled = 0;
            let notificationsEnabled = 0;

            for (const pref of allPreferences) {
                // 統計主題使用情況
                themeStats[pref.theme] = (themeStats[pref.theme] || 0) + 1;
                
                // 統計語言使用情況
                languageStats[pref.language] = (languageStats[pref.language] || 0) + 1;
                
                // 統計時區使用情況
                timezoneStats[pref.timezone] = (timezoneStats[pref.timezone] || 0) + 1;
                
                // 統計功能使用情況
                if (pref.autoSave) autoSaveEnabled++;
                if (pref.notifications) notificationsEnabled++;
            }

            const statistics: UserPreferenceStatistics = {
                totalUsers,
                themeStats,
                languageStats,
                timezoneStats,
                featureUsage: {
                    autoSaveEnabled,
                    notificationsEnabled
                }
            };

            return statistics;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得用戶偏好設定總數
     *
     * @returns {Promise<number>} 用戶偏好設定總數
     */
    async getUserPreferenceCount(): Promise<number> {
        try {
            const count = await this.queriesRepository.count();
            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 取得用戶偏好設定或預設值
     * 如果用戶沒有偏好設定，返回預設值
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<UserPreferenceAttributes>} 用戶偏好設定或預設值
     */
    async getUserPreferenceOrDefault(userId: number): Promise<UserPreferenceAttributes> {
        try {
            const preference = await this.queriesRepository.selectByUserId(userId);
            
            if (preference) {
                return preference;
            }

            // 回傳預設值
            const defaultPreference: UserPreferenceAttributes = {
                id: 0, // 臨時 ID，表示這不是真實的資料庫記錄
                userId: userId,
                theme: 'auto',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                autoSave: true,
                notifications: true
            };

            return defaultPreference;
        } catch (error) {
            throw error;
        }
    }
}
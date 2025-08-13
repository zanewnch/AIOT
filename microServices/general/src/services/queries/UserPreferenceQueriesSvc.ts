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
import type { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('UserPreferenceQueriesSvc');

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
export class UserPreferenceQueriesSvc {
    constructor(
        @inject(TYPES.UserPreferenceQueriesRepo) 
        private readonly queriesRepository: UserPreferenceQueriesRepository
    ) {}

    /**
     * 取得所有用戶偏好設定
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<UserPreferenceAttributes[]>} 用戶偏好設定列表
     */
    async getAllUserPreferences(limit: number = 100): Promise<UserPreferenceAttributes[]> {
        try {
            logger.info('Fetching all user preferences', { limit });

            const preferences = await this.queriesRepository.selectAll(limit);
            logger.info('Successfully fetched user preferences', { count: preferences.length });

            return preferences;
        } catch (error) {
            logger.error('Error fetching all user preferences', { 
                limit, 
                error: error instanceof Error ? error.message : error 
            });
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
            logger.info('Fetching user preference by ID', { id });

            const preference = await this.queriesRepository.selectById(id);
            logger.info('User preference fetch completed', { id, found: !!preference });

            return preference;
        } catch (error) {
            logger.error('Error fetching user preference by ID', { 
                id, 
                error: error instanceof Error ? error.message : error 
            });
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
            logger.info('Fetching user preference by user ID', { userId });

            const preference = await this.queriesRepository.selectByUserId(userId);
            logger.info('User preference fetch completed', { userId, found: !!preference });

            return preference;
        } catch (error) {
            logger.error('Error fetching user preference by user ID', { 
                userId, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    /**
     * 根據主題偏好取得用戶偏好設定
     *
     * @param {string} theme - 主題偏好
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定
     */
    async getUserPreferencesByTheme(
        theme: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            logger.info('Fetching user preferences by theme', { theme, pagination });

            const result = await this.queriesRepository.selectByTheme(theme, pagination);
            logger.info('User preferences by theme fetch completed', { 
                theme, 
                count: result.data.length, 
                total: result.pagination.total 
            });

            return result;
        } catch (error) {
            logger.error('Error fetching user preferences by theme', { 
                theme, 
                pagination, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    /**
     * 根據語言偏好取得用戶偏好設定
     *
     * @param {string} language - 語言偏好
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定
     */
    async getUserPreferencesByLanguage(
        language: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            logger.info('Fetching user preferences by language', { language, pagination });

            const result = await this.queriesRepository.selectByLanguage(language, pagination);
            logger.info('User preferences by language fetch completed', { 
                language, 
                count: result.data.length, 
                total: result.pagination.total 
            });

            return result;
        } catch (error) {
            logger.error('Error fetching user preferences by language', { 
                language, 
                pagination, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    /**
     * 根據時區偏好取得用戶偏好設定
     *
     * @param {string} timezone - 時區偏好
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定
     */
    async getUserPreferencesByTimezone(
        timezone: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            logger.info('Fetching user preferences by timezone', { timezone, pagination });

            const result = await this.queriesRepository.selectByTimezone(timezone, pagination);
            logger.info('User preferences by timezone fetch completed', { 
                timezone, 
                count: result.data.length, 
                total: result.pagination.total 
            });

            return result;
        } catch (error) {
            logger.error('Error fetching user preferences by timezone', { 
                timezone, 
                pagination, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    /**
     * 分頁查詢用戶偏好設定
     *
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定
     */
    async getUserPreferencesWithPagination(
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            logger.info('Fetching user preferences with pagination', { pagination });

            const result = await this.queriesRepository.selectWithPagination(pagination);
            logger.info('User preferences with pagination fetch completed', { 
                count: result.data.length, 
                total: result.pagination.total 
            });

            return result;
        } catch (error) {
            logger.error('Error fetching user preferences with pagination', { 
                pagination, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    /**
     * 搜尋用戶偏好設定
     *
     * @param {UserPreferenceSearchCriteria} searchCriteria - 搜尋條件
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的搜尋結果
     */
    async searchUserPreferences(
        searchCriteria: UserPreferenceSearchCriteria,
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            logger.info('Searching user preferences', { searchCriteria, pagination });

            const result = await this.queriesRepository.search(searchCriteria, pagination);
            logger.info('User preferences search completed', { 
                count: result.data.length, 
                total: result.pagination.total 
            });

            return result;
        } catch (error) {
            logger.error('Error searching user preferences', { 
                searchCriteria, 
                pagination, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }

    /**
     * 檢查用戶是否有偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<boolean>} 是否存在偏好設定
     */
    async checkUserPreferenceExists(userId: number): Promise<boolean> {
        try {
            logger.info('Checking user preference existence', { userId });

            const exists = await this.queriesRepository.existsByUserId(userId);
            logger.info('User preference existence check completed', { userId, exists });

            return exists;
        } catch (error) {
            logger.error('Error checking user preference existence', { 
                userId, 
                error: error instanceof Error ? error.message : error 
            });
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
            logger.info('Generating user preference statistics');

            // 取得所有偏好設定資料
            const allPreferences = await this.queriesRepository.selectAll(10000); // 設定大一點的限制
            const totalUsers = allPreferences.length;

            // 計算主題統計
            const themeStats: { [key: string]: number } = {};
            const languageStats: { [key: string]: number } = {};
            const timezoneStats: { [key: string]: number } = {};
            
            let autoSaveEnabled = 0;
            let notificationsEnabled = 0;

            allPreferences.forEach(pref => {
                // 主題統計
                const theme = pref.theme || 'unknown';
                themeStats[theme] = (themeStats[theme] || 0) + 1;

                // 語言統計
                const language = pref.language || 'unknown';
                languageStats[language] = (languageStats[language] || 0) + 1;

                // 時區統計
                const timezone = pref.timezone || 'unknown';
                timezoneStats[timezone] = (timezoneStats[timezone] || 0) + 1;

                // 功能使用統計
                if (pref.autoSave) autoSaveEnabled++;
                if (pref.notifications) notificationsEnabled++;
            });

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

            logger.info('User preference statistics generated successfully', { 
                totalUsers, 
                themeCount: Object.keys(themeStats).length,
                languageCount: Object.keys(languageStats).length 
            });

            return statistics;
        } catch (error) {
            logger.error('Error generating user preference statistics', { 
                error: error instanceof Error ? error.message : error 
            });
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
            logger.info('Counting user preferences');

            const count = await this.queriesRepository.count();
            logger.info('User preference count completed', { count });

            return count;
        } catch (error) {
            logger.error('Error counting user preferences', { 
                error: error instanceof Error ? error.message : error 
            });
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
            logger.info('Fetching user preference or default', { userId });

            const preference = await this.queriesRepository.selectByUserId(userId);
            
            if (preference) {
                logger.info('User preference found', { userId });
                return preference;
            }

            // 返回預設值
            const defaultPreference: UserPreferenceAttributes = {
                id: 0, // 臨時 ID，表示這不是真實的資料庫記錄
                userId: userId,
                theme: 'auto',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                autoSave: true,
                notifications: true
            };

            logger.info('Returned default user preference', { userId });
            return defaultPreference;
        } catch (error) {
            logger.error('Error fetching user preference or default', { 
                userId, 
                error: error instanceof Error ? error.message : error 
            });
            throw error;
        }
    }
}
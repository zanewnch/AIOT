/**
 * @fileoverview 用戶偏好設定查詢 Repository - CQRS 查詢端
 *
 * 專門處理用戶偏好設定資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserPreferenceModel, type UserPreferenceAttributes } from '../../models/UserPreferenceModel.js';
import type { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';

/**
 * 用戶偏好設定查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理用戶偏好設定資料的查詢操作，遵循 CQRS 模式
 *
 * @class UserPreferenceQueriesRepository
 */
@injectable()
export class UserPreferenceQueriesRepository {
    private readonly logger = createLogger('UserPreferenceQueriesRepository');

    /**
     * 取得所有用戶偏好設定資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<UserPreferenceAttributes[]>} 用戶偏好設定資料陣列
     */
    async selectAll(limit: number = 100): Promise<UserPreferenceAttributes[]> {
        try {
            this.logger.info('Fetching all user preference data');
            const userPreferences = await UserPreferenceModel.findAll({
                order: [['updatedAt', 'DESC']],
                limit
            });

            this.logger.info(`Successfully fetched ${userPreferences.length} user preference records`);
            return userPreferences.map(item => item.toJSON() as UserPreferenceAttributes);
        } catch (error) {
            this.logger.error('Error fetching all user preference data', { error });
            throw error;
        }
    }

    /**
     * 根據 ID 查詢用戶偏好設定資料
     *
     * @param {number} id - 用戶偏好設定 ID
     * @returns {Promise<UserPreferenceAttributes | null>} 用戶偏好設定資料或 null
     */
    async selectById(id: number): Promise<UserPreferenceAttributes | null> {
        try {
            this.logger.info('Fetching user preference data by ID', { id });
            const userPreference = await UserPreferenceModel.findByPk(id);

            if (!userPreference) {
                this.logger.warn('User preference not found', { id });
                return null;
            }

            this.logger.info('Successfully fetched user preference by ID', { id });
            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            this.logger.error('Error fetching user preference data by ID', { id, error });
            throw error;
        }
    }

    /**
     * 根據用戶 ID 查詢用戶偏好設定資料
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<UserPreferenceAttributes | null>} 用戶偏好設定資料或 null
     */
    async selectByUserId(userId: number): Promise<UserPreferenceAttributes | null> {
        try {
            this.logger.info('Fetching user preference data by user ID', { userId });
            const userPreference = await UserPreferenceModel.findOne({
                where: { userId: userId }
            });

            if (!userPreference) {
                this.logger.warn('User preference not found for user', { userId });
                return null;
            }

            this.logger.info('Successfully fetched user preference by user ID', { userId });
            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            this.logger.error('Error fetching user preference data by user ID', { userId, error });
            throw error;
        }
    }

    /**
     * 根據主題偏好查詢用戶偏好設定資料
     *
     * @param {string} theme - 主題偏好 ('light', 'dark', 'auto')
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    async selectByTheme(
        theme: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            this.logger.info('Fetching user preferences by theme', { theme, pagination });

            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await UserPreferenceModel.findAndCountAll({
                where: { theme: theme },
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const result: PaginatedResponse<UserPreferenceAttributes> = {
                data: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages
                }
            };

            this.logger.info(`Successfully fetched ${rows.length} user preferences by theme`, { theme, total: count });
            return result;
        } catch (error) {
            this.logger.error('Error fetching user preferences by theme', { theme, pagination, error });
            throw error;
        }
    }

    /**
     * 根據語言偏好查詢用戶偏好設定資料
     *
     * @param {string} language - 語言偏好 ('zh-TW', 'zh-CN', 'en-US', 等)
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    async selectByLanguage(
        language: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            this.logger.info('Fetching user preferences by language', { language, pagination });

            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await UserPreferenceModel.findAndCountAll({
                where: { language: language },
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const result: PaginatedResponse<UserPreferenceAttributes> = {
                data: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages
                }
            };

            this.logger.info(`Successfully fetched ${rows.length} user preferences by language`, { language, total: count });
            return result;
        } catch (error) {
            this.logger.error('Error fetching user preferences by language', { language, pagination, error });
            throw error;
        }
    }

    /**
     * 根據時區偏好查詢用戶偏好設定資料
     *
     * @param {string} timezone - 時區偏好
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    async selectByTimezone(
        timezone: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            this.logger.info('Fetching user preferences by timezone', { timezone, pagination });

            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await UserPreferenceModel.findAndCountAll({
                where: { timezone: timezone },
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const result: PaginatedResponse<UserPreferenceAttributes> = {
                data: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages
                }
            };

            this.logger.info(`Successfully fetched ${rows.length} user preferences by timezone`, { timezone, total: count });
            return result;
        } catch (error) {
            this.logger.error('Error fetching user preferences by timezone', { timezone, pagination, error });
            throw error;
        }
    }

    /**
     * 分頁查詢用戶偏好設定資料
     *
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    async selectWithPagination(
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            this.logger.info('Fetching user preferences with pagination', { pagination });

            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await UserPreferenceModel.findAndCountAll({
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const result: PaginatedResponse<UserPreferenceAttributes> = {
                data: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages
                }
            };

            this.logger.info(`Successfully fetched ${rows.length} user preferences with pagination`, { total: count });
            return result;
        } catch (error) {
            this.logger.error('Error fetching user preferences with pagination', { pagination, error });
            throw error;
        }
    }

    /**
     * 計算用戶偏好設定資料總數
     *
     * @returns {Promise<number>} 用戶偏好設定資料總數
     */
    async count(): Promise<number> {
        try {
            this.logger.info('Counting user preference data');
            const count = await UserPreferenceModel.count();

            this.logger.info('Successfully counted user preference data', { count });
            return count;
        } catch (error) {
            this.logger.error('Error counting user preference data', { error });
            throw error;
        }
    }

    /**
     * 檢查用戶是否存在偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<boolean>} 是否存在用戶偏好設定
     */
    async existsByUserId(userId: number): Promise<boolean> {
        try {
            this.logger.info('Checking if user preference exists', { userId });
            const count = await UserPreferenceModel.count({
                where: { userId: userId }
            });

            const exists = count > 0;
            this.logger.info('User preference existence check completed', { userId, exists });
            return exists;
        } catch (error) {
            this.logger.error('Error checking user preference existence', { userId, error });
            throw error;
        }
    }

    /**
     * 搜尋用戶偏好設定資料（支援多條件搜尋）
     *
     * @param {object} searchCriteria - 搜尋條件
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedResponse<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    async search(
        searchCriteria: {
            userId?: number;
            theme?: string;
            language?: string;
            timezone?: string;
            autoSave?: boolean;
            notifications?: boolean;
        },
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedResponse<UserPreferenceAttributes>> {
        try {
            this.logger.info('Searching user preferences', { searchCriteria, pagination });

            const whereClause: any = {};

            if (searchCriteria.userId !== undefined) {
                whereClause.userId = searchCriteria.userId;
            }
            if (searchCriteria.theme) {
                whereClause.theme_preference = searchCriteria.theme;
            }
            if (searchCriteria.language) {
                whereClause.language_preference = searchCriteria.language;
            }
            if (searchCriteria.timezone) {
                whereClause.timezone_preference = searchCriteria.timezone;
            }
            if (searchCriteria.autoSave !== undefined) {
                whereClause.auto_save_enabled = searchCriteria.autoSave;
            }
            if (searchCriteria.notifications !== undefined) {
                whereClause.notifications_enabled = searchCriteria.notifications;
            }

            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await UserPreferenceModel.findAndCountAll({
                where: whereClause,
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const result: PaginatedResponse<UserPreferenceAttributes> = {
                data: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                pagination: {
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages
                }
            };

            this.logger.info(`Successfully searched ${rows.length} user preferences`, { total: count });
            return result;
        } catch (error) {
            this.logger.error('Error searching user preferences', { searchCriteria, pagination, error });
            throw error;
        }
    }
}
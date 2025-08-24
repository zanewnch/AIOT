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
import type { PaginationParams, PaginatedData } from '../../types/ApiResponseType.js';
import { Logger, LogRepository } from '../../decorators/LoggerDecorator.js';
import { Op } from 'sequelize';

/**
 * 用戶偏好設定查詢 Repository 實現類別 - CQRS 查詢端
 *
 * 專門處理用戶偏好設定資料的查詢操作，遵循 CQRS 模式
 *
 * @class UserPreferenceQueriesRepo
 */
@injectable()
export class UserPreferenceQueriesRepo {

    /**
     * 取得所有用戶偏好設定資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<UserPreferenceAttributes[]>} 用戶偏好設定資料陣列
     */
    selectAll = async (limit: number = 100): Promise<UserPreferenceAttributes[]> => {
        try {
            const userPreferences = await UserPreferenceModel.findAll({
                order: [['updatedAt', 'DESC']],
                limit
            });

            return userPreferences.map(item => item.toJSON() as UserPreferenceAttributes);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據 ID 查詢用戶偏好設定資料
     *
     * @param {number} id - 用戶偏好設定 ID
     * @returns {Promise<UserPreferenceAttributes | null>} 用戶偏好設定資料或 null
     */
    selectById = async (id: number): Promise<UserPreferenceAttributes | null> => {
        try {
            const userPreference = await UserPreferenceModel.findByPk(id);

            if (!userPreference) {
                return null;
            }

            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據用戶 ID 查詢用戶偏好設定資料
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<UserPreferenceAttributes | null>} 用戶偏好設定資料或 null
     */
    selectByUserId = async (userId: number): Promise<UserPreferenceAttributes | null> => {
        try {
            const userPreference = await UserPreferenceModel.findOne({
                where: { userId: userId }
            });

            if (!userPreference) {
                return null;
            }

            return userPreference.toJSON() as UserPreferenceAttributes;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據主題偏好查詢用戶偏好設定資料
     *
     * @param {string} theme - 主題偏好 ('light', 'dark', 'auto')
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    selectByTheme = async (
        theme: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> => {
        try {

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
            const result: PaginatedData<UserPreferenceAttributes> = {
                items: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                total: count,
                page: page,
                limit: limit,
                totalPages
            };

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據語言偏好查詢用戶偏好設定資料
     *
     * @param {string} language - 語言偏好 ('zh-TW', 'zh-CN', 'en-US', 等)
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    selectByLanguage = async (
        language: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> => {
        try {

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
            const result: PaginatedData<UserPreferenceAttributes> = {
                items: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                total: count,
                page: page,
                limit: limit,
                totalPages
            };

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根據時區偏好查詢用戶偏好設定資料
     *
     * @param {string} timezone - 時區偏好
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    selectByTimezone = async (
        timezone: string, 
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> => {
        try {

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
            const result: PaginatedData<UserPreferenceAttributes> = {
                items: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                total: count,
                page: page,
                limit: limit,
                totalPages
            };

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 分頁查詢用戶偏好設定資料
     *
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    selectWithPagination = async (
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> => {
        try {

            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await UserPreferenceModel.findAndCountAll({
                order: [['updatedAt', 'DESC']],
                limit: limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const result: PaginatedData<UserPreferenceAttributes> = {
                items: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                total: count,
                page: page,
                limit: limit,
                totalPages
            };

            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 計算用戶偏好設定資料總數
     *
     * @returns {Promise<number>} 用戶偏好設定資料總數
     */
    count = async (): Promise<number> => {
        try {
            const count = await UserPreferenceModel.count();

            return count;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 檢查用戶是否存在偏好設定
     *
     * @param {number} userId - 用戶 ID
     * @returns {Promise<boolean>} 是否存在用戶偏好設定
     */
    existsByUserId = async (userId: number): Promise<boolean> => {
        try {
            const count = await UserPreferenceModel.count({
                where: { userId: userId }
            });

            const exists = count > 0;
            return exists;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 搜尋用戶偏好設定資料（支援多條件搜尋）
     *
     * @param {object} searchCriteria - 搜尋條件
     * @param {PaginationParams} pagination - 分頁參數
     * @returns {Promise<PaginatedData<UserPreferenceAttributes>>} 分頁的用戶偏好設定資料
     */
    search = async (
        searchCriteria: {
            userId?: number;
            theme?: string;
            language?: string;
            timezone?: string;
            autoSave?: boolean;
            notifications?: boolean;
        },
        pagination: PaginationParams = { page: 1, limit: 10 }
    ): Promise<PaginatedData<UserPreferenceAttributes>> => {
        try {

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
            const result: PaginatedData<UserPreferenceAttributes> = {
                items: rows.map(item => item.toJSON() as UserPreferenceAttributes),
                total: count,
                page: page,
                limit: limit,
                totalPages
            };

            return result;
        } catch (error) {
            throw error;
        }
    }
}
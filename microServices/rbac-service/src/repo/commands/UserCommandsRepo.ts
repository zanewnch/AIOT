/**
 * @fileoverview 使用者命令 Repository - CQRS 命令端
 * 
 * 專門處理使用者資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserModel } from '../../../models/rbac/UserModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';

const logger = createLogger('UserCommandsRepository');

/**
 * 使用者命令 Repository 實現類別 - CQRS 命令端
 * 
 * 專門處理使用者資料的寫入操作，遵循 CQRS 模式
 * 
 * @class UserCommandsRepository
 */
@injectable()
export class UserCommandsRepository {
    /**
     * 建立新的使用者記錄
     * 
     * @param {Object} userData 使用者資料物件
     * @param {string} userData.username 使用者名稱（必須唯一）
     * @param {string} userData.passwordHash 已雜湊的密碼（請勿傳入明文密碼）
     * @param {string} [userData.email] 電子郵件地址（可選）
     * @returns {Promise<UserModel>} 成功建立的使用者模型
     * @throws {Error} 當使用者名稱重複、資料格式錯誤或資料庫操作失敗時拋出異常
     */
    create = async (userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel> => {
        try {
            logger.info('Creating new user', { username: userData.username, hasEmail: !!userData.email });
            const user = await UserModel.create({
                ...userData,
                isActive: true  // 預設新用戶為活躍狀態
            });
            
            logger.info('User created successfully', { id: user.id, username: user.username });
            return user;
        } catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * 批量建立使用者記錄
     * 
     * @param {Array<Object>} usersData 使用者資料陣列
     * @returns {Promise<UserModel[]>} 建立的使用者模型陣列
     * @throws {Error} 當資料格式錯誤或資料庫操作失敗時拋出異常
     */
    bulkCreate = async (usersData: { username: string; passwordHash: string; email?: string }[]): Promise<UserModel[]> => {
        try {
            logger.info('Bulk creating users', { count: usersData.length });
            const usersWithDefaults = usersData.map(userData => ({
                ...userData,
                isActive: true  // 預設新用戶為活躍狀態
            }));
            const users = await UserModel.bulkCreate(usersWithDefaults, {
                ignoreDuplicates: true,
                returning: true
            });
            
            logger.info('Users bulk created successfully', { count: users.length });
            return users;
        } catch (error) {
            logger.error('Error bulk creating users:', error);
            throw error;
        }
    }

    /**
     * 查詢或建立使用者
     * 
     * @param {Object} whereCondition 查詢條件
     * @param {Object} defaults 預設值（當記錄不存在時建立）
     * @returns {Promise<[UserModel, boolean]>} [使用者模型, 是否為新建立的記錄]
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    findOrCreate = async (
        whereCondition: { username: string },
        defaults: { username: string; passwordHash: string; email?: string }
    ): Promise<[UserModel, boolean]> => {
        try {
            logger.info('Finding or creating user', { username: whereCondition.username });
            const result = await UserModel.findOrCreate({
                where: whereCondition,
                defaults: {
                    ...defaults,
                    isActive: true  // 預設新用戶為活躍狀態
                }
            });
            
            const [user, created] = result;
            if (created) {
                logger.info('New user created', { id: user.id, username: user.username });
            } else {
                logger.info('Existing user found', { id: user.id, username: user.username });
            }
            
            return result;
        } catch (error) {
            logger.error('Error finding or creating user:', error);
            throw error;
        }
    }

    /**
     * 更新使用者資料
     * 
     * @param {number} id 使用者 ID
     * @param {Partial<{username: string; email: string; passwordHash: string}>} updateData 更新資料
     * @returns {Promise<UserModel | null>} 更新後的使用者模型或 null（若找不到）
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    update = async (id: number, updateData: Partial<{username: string; email: string; passwordHash: string}>): Promise<UserModel | null> => {
        try {
            logger.info('Updating user', { id, updateFields: Object.keys(updateData) });
            const [affectedCount] = await UserModel.update(updateData, {
                where: { id },
                returning: false
            });
            
            if (affectedCount === 0) {
                logger.warn('User not found for update', { id });
                return null;
            }
            
            // 回傳更新後的使用者資料
            const updatedUser = await UserModel.findByPk(id);
            if (updatedUser) {
                logger.info('User updated successfully', { id });
            }
            
            return updatedUser;
        } catch (error) {
            logger.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * 刪除使用者
     * 
     * @param {number} id 使用者 ID
     * @returns {Promise<boolean>} 是否成功刪除
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    delete = async (id: number): Promise<boolean> => {
        try {
            logger.info('Deleting user', { id });
            const affectedCount = await UserModel.destroy({
                where: { id }
            });
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('User deleted successfully', { id });
            } else {
                logger.warn('User not found for deletion', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * 批量刪除使用者
     * 
     * @param {number[]} ids 使用者 ID 陣列
     * @returns {Promise<number>} 刪除的記錄數
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    bulkDelete = async (ids: number[]): Promise<number> => {
        try {
            logger.info('Bulk deleting users', { ids, count: ids.length });
            const affectedCount = await UserModel.destroy({
                where: {
                    id: ids
                }
            });
            
            logger.info('Users bulk deleted', { deletedCount: affectedCount, requestedCount: ids.length });
            return affectedCount;
        } catch (error) {
            logger.error('Error bulk deleting users:', error);
            throw error;
        }
    }

    /**
     * 更新使用者密碼
     * 
     * @param {number} id 使用者 ID
     * @param {string} newPasswordHash 新的密碼雜湊值
     * @returns {Promise<boolean>} 是否成功更新
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    updatePassword = async (id: number, newPasswordHash: string): Promise<boolean> => {
        try {
            logger.info('Updating user password', { id });
            const [affectedCount] = await UserModel.update(
                { passwordHash: newPasswordHash },
                {
                    where: { id },
                    returning: false
                }
            );
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('User password updated successfully', { id });
            } else {
                logger.warn('User not found for password update', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error updating user password:', error);
            throw error;
        }
    }

    /**
     * 更新使用者電子郵件
     * 
     * @param {number} id 使用者 ID
     * @param {string} newEmail 新的電子郵件地址
     * @returns {Promise<boolean>} 是否成功更新
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    updateEmail = async (id: number, newEmail: string): Promise<boolean> => {
        try {
            logger.info('Updating user email', { id, newEmail });
            const [affectedCount] = await UserModel.update(
                { email: newEmail },
                {
                    where: { id },
                    returning: false
                }
            );
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('User email updated successfully', { id });
            } else {
                logger.warn('User not found for email update', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error updating user email:', error);
            throw error;
        }
    }

    /**
     * 停用使用者帳戶
     * 
     * @param {number} id 使用者 ID
     * @returns {Promise<boolean>} 是否成功停用
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    deactivate = async (id: number): Promise<boolean> => {
        try {
            logger.info('Deactivating user account', { id });
            const [affectedCount] = await UserModel.update(
                { isActive: false },
                {
                    where: { id },
                    returning: false
                }
            );
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('User account deactivated successfully', { id });
            } else {
                logger.warn('User not found for deactivation', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error deactivating user account:', error);
            throw error;
        }
    }

    /**
     * 啟用使用者帳戶
     * 
     * @param {number} id 使用者 ID
     * @returns {Promise<boolean>} 是否成功啟用
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    activate = async (id: number): Promise<boolean> => {
        try {
            logger.info('Activating user account', { id });
            const [affectedCount] = await UserModel.update(
                { isActive: true },
                {
                    where: { id },
                    returning: false
                }
            );
            
            const success = affectedCount > 0;
            if (success) {
                logger.info('User account activated successfully', { id });
            } else {
                logger.warn('User not found for activation', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error activating user account:', error);
            throw error;
        }
    }

    /**
     * 更新使用者最後登入時間
     * 
     * @param {number} id 使用者 ID
     * @returns {Promise<boolean>} 是否成功更新
     * @throws {Error} 當資料庫操作失敗時拋出異常
     */
    updateLastLogin = async (id: number): Promise<boolean> => {
        try {
            logger.debug('Updating user last login time', { id });
            const [affectedCount] = await UserModel.update(
                { lastLoginAt: new Date() },
                {
                    where: { id },
                    returning: false
                }
            );
            
            const success = affectedCount > 0;
            if (success) {
                logger.debug('User last login time updated successfully', { id });
            } else {
                logger.warn('User not found for last login update', { id });
            }
            
            return success;
        } catch (error) {
            logger.error('Error updating user last login time:', error);
            throw error;
        }
    }
}
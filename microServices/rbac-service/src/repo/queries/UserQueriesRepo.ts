/**
 * @fileoverview 使用者查詢 Repo - CQRS 查詢端
 * 
 * 專門處理使用者資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserModel } from '../../models/UserModel.js';
import { RoleModel } from '../../models/RoleModel.js';
import { PermissionModel } from '../../models/PermissionModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('UserQueriesRepo');

/**
 * 使用者查詢 Repo 實現類別 - CQRS 查詢端
 * 
 * 專門處理使用者資料的查詢操作，遵循 CQRS 模式
 * 
 * @class UserQueriesRepo
 */
@injectable()
export class UserQueriesRepo {
    /**
     * 根據使用者名稱查詢使用者
     * 
     * @param {string} username 要查詢的使用者名稱
     * @returns {Promise<UserModel | null>} 找到的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findByUsername = async (username: string): Promise<UserModel | null> => {
        try {
            logger.info('Finding user by username', { username });
            const user = await UserModel.findOne({ where: { username } });
            
            if (user) {
                logger.info('User found by username', { username, id: user.id });
            } else {
                logger.warn('User not found by username', { username });
            }
            
            return user;
        } catch (error) {
            logger.error('Error finding user by username:', error);
            throw error;
        }
    }

    /**
     * 根據使用者 ID 查詢使用者
     * 
     * @param {number} id 使用者的主鍵 ID
     * @returns {Promise<UserModel | null>} 找到的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findById = async (id: number): Promise<UserModel | null> => {
        try {
            logger.info('Finding user by id', { id });
            const user = await UserModel.findByPk(id);
            
            if (user) {
                logger.info('User found by id', { id });
            } else {
                logger.warn('User not found by id', { id });
            }
            
            return user;
        } catch (error) {
            logger.error('Error finding user by id:', error);
            throw error;
        }
    }

    /**
     * 根據使用者 ID 查詢使用者（包含角色和權限）
     * 
     * @param {number} id 使用者的主鍵 ID
     * @returns {Promise<UserModel | null>} 包含角色和權限的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findByIdWithRolesAndPermissions = async (id: number): Promise<UserModel | null> => {
        try {
            logger.info('Finding user with roles and permissions', { id });
            const user = await UserModel.findByPk(id, {
                include: [
                    {
                        model: RoleModel,
                        as: 'roles',
                        include: [
                            {
                                model: PermissionModel,
                                as: 'permissions',
                                through: { attributes: [] }
                            }
                        ],
                        through: { attributes: [] }
                    }
                ]
            });
            
            if (user) {
                logger.info('User found with roles and permissions', { 
                    id, 
                    roleCount: user.roles?.length || 0 
                });
            } else {
                logger.warn('User not found for roles and permissions query', { id });
            }
            
            return user;
        } catch (error) {
            logger.error('Error finding user by id with roles and permissions:', error);
            throw error;
        }
    }

    /**
     * 查詢所有使用者（使用分頁方法以統一介面）
     * 
     * **設計意圖說明：**
     * 此方法原採用直接的 Sequelize findAll 查詢，現已重構為使用 findPaginated 統一介面。
     * 重構動機與效益：
     * 1. **架構一致性**：與 Permission 和 Role Repository 保持統一的查詢模式
     * 2. **代碼重複消除**：避免在多個方法中重複資料庫查詢邏輯
     * 3. **查詢優化集中化**：所有效能調優和索引優化都在 findPaginated 中統一處理
     * 4. **日誌記錄統一**：查詢日誌、錯誤處理都使用相同的格式和邏輯
     * 5. **未來擴展性**：輕鬆支援排序欄位變更、條件篩選等需求
     * 
     * 實現細節：使用 Number.MAX_SAFE_INTEGER 作為 limit 以確保取得全部使用者記錄
     * 
     * @returns {Promise<UserModel[]>} 所有使用者模型的陣列
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findAll = async (): Promise<UserModel[]> => {
        // 統一使用 findPaginated 方法，設定極大值來模擬查詢全部
        return this.findPaginated(
            Number.MAX_SAFE_INTEGER, // 使用極大值作為 limit
            0, // offset 為 0
            'id', // 按 ID 排序
            'DESC' // 降序排列
        );
    }

    /**
     * 根據電子郵件查詢使用者
     * 
     * @param {string} email 要查詢的電子郵件地址
     * @returns {Promise<UserModel | null>} 找到的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findByEmail = async (email: string): Promise<UserModel | null> => {
        try {
            logger.info('Finding user by email', { email });
            const user = await UserModel.findOne({ where: { email } });
            
            if (user) {
                logger.info('User found by email', { email, id: user.id });
            } else {
                logger.warn('User not found by email', { email });
            }
            
            return user;
        } catch (error) {
            logger.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * 統計使用者總數
     * 
     * @returns {Promise<number>} 使用者總數
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    count = async (): Promise<number> => {
        try {
            logger.info('Counting total users');
            const count = await UserModel.count();
            
            logger.info(`Total users count: ${count}`);
            return count;
        } catch (error) {
            logger.error('Error counting users:', error);
            throw error;
        }
    }

    /**
     * 分頁查詢使用者
     * 
     * @param {number} limit 每頁數量
     * @param {number} offset 偏移量
     * @param {string} sortBy 排序欄位
     * @param {'ASC'|'DESC'} sortOrder 排序方向
     * @returns {Promise<UserModel[]>} 使用者列表
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findPaginated = async (
        limit: number, 
        offset: number, 
        sortBy: string = 'id', 
        sortOrder: 'ASC' | 'DESC' = 'DESC'
    ): Promise<UserModel[]> => {
        try {
            logger.info('Fetching paginated users', { limit, offset, sortBy, sortOrder });
            
            const users = await UserModel.findAll({
                limit,
                offset,
                order: [[sortBy, sortOrder]]
            });
            
            logger.info(`Retrieved ${users.length} users with pagination`);
            return users;
        } catch (error) {
            logger.error('Error fetching paginated users:', error);
            throw error;
        }
    }

    /**
     * 檢查使用者名稱是否存在
     * 
     * @param {string} username 要檢查的使用者名稱
     * @returns {Promise<boolean>} 是否存在
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    existsByUsername = async (username: string): Promise<boolean> => {
        try {
            logger.info('Checking if username exists', { username });
            const count = await UserModel.count({ where: { username } });
            const exists = count > 0;
            
            logger.info('Username existence check result', { username, exists });
            return exists;
        } catch (error) {
            logger.error('Error checking username existence:', error);
            throw error;
        }
    }

    /**
     * 檢查電子郵件是否存在
     * 
     * @param {string} email 要檢查的電子郵件地址
     * @returns {Promise<boolean>} 是否存在
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    existsByEmail = async (email: string): Promise<boolean> => {
        try {
            logger.info('Checking if email exists', { email });
            const count = await UserModel.count({ where: { email } });
            const exists = count > 0;
            
            logger.info('Email existence check result', { email, exists });
            return exists;
        } catch (error) {
            logger.error('Error checking email existence:', error);
            throw error;
        }
    }

    /**
     * 根據角色查詢使用者
     * 
     * @param {string} roleName 角色名稱
     * @returns {Promise<UserModel[]>} 具有指定角色的使用者陣列
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findByRole = async (roleName: string): Promise<UserModel[]> => {
        try {
            logger.info('Finding users by role', { roleName });
            const users = await UserModel.findAll({
                include: [
                    {
                        model: RoleModel,
                        as: 'roles',
                        where: { name: roleName },
                        through: { attributes: [] }
                    }
                ]
            });
            
            logger.info(`Found ${users.length} users with role ${roleName}`);
            return users;
        } catch (error) {
            logger.error('Error finding users by role:', error);
            throw error;
        }
    }

    /**
     * 根據權限查詢使用者
     * 
     * @param {string} permissionName 權限名稱
     * @returns {Promise<UserModel[]>} 具有指定權限的使用者陣列
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     */
    findByPermission = async (permissionName: string): Promise<UserModel[]> => {
        try {
            logger.info('Finding users by permission', { permissionName });
            const users = await UserModel.findAll({
                include: [
                    {
                        model: RoleModel,
                        as: 'roles',
                        include: [
                            {
                                model: PermissionModel,
                                as: 'permissions',
                                where: { name: permissionName },
                                through: { attributes: [] }
                            }
                        ],
                        through: { attributes: [] }
                    }
                ]
            });
            
            logger.info(`Found ${users.length} users with permission ${permissionName}`);
            return users;
        } catch (error) {
            logger.error('Error finding users by permission:', error);
            throw error;
        }
    }
}
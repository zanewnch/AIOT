/**
 * @fileoverview 身份驗證查詢服務實現
 *
 * 此文件實作了身份驗證查詢業務邏輯層，
 * 專注於處理所有讀取相關的認證業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module AuthQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserModel } from '../../models/UserModel.js';
import { SessionQueriesSvc } from './SessionQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('AuthQueriesSvc');

/**
 * UserSessionDTO - 代表會話中的使用者摘要資料，供查詢回傳使用
 */
export interface UserSessionDTO {
    id: number; // 使用者 ID
    username: string; // 使用者名稱
    email: string; // 電子郵件
    isActive: boolean; // 帳號是否啟用
    lastLoginAt: Date | null; // 最後登入時間
    createdAt: Date; // 建立時間
    updatedAt: Date; // 更新時間
}

/**
 * SessionValidationResult - 驗證會話的結果型別
 */
export interface SessionValidationResult {
    isValid: boolean; // 會話是否有效
    user?: UserSessionDTO; // 若有效，回傳使用者摘要資料
    message?: string; // 遇到錯誤或無效時的訊息
}

/**
 * 認證查詢服務類別
 *
 * @remarks
 * 提供會話驗證、使用者查詢與會話狀態檢查等查詢相關功能，適合由控制器注入使用。
 */
@injectable()
export class AuthQueriesSvc {
    private sessionQueriesSvc: SessionQueriesSvc; // 注入的 session 查詢服務

    constructor(
        @inject(TYPES.SessionQueriesSvc) sessionQueriesSvc: SessionQueriesSvc
    ) {
        this.sessionQueriesSvc = sessionQueriesSvc; // 建構子注入
    }

    /**
     * 將 UserModel 轉換成會話 DTO，避免將完整模型暴露給外層
     *
     * @param model - UserModel 實例
     * @returns UserSessionDTO
     * @private
     */
    private userModelToSessionDTO = (model: UserModel): UserSessionDTO => {
        return {
            id: model.id,
            username: model.username,
            email: typeof model.email === 'string' ? model.email : '',
            isActive: model.isActive,
            lastLoginAt: model.lastLoginAt,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 驗證會話並取得使用者資料
     *
     * @param token - JWT Token
     * @returns Promise<SessionValidationResult> - 會話驗證結果
     */
    public validateSession = async (token: string): Promise<SessionValidationResult> => {
        try {
            logger.debug('Session validation started');

            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Session validation failed: Invalid token format');
                return { isValid: false, message: 'Invalid token format' };
            }

            const sessionData = await this.sessionQueriesSvc.getUserSession(token); // 從 Redis 查詢會話
            if (!sessionData) {
                logger.warn('Session validation failed: Session not found in Redis');
                return { isValid: false, message: 'Session not found or expired' };
            }

            logger.debug(`Session found for user ID: ${sessionData.userId}`);

            const user = await UserModel.findByPk(sessionData.userId); // 從資料庫取出使用者
            if (!user) {
                logger.warn(`Session validation failed: User not found in database for ID: ${sessionData.userId}`);
                return { isValid: false, message: 'User not found' };
            }

            if (!user.isActive) { // 檢查帳號是否啟用
                logger.warn(`Session validation failed: User account is inactive for ID: ${sessionData.userId}`);
                return { isValid: false, message: 'User account is inactive' };
            }

            logger.debug(`Session validation successful for user: ${user.username}`);
            return { isValid: true, user: this.userModelToSessionDTO(user) };
        } catch (error) {
            logger.error('Session validation error occurred:', error);
            return { isValid: false, message: 'Session validation failed due to system error' };
        }
    }

    /**
     * 檢查使用者是否存在（以 username）
     *
     * @param username - 要檢查的使用者名稱
     * @returns Promise<boolean>
     */
    public userExistsByUsername = async (username: string): Promise<boolean> => {
        try {
            if (!username || typeof username !== 'string' || username.trim().length === 0) { return false; }
            const user = await UserModel.findOne({ where: { username: username.trim() } });
            return !!user;
        } catch (error) {
            logger.error(`Error checking user existence by username ${username}:`, error);
            return false;
        }
    }

    /**
     * 檢查使用者是否存在（以 userId）
     *
     * @param userId - 使用者 ID
     * @returns Promise<boolean>
     */
    public userExistsById = async (userId: number): Promise<boolean> => {
        try {
            if (!userId || userId <= 0) { return false; }
            const user = await UserModel.findByPk(userId);
            return !!user;
        } catch (error) {
            logger.error(`Error checking user existence by ID ${userId}:`, error);
            return false;
        }
    }

    /**
     * 根據使用者名稱取得使用者資料
     *
     * @param username - 使用者名稱
     * @returns Promise<UserModel | null>
     */
    public getUserByUsername = async (username: string): Promise<UserModel | null> => {
        try {
            if (!username || typeof username !== 'string' || username.trim().length === 0) { logger.warn('Invalid username provided'); return null; }
            logger.debug(`Getting user by username: ${username}`);
            const user = await UserModel.findOne({ where: { username: username.trim() } });
            if (!user) { logger.debug(`User not found for username: ${username}`); return null; }
            logger.debug(`User found: ${user.username} (ID: ${user.id})`);
            return user;
        } catch (error) {
            logger.error(`Error getting user by username ${username}:`, error);
            return null;
        }
    }

    /**
     * 根據使用者 ID 取得使用者資料
     *
     * @param userId - 使用者 ID
     * @returns Promise<UserModel | null>
     */
    public getUserById = async (userId: number): Promise<UserModel | null> => {
        try {
            if (!userId || userId <= 0) { logger.warn(`Invalid user ID: ${userId}`); return null; }
            logger.debug(`Getting user by ID: ${userId}`);
            const user = await UserModel.findByPk(userId);
            if (!user) { logger.debug(`User not found for ID: ${userId}`); return null; }
            logger.debug(`User found: ${user.username} (ID: ${user.id})`);
            return user;
        } catch (error) {
            logger.error(`Error getting user by ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * 檢查會話是否存在於 Redis 中
     *
     * @param token - JWT Token
     * @returns Promise<boolean>
     */
    public sessionExists = async (token: string): Promise<boolean> => {
        try {
            if (!token || typeof token !== 'string' || token.trim().length === 0) { return false; }
            const sessionData = await this.sessionQueriesSvc.getUserSession(token);
            return !!sessionData;
        } catch (error) {
            logger.error(`Error checking session existence for token:`, error);
            return false;
        }
    }

    /**
     * 取得使用者會話資料
     *
     * @param token - JWT Token
     * @returns Promise<any> - 會話資料或 null
     */
    public getSessionData = async (token: string): Promise<any> => {
        try {
            if (!token || typeof token !== 'string' || token.trim().length === 0) { return null; }
            logger.debug('Getting session data from Redis');
            const sessionData = await this.sessionQueriesSvc.getUserSession(token);
            if (!sessionData) { logger.debug('Session data not found in Redis'); return null; }
            logger.debug(`Session data found for user ID: ${sessionData.userId}`);
            return sessionData;
        } catch (error) {
            logger.error('Error getting session data:', error);
            return null;
        }
    }
}
/**
 * @fileoverview 身份驗證查詢服務實現
 *
 * 此文件實作了身份驗證查詢業務邏輯層，
 * 專注於處理所有讀取相關的認證業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 會話驗證和使用者資料擷取
 * - 使用者存在性檢查
 * - JWT Token 驗證
 * - 會話狀態查詢
 *
 * 安全特性：
 * - 驗證會話有效性
 * - 檢查 Redis 中的會話狀態
 * - 從資料庫獲取最新使用者資料
 * - 錯誤處理和日誌記錄
 *
 * @module AuthQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserQueriesRepository } from '../../repo/queries/UserQueriesRepo.js';
import { UserModel } from '../../models/UserModel.js';
import { SessionQueriesSvc } from './SessionQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('AuthQueriesSvc');

/**
 * 使用者會話資料傳輸物件
 */
export interface UserSessionDTO {
    id: number;
    username: string;
    email: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 會話驗證結果物件
 */
export interface SessionValidationResult {
    isValid: boolean;
    user?: UserSessionDTO;
    message?: string;
}

/**
 * 身份驗證查詢服務類別
 * 
 * 提供身份驗證的所有查詢功能，
 * 包含會話驗證、使用者資料查詢和狀態檢查。
 */
@injectable()
export class AuthQueriesSvc {
    private userQueriesRepository: UserQueriesRepository;
    private sessionQueriesSvc: SessionQueriesSvc;

    constructor(
        @inject(TYPES.SessionQueriesSvc) sessionQueriesSvc: SessionQueriesSvc
    ) {
        this.userQueriesRepository = new UserQueriesRepository();
        this.sessionQueriesSvc = sessionQueriesSvc;
    }

    /**
     * 將使用者模型轉換為會話 DTO
     * @param model 使用者模型
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
     * 檢查 Redis 中的會話狀態並從資料庫取得最新的使用者資料
     *
     * @param token JWT Token
     * @returns Promise<SessionValidationResult> 會話驗證結果
     *
     * @example
     * ```typescript
     * const authQueriesSvc = new AuthQueriesSvc();
     * const result = await authQueriesSvc.validateSession(token);
     * 
     * if (result.isValid && result.user) {
     *   console.log(`會話有效，使用者：${result.user.username}`);
     * } else {
     *   console.log(`會話無效：${result.message}`);
     * }
     * ```
     */
    public validateSession = async (token: string): Promise<SessionValidationResult> => {
        try {
            logger.debug('Session validation started');

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Session validation failed: Invalid token format');
                return {
                    isValid: false,
                    message: 'Invalid token format'
                };
            }

            // 首先檢查 Redis 會話
            const sessionData = await this.sessionQueriesSvc.getUserSession(token);
            if (!sessionData) {
                logger.warn('Session validation failed: Session not found in Redis');
                return {
                    isValid: false,
                    message: 'Session not found or expired'
                };
            }

            logger.debug(`Session found for user ID: ${sessionData.userId}`);

            // 從資料庫取得最新的使用者資料
            const user = await this.userQueriesRepository.findById(sessionData.userId);
            if (!user) {
                logger.warn(`Session validation failed: User not found in database for ID: ${sessionData.userId}`);
                return {
                    isValid: false,
                    message: 'User not found'
                };
            }

            // 檢查使用者是否仍然處於活躍狀態
            if (!user.isActive) {
                logger.warn(`Session validation failed: User account is inactive for ID: ${sessionData.userId}`);
                return {
                    isValid: false,
                    message: 'User account is inactive'
                };
            }

            logger.debug(`Session validation successful for user: ${user.username}`);
            return {
                isValid: true,
                user: this.userModelToSessionDTO(user)
            };
        } catch (error) {
            logger.error('Session validation error occurred:', error);
            return {
                isValid: false,
                message: 'Session validation failed due to system error'
            };
        }
    }

    /**
     * 檢查使用者是否存在
     * @param username 使用者名稱
     * @returns 使用者是否存在
     */
    public userExistsByUsername = async (username: string): Promise<boolean> => {
        try {
            if (!username || typeof username !== 'string' || username.trim().length === 0) {
                return false;
            }

            const user = await this.userQueriesRepository.findByUsername(username.trim());
            return !!user;
        } catch (error) {
            logger.error(`Error checking user existence by username ${username}:`, error);
            return false;
        }
    }

    /**
     * 檢查使用者是否存在
     * @param userId 使用者 ID
     * @returns 使用者是否存在
     */
    public userExistsById = async (userId: number): Promise<boolean> => {
        try {
            if (!userId || userId <= 0) {
                return false;
            }

            const user = await this.userQueriesRepository.findById(userId);
            return !!user;
        } catch (error) {
            logger.error(`Error checking user existence by ID ${userId}:`, error);
            return false;
        }
    }

    /**
     * 根據使用者名稱取得使用者資料
     * @param username 使用者名稱
     * @returns 使用者資料或 null
     */
    public getUserByUsername = async (username: string): Promise<UserModel | null> => {
        try {
            if (!username || typeof username !== 'string' || username.trim().length === 0) {
                logger.warn('Invalid username provided');
                return null;
            }

            logger.debug(`Getting user by username: ${username}`);
            const user = await this.userQueriesRepository.findByUsername(username.trim());

            if (!user) {
                logger.debug(`User not found for username: ${username}`);
                return null;
            }

            logger.debug(`User found: ${user.username} (ID: ${user.id})`);
            return user;
        } catch (error) {
            logger.error(`Error getting user by username ${username}:`, error);
            return null;
        }
    }

    /**
     * 根據使用者 ID 取得使用者資料
     * @param userId 使用者 ID
     * @returns 使用者資料或 null
     */
    public getUserById = async (userId: number): Promise<UserModel | null> => {
        try {
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                return null;
            }

            logger.debug(`Getting user by ID: ${userId}`);
            const user = await this.userQueriesRepository.findById(userId);

            if (!user) {
                logger.debug(`User not found for ID: ${userId}`);
                return null;
            }

            logger.debug(`User found: ${user.username} (ID: ${user.id})`);
            return user;
        } catch (error) {
            logger.error(`Error getting user by ID ${userId}:`, error);
            return null;
        }
    }

    /**
     * 檢查會話是否存在於 Redis 中
     * @param token JWT Token
     * @returns 會話是否存在
     */
    public sessionExists = async (token: string): Promise<boolean> => {
        try {
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                return false;
            }

            const sessionData = await this.sessionQueriesSvc.getUserSession(token);
            return !!sessionData;
        } catch (error) {
            logger.error(`Error checking session existence for token:`, error);
            return false;
        }
    }

    /**
     * 取得使用者會話資料
     * @param token JWT Token
     * @returns 會話資料或 null
     */
    public getSessionData = async (token: string): Promise<any> => {
        try {
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                return null;
            }

            logger.debug('Getting session data from Redis');
            const sessionData = await this.sessionQueriesSvc.getUserSession(token);

            if (!sessionData) {
                logger.debug('Session data not found in Redis');
                return null;
            }

            logger.debug(`Session data found for user ID: ${sessionData.userId}`);
            return sessionData;
        } catch (error) {
            logger.error('Error getting session data:', error);
            return null;
        }
    }
}
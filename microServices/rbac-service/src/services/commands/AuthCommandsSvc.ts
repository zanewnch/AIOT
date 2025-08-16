/**
 * @fileoverview 認證命令服務實現
 * 
 * 此文件實作了認證命令業務邏輯層，
 * 專注於處理所有寫入相關的認證業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含登入、登出等寫入邏輯。
 * 
 * @module AuthCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('AuthCommandsSvc');

/**
 * 登入請求介面
 */
export interface LoginRequest {
    username: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * 登入回應介面
 */
export interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: number;
        username: string;
    };
}

/**
 * 登出請求介面
 */
export interface LogoutRequest {
    token?: string;
    userId?: number;
}

/**
 * 認證命令服務類別
 * 
 * 提供認證的所有命令功能，
 * 包含登入、登出和會話管理。
 */
@injectable()
export class AuthCommandsSvc {
    
    /**
     * 使用者登入
     */
    public login = async (request: LoginRequest): Promise<LoginResponse> => {
        try {
            logger.info(`Login attempt for user: ${request.username}`);
            
            // 簡化實現：檢查是否為預設管理員帳號
            if (request.username === 'admin' && request.password === 'admin') {
                logger.info('Login successful for admin user');
                
                return {
                    success: true,
                    message: 'Login successful',
                    token: 'mock-jwt-token-' + Date.now(),
                    user: {
                        id: 1,
                        username: 'admin'
                    }
                };
            }
            
            logger.warn(`Login failed for user: ${request.username}`);
            return {
                success: false,
                message: 'Invalid username or password'
            };
        } catch (error) {
            logger.error('Login error:', error);
            return {
                success: false,
                message: 'Login failed due to system error'
            };
        }
    }

    /**
     * 使用者登出
     */
    public logout = async (request: LogoutRequest): Promise<{ success: boolean; message: string }> => {
        try {
            logger.info('Processing logout request');
            
            // 簡化實現：總是返回成功
            return {
                success: true,
                message: 'Logout successful'
            };
        } catch (error) {
            logger.error('Logout error:', error);
            return {
                success: false,
                message: 'Logout failed due to system error'
            };
        }
    }
}
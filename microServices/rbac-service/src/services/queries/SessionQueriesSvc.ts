/**
 * @fileoverview 會話查詢服務實現
 * 
 * 此文件實作了會話查詢業務邏輯層，
 * 專注於處理所有讀取相關的會話業務操作。
 * 遵循 CQRS 模式，只處理查詢操作。
 * 
 * @module SessionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('SessionQueriesSvc');

/**
 * 會話資料介面
 */
export interface SessionData {
    userId: number;
    username: string;
    createdAt: Date;
    lastAccessedAt: Date;
}

/**
 * 會話查詢服務類別
 * 
 * 提供會話的所有查詢功能，
 * 包含會話驗證和會話資料查詢。
 */
@injectable()
export class SessionQueriesSvc {
    
    /**
     * 取得使用者會話
     */
    public getUserSession = async (token: string): Promise<SessionData | null> => {
        try {
            logger.debug('Getting user session for token');
            
            // 簡化實現：如果是 mock token，返回預設管理員會話
            if (token && token.startsWith('mock-jwt-token-')) {
                return {
                    userId: 1,
                    username: 'admin',
                    createdAt: new Date(),
                    lastAccessedAt: new Date()
                };
            }
            
            logger.debug('Session not found');
            return null;
        } catch (error) {
            logger.error('Error getting user session:', error);
            return null;
        }
    }
}
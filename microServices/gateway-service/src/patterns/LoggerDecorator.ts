/**
 * @fileoverview Logger Decorator Pattern - Design Pattern 實現
 * @description 簡單的 Logger Decorator，只有兩個參數：originalFunction 和 methodName
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { loggerConfig } from '../configs/loggerConfig.js';

const logger = loggerConfig;

/**
 * 日誌裝飾器函數 - Design Pattern 實現
 * @param originalFunction - 原始函數
 * @param methodName - 方法名稱
 * @returns 裝飾後的函數
 */
export function loggerDecorator(originalFunction: Function, methodName: string) {
    return async function(...args: any[]) {
        const startTime = Date.now();
        
        try {
            logger.info(`🚀 開始執行 ${methodName}`);
            const result = await originalFunction.apply(this, args);
            const duration = Date.now() - startTime;
            logger.info(`✅ ${methodName} 執行完成 (${duration}ms)`);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`❌ ${methodName} 執行失敗 (${duration}ms):`, error);
            throw error;
        }
    };
}
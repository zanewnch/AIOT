/**
 * 簡單的 Logger Decorator
 * 只有兩個參數：originalFunction 和 methodName
 */

import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('DECORATOR');

export function loggerDecorator(originalFunction: Function, methodName: string) {
  return async (...args: any[]) => {
    const startTime = Date.now();
    
    try {
      logger.info(`開始執行 ${methodName}`);
      const result = await originalFunction(...args);
      logger.info(`${methodName} 執行完成 (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      logger.error(`${methodName} 執行失敗 (${Date.now() - startTime}ms):`, error);
      throw error;
    }
  };
}
/**
 * 簡單的 Logger Decorator
 * 只有兩個參數：originalFunction 和 methodName
 */

import { createLogger } from '../configs/loggerConfig.js';

const decoratorLogger = createLogger('DECORATOR');

export function logger(originalFunction: Function, methodName: string) {
  return async (...args: any[]) => {
    const startTime = Date.now();
    
    try {
      decoratorLogger.info(`開始執行 ${methodName}`);
      const result = await originalFunction(...args);
      decoratorLogger.info(`${methodName} 執行完成 (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      decoratorLogger.error(`${methodName} 執行失敗 (${Date.now() - startTime}ms):`, error);
      throw error;
    }
  };
}
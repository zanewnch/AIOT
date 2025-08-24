/**
 * 簡單的 Logger Decorator
 * 只有兩個參數：originalFunction 和 methodName
 * 
 * @note 這個裝飾器需要從使用的服務中傳入 logger 實例
 * 以避免對特定 loggerConfig 的依賴
 */

export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export function loggerDecorator(originalFunction: Function, methodName: string, logger: Logger) {
  return async function(...args: any[]) {
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
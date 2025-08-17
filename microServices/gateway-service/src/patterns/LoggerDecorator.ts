/**
 * @fileoverview Logger Decorator Pattern
 * @description 統一的日誌裝飾器，提供執行時間測量和錯誤捕獲
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { loggerConfig } from '../configs/loggerConfig.js';

const logger = loggerConfig;

/**
 * 日誌裝飾器函數
 * @param originalFunction - 原始函數
 * @param methodName - 方法名稱
 * @param className - 類別名稱（可選）
 * @returns 裝飾後的函數
 */
export function loggerDecorator(
    originalFunction: Function, 
    methodName: string, 
    className?: string
) {
    return async (...args: any[]) => {
        const startTime = Date.now();
        const fullMethodName = className ? `${className}.${methodName}` : methodName;
        
        try {
            logger.info(`🚀 開始執行 ${fullMethodName}`);
            const result = await originalFunction(...args);
            const duration = Date.now() - startTime;
            logger.info(`✅ ${fullMethodName} 執行完成 (${duration}ms)`);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`❌ ${fullMethodName} 執行失敗 (${duration}ms):`, error);
            throw error;
        }
    };
}

/**
 * 方法裝飾器
 * @param className - 類別名稱
 * @returns 裝飾器函數
 */
export function LogMethod(className?: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = loggerDecorator(originalMethod, propertyName, className);
        
        return descriptor;
    };
}

/**
 * 類別裝飾器 - 為類別中的所有方法添加日誌
 * @param className - 類別名稱
 * @returns 裝飾器函數
 */
export function LogClass(className?: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        const originalClass = constructor;
        
        // 獲取類別名稱
        const finalClassName = className || originalClass.name;
        
        // 裝飾所有方法
        const prototype = originalClass.prototype;
        const methodNames = Object.getOwnPropertyNames(prototype);
        
        methodNames.forEach(methodName => {
            if (methodName !== 'constructor' && typeof prototype[methodName] === 'function') {
                const originalMethod = prototype[methodName];
                prototype[methodName] = loggerDecorator(originalMethod, methodName, finalClassName);
            }
        });
        
        return originalClass;
    };
}

/**
 * 簡化的函數日誌包裝器
 * @param func - 要包裝的函數
 * @param name - 函數名稱
 * @returns 包裝後的函數
 */
export function withLogger<T extends (...args: any[]) => any>(
    func: T, 
    name: string
): T {
    return loggerDecorator(func, name) as T;
}

/**
 * Gateway 服務專用的日誌裝飾器
 * @param serviceName - 服務名稱
 * @returns 裝飾器函數
 */
export function GatewayLog(serviceName: string = 'Gateway') {
    return LogMethod(serviceName);
}
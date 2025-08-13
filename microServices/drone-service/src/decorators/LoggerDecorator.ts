/**
 * @fileoverview Logger 裝飾器實現
 * 
 * 提供自動日誌記錄功能的裝飾器，支援：
 * - 自動創建類別專屬的 logger 實例
 * - 方法執行時間記錄
 * - 錯誤自動記錄
 * - 請求參數和結果記錄
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-13
 */

import 'reflect-metadata';
import { createLogger, logRequest } from '@aiot/shared-packages/loggerConfig.js';
import { Request, Response, NextFunction } from 'express';

/**
 * Logger 元數據鍵
 */
const LOGGER_METADATA_KEY = Symbol.for('logger');

/**
 * 日誌配置選項
 */
interface LoggerOptions {
    /** 是否記錄方法執行時間 */
    logExecutionTime?: boolean;
    /** 是否記錄方法參數 */
    logParameters?: boolean;
    /** 是否記錄方法返回值 */
    logResult?: boolean;
    /** 是否自動記錄錯誤 */
    logErrors?: boolean;
    /** 自定義日誌級別 */
    logLevel?: 'info' | 'debug' | 'warn' | 'error';
    /** 是否記錄 HTTP 請求資訊 */
    logRequest?: boolean;
}

/**
 * 預設日誌配置
 */
const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    logExecutionTime: true,
    logParameters: false,
    logResult: false,
    logErrors: true,
    logLevel: 'info',
    logRequest: true
};

/**
 * 類別裝飾器：為類別自動注入 logger 屬性
 * 
 * @param name 可選的 logger 名稱，預設使用類別名稱
 */
export function Logger(name?: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            protected readonly logger = createLogger(name || constructor.name);
            
            constructor(...args: any[]) {
                super(...args);
                // 將 logger 實例儲存到元數據中
                Reflect.defineMetadata(LOGGER_METADATA_KEY, this.logger, this);
            }
        };
    };
}

/**
 * 方法裝飾器：為方法添加自動日誌記錄
 * 
 * @param options 日誌配置選項
 */
export function LogMethod(options: LoggerOptions = {}) {
    const config = { ...DEFAULT_LOGGER_OPTIONS, ...options };
    
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function (...args: any[]) {
            // 獲取 logger 實例
            const logger = Reflect.getMetadata(LOGGER_METADATA_KEY, this) || 
                          createLogger(target.constructor.name);
            
            const startTime = Date.now();
            const methodName = `${target.constructor.name}.${propertyKey}`;
            
            try {
                // 記錄方法開始執行
                if (config.logLevel === 'debug' || config.logParameters) {
                    logger.debug(`開始執行 ${methodName}`, {
                        parameters: config.logParameters ? args : undefined
                    });
                } else {
                    logger[config.logLevel!](`開始執行 ${methodName}`);
                }
                
                // 如果是 HTTP 請求方法，記錄請求資訊
                if (config.logRequest && args.length >= 2 && args[0]?.method && args[0]?.url) {
                    const req = args[0] as Request;
                    logRequest(req, `${methodName} 請求處理`);
                }
                
                // 執行原始方法
                const result = await originalMethod.apply(this, args);
                
                // 記錄執行完成
                const executionTime = Date.now() - startTime;
                const logData: any = {};
                
                if (config.logExecutionTime) {
                    logData.executionTime = `${executionTime}ms`;
                }
                
                if (config.logResult && result !== undefined) {
                    logData.result = result;
                }
                
                logger.info(`${methodName} 執行完成`, logData);
                
                return result;
                
            } catch (error) {
                const executionTime = Date.now() - startTime;
                
                if (config.logErrors) {
                    logger.error(`${methodName} 執行失敗`, {
                        error: error instanceof Error ? {
                            message: error.message,
                            stack: error.stack,
                            name: error.name
                        } : error,
                        executionTime: config.logExecutionTime ? `${executionTime}ms` : undefined,
                        parameters: config.logParameters ? args : undefined
                    });
                }
                
                throw error;
            }
        };
        
        return descriptor;
    };
}

/**
 * 控制器專用的日誌裝飾器
 * 針對 HTTP 控制器優化，自動記錄請求和回應資訊
 */
export function LogController(options: LoggerOptions = {}) {
    const config = { 
        ...DEFAULT_LOGGER_OPTIONS, 
        logRequest: true,
        logParameters: false,
        ...options 
    };
    
    return LogMethod(config);
}

/**
 * 服務層專用的日誌裝飾器
 * 針對業務邏輯層優化
 */
export function LogService(options: LoggerOptions = {}) {
    const config = { 
        ...DEFAULT_LOGGER_OPTIONS, 
        logRequest: false,
        logExecutionTime: true,
        ...options 
    };
    
    return LogMethod(config);
}

/**
 * Repository 專用的日誌裝飾器
 * 針對資料存取層優化
 */
export function LogRepository(options: LoggerOptions = {}) {
    const config = { 
        ...DEFAULT_LOGGER_OPTIONS, 
        logRequest: false,
        logExecutionTime: true,
        logLevel: 'debug' as const,
        ...options 
    };
    
    return LogMethod(config);
}

/**
 * 路由專用的日誌裝飾器
 * 針對路由層優化
 */
export function LogRoute(options: LoggerOptions = {}) {
    const config = { 
        ...DEFAULT_LOGGER_OPTIONS, 
        logRequest: true,
        logExecutionTime: false,
        ...options 
    };
    
    return LogMethod(config);
}

/**
 * 獲取類別的 logger 實例
 * 
 * @param instance 類別實例
 * @returns logger 實例
 */
export function getLogger(instance: any) {
    return Reflect.getMetadata(LOGGER_METADATA_KEY, instance) || 
           createLogger(instance.constructor.name);
}
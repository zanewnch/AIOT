/**
 * @fileoverview Logger Decorator Pattern 實現 - General Service
 * 
 * 正確實作設計模式中的 Decorator Pattern 來處理日誌記錄。
 * 這不是 TypeScript 的 @decorator 語法糖，而是真正的設計模式實現。
 * 
 * 特點：
 * - 與 arrow function 完全兼容
 * - 提供方法執行前後的日誌記錄
 * - 支援錯誤記錄和執行時間統計
 * - 可組合和可擴展
 * - 適配 General Service 的 logger 系統
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-13
 */

import { Request } from 'express';
import { createLogger, logRequest } from '../configs/loggerConfig.js';

/**
 * 日誌配置選項
 */
export interface LoggerOptions {
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
    /** 方法名稱（用於日誌顯示） */
    methodName?: string;
}

/**
 * 基礎組件介面
 * 所有需要被裝飾的類別都應該實現這個介面的方法
 */
export interface Component {
    [key: string]: any;
}

/**
 * Logger Decorator Pattern 實現
 * 
 * 使用組合而非繼承的方式來包裝原始組件，提供日誌功能
 */
export class LoggerDecorator implements Component {
    private logger: any;

    constructor(
        private component: Component, 
        private className: string,
        private options: LoggerOptions = {}
    ) {
        this.logger = createLogger(className);
        
        // 動態代理所有方法
        return new Proxy(this, {
            get: (target, prop) => {
                // 處理 symbol 屬性
                if (typeof prop === 'symbol') {
                    return Reflect.get(target.component, prop);
                }
                
                const propName = prop.toString();
                const originalMethod = target.component[propName];
                
                // 如果是方法且是 arrow function，則包裝它
                if (typeof originalMethod === 'function' && propName !== 'constructor') {
                    return target.wrapMethod(originalMethod, propName);
                }
                
                // 如果是屬性，直接返回
                return originalMethod;
            }
        });
    }

    /**
     * 包裝方法以提供日誌功能
     */
    private wrapMethod = (originalMethod: Function, methodName: string) => {
        return async (...args: any[]) => {
            const startTime = Date.now();
            const fullMethodName = `${this.className}.${methodName}`;
            
            const config = {
                logExecutionTime: true,
                logParameters: false,
                logResult: false,
                logErrors: true,
                logLevel: 'info' as const,
                logRequest: this.isControllerMethod(methodName),
                ...this.options,
                methodName: fullMethodName
            };

            try {
                // 記錄方法開始執行
                this.logMethodStart(config, args);
                
                // 如果是 HTTP 控制器方法，記錄請求資訊
                if (config.logRequest && this.isHttpMethod(args)) {
                    const req = args[0] as Request;
                    logRequest(req, `${fullMethodName} 請求處理`);
                }
                
                // 執行原始方法（綁定正確的 this 上下文）
                const result = await originalMethod.apply(this.component, args);
                
                // 記錄執行完成
                this.logMethodSuccess(config, result, startTime);
                
                return result;
                
            } catch (error) {
                // 記錄執行錯誤
                this.logMethodError(config, error, args, startTime);
                throw error;
            }
        };
    };

    /**
     * 記錄方法開始執行
     */
    private logMethodStart = (config: LoggerOptions & { methodName: string }, args: any[]) => {
        const logData: any = {};
        
        if (config.logParameters) {
            logData.parameters = args;
        }
        
        if (config.logLevel === 'debug') {
            this.logger.debug(`開始執行 ${config.methodName}`, logData);
        } else {
            this.logger[config.logLevel!](`開始執行 ${config.methodName}`);
        }
    };

    /**
     * 記錄方法成功執行
     */
    private logMethodSuccess = (config: LoggerOptions & { methodName: string }, result: any, startTime: number) => {
        const executionTime = Date.now() - startTime;
        const logData: any = {};
        
        if (config.logExecutionTime) {
            logData.executionTime = `${executionTime}ms`;
        }
        
        if (config.logResult && result !== undefined) {
            logData.result = result;
        }
        
        this.logger.info(`${config.methodName} 執行完成`, logData);
    };

    /**
     * 記錄方法執行錯誤
     */
    private logMethodError = (config: LoggerOptions & { methodName: string }, error: any, args: any[], startTime: number) => {
        if (!config.logErrors) return;
        
        const executionTime = Date.now() - startTime;
        const logData: any = {
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error,
            executionTime: config.logExecutionTime ? `${executionTime}ms` : undefined,
            parameters: config.logParameters ? args : undefined
        };
        
        this.logger.error(`${config.methodName} 執行失敗`, logData);
    };

    /**
     * 判斷是否為控制器方法
     */
    private isControllerMethod = (methodName: string): boolean => {
        const controllerMethods = ['create', 'update', 'delete', 'get', 'list', 'find', 'health', 'getUserPreference', 'setUserPreference', 'getDocs'];
        return controllerMethods.some(method => methodName.toLowerCase().includes(method));
    };

    /**
     * 判斷是否為 HTTP 方法（有 req, res 參數）
     */
    private isHttpMethod = (args: any[]): boolean => {
        return args.length >= 2 && 
               args[0] && typeof args[0] === 'object' && 'method' in args[0] && 'url' in args[0] &&
               args[1] && typeof args[1] === 'object' && 'status' in args[1] && 'json' in args[1];
    };
}

/**
 * 工廠方法：創建帶有日誌功能的控制器
 */
export const createLoggedController = <T extends Component>(
    controller: T, 
    className: string, 
    options?: LoggerOptions
): T => {
    return new LoggerDecorator(controller, className, {
        logRequest: true,
        logExecutionTime: true,
        logErrors: true,
        ...options
    }) as unknown as T;
};

/**
 * 工廠方法：創建帶有日誌功能的服務
 */
export const createLoggedService = <T extends Component>(
    service: T, 
    className: string, 
    options?: LoggerOptions
): T => {
    return new LoggerDecorator(service, className, {
        logRequest: false,
        logExecutionTime: true,
        logErrors: true,
        ...options
    }) as unknown as T;
};

/**
 * 工廠方法：創建帶有日誌功能的倉庫
 */
export const createLoggedRepository = <T extends Component>(
    repository: T, 
    className: string, 
    options?: LoggerOptions
): T => {
    return new LoggerDecorator(repository, className, {
        logRequest: false,
        logExecutionTime: true,
        logErrors: true,
        logLevel: 'debug',
        ...options
    }) as unknown as T;
};

/**
 * 工廠方法：創建帶有日誌功能的路由處理器
 */
export const createLoggedRoutes = <T extends Component>(
    routes: T, 
    className: string, 
    options?: LoggerOptions
): T => {
    return new LoggerDecorator(routes, className, {
        logRequest: true,
        logExecutionTime: true,
        logErrors: true,
        logLevel: 'info',
        ...options
    }) as unknown as T;
};

/**
 * 工廠方法：創建帶有日誌功能的 gRPC 服務
 */
export const createLoggedGrpcService = <T extends Component>(
    service: T, 
    className: string, 
    options?: LoggerOptions
): T => {
    return new LoggerDecorator(service, className, {
        logRequest: false,
        logExecutionTime: true,
        logErrors: true,
        logLevel: 'info',
        ...options
    }) as unknown as T;
};

/**
 * 裝飾器鏈：可組合多個裝飾器
 */
export class DecoratorChain<T extends Component> {
    private component: T;

    constructor(component: T) {
        this.component = component;
    }

    /**
     * 添加日誌裝飾器
     */
    withLogger = (className: string, options?: LoggerOptions): DecoratorChain<T> => {
        this.component = new LoggerDecorator(this.component, className, options) as T;
        return this;
    };

    /**
     * 獲取最終的裝飾組件
     */
    build = (): T => {
        return this.component;
    };
}

/**
 * 便捷方法：創建裝飾器鏈
 */
export const decorateComponent = <T extends Component>(component: T): DecoratorChain<T> => {
    return new DecoratorChain(component);
};
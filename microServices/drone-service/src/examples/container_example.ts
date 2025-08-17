/**
 * @fileoverview DI Container 配置範例 - 使用 Decorator Pattern
 * 
 * 展示如何在 Inversify 容器中正確配置使用 Decorator Pattern 的元件。
 * 這個範例展示了 Controller、Service、Repository 三層架構的完整配置。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-13
 */

import { Container } from 'inversify';
import { TYPES } from '../container/types.js';

// 導入原始類別（無裝飾器）
import { DroneCommandCommandsBase } from './DroneCommandCommandsCtrl_Fixed.js';
import { DroneCommandCommandsSvcBase } from '../services/commands/DroneCommandCommandsSvc.js';
import { DroneCommandCommandsRepoBase } from '../repo/commands/DroneCommandCommandsRepo.js';

// 導入 Decorator Pattern 工廠方法
import { 
    createLoggedController, 
    createLoggedService, 
    createLoggedRepository,
    LoggerFactory,
    Logger 
} from '../patterns/LoggerDecorator.js';

// 導入現有的 logger 系統
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { Request } from 'express';

/**
 * Drone Service 專用的 Logger Factory
 */
class DroneServiceLoggerFactory implements LoggerFactory {
    createLogger(name: string): Logger {
        const logger = createLogger(name);
        return {
            info: (message: string, meta?: any) => logger.info(message, meta),
            error: (message: string, meta?: any) => logger.error(message, meta),
            debug: (message: string, meta?: any) => logger.debug(message, meta),
            warn: (message: string, meta?: any) => logger.warn(message, meta)
        };
    }

    logRequest(req: Request, message: string, level?: string): void {
        logRequest(req, message, level as any);
    }
}

/**
 * 創建並配置 DI 容器
 */
export const createContainer = (): Container => {
    const container = new Container();
    const loggerFactory = new DroneServiceLoggerFactory();

    // 註冊 Logger Factory（單例）
    container.bind<LoggerFactory>('LoggerFactory').toConstantValue(loggerFactory);

    // === Repository 層 ===
    
    // 原始 Repository（無裝飾器）
    container.bind<DroneCommandCommandsRepoBase>('DroneCommandCommandsRepoBase')
        .to(DroneCommandCommandsRepoBase)
        .inSingletonScope();
    
    // 帶有日誌功能的 Repository
    container.bind(TYPES.DroneCommandCommandsRepo).toDynamicValue((context) => {
        const baseRepo = context.container.get<DroneCommandCommandsRepoBase>('DroneCommandCommandsRepoBase');
        const loggerFactory = context.container.get<LoggerFactory>('LoggerFactory');
        
        return createLoggedRepository(
            baseRepo,
            'DroneCommandCommandsRepo',
            loggerFactory,
            {
                logLevel: 'debug',
                logExecutionTime: true,
                logErrors: true
            }
        );
    }).inSingletonScope();

    // === Service 層 ===
    
    // 原始 Service（無裝飾器）
    container.bind<DroneCommandCommandsSvcBase>('DroneCommandCommandsSvcBase')
        .to(DroneCommandCommandsSvcBase)
        .inSingletonScope();
    
    // 帶有日誌功能的 Service
    container.bind(TYPES.DroneCommandCommandsSvc).toDynamicValue((context) => {
        const baseService = context.container.get<DroneCommandCommandsSvcBase>('DroneCommandCommandsSvcBase');
        const loggerFactory = context.container.get<LoggerFactory>('LoggerFactory');
        
        return createLoggedService(
            baseService,
            'DroneCommandCommandsSvc',
            loggerFactory,
            {
                logLevel: 'info',
                logExecutionTime: true,
                logErrors: true,
                logParameters: false // Service 層通常不記錄參數
            }
        );
    }).inSingletonScope();

    // === Controller 層 ===
    
    // 原始 Controller（無裝飾器）
    container.bind<DroneCommandCommandsBase>('DroneCommandCommandsBase')
        .to(DroneCommandCommandsBase)
        .inSingletonScope();
    
    // 帶有日誌功能的 Controller
    container.bind(TYPES.DroneCommandCommandsCtrl).toDynamicValue((context) => {
        const baseController = context.container.get<DroneCommandCommandsBase>('DroneCommandCommandsBase');
        const loggerFactory = context.container.get<LoggerFactory>('LoggerFactory');
        
        return createLoggedController(
            baseController,
            'DroneCommandCommands',
            loggerFactory,
            {
                logLevel: 'info',
                logExecutionTime: true,
                logErrors: true,
                logRequest: true, // Controller 層記錄 HTTP 請求
                logParameters: false
            }
        );
    }).inSingletonScope();

    return container;
};

/**
 * 簡化的工廠方法配置（推薦用法）
 */
export const createSimpleContainer = (): Container => {
    const container = new Container();
    const loggerFactory = new DroneServiceLoggerFactory();

    // 直接註冊帶有裝飾器的元件
    container.bind(TYPES.DroneCommandCommandsRepo).toDynamicValue(() => {
        const baseRepo = new DroneCommandCommandsRepoBase();
        return createLoggedRepository(baseRepo, 'DroneCommandCommandsRepo', loggerFactory);
    }).inSingletonScope();

    container.bind(TYPES.DroneCommandCommandsSvc).toDynamicValue((context) => {
        const repo = context.container.get(TYPES.DroneCommandCommandsRepo);
        const baseService = new DroneCommandCommandsSvcBase(repo);
        return createLoggedService(baseService, 'DroneCommandCommandsSvc', loggerFactory);
    }).inSingletonScope();

    container.bind(TYPES.DroneCommandCommandsCtrl).toDynamicValue((context) => {
        const service = context.container.get(TYPES.DroneCommandCommandsSvc);
        const baseController = new DroneCommandCommandsBase(service);
        return createLoggedController(baseController, 'DroneCommandCommands', loggerFactory);
    }).inSingletonScope();

    return container;
};

/**
 * 使用範例
 */
export const useExample = () => {
    // 創建容器
    const container = createSimpleContainer();
    
    // 獲取帶有日誌功能的控制器
    const controller = container.get(TYPES.DroneCommandCommandsCtrl);
    
    // 現在 controller 的所有方法都會自動記錄日誌
    // 例如：controller.createCommand() 會自動記錄執行時間、錯誤等
    
    return controller;
};

/**
 * 測試配置是否正確
 */
export const testConfiguration = async () => {
    const container = createSimpleContainer();
    
    try {
        // 測試所有層都能正確創建
        const repo = container.get(TYPES.DroneCommandCommandsRepo);
        const service = container.get(TYPES.DroneCommandCommandsSvc);
        const controller = container.get(TYPES.DroneCommandCommandsCtrl);
        
        console.log('✅ Repository 創建成功:', !!repo);
        console.log('✅ Service 創建成功:', !!service);
        console.log('✅ Controller 創建成功:', !!controller);
        
        // 測試方法是否存在（應該是 arrow function）
        console.log('✅ Controller.createCommand 是函數:', typeof controller.createCommand === 'function');
        
        return true;
    } catch (error) {
        console.error('❌ 配置測試失敗:', error);
        return false;
    }
};
/**
 * @fileoverview general 服務 IoC 容器配置
 * 
 * 簡化版容器配置，專注於基本文檔功能
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';

// Repository 層 imports
import { UserPreferenceCommandsRepository } from '../repo/commands/UserPreferenceCommandsRepo.js';
import { UserPreferenceQueriesRepository } from '../repo/queries/UserPreferenceQueriesRepo.js';

// Service 層 imports
import { UserPreferenceCommandsSvc } from '../services/commands/UserPreferenceCommandsSvc.js';
import { UserPreferenceQueriesSvc } from '../services/queries/UserPreferenceQueriesSvc.js';

// Controller 層 imports
import { UserPreferenceCommands } from '../controllers/commands/UserPreferenceCommandsCtrl.js';
import { UserPreferenceQueries } from '../controllers/queries/UserPreferenceQueriesCtrl.js';
import { DocsController } from '../controllers/queries/DocsQueriesCtrl.js';

// Routes 層 imports
import { UserPreferenceRoutes } from '../routes/userPreferenceRoutes.js';

/**
 * 建立和配置 general 服務 IoC 容器
 * 
 * @returns 配置完成的容器實例
 */
export function createContainer(): Container {
    const container = new Container();

    // ===== Repository 層註冊 =====
    container.bind<UserPreferenceCommandsRepository>(TYPES.UserPreferenceCommandsRepo)
        .to(UserPreferenceCommandsRepository)
        .inSingletonScope();

    container.bind<UserPreferenceQueriesRepository>(TYPES.UserPreferenceQueriesRepo)
        .to(UserPreferenceQueriesRepository)
        .inSingletonScope();

    // ===== Service 層註冊 =====
    container.bind<UserPreferenceCommandsSvc>(TYPES.UserPreferenceCommandsSvc)
        .to(UserPreferenceCommandsSvc)
        .inSingletonScope();

    container.bind<UserPreferenceQueriesSvc>(TYPES.UserPreferenceQueriesSvc)
        .to(UserPreferenceQueriesSvc)
        .inSingletonScope();

    // ===== Controller 層註冊 =====
    container.bind<UserPreferenceCommands>(TYPES.UserPreferenceCommandsCtrl)
        .to(UserPreferenceCommands)
        .inSingletonScope();

    container.bind<UserPreferenceQueries>(TYPES.UserPreferenceQueriesCtrl)
        .to(UserPreferenceQueries)
        .inSingletonScope();

    /**
     * 動態文檔 Controller
     * 處理微服務架構文檔展示（EJS 渲染、服務狀態監控）
     */
    container.bind<DocsController>(TYPES.DocsController)
        .to(DocsController)
        .inSingletonScope();

    // ===== Routes 層註冊 =====
    container.bind<UserPreferenceRoutes>(TYPES.UserPreferenceRoutes)
        .to(UserPreferenceRoutes)
        .inSingletonScope();

    console.log('✅ general 服務 IoC Container 配置完成 - UserPreference + 動態文檔功能已註冊');
    
    return container;
}

/**
 * 容器工具函數
 */
export class ContainerUtils {
    static get<T>(serviceId: symbol): T {
        return container.get<T>(serviceId);
    }

    static isBound(serviceId: symbol): boolean {
        return container.isBound(serviceId);
    }
}

// 匯出容器實例
export const container = createContainer();
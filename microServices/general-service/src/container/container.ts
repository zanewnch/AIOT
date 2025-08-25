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
import { UserPreferenceCommandsRepository } from '../repo/commands/UserPreferenceCommandsRepository.js';
import { UserPreferenceQueriesRepository } from '../repo/queries/UserPreferenceQueriesRepository.js';

// Service 層 imports
import { UserPreferenceCommandsService } from '../services/commands/UserPreferenceCommandsService.js';
import { UserPreferenceQueriesService } from '../services/queries/UserPreferenceQueriesService.js';

// Controller 層 imports
import { UserPreferenceCommandsController } from '../controllers/commands/UserPreferenceCommandsCtrl.js';
import { UserPreferenceQueriesController } from '../controllers/queries/UserPreferenceQueriesCtrl.js';
import { DocsQueriesController } from '../controllers/queries/DocsQueriesCtrl.js';

// Routes 層 imports
import { UserPreferenceRoutes } from '../routes/userPreferenceRoutes.js';
import { DocsRoutes } from '../routes/docsRoutes.js';
import { HealthRoutes } from '../routes/healthRoutes.js';
import { MCPRoutes } from '../routes/mcpRoutes.js';
import { RouteRegistrar } from '../routes/index.js';

/**
 * 建立和配置 general 服務 IoC 容器
 * 
 * @returns 配置完成的容器實例
 */
export function createContainer(): Container {
    const container = new Container();

    // ===== Repository 層註冊 =====
    container.bind<UserPreferenceCommandsRepository>(TYPES.UserPreferenceCommandsRepository)
        .to(UserPreferenceCommandsRepository)
        .inSingletonScope();

    container.bind<UserPreferenceQueriesRepository>(TYPES.UserPreferenceQueriesRepository)
        .to(UserPreferenceQueriesRepository)
        .inSingletonScope();

    // ===== Service 層註冊 =====
    container.bind<UserPreferenceCommandsService>(TYPES.UserPreferenceCommandsService)
        .to(UserPreferenceCommandsService)
        .inSingletonScope();

    container.bind<UserPreferenceQueriesService>(TYPES.UserPreferenceQueriesService)
        .to(UserPreferenceQueriesService)
        .inSingletonScope();

    // ===== Controller 層註冊 =====
    container.bind<UserPreferenceCommandsController>(TYPES.UserPreferenceCommandsController)
        .to(UserPreferenceCommandsController)
        .inSingletonScope();

    container.bind<UserPreferenceQueriesController>(TYPES.UserPreferenceQueriesController)
        .to(UserPreferenceQueriesController)
        .inSingletonScope();

    /**
     * 動態文檔 Controller
     * 處理微服務架構文檔展示（EJS 渲染、服務狀態監控）
     */
    container.bind<DocsQueriesController>(TYPES.DocsController)
        .to(DocsQueriesController)
        .inSingletonScope();

    // ===== Routes 層註冊 =====
    container.bind<UserPreferenceRoutes>(TYPES.UserPreferenceRoutes)
        .to(UserPreferenceRoutes)
        .inSingletonScope();

    container.bind<DocsRoutes>(TYPES.DocsRoutes)
        .to(DocsRoutes)
        .inSingletonScope();

    container.bind<HealthRoutes>(TYPES.HealthRoutes)
        .to(HealthRoutes)
        .inSingletonScope();

    container.bind<MCPRoutes>(TYPES.MCPRoutes)
        .to(MCPRoutes)
        .inSingletonScope();

    // ===== Route Registrar 註冊 =====
    container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
        .to(RouteRegistrar)
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
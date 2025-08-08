/**
 * @fileoverview feSetting 服務 IoC 容器配置
 * 
 * 配置 InversifyJS 容器，註冊用戶偏好設定相關服務依賴，
 * 實現自動依賴注入和生命週期管理，遵循 CQRS 架構模式
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

/**
 * 建立和配置 feSetting 服務 IoC 容器
 * 
 * 註冊順序：
 * 1. Repository 層（數據訪問層）
 * 2. Service 層（業務邏輯層）
 * 3. Controller 層（API 端點層）
 * 
 * @returns 配置完成的容器實例
 */
export function createContainer(): Container {
    const container = new Container();

    // ===== Repository 層註冊 =====
    
    /**
     * 用戶偏好設定 Commands Repository
     * 處理寫入操作（創建、更新、刪除）
     */
    container.bind<UserPreferenceCommandsRepository>(TYPES.UserPreferenceCommandsRepo)
        .to(UserPreferenceCommandsRepository)
        .inSingletonScope();

    /**
     * 用戶偏好設定 Queries Repository
     * 處理查詢操作（選擇、搜索、統計）
     */
    container.bind<UserPreferenceQueriesRepository>(TYPES.UserPreferenceQueriesRepo)
        .to(UserPreferenceQueriesRepository)
        .inSingletonScope();

    // ===== Service 層註冊 =====
    
    /**
     * 用戶偏好設定 Commands Service
     * 處理命令業務邏輯（創建、更新、刪除相關的業務規則）
     */
    container.bind<UserPreferenceCommandsSvc>(TYPES.UserPreferenceCommandsSvc)
        .to(UserPreferenceCommandsSvc)
        .inSingletonScope();

    /**
     * 用戶偏好設定 Queries Service
     * 處理查詢業務邏輯（搜索、過濾、統計相關的業務規則）
     */
    container.bind<UserPreferenceQueriesSvc>(TYPES.UserPreferenceQueriesSvc)
        .to(UserPreferenceQueriesSvc)
        .inSingletonScope();

    // ===== Controller 層註冊 =====
    
    /**
     * 用戶偏好設定 Commands Controller
     * 處理 HTTP 命令端點（POST、PUT、DELETE 等寫入操作）
     */
    container.bind<UserPreferenceCommands>(TYPES.UserPreferenceCommandsCtrl)
        .to(UserPreferenceCommands)
        .inSingletonScope();

    /**
     * 用戶偏好設定 Queries Controller
     * 處理 HTTP 查詢端點（GET 等讀取操作）
     */
    container.bind<UserPreferenceQueries>(TYPES.UserPreferenceQueriesCtrl)
        .to(UserPreferenceQueries)
        .inSingletonScope();

    console.log('✅ feSetting 服務 IoC Container 配置完成 - UserPreference CQRS 架構已註冊');
    
    return container;
}

/**
 * 容器工具函數
 * 
 * 提供便利的靜態方法來操作容器
 */
export class ContainerUtils {
    /**
     * 獲取服務實例
     * 
     * @template T 服務類型
     * @param {symbol} serviceId 服務識別符
     * @returns {T} 服務實例
     */
    static get<T>(serviceId: symbol): T {
        return container.get<T>(serviceId);
    }

    /**
     * 檢查服務是否已註冊
     * 
     * @param {symbol} serviceId 服務識別符
     * @returns {boolean} 是否已註冊
     */
    static isBound(serviceId: symbol): boolean {
        return container.isBound(serviceId);
    }

    /**
     * 獲取用戶偏好設定 Commands 服務
     * 
     * @returns {UserPreferenceCommandsSvc} Commands 服務實例
     */
    static getUserPreferenceCommandsService(): UserPreferenceCommandsSvc {
        return container.get<UserPreferenceCommandsSvc>(TYPES.UserPreferenceCommandsSvc);
    }

    /**
     * 獲取用戶偏好設定 Queries 服務
     * 
     * @returns {UserPreferenceQueriesSvc} Queries 服務實例
     */
    static getUserPreferenceQueriesService(): UserPreferenceQueriesSvc {
        return container.get<UserPreferenceQueriesSvc>(TYPES.UserPreferenceQueriesSvc);
    }

    /**
     * 獲取用戶偏好設定 Commands 控制器
     * 
     * @returns {UserPreferenceCommands} Commands 控制器實例
     */
    static getUserPreferenceCommandsController(): UserPreferenceCommands {
        return container.get<UserPreferenceCommands>(TYPES.UserPreferenceCommandsCtrl);
    }

    /**
     * 獲取用戶偏好設定 Queries 控制器
     * 
     * @returns {UserPreferenceQueries} Queries 控制器實例
     */
    static getUserPreferenceQueriesController(): UserPreferenceQueries {
        return container.get<UserPreferenceQueries>(TYPES.UserPreferenceQueriesCtrl);
    }

    /**
     * 獲取容器統計信息
     * 
     * @returns {object} 容器統計信息
     */
    static getContainerStats(): object {
        return {
            timestamp: new Date().toISOString(),
            service: 'feSetting',
            registeredServices: [
                'UserPreferenceCommandsRepo',
                'UserPreferenceQueriesRepo',
                'UserPreferenceCommandsSvc',
                'UserPreferenceQueriesSvc',
                'UserPreferenceCommandsCtrl',
                'UserPreferenceQueriesCtrl'
            ],
            containerCreated: true,
            cqrsArchitecture: {
                repositories: 2,
                services: 2,
                controllers: 2
            }
        };
    }
}

// 匯出容器實例
export const container = createContainer();
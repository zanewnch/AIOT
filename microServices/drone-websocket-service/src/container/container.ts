/**
 * @fileoverview Drone-Realtime 服務 IoC 容器配置
 * 
 * 配置 InversifyJS 容器，註冊無人機實時狀態相關服務依賴，
 * 實現自動依賴注入和生命週期管理
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';
import type {
  IDroneEventHandler,
  IWebSocketService,
  IWebSocketAuthMiddleware
} from '../types/websocket-interfaces.js';

// 服務和介面導入
import {
    DroneRealTimeStatusQueriesSvc,
    DroneRealTimeStatusCommandsSvc
} from '@/services';
import type {
    IDroneRealTimeStatusQueriesSvc,
    IDroneRealTimeStatusCommandsSvc
} from '@/interfaces/services';

// Repository 導入
import {
    DroneRealTimeStatusQueriesRepository,
    DroneRealTimeStatusCommandsRepository
} from '@/repo';

// 路由導入
import { HealthRoutes } from '@/routes/healthRoutes.js';
import { RouteManager } from '@/routes/index.js';

// WebSocket 服務和事件處理器導入
import { IntegratedWebSocketService } from '@/configs/websocket/service.js';
import { IntegratedDroneStatusEventHandler } from '@/configs/websocket/handlers/DroneStatusEventHandler.js';

/**
 * IoC 容器實例
 * 管理所有服務依賴的生命週期和注入
 */
export const container = new Container({
    defaultScope: 'Singleton'
});

/**
 * 註冊資料存取層依賴
 * Repository 層服務
 */
function bindRepositories(): void {
    // 實時狀態資料存取層
    container.bind<DroneRealTimeStatusQueriesRepository>(TYPES.DroneRealTimeStatusQueriesRepository)
        .to(DroneRealTimeStatusQueriesRepository);
    container.bind<DroneRealTimeStatusCommandsRepository>(TYPES.DroneRealTimeStatusCommandsRepository)
        .to(DroneRealTimeStatusCommandsRepository);
}

/**
 * 註冊服務層依賴
 * 實時狀態相關的查詢和命令服務 (介面 → 實現類別綁定)
 */
function bindServices(): void {
    // 實時狀態服務 - 介面綁定 (遵循依賴反轉原則)
    container.bind<IDroneRealTimeStatusQueriesSvc>(TYPES.IDroneRealTimeStatusQueriesSvc)
        .to(DroneRealTimeStatusQueriesSvc);
    container.bind<IDroneRealTimeStatusCommandsSvc>(TYPES.IDroneRealTimeStatusCommandsSvc)
        .to(DroneRealTimeStatusCommandsSvc);
    
    // 向後兼容的具體類型綁定 (如果需要)
    container.bind<DroneRealTimeStatusQueriesSvc>(TYPES.DroneRealTimeStatusQueriesSvc)
        .to(DroneRealTimeStatusQueriesSvc);
    container.bind<DroneRealTimeStatusCommandsSvc>(TYPES.DroneRealTimeStatusCommandsSvc)  
        .to(DroneRealTimeStatusCommandsSvc);
}

// 註冊控制器層依賴已移除 - 此微服務專注於 WebSocket 實時通信

/**
 * 註冊路由層依賴
 * WebSocket 服務的輔助 HTTP 端點
 */
function bindRoutes(): void {
    // 健康檢查和 WebSocket 資訊路由
    container.bind<HealthRoutes>(TYPES.HealthRoutes).to(HealthRoutes);
    container.bind<RouteManager>(TYPES.RouteManager).to(RouteManager);
}

/**
 * 註冊 WebSocket 相關依賴
 * 實時通訊服務和事件處理器
 */
function bindWebSocketServices(): void {
    // 整合的 WebSocket 服務
    container.bind<IntegratedWebSocketService>(TYPES.IntegratedWebSocketService)
        .to(IntegratedWebSocketService);
    
    // 整合的事件處理器
    container.bind<IntegratedDroneStatusEventHandler>(TYPES.DroneStatusEventHandler)
        .to(IntegratedDroneStatusEventHandler);
    
    // 舊版 WebSocket 服務 (保持向後兼容，如需要)
    /*
    container.bind<IWebSocketService>(TYPES.WebSocketService).to(WebSocketService);
    container.bind<IWebSocketAuthMiddleware>(TYPES.WebSocketAuthMiddleware)
        .to(WebSocketAuthMiddleware);
    */
}

/**
 * 初始化容器
 * 按順序註冊所有依賴
 */
function initializeContainer(): void {
    bindRepositories();
    bindServices();
    bindRoutes();
    bindWebSocketServices();
}

// 執行容器初始化
initializeContainer();

/**
 * 容器工具類
 * 提供便捷的容器操作方法
 */
export class ContainerUtils {
    /**
     * 獲取服務實例
     */
    static get<T>(serviceIdentifier: symbol): T {
        return container.get<T>(serviceIdentifier);
    }

    /**
     * 檢查服務是否已註冊
     */
    static isBound(serviceIdentifier: symbol): boolean {
        return container.isBound(serviceIdentifier);
    }

    /**
     * 重新綁定服務（用於測試）
     */
    static rebind<T>(serviceIdentifier: symbol): any {
        return container.rebind<T>(serviceIdentifier);
    }
}
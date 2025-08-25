/**
 * @fileoverview Drone WebSocket Service IoC 容器配置
 * 
 * 遵循 CLAUDE.md 規範，使用 @injectable 和 @inject 裝飾器
 * 在容器中註冊所有可注入服務以支持依賴解析
 * 
 * @version 2.1.0
 * @author AIOT Team
 * @since 2025-08-24
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';

// 導入所有需要註冊的服務
import { RouteRegistrar } from '../routes/index.js';
import { HealthRoutes } from '../routes/healthRoutes.js';
import { IntegratedWebSocketService } from '../configs/websocket/service.js';
import { IntegratedDroneStatusEventHandler } from '../configs/websocket/handlers/DroneStatusEventHandler.js';

// 導入服務層
import { DroneRealTimeStatusQueriesService } from '../services/queries/DroneRealTimeStatusQueriesService.js';
import { DroneRealTimeStatusCommandsService } from '../services/commands/DroneRealTimeStatusCommandsService.js';

// 導入儲存庫層
import { DroneRealTimeStatusQueriesRepositorysitorysitory } from '../repo/queries/DroneRealTimeStatusQueriesRepository.js';
import { DroneRealTimeStatusCommandsRepositorysitorysitorysitory } from '../repo/commands/DroneRealTimeStatusCommandsRepository.js';

/**
 * 創建並配置 Drone WebSocket Service 的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container({
    defaultScope: 'Singleton'
  });

  // 註冊所有可注入服務到容器
  
  // 路由層
  container.bind<HealthRoutes>(TYPES.HealthRoutes).to(HealthRoutes);
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar).to(RouteRegistrar);
  
  // 儲存庫層
  container.bind<DroneRealTimeStatusQueriesRepositorysitorysitory>(TYPES.DroneRealTimeStatusQueriesRepositorysitory).to(DroneRealTimeStatusQueriesRepositorysitorysitory);
  container.bind<DroneRealTimeStatusCommandsRepositorysitorysitorysitory>(TYPES.DroneRealTimeStatusCommandsRepositorysitorysitory).to(DroneRealTimeStatusCommandsRepositorysitorysitorysitory);
  
  // 服務層
  container.bind<DroneRealTimeStatusQueriesService>(TYPES.IDroneRealTimeStatusQueriesService).to(DroneRealTimeStatusQueriesService);
  container.bind<DroneRealTimeStatusCommandsService>(TYPES.DroneRealTimeStatusCommandsService).to(DroneRealTimeStatusCommandsService);
  
  // WebSocket 相關服務
  container.bind<IntegratedDroneStatusEventHandler>(TYPES.DroneStatusEventHandler).to(IntegratedDroneStatusEventHandler);
  container.bind<IntegratedWebSocketService>(TYPES.IntegratedWebSocketService).to(IntegratedWebSocketService);

  console.log('✅ Drone WebSocket Service IoC 容器已配置');
  console.log('📦 已註冊的服務：');
  console.log('  - HealthRoutes');
  console.log('  - RouteRegistrar');
  console.log('  - DroneRealTimeStatusQueriesRepository');
  console.log('  - DroneRealTimeStatusCommandsRepository');
  console.log('  - DroneRealTimeStatusQueriesService');
  console.log('  - DroneRealTimeStatusCommandsService');
  console.log('  - IntegratedDroneStatusEventHandler');
  console.log('  - IntegratedWebSocketService');
  
  return container;
}

/**
 * 全域容器實例
 */
export const container = createContainer();

/**
 * 應用程式工廠函數 - 正確的依賴注入實現方式
 * 避免在類別中直接使用 container.get()
 */
export const createAppServices = () => {
  return {
    routeRegistrar: container.get<RouteRegistrar>(TYPES.RouteRegistrar),
    webSocketService: container.get<IntegratedWebSocketService>(TYPES.IntegratedWebSocketService)
  };
};

/**
 * 容器工具函數 - 僅供內部使用
 * 遵循 CLAUDE.md：避免在業務邏輯中直接使用 container.get()
 */
export class ContainerUtils {
  /**
   * 檢查服務是否已註冊
   */
  static isBound(serviceId: symbol): boolean {
    return container.isBound(serviceId);
  }
  
  /**
   * 獲取容器實例 - 僅供測試和初始化使用
   */
  static getContainer(): Container {
    return container;
  }
}
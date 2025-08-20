/**
 * @fileoverview Drone 服務 IoC 容器配置
 * 
 * 配置 InversifyJS 容器，註冊無人機相關服務依賴，
 * 實現自動依賴注入和生命週期管理
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES, DroneEventType } from '../container/types.js';
import type {
  IDroneEventHandler,
  IWebSocketService,
  IWebSocketAuthMiddleware
} from '../types/websocket-interfaces.js';

// 無人機服務實現導入
import { DronePositionQueriesSvc } from '../services/queries/DronePositionQueriesSvc.js';
import { DronePositionCommandsSvc } from '../services/commands/DronePositionCommandsSvc.js';
import { DroneStatusQueriesSvc } from '../services/queries/DroneStatusQueriesSvc.js';
import { DroneStatusCommandsSvc } from '../services/commands/DroneStatusCommandsSvc.js';
import { DroneRealTimeStatusQueriesSvc } from '../services/queries/DroneRealTimeStatusQueriesSvc.js';
import { DroneRealTimeStatusCommandsSvc } from '../services/commands/DroneRealTimeStatusCommandsSvc.js';
import { DroneCommandQueriesSvc } from '../services/queries/DroneCommandQueriesSvc.js';
import { DroneCommandCommandsSvc } from '../services/commands/DroneCommandCommandsSvc.js';
import { DroneCommandQueueQueriesSvc } from '../services/queries/DroneCommandQueueQueriesSvc.js';
import { DroneCommandQueueCommandsSvc } from '../services/commands/DroneCommandQueueCommandsSvc.js';

// Repository 層導入
import { DronePositionQueriesRepo } from '../repo/queries/DronePositionQueriesRepo.js';
import { DronePositionCommandsRepository } from '../repo/commands/DronePositionCommandsRepo.js';
import { DroneStatusQueriesRepo } from '../repo/queries/DroneStatusQueriesRepo.js';
import { DroneStatusCommandsRepository } from '../repo/commands/DroneStatusCommandsRepo.js';
import { DroneRealTimeStatusQueriesRepo } from '../repo/queries/DroneRealTimeStatusQueriesRepo.js';
import { DroneRealTimeStatusCommandsRepository } from '../repo/commands/DroneRealTimeStatusCommandsRepo.js';
import { ArchiveTaskQueriesRepo } from '../repo/queries/ArchiveTaskQueriesRepo.js';
import { ArchiveTaskCommandsRepository } from '../repo/commands/ArchiveTaskCommandsRepo.js';
import { DroneStatusArchiveQueriesRepo } from '../repo/queries/DroneStatusArchiveQueriesRepo.js';
import { DroneStatusArchiveCommandsRepository } from '../repo/commands/DroneStatusArchiveCommandsRepo.js';

// 歷史歸檔服務
import { ArchiveTaskQueriesSvc } from '../services/queries/ArchiveTaskQueriesSvc.js';
import { ArchiveTaskCommandsSvc } from '../services/commands/ArchiveTaskCommandsSvc.js';
import { DroneCommandsArchiveQueriesSvc } from '../services/queries/DroneCommandsArchiveQueriesSvc.js';
import { DroneCommandsArchiveCommandsSvc } from '../services/commands/DroneCommandsArchiveCommandsSvc.js';
import { DronePositionsArchiveQueriesSvc } from '../services/queries/DronePositionsArchiveQueriesSvc.js';
import { DronePositionsArchiveCommandsSvc } from '../services/commands/DronePositionsArchiveCommandsSvc.js';
import { DroneStatusArchiveQueriesSvc } from '../services/queries/DroneStatusArchiveQueriesSvc.js';
import { DroneStatusArchiveCommandsSvc } from '../services/commands/DroneStatusArchiveCommandsSvc.js';

// WebSocket 服務（如果存在）
// import { WebSocketService } from '../configs/websocket/service.js';
// import { WebSocketAuthMiddleware } from '../../../../packages/WebSocketAuthMiddleware.js';
// import { DronePositionEventHandler } from '../websocket/DronePositionEventHandler.js';
// import { DroneStatusEventHandler } from '../websocket/DroneStatusEventHandler.js';
// import { DroneCommandEventHandler } from '../websocket/DroneCommandEventHandler.js';

// 控制器導入
import { ArchiveTaskQueries } from '../controllers/queries/ArchiveTaskQueriesCtrl.js';
import { ArchiveTaskCommands } from '../controllers/commands/ArchiveTaskCommandsCtrl.js';
import { DroneCommandQueries } from '../controllers/queries/DroneCommandQueriesCtrl.js';
import { DroneCommandCommands } from '../controllers/commands/DroneCommandCommandsCtrl.js';
import { DroneCommandQueueQueries } from '../controllers/queries/DroneCommandQueueQueriesCtrl.js';
import { DroneCommandQueueCommands } from '../controllers/commands/DroneCommandQueueCommandsCtrl.js';
import { DroneCommandsArchiveQueries } from '../controllers/queries/DroneCommandsArchiveQueriesCtrl.js';
import { DroneCommandsArchiveCommands } from '../controllers/commands/DroneCommandsArchiveCommandsCtrl.js';
import { DronePositionQueries } from '../controllers/queries/DronePositionQueriesCtrl.js';
import { DronePositionCommands } from '../controllers/commands/DronePositionCommandsCtrl.js';
import { DronePositionsArchiveQueries } from '../controllers/queries/DronePositionsArchiveQueriesCtrl.js';
import { DronePositionsArchiveCommands } from '../controllers/commands/DronePositionsArchiveCommandsCtrl.js';
import { DroneRealTimeStatusQueries } from '../controllers/queries/DroneRealTimeStatusQueriesCtrl.js';
import { DroneRealTimeStatusCommands } from '../controllers/commands/DroneRealTimeStatusCommandsCtrl.js';
import { DroneStatusArchiveQueries } from '../controllers/queries/DroneStatusArchiveQueriesCtrl.js';
import { DroneStatusArchiveCommands } from '../controllers/commands/DroneStatusArchiveCommandsCtrl.js';
import { DroneStatusQueries } from '../controllers/queries/DroneStatusQueriesCtrl.js';
import { DroneStatusCommands } from '../controllers/commands/DroneStatusCommandsCtrl.js';

// 路由導入
import { ArchiveTaskRoutes } from '../routes/archiveTaskRoutes.js';
import { DronePositionRoutes } from '../routes/dronePositionRoutes.js';
import { DroneStatusRoutes } from '../routes/droneStatusRoutes.js';
import { DroneCommandRoutes } from '../routes/droneCommandRoutes.js';
import { DroneRealtimeRoutes } from '../routes/droneRealtimeRoutes.js';
import { RouteManager } from '../routes/index.js';

/**
 * 建立和配置 IoC 容器
 * @returns 配置完成的容器實例
 */
export function createContainer(): Container {
    const container = new Container();

    // === Repository 層 ===
    container.bind(TYPES.DronePositionQueriesRepo).to(DronePositionQueriesRepo).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsRepository).to(DronePositionCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneStatusQueriesRepo).to(DroneStatusQueriesRepo).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsRepository).to(DroneStatusCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusQueriesRepo).to(DroneRealTimeStatusQueriesRepo).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsRepository).to(DroneRealTimeStatusCommandsRepository).inSingletonScope();
    container.bind(TYPES.ArchiveTaskQueriesRepo).to(ArchiveTaskQueriesRepo).inSingletonScope();
    container.bind(TYPES.ArchiveTaskCommandsRepository).to(ArchiveTaskCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesRepo).to(DroneStatusArchiveQueriesRepo).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsRepository).to(DroneStatusArchiveCommandsRepository).inSingletonScope();

    // === 無人機位置服務 ===
    container.bind(TYPES.DronePositionQueriesSvc).to(DronePositionQueriesSvc).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsSvc).to(DronePositionCommandsSvc).inSingletonScope();

    // === 無人機狀態服務 ===
    container.bind(TYPES.DroneStatusQueriesSvc).to(DroneStatusQueriesSvc).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsSvc).to(DroneStatusCommandsSvc).inSingletonScope();

    // === 無人機即時狀態服務 ===
    container.bind(TYPES.DroneRealTimeStatusQueriesSvc).to(DroneRealTimeStatusQueriesSvc).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsSvc).to(DroneRealTimeStatusCommandsSvc).inSingletonScope();

    // === 無人機命令服務 ===
    container.bind(TYPES.DroneCommandQueriesSvc).to(DroneCommandQueriesSvc).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsSvc).to(DroneCommandCommandsSvc).inSingletonScope();

    // === 無人機命令佇列服務 ===
    container.bind(TYPES.DroneCommandQueueQueriesSvc).to(DroneCommandQueueQueriesSvc).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueCommandsSvc).to(DroneCommandQueueCommandsSvc).inSingletonScope();

    // === 歷史歸檔服務 ===
    container.bind(TYPES.ArchiveTaskQueriesSvc).to(ArchiveTaskQueriesSvc).inSingletonScope();
    container.bind(TYPES.ArchiveTaskCommandsSvc).to(ArchiveTaskCommandsSvc).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesSvc).to(DroneCommandsArchiveQueriesSvc).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsSvc).to(DroneCommandsArchiveCommandsSvc).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesSvc).to(DronePositionsArchiveQueriesSvc).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsSvc).to(DronePositionsArchiveCommandsSvc).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesSvc).to(DroneStatusArchiveQueriesSvc).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsSvc).to(DroneStatusArchiveCommandsSvc).inSingletonScope();

    // === 控制器層 ===
    // 查詢控制器
    container.bind(TYPES.ArchiveTaskQueriesCtrl).to(ArchiveTaskQueries).inSingletonScope();
    container.bind(TYPES.DroneCommandQueriesCtrl).to(DroneCommandQueries).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueQueriesCtrl).to(DroneCommandQueueQueries).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesCtrl).to(DroneCommandsArchiveQueries).inSingletonScope();
    container.bind(TYPES.DronePositionQueriesCtrl).to(DronePositionQueries).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesCtrl).to(DronePositionsArchiveQueries).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusQueriesCtrl).to(DroneRealTimeStatusQueries).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesCtrl).to(DroneStatusArchiveQueries).inSingletonScope();
    container.bind(TYPES.DroneStatusQueriesCtrl).to(DroneStatusQueries).inSingletonScope();
    
    // 命令控制器
    container.bind(TYPES.ArchiveTaskCommandsCtrl).to(ArchiveTaskCommands).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsCtrl).to(DroneCommandCommands).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueCommandsCtrl).to(DroneCommandQueueCommands).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsCtrl).to(DroneCommandsArchiveCommands).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsCtrl).to(DronePositionCommands).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsCtrl).to(DronePositionsArchiveCommands).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsCtrl).to(DroneRealTimeStatusCommands).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsCtrl).to(DroneStatusArchiveCommands).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsCtrl).to(DroneStatusCommands).inSingletonScope();

    // === 路由層 ===
    container.bind(TYPES.ArchiveTaskRoutes).to(ArchiveTaskRoutes).inSingletonScope();
    container.bind(TYPES.DronePositionRoutes).to(DronePositionRoutes).inSingletonScope();
    container.bind(TYPES.DroneStatusRoutes).to(DroneStatusRoutes).inSingletonScope();
    container.bind(TYPES.DroneCommandRoutes).to(DroneCommandRoutes).inSingletonScope();
    container.bind(TYPES.DroneRealtimeRoutes).to(DroneRealtimeRoutes).inSingletonScope();
    container.bind(TYPES.RouteManager).to(RouteManager).inSingletonScope();

    // TODO: 註冊 WebSocket 服務（當實現後取消註釋）
    // container.bind(TYPES.WebSocketService).to(WebSocketService).inSingletonScope();
    // container.bind(TYPES.DronePositionEventHandler).to(DronePositionEventHandler).inSingletonScope();
    // container.bind(TYPES.DroneStatusEventHandler).to(DroneStatusEventHandler).inSingletonScope();
    // container.bind(TYPES.DroneCommandEventHandler).to(DroneCommandEventHandler).inSingletonScope();

    return container;
}

// 匯出容器實例
export const container = createContainer();

/**
 * 簡化的容器工具函數
 */
export class ContainerUtils {
  /**
   * 獲取服務實例
   */
  static get<T>(serviceId: symbol): T {
    return container.get<T>(serviceId);
  }

  /**
   * 檢查服務是否已註冊
   */
  static isBound(serviceId: symbol): boolean {
    return container.isBound(serviceId);
  }

  /**
   * 獲取容器統計資訊
   */
  static getContainerStats() {
    return {
      registeredServices: container.isBound.length || 0,
      timestamp: new Date().toISOString()
    };
  }
}
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
import { TYPES } from '../container/types.js';

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

// 配置模組導入
import { createSequelizeInstance } from '../configs/dbConfig.js';
import { RabbitMQManager } from '../configs/rabbitmqConfig.js';
import { ConsulConfig } from '../configs/consulConfig.js';
import { DroneStatusQueriesRepo } from '../repo/queries/DroneStatusQueriesRepo.js';
import { DroneStatusCommandsRepository } from '../repo/commands/DroneStatusCommandsRepo.js';
import { DroneRealTimeStatusQueriesRepo } from '../repo/queries/DroneRealTimeStatusQueriesRepo.js';
import { DroneRealTimeStatusCommandsRepository } from '../repo/commands/DroneRealTimeStatusCommandsRepo.js';
import { ArchiveTaskQueriesRepo } from '../repo/queries/ArchiveTaskQueriesRepo.js';
import { ArchiveTaskCommandsRepository } from '../repo/commands/ArchiveTaskCommandsRepo.js';
import { DroneStatusArchiveQueriesRepo } from '../repo/queries/DroneStatusArchiveQueriesRepo.js';
import { DroneStatusArchiveCommandsRepository } from '../repo/commands/DroneStatusArchiveCommandsRepo.js';
import { DroneCommandQueriesRepo } from '../repo/queries/DroneCommandQueriesRepo.js';
import { DroneCommandCommandsRepository } from '../repo/commands/DroneCommandCommandsRepo.js';
import { DroneCommandsArchiveQueriesRepo } from '../repo/queries/DroneCommandsArchiveQueriesRepo.js';
import { DroneCommandsArchiveCommandsRepository } from '../repo/commands/DroneCommandsArchiveCommandsRepo.js';
import { DronePositionsArchiveQueriesRepo } from '../repo/queries/DronePositionsArchiveQueriesRepo.js';
import { DronePositionsArchiveCommandsRepository } from '../repo/commands/DronePositionsArchiveCommandsRepo.js';

// 歷史歸檔服務
import { ArchiveTaskQueriesSvc } from '../services/queries/ArchiveTaskQueriesSvc.js';
import { ArchiveTaskCommandsSvc } from '../services/commands/ArchiveTaskCommandsSvc.js';
import { DroneCommandsArchiveQueriesSvc } from '../services/queries/DroneCommandsArchiveQueriesSvc.js';
import { DroneCommandsArchiveCommandsSvc } from '../services/commands/DroneCommandsArchiveCommandsSvc.js';
import { DronePositionsArchiveQueriesSvc } from '../services/queries/DronePositionsArchiveQueriesSvc.js';
import { DronePositionsArchiveCommandsSvc } from '../services/commands/DronePositionsArchiveCommandsSvc.js';
import { DroneStatusArchiveQueriesSvc } from '../services/queries/DroneStatusArchiveQueriesSvc.js';
import { DroneStatusArchiveCommandsSvc } from '../services/commands/DroneStatusArchiveCommandsSvc.js';


// 控制器導入
import { ArchiveTaskQueriesCtrl } from '../controllers/queries/ArchiveTaskQueriesCtrl.js';
import { ArchiveTaskCommandsCtrl } from '../controllers/commands/ArchiveTaskCommandsCtrl.js';
import { DroneCommandQueriesCtrl } from '../controllers/queries/DroneCommandQueriesCtrl.js';
import { DroneCommandCommandsCtrl } from '../controllers/commands/DroneCommandCommandsCtrl.js';
import { DroneCommandQueueQueriesCtrl } from '../controllers/queries/DroneCommandQueueQueriesCtrl.js';
import { DroneCommandQueueCommandsCtrl } from '../controllers/commands/DroneCommandQueueCommandsCtrl.js';
import { DroneCommandsArchiveQueriesCtrl } from '../controllers/queries/DroneCommandsArchiveQueriesCtrl.js';
import { DroneCommandsArchiveCommandsCtrl } from '../controllers/commands/DroneCommandsArchiveCommandsCtrl.js';
import { DronePositionQueriesCtrl } from '../controllers/queries/DronePositionQueriesCtrl.js';
import { DronePositionCommandsCtrl } from '../controllers/commands/DronePositionCommandsCtrl.js';
import { DronePositionsArchiveQueriesCtrl } from '../controllers/queries/DronePositionsArchiveQueriesCtrl.js';
import { DronePositionsArchiveCommandsCtrl } from '../controllers/commands/DronePositionsArchiveCommandsCtrl.js';
import { DroneRealTimeStatusQueriesCtrl } from '../controllers/queries/DroneRealTimeStatusQueriesCtrl.js';
import { DroneRealTimeStatusCommandsCtrl } from '../controllers/commands/DroneRealTimeStatusCommandsCtrl.js';
import { DroneStatusArchiveQueriesCtrl } from '../controllers/queries/DroneStatusArchiveQueriesCtrl.js';
import { DroneStatusArchiveCommandsCtrl } from '../controllers/commands/DroneStatusArchiveCommandsCtrl.js';
import { DroneStatusQueriesCtrl } from '../controllers/queries/DroneStatusQueriesCtrl.js';
import { DroneStatusCommandsCtrl } from '../controllers/commands/DroneStatusCommandsCtrl.js';

// 路由導入
import { ArchiveTaskRoutes } from '../routes/archiveTaskRoutes.js';
import { DronePositionRoutes } from '../routes/dronePositionRoutes.js';
import { DroneStatusRoutes } from '../routes/droneStatusRoutes.js';
import { DroneCommandRoutes } from '../routes/droneCommandRoutes.js';
import { DroneRealtimeRoutes } from '../routes/droneRealtimeRoutes.js';
import { RouteManager } from '../routes/index.js';

// 應用程式導入
import { App } from '../app.js';

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
    container.bind(TYPES.DroneCommandQueriesRepo).to(DroneCommandQueriesRepo).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsRepository).to(DroneCommandCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesRepo).to(DroneCommandsArchiveQueriesRepo).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsRepository).to(DroneCommandsArchiveCommandsRepository).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesRepo).to(DronePositionsArchiveQueriesRepo).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsRepository).to(DronePositionsArchiveCommandsRepository).inSingletonScope();

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
    container.bind(TYPES.ArchiveTaskQueriesCtrl).to(ArchiveTaskQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DroneCommandQueriesCtrl).to(DroneCommandQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueQueriesCtrl).to(DroneCommandQueueQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesCtrl).to(DroneCommandsArchiveQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DronePositionQueriesCtrl).to(DronePositionQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesCtrl).to(DronePositionsArchiveQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusQueriesCtrl).to(DroneRealTimeStatusQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesCtrl).to(DroneStatusArchiveQueriesCtrl).inSingletonScope();
    container.bind(TYPES.DroneStatusQueriesCtrl).to(DroneStatusQueriesCtrl).inSingletonScope();
    
    // 命令控制器
    container.bind(TYPES.ArchiveTaskCommandsCtrl).to(ArchiveTaskCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsCtrl).to(DroneCommandCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueCommandsCtrl).to(DroneCommandQueueCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsCtrl).to(DroneCommandsArchiveCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsCtrl).to(DronePositionCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsCtrl).to(DronePositionsArchiveCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsCtrl).to(DroneRealTimeStatusCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsCtrl).to(DroneStatusArchiveCommandsCtrl).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsCtrl).to(DroneStatusCommandsCtrl).inSingletonScope();

    // === 路由層 ===
    container.bind(TYPES.ArchiveTaskRoutes).to(ArchiveTaskRoutes).inSingletonScope();
    container.bind(TYPES.DronePositionRoutes).to(DronePositionRoutes).inSingletonScope();
    container.bind(TYPES.DroneStatusRoutes).to(DroneStatusRoutes).inSingletonScope();
    container.bind(TYPES.DroneCommandRoutes).to(DroneCommandRoutes).inSingletonScope();
    container.bind(TYPES.DroneRealtimeRoutes).to(DroneRealtimeRoutes).inSingletonScope();
    container.bind(TYPES.RouteManager).to(RouteManager).inSingletonScope();

    // === 基礎設施服務 ===
    // 數據庫連接
    container.bind(TYPES.DatabaseConnection).toDynamicValue(() => {
        return createSequelizeInstance();
    }).inSingletonScope();

    // RabbitMQ 管理器
    container.bind(TYPES.RabbitMQManager).toDynamicValue(() => {
        return new RabbitMQManager();
    }).inSingletonScope();

    // Consul 配置
    container.bind(TYPES.ConsulConfig).toDynamicValue(() => {
        return new ConsulConfig();
    }).inSingletonScope();

    // === 應用程式核心 ===
    // App 類 - 使用依賴注入
    container.bind(TYPES.App).to(App).inSingletonScope();

    // DroneHttpServer 類 - HTTP 伺服器管理
    // const { .* } = require('../server.js');
//     container.bind(TYPES.DroneHttpServer).to(DroneHttpServer).inSingletonScope();

    // WebSocket 服務已移至 drone-websocket-service

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
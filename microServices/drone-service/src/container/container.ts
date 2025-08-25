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
import { DronePositionQueriesService } from '../services/queries/DronePositionQueriesService.js';
import { DronePositionCommandsService } from '../services/commands/DronePositionCommandsService.js';
import { DroneStatusQueriesService } from '../services/queries/DroneStatusQueriesService.js';
import { DroneStatusCommandsService } from '../services/commands/DroneStatusCommandsService.js';
import { DroneRealTimeStatusQueriesService } from '../services/queries/DroneRealTimeStatusQueriesService.js';
import { DroneRealTimeStatusCommandsService } from '../services/commands/DroneRealTimeStatusCommandsService.js';
import { DroneCommandQueriesService } from '../services/queries/DroneCommandQueriesService.js';
import { DroneCommandCommandsService } from '../services/commands/DroneCommandCommandsService.js';
import { DroneCommandQueueQueriesService } from '../services/queries/DroneCommandQueueQueriesService.js';
import { DroneCommandQueueCommandsService } from '../services/commands/DroneCommandQueueCommandsService.js';

// Repositorysitorysitory 層導入
import { DronePositionQueriesRepository } from '../repo/queries/DronePositionQueriesRepository.js';
import { DronePositionCommandsRepository } from '../repo/commands/DronePositionCommandsRepository.js';

// 配置模組導入
import { createSequelizeInstance } from '../configs/dbConfig.js';
import { RabbitMQManager } from '../configs/rabbitmqConfig.js';
import { ConsulConfig } from '../configs/consulConfig.js';
import { DroneStatusQueriesRepository } from '../repo/queries/DroneStatusQueriesRepository.js';
import { DroneStatusCommandsRepository } from '../repo/commands/DroneStatusCommandsRepository.js';
import { DroneRealTimeStatusQueriesRepository } from '../repo/queries/DroneRealTimeStatusQueriesRepository.js';
import { DroneRealTimeStatusCommandsRepository } from '../repo/commands/DroneRealTimeStatusCommandsRepository.js';
import { ArchiveTaskQueriesRepository } from '../repo/queries/ArchiveTaskQueriesRepository.js';
import { ArchiveTaskCommandsRepository } from '../repo/commands/ArchiveTaskCommandsRepository.js';
import { DroneStatusArchiveQueriesRepository } from '../repo/queries/DroneStatusArchiveQueriesRepository.js';
import { DroneStatusArchiveCommandsRepository } from '../repo/commands/DroneStatusArchiveCommandsRepository.js';
import { DroneCommandQueriesRepository } from '../repo/queries/DroneCommandQueriesRepository.js';
import { DroneCommandCommandsRepository } from '../repo/commands/DroneCommandCommandsRepository.js';
import { DroneCommandsArchiveQueriesRepository } from '../repo/queries/DroneCommandsArchiveQueriesRepository.js';
import { DroneCommandsArchiveCommandsRepository } from '../repo/commands/DroneCommandsArchiveCommandsRepository.js';
import { DroneCommandQueueQueriesRepository } from '../repo/queries/DroneCommandQueueQueriesRepository.js';
import { DronePositionsArchiveQueriesRepository } from '../repo/queries/DronePositionsArchiveQueriesRepository.js';
import { DronePositionsArchiveCommandsRepository } from '../repo/commands/DronePositionsArchiveCommandsRepository.js';

// 歷史歸檔服務
import { ArchiveTaskQueriesService } from '../services/queries/ArchiveTaskQueriesService.js';
import { ArchiveTaskCommandsService } from '../services/commands/ArchiveTaskCommandsService.js';
import { DroneCommandsArchiveQueriesService } from '../services/queries/DroneCommandsArchiveQueriesService.js';
import { DroneCommandsArchiveCommandsService } from '../services/commands/DroneCommandsArchiveCommandsService.js';
import { DronePositionsArchiveQueriesService } from '../services/queries/DronePositionsArchiveQueriesService.js';
import { DronePositionsArchiveCommandsService } from '../services/commands/DronePositionsArchiveCommandsService.js';
import { DroneStatusArchiveQueriesService } from '../services/queries/DroneStatusArchiveQueriesService.js';
import { DroneStatusArchiveCommandsService } from '../services/commands/DroneStatusArchiveCommandsService.js';


// 控制器導入
import { ArchiveTaskQueriesController } from '../controllers/queries/ArchiveTaskQueriesController.js';
import { ArchiveTaskCommandsController } from '../controllers/commands/ArchiveTaskCommandsController.js';
import { DroneCommandQueriesController } from '../controllers/queries/DroneCommandQueriesController.js';
import { DroneCommandCommandsController } from '../controllers/commands/DroneCommandCommandsController.js';
import { DroneCommandQueueQueriesController } from '../controllers/queries/DroneCommandQueueQueriesController.js';
import { DroneCommandQueueCommandsController } from '../controllers/commands/DroneCommandQueueCommandsController.js';
import { DroneCommandsArchiveQueriesController } from '../controllers/queries/DroneCommandsArchiveQueriesController.js';
import { DroneCommandsArchiveCommandsController } from '../controllers/commands/DroneCommandsArchiveCommandsController.js';
import { DronePositionQueriesController } from '../controllers/queries/DronePositionQueriesController.js';
import { DronePositionCommandsController } from '../controllers/commands/DronePositionCommandsController.js';
import { DronePositionsArchiveQueriesController } from '../controllers/queries/DronePositionsArchiveQueriesController.js';
import { DronePositionsArchiveCommandsController } from '../controllers/commands/DronePositionsArchiveCommandsController.js';
import { DroneRealTimeStatusQueriesController } from '../controllers/queries/DroneRealTimeStatusQueriesController.js';
import { DroneRealTimeStatusCommandsController } from '../controllers/commands/DroneRealTimeStatusCommandsController.js';
import { DroneStatusArchiveQueriesController } from '../controllers/queries/DroneStatusArchiveQueriesController.js';
import { DroneStatusArchiveCommandsController } from '../controllers/commands/DroneStatusArchiveCommandsController.js';
import { DroneStatusQueriesController } from '../controllers/queries/DroneStatusQueriesController.js';
import { DroneStatusCommandsController } from '../controllers/commands/DroneStatusCommandsController.js';

// 路由導入
import { ArchiveTaskRoutes } from '../routes/archiveTaskRoutes.js';
import { DronePositionRoutes } from '../routes/dronePositionRoutes.js';
import { DroneStatusRoutes } from '../routes/droneStatusRoutes.js';
import { DroneCommandRoutes } from '../routes/droneCommandRoutes.js';
import { DroneRealtimeRoutes } from '../routes/droneRealtimeRoutes.js';
import { RouteRegistrar } from '../routes/index.js';
import { DroneMCPRoutes } from '../routes/mcpRoutes.js';

// 應用程式導入
import { App } from '../app.js';

/**
 * 建立和配置 IoC 容器
 * @returns 配置完成的容器實例
 */
export function createContainer(): Container {
    const container = new Container();

    // === Repositorysitorysitory 層 ===
    container.bind(TYPES.DronePositionQueriesRepo).to(DronePositionQueriesRepository).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsRepository).to(DronePositionCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneStatusQueriesRepo).to(DroneStatusQueriesRepository).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsRepository).to(DroneStatusCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusQueriesRepo).to(DroneRealTimeStatusQueriesRepository).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsRepository).to(DroneRealTimeStatusCommandsRepository).inSingletonScope();
    container.bind(TYPES.ArchiveTaskQueriesRepo).to(ArchiveTaskQueriesRepository).inSingletonScope();
    container.bind(TYPES.ArchiveTaskCommandsRepository).to(ArchiveTaskCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesRepo).to(DroneStatusArchiveQueriesRepository).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsRepository).to(DroneStatusArchiveCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneCommandQueriesRepo).to(DroneCommandQueriesRepository).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsRepository).to(DroneCommandCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesRepo).to(DroneCommandsArchiveQueriesRepository).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsRepository).to(DroneCommandsArchiveCommandsRepository).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueQueriesRepo).to(DroneCommandQueueQueriesRepository).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesRepo).to(DronePositionsArchiveQueriesRepository).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsRepository).to(DronePositionsArchiveCommandsRepository).inSingletonScope();

    // === 無人機位置服務 ===
    container.bind(TYPES.DronePositionQueriesSvc).to(DronePositionQueriesService).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsSvc).to(DronePositionCommandsService).inSingletonScope();

    // === 無人機狀態服務 ===
    container.bind(TYPES.DroneStatusQueriesSvc).to(DroneStatusQueriesService).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsSvc).to(DroneStatusCommandsService).inSingletonScope();

    // === 無人機即時狀態服務 ===
    container.bind(TYPES.DroneRealTimeStatusQueriesSvc).to(DroneRealTimeStatusQueriesService).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsSvc).to(DroneRealTimeStatusCommandsService).inSingletonScope();

    // === 無人機命令服務 ===
    container.bind(TYPES.DroneCommandQueriesSvc).to(DroneCommandQueriesService).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsSvc).to(DroneCommandCommandsService).inSingletonScope();

    // === 無人機命令佇列服務 ===
    container.bind(TYPES.DroneCommandQueueQueriesSvc).to(DroneCommandQueueQueriesService).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueCommandsSvc).to(DroneCommandQueueCommandsService).inSingletonScope();

    // === 歷史歸檔服務 ===
    container.bind(TYPES.ArchiveTaskQueriesSvc).to(ArchiveTaskQueriesService).inSingletonScope();
    container.bind(TYPES.ArchiveTaskCommandsSvc).to(ArchiveTaskCommandsService).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesSvc).to(DroneCommandsArchiveQueriesService).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsSvc).to(DroneCommandsArchiveCommandsService).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesService).to(DronePositionsArchiveQueriesService).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsService).to(DronePositionsArchiveCommandsService).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesService).to(DroneStatusArchiveQueriesService).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsService).to(DroneStatusArchiveCommandsService).inSingletonScope();

    // === 控制器層 ===
    // 查詢控制器
    container.bind(TYPES.ArchiveTaskQueriesCtrl).to(ArchiveTaskQueriesController).inSingletonScope();
    container.bind(TYPES.DroneCommandQueriesCtrl).to(DroneCommandQueriesController).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueQueriesCtrl).to(DroneCommandQueueQueriesController).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveQueriesCtrl).to(DroneCommandsArchiveQueriesController).inSingletonScope();
    container.bind(TYPES.DronePositionQueriesCtrl).to(DronePositionQueriesController).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveQueriesCtrl).to(DronePositionsArchiveQueriesController).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusQueriesCtrl).to(DroneRealTimeStatusQueriesController).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveQueriesCtrl).to(DroneStatusArchiveQueriesController).inSingletonScope();
    container.bind(TYPES.DroneStatusQueriesCtrl).to(DroneStatusQueriesController).inSingletonScope();
    
    // 命令控制器
    container.bind(TYPES.ArchiveTaskCommandsCtrl).to(ArchiveTaskCommandsController).inSingletonScope();
    container.bind(TYPES.DroneCommandCommandsCtrl).to(DroneCommandCommandsController).inSingletonScope();
    container.bind(TYPES.DroneCommandQueueCommandsCtrl).to(DroneCommandQueueCommandsController).inSingletonScope();
    container.bind(TYPES.DroneCommandsArchiveCommandsCtrl).to(DroneCommandsArchiveCommandsController).inSingletonScope();
    container.bind(TYPES.DronePositionCommandsCtrl).to(DronePositionCommandsController).inSingletonScope();
    container.bind(TYPES.DronePositionsArchiveCommandsCtrl).to(DronePositionsArchiveCommandsController).inSingletonScope();
    container.bind(TYPES.DroneRealTimeStatusCommandsCtrl).to(DroneRealTimeStatusCommandsController).inSingletonScope();
    container.bind(TYPES.DroneStatusArchiveCommandsCtrl).to(DroneStatusArchiveCommandsController).inSingletonScope();
    container.bind(TYPES.DroneStatusCommandsCtrl).to(DroneStatusCommandsController).inSingletonScope();

    // === 路由層 ===
    container.bind(TYPES.ArchiveTaskRoutes).to(ArchiveTaskRoutes).inSingletonScope();
    container.bind(TYPES.DronePositionRoutes).to(DronePositionRoutes).inSingletonScope();
    container.bind(TYPES.DroneStatusRoutes).to(DroneStatusRoutes).inSingletonScope();
    container.bind(TYPES.DroneCommandRoutes).to(DroneCommandRoutes).inSingletonScope();
    container.bind(TYPES.DroneRealtimeRoutes).to(DroneRealtimeRoutes).inSingletonScope();

    // MCP 路由
    container.bind<DroneMCPRoutes>(TYPES.DroneMCPRoutes).to(DroneMCPRoutes).inSingletonScope();
    container.bind(TYPES.RouteRegistrar).to(RouteRegistrar).inSingletonScope();

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

    // DroneHttpServer 類 - HTTP 伺服器管理（延遲綁定以避免循環依賴）
    container.bind(TYPES.DroneHttpServer).toDynamicValue(async () => {
        const { DroneHttpServer } = await import('../server.js');
        return new DroneHttpServer(container.get(TYPES.App));
    }).inSingletonScope();

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
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
import { TYPES, DroneEventType } from '../types/dependency-injection.js';
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

// 控制器導入 (TODO: 稍後實現)
// import { DronePositionQueries } from '../controllers/queries/DronePositionQueriesCtrl.js';
// import { DronePositionCommands } from '../controllers/commands/DronePositionCommandsCtrl.js';

/**
 * 建立和配置 IoC 容器
 * @returns 配置完成的容器實例
 */
export function createContainer(): Container {
    const container = new Container();

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

    // TODO: 註冊 WebSocket 服務（當實現後取消註釋）
    // container.bind(TYPES.WebSocketService).to(WebSocketService).inSingletonScope();
    // container.bind(TYPES.DronePositionEventHandler).to(DronePositionEventHandler).inSingletonScope();
    // container.bind(TYPES.DroneStatusEventHandler).to(DroneStatusEventHandler).inSingletonScope();
    // container.bind(TYPES.DroneCommandEventHandler).to(DroneCommandEventHandler).inSingletonScope();

    return container;
}

// 匯出容器實例
export const container = createContainer();
/**
 * @fileoverview IoC 容器配置
 * 
 * 配置 InversifyJS 容器，註冊所有服務依賴，
 * 實現自動依賴注入和生命週期管理
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES, DroneEventType } from '../container/types.js';
import type {
  IDroneEventHandler,
  IWebSocketService,
  IWebSocketAuthMiddleware
} from '../types/container/websocket-interfaces.js';

// 服務實現導入
// DroneCommandService has been refactored to CQRS pattern
import { DronePositionQueriesSvc } from '../services/queries/DronePositionQueriesSvc.js';
import { DronePositionCommandsSvc } from '../services/commands/DronePositionCommandsSvc.js';
import { DroneRealTimeStatusQueriesSvc } from '../services/queries/DroneRealTimeStatusQueriesSvc.js';
import { DroneRealTimeStatusCommandsSvc } from '../services/commands/DroneRealTimeStatusCommandsSvc.js';
import { WebSocketService } from '../configs/websocket/service.js';
import { WebSocketAuthMiddleware } from '../middlewares/WebSocketAuthMiddleware.js';
import { DronePositionEventHandler } from '../websocket/DronePositionEventHandler.js';
import { DroneStatusEventHandler } from '../websocket/DroneStatusEventHandler.js';
import { DroneCommandEventHandler } from '../websocket/DroneCommandEventHandler.js';

// CQRS Commands Services
import { ArchiveTaskCommandsSvc } from '../services/commands/ArchiveTaskCommandsSvc.js';
import { AuthCommandsSvc } from '../services/commands/AuthCommandsSvc.js';
import { DroneCommandCommandsSvc } from '../services/commands/DroneCommandCommandsSvc.js';
import { DroneStatusCommandsSvc } from '../services/commands/DroneStatusCommandsSvc.js';
import { DroneCommandQueueCommandsSvc } from '../services/commands/DroneCommandQueueCommandsSvc.js';
import { DroneCommandsArchiveCommandsSvc } from '../services/commands/DroneCommandsArchiveCommandsSvc.js';
import { DronePositionsArchiveCommandsSvc } from '../services/commands/DronePositionsArchiveCommandsSvc.js';
import { DroneStatusArchiveCommandsSvc } from '../services/commands/DroneStatusArchiveCommandsSvc.js';
import { PermissionCommandsSvc } from '../services/commands/PermissionCommandsSvc.js';
import { RoleCommandsSvc } from '../services/commands/RoleCommandsSvc.js';
import { RoleToPermissionCommandsSvc } from '../services/commands/RoleToPermissionCommandsSvc.js';
import { UserCommandsSvc } from '../services/commands/UserCommandsSvc.js';
import { UserToRoleCommandsSvc } from '../services/commands/UserToRoleCommandsSvc.js';

// CQRS Queries Services
import { ArchiveTaskQueriesSvc } from '../services/queries/ArchiveTaskQueriesSvc.js';
import { AuthQueriesSvc } from '../services/queries/AuthQueriesSvc.js';
import { SessionQueriesSvc } from '../services/queries/SessionQueriesSvc.js';
import { DroneCommandQueriesSvc } from '../services/queries/DroneCommandQueriesSvc.js';
import { DroneStatusQueriesSvc } from '../services/queries/DroneStatusQueriesSvc.js';
import { DroneCommandQueueQueriesSvc } from '../services/queries/DroneCommandQueueQueriesSvc.js';
import { DroneCommandsArchiveQueriesSvc } from '../services/queries/DroneCommandsArchiveQueriesSvc.js';
import { DronePositionsArchiveQueriesSvc } from '../services/queries/DronePositionsArchiveQueriesSvc.js';
import { DroneStatusArchiveQueriesSvc } from '../services/queries/DroneStatusArchiveQueriesSvc.js';
import { PermissionQueriesSvc } from '../services/queries/PermissionQueriesSvc.js';
import { RoleQueriesSvc } from '../services/queries/RoleQueriesSvc.js';
import { RoleToPermissionQueriesSvc } from '../services/queries/RoleToPermissionQueriesSvc.js';
import { UserQueriesSvc } from '../services/queries/UserQueriesSvc.js';
import { UserToRoleQueriesSvc } from '../services/queries/UserToRoleQueriesSvc.js';

// Commands Controllers
import { ArchiveTaskCommands } from '../controllers/commands/ArchiveTaskCommandsCtrl.js';
import { AuthCommands } from '../controllers/commands/AuthCommandsCtrl.js';
import { DroneCommandCommands } from '../controllers/commands/DroneCommandCommandsCtrl.js';
import { DronePositionCommands } from '../controllers/commands/DronePositionCommandsCtrl.js';
import { DroneStatusCommands } from '../controllers/commands/DroneStatusCommandsCtrl.js';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl.js';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl.js';
import { UserCommands } from '../controllers/commands/UserCommandsCtrl.js';

// Queries Controllers
import { ArchiveTaskQueries } from '../controllers/queries/ArchiveTaskQueriesCtrl.js';
import { AuthQueries } from '../controllers/queries/AuthQueriesCtrl.js';
import { DroneCommandQueries } from '../controllers/queries/DroneCommandQueriesCtrl.js';
import { DroneCommandQueueQueries } from '../controllers/queries/DroneCommandQueueQueriesCtrl.js';
import { DroneCommandsArchiveQueries } from '../controllers/queries/DroneCommandsArchiveQueriesCtrl.js';
import { DronePositionQueries } from '../controllers/queries/DronePositionQueriesCtrl.js';
import { DronePositionsArchiveQueries } from '../controllers/queries/DronePositionsArchiveQueriesCtrl.js';
import { DroneRealTimeStatusQueries } from '../controllers/queries/DroneRealTimeStatusQueriesCtrl.js';
import { DroneStatusQueries } from '../controllers/queries/DroneStatusQueriesCtrl.js';
import { DroneStatusArchiveQueries } from '../controllers/queries/DroneStatusArchiveQueriesCtrl.js';
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl.js';
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl.js';
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';
import { UserQueries } from '../controllers/queries/UserQueriesCtrl.js';
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl.js';

/**
 * 創建並配置 IoC 容器
 * 
 * 邏輯執行順序：
 * 1. 創建容器實例
 * 2. 註冊業務服務（CQRS 模式：HTTP API 用的查詢和命令分離）
 * 3. 註冊 WebSocket 基礎設施服務
 * 4. 註冊事件處理器（WebSocket 事件處理）
 * 5. 配置工廠模式（動態創建事件處理器）
 * 6. 返回配置完成的容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  // 步驟 1：創建 InversifyJS 容器實例
  const container = new Container();

  // ===== 步驟 2：業務服務註冊（CQRS 模式 - HTTP API 層）=====
  // 
  // 註冊順序說明：
  // 2.1 查詢服務（Queries）- 處理 HTTP GET 請求的數據讀取操作
  // 2.2 命令服務（Commands）- 處理 HTTP POST/PUT/DELETE 請求的數據寫入操作
  // 
  // Named Binding 概念：
  // - 使用 TYPES 中定義的 Symbol 作為服務的唯一識別符
  // - 避免字串識別符的拼寫錯誤和重複問題
  // - 提供型別安全的依賴注入
  // 
  // DroneCommandService 已重構為 CQRS 模式
  // HTTP API 的查詢和命令現在由分離的服務處理

  // 步驟 2.1：註冊查詢服務（Queries）- 使用 Factory Provider
  /**
   * 無人機位置查詢服務工廠 - Factory Provider
   * 
   * Factory Provider 優勢：
   * - 支援未來多個實現（DEFAULT, CACHED, DISTRIBUTED）
   * - 運行時動態選擇實現
   * - 更好的可擴展性和測試性
   */
  container.bind<DronePositionQueriesSvc>(TYPES.DronePositionQueriesSvc)
    .to(DronePositionQueriesSvc)
    .inSingletonScope();

  container.bind<() => DronePositionQueriesSvc>(TYPES.DronePositionQueriesFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<DronePositionQueriesSvc>(TYPES.DronePositionQueriesSvc);
      };
    });

  // 步驟 2.2：註冊命令服務（Commands）- 使用 Factory Provider
  /**
   * 無人機位置命令服務工廠 - Factory Provider
   * 
   * Factory Provider 優勢：
   * - 支援未來多個實現（DEFAULT, CACHED, DISTRIBUTED）
   * - 運行時動態選擇實現
   * - 更好的可擴展性和測試性
   */
  container.bind<DronePositionCommandsSvc>(TYPES.DronePositionCommandsSvc)
    .to(DronePositionCommandsSvc)
    .inSingletonScope();

  container.bind<() => DronePositionCommandsSvc>(TYPES.DronePositionCommandsFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<DronePositionCommandsSvc>(TYPES.DronePositionCommandsSvc);
      };
    });

  // 繼續註冊狀態查詢服務 - 使用 Factory Provider
  /**
   * 無人機狀態查詢服務工廠 - Factory Provider
   * 
   * 支援未來的多種實現：
   * - DEFAULT_STATUS: 標準狀態查詢
   * - CACHED_STATUS: 帶快取的狀態查詢
   * - REAL_TIME_STATUS: 即時狀態查詢
   */
  container.bind<DroneRealTimeStatusQueriesSvc>(TYPES.DroneStatusQueriesService)
    .to(DroneRealTimeStatusQueriesSvc)
    .inSingletonScope();

  container.bind<() => DroneRealTimeStatusQueriesSvc>(TYPES.DroneStatusQueriesFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<DroneRealTimeStatusQueriesSvc>(TYPES.DroneStatusQueriesService);
      };
    });

  // 繼續註冊狀態命令服務 - 使用 Factory Provider
  /**
   * 無人機狀態命令服務工廠 - Factory Provider
   * 
   * 支援未來的多種實現：
   * - DEFAULT_STATUS: 標準狀態命令
   * - CACHED_STATUS: 帶快取的狀態命令
   * - REAL_TIME_STATUS: 即時狀態命令
   */
  container.bind<DroneRealTimeStatusCommandsSvc>(TYPES.DroneStatusCommandsService)
    .to(DroneRealTimeStatusCommandsSvc)
    .inSingletonScope();

  container.bind<() => DroneRealTimeStatusCommandsSvc>(TYPES.DroneStatusCommandsFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<DroneRealTimeStatusCommandsSvc>(TYPES.DroneStatusCommandsService);
      };
    });

  // ===== 步驟 2.3：註冊其他 CQRS 服務 =====
  
  // 歸檔任務服務
  container.bind<ArchiveTaskCommandsSvc>(TYPES.ArchiveTaskCommandsSvc)
    .to(ArchiveTaskCommandsSvc)
    .inSingletonScope();

  container.bind<ArchiveTaskQueriesSvc>(TYPES.ArchiveTaskQueriesSvc)
    .to(ArchiveTaskQueriesSvc)
    .inSingletonScope();

  // 認證服務
  container.bind<AuthCommandsSvc>(TYPES.AuthCommandsSvc)
    .to(AuthCommandsSvc)
    .inSingletonScope();

  container.bind<AuthQueriesSvc>(TYPES.AuthQueriesSvc)
    .to(AuthQueriesSvc)
    .inSingletonScope();

  container.bind<SessionQueriesSvc>(TYPES.SessionQueriesSvc)
    .to(SessionQueriesSvc)
    .inSingletonScope();

  // 無人機命令服務
  container.bind<DroneCommandCommandsSvc>(TYPES.DroneCommandCommandsSvc)
    .to(DroneCommandCommandsSvc)
    .inSingletonScope();

  container.bind<DroneCommandQueriesSvc>(TYPES.DroneCommandQueriesSvc)
    .to(DroneCommandQueriesSvc)
    .inSingletonScope();

  // 無人機狀態服務
  container.bind<DroneStatusCommandsSvc>(TYPES.DroneStatusCommandsSvc)
    .to(DroneStatusCommandsSvc)
    .inSingletonScope();

  container.bind<DroneStatusQueriesSvc>(TYPES.DroneStatusQueriesSvc)
    .to(DroneStatusQueriesSvc)
    .inSingletonScope();

  // 所有其他 CQRS 服務
  container.bind<DroneCommandQueueCommandsSvc>(TYPES.DroneCommandQueueCommandsSvc)
    .to(DroneCommandQueueCommandsSvc)
    .inSingletonScope();

  container.bind<DroneCommandQueueQueriesSvc>(TYPES.DroneCommandQueueQueriesSvc)
    .to(DroneCommandQueueQueriesSvc)
    .inSingletonScope();

  container.bind<DroneCommandsArchiveCommandsSvc>(TYPES.DroneCommandsArchiveCommandsSvc)
    .to(DroneCommandsArchiveCommandsSvc)
    .inSingletonScope();

  container.bind<DroneCommandsArchiveQueriesSvc>(TYPES.DroneCommandsArchiveQueriesSvc)
    .to(DroneCommandsArchiveQueriesSvc)
    .inSingletonScope();

  container.bind<DronePositionsArchiveCommandsSvc>(TYPES.DronePositionsArchiveCommandsSvc)
    .to(DronePositionsArchiveCommandsSvc)
    .inSingletonScope();

  container.bind<DronePositionsArchiveQueriesSvc>(TYPES.DronePositionsArchiveQueriesSvc)
    .to(DronePositionsArchiveQueriesSvc)
    .inSingletonScope();

  container.bind<DroneStatusArchiveCommandsSvc>(TYPES.DroneStatusArchiveCommandsSvc)
    .to(DroneStatusArchiveCommandsSvc)
    .inSingletonScope();

  container.bind<DroneStatusArchiveQueriesSvc>(TYPES.DroneStatusArchiveQueriesSvc)
    .to(DroneStatusArchiveQueriesSvc)
    .inSingletonScope();

  container.bind<PermissionCommandsSvc>(TYPES.PermissionCommandsSvc)
    .to(PermissionCommandsSvc)
    .inSingletonScope();

  container.bind<PermissionQueriesSvc>(TYPES.PermissionQueriesSvc)
    .to(PermissionQueriesSvc)
    .inSingletonScope();

  container.bind<RoleCommandsSvc>(TYPES.RoleCommandsSvc)
    .to(RoleCommandsSvc)
    .inSingletonScope();

  container.bind<RoleQueriesSvc>(TYPES.RoleQueriesSvc)
    .to(RoleQueriesSvc)
    .inSingletonScope();

  container.bind<RoleToPermissionCommandsSvc>(TYPES.RoleToPermissionCommandsSvc)
    .to(RoleToPermissionCommandsSvc)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesSvc>(TYPES.RoleToPermissionQueriesSvc)
    .to(RoleToPermissionQueriesSvc)
    .inSingletonScope();

  container.bind<UserCommandsSvc>(TYPES.UserCommandsSvc)
    .to(UserCommandsSvc)
    .inSingletonScope();

  container.bind<UserQueriesSvc>(TYPES.UserQueriesSvc)
    .to(UserQueriesSvc)
    .inSingletonScope();

  container.bind<UserToRoleCommandsSvc>(TYPES.UserToRoleCommandsSvc)
    .to(UserToRoleCommandsSvc)
    .inSingletonScope();

  container.bind<UserToRoleQueriesSvc>(TYPES.UserToRoleQueriesSvc)
    .to(UserToRoleQueriesSvc)
    .inSingletonScope();

  // ===== 步驟 2.4：註冊控制器 =====
  
  // 命令控制器
  container.bind<ArchiveTaskCommands>(TYPES.ArchiveTaskCommandsCtrl)
    .to(ArchiveTaskCommands)
    .inSingletonScope();

  container.bind<AuthCommands>(TYPES.AuthCommandsCtrl)
    .to(AuthCommands)
    .inSingletonScope();

  container.bind<DroneCommandCommands>(TYPES.DroneCommandCommandsCtrl)
    .to(DroneCommandCommands)
    .inSingletonScope();

  container.bind<DronePositionCommands>(TYPES.DronePositionCommandsCtrl)
    .to(DronePositionCommands)
    .inSingletonScope();

  container.bind<DroneStatusCommands>(TYPES.DroneStatusCommandsCtrl)
    .to(DroneStatusCommands)
    .inSingletonScope();

  container.bind<PermissionCommands>(TYPES.PermissionCommandsCtrl)
    .to(PermissionCommands)
    .inSingletonScope();

  container.bind<RoleCommands>(TYPES.RoleCommandsCtrl)
    .to(RoleCommands)
    .inSingletonScope();

  container.bind<UserCommands>(TYPES.UserCommandsCtrl)
    .to(UserCommands)
    .inSingletonScope();

  // 查詢控制器
  container.bind<ArchiveTaskQueries>(TYPES.ArchiveTaskQueriesCtrl)
    .to(ArchiveTaskQueries)
    .inSingletonScope();

  container.bind<AuthQueries>(TYPES.AuthQueriesCtrl)
    .to(AuthQueries)
    .inSingletonScope();

  container.bind<DroneCommandQueries>(TYPES.DroneCommandQueriesCtrl)
    .to(DroneCommandQueries)
    .inSingletonScope();

  container.bind<DroneCommandQueueQueries>(TYPES.DroneCommandQueueQueriesCtrl)
    .to(DroneCommandQueueQueries)
    .inSingletonScope();

  container.bind<DroneCommandsArchiveQueries>(TYPES.DroneCommandsArchiveQueriesCtrl)
    .to(DroneCommandsArchiveQueries)
    .inSingletonScope();

  container.bind<DronePositionQueries>(TYPES.DronePositionQueriesCtrl)
    .to(DronePositionQueries)
    .inSingletonScope();

  container.bind<DronePositionsArchiveQueries>(TYPES.DronePositionsArchiveQueriesCtrl)
    .to(DronePositionsArchiveQueries)
    .inSingletonScope();

  container.bind<DroneRealTimeStatusQueries>(TYPES.DroneRealTimeStatusQueriesCtrl)
    .to(DroneRealTimeStatusQueries)
    .inSingletonScope();

  container.bind<DroneStatusQueries>(TYPES.DroneStatusQueriesCtrl)
    .to(DroneStatusQueries)
    .inSingletonScope();

  container.bind<DroneStatusArchiveQueries>(TYPES.DroneStatusArchiveQueriesCtrl)
    .to(DroneStatusArchiveQueries)
    .inSingletonScope();

  container.bind<PermissionQueries>(TYPES.PermissionQueriesCtrl)
    .to(PermissionQueries)
    .inSingletonScope();

  container.bind<RoleQueries>(TYPES.RoleQueriesCtrl)
    .to(RoleQueries)
    .inSingletonScope();

  container.bind<RoleToPermissionQueries>(TYPES.RoleToPermissionQueriesCtrl)
    .to(RoleToPermissionQueries)
    .inSingletonScope();

  container.bind<UserQueries>(TYPES.UserQueriesCtrl)
    .to(UserQueries)
    .inSingletonScope();

  container.bind<UserToRoleQueries>(TYPES.UserToRoleQueriesCtrl)
    .to(UserToRoleQueries)
    .inSingletonScope();

  // 注意：DroneStatusService 已重構為 CQRS 模式，舊的服務已移除
  // 如需舊的相容性介面，請使用 DroneStatusQueriesService 和 DroneStatusCommandsService

  // ===== 步驟 3：註冊 WebSocket 基礎設施服務 =====
  //
  // 註冊順序說明：
  // 3.1 WebSocket 核心服務
  // 3.2 WebSocket 認證中間件

  // 步驟 3.1：註冊 WebSocket 核心服務 - 使用 Factory Provider
  /**
   * WebSocket 服務工廠 - Factory Provider
   * 整個應用共享一個 WebSocket 服務實例
   */
  container.bind<IWebSocketService>(TYPES.WebSocketService)
    .to(WebSocketService)
    .inSingletonScope();

  container.bind<() => IWebSocketService>(TYPES.WebSocketServiceFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<IWebSocketService>(TYPES.WebSocketService);
      };
    });

  // 步驟 3.2：註冊 WebSocket 認證中間件 - 使用 Factory Provider
  /**
   * WebSocket 認證中間件工廠 - Factory Provider
   * 共享認證邏輯和配置
   */
  container.bind<IWebSocketAuthMiddleware>(TYPES.WebSocketAuthMiddleware)
    .to(WebSocketAuthMiddleware)
    .inSingletonScope();

  container.bind<() => IWebSocketAuthMiddleware>(TYPES.WebSocketAuthMiddlewareFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<IWebSocketAuthMiddleware>(TYPES.WebSocketAuthMiddleware);
      };
    });

  // ===== 步驟 4：註冊事件處理器（WebSocket 事件處理層）=====
  //
  // 註冊順序說明：
  // 4.1 無人機位置事件處理器（處理 WebSocket 位置事件）
  // 4.2 無人機狀態事件處理器（處理 WebSocket 狀態事件）
  // 4.3 無人機命令事件處理器（處理 WebSocket 命令事件）

  // 步驟 4.1：註冊位置事件處理器 - 使用 Factory Provider
  /**
   * 無人機位置事件處理器工廠 - Factory Provider
   * 共享訂閱狀態和統計信息
   */
  container.bind<IDroneEventHandler>(TYPES.DronePositionEventHandler)
    .to(DronePositionEventHandler)
    .inSingletonScope();

  container.bind<() => IDroneEventHandler>(TYPES.DronePositionEventHandlerFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<IDroneEventHandler>(TYPES.DronePositionEventHandler);
      };
    });

  // 步驟 4.2：註冊狀態事件處理器 - 使用 Factory Provider
  /**
   * 無人機狀態事件處理器工廠 - Factory Provider
   * 共享訂閱狀態和統計信息
   */
  container.bind<IDroneEventHandler>(TYPES.DroneStatusEventHandler)
    .to(DroneStatusEventHandler)
    .inSingletonScope();

  container.bind<() => IDroneEventHandler>(TYPES.DroneStatusEventHandlerFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<IDroneEventHandler>(TYPES.DroneStatusEventHandler);
      };
    });

  // 步驟 4.3：註冊命令事件處理器 - 使用 Factory Provider
  /**
   * 無人機命令事件處理器工廠 - Factory Provider
   * 共享命令執行統計和狀態
   */
  container.bind<IDroneEventHandler>(TYPES.DroneCommandEventHandler)
    .to(DroneCommandEventHandler)
    .inSingletonScope();

  container.bind<() => IDroneEventHandler>(TYPES.DroneCommandEventHandlerFactory)
    .toFactory((_context) => {
      return () => {
        // 目前只有一個實現，未來可以根據需求擴展
        return container.get<IDroneEventHandler>(TYPES.DroneCommandEventHandler);
      };
    });

  // ===== 步驟 5：配置工廠模式（動態創建事件處理器）=====
  //
  // Factory Provider 模式說明：
  // 5.1 使用 .toFactory() 註冊工廠函數（不是具體實例）
  // 5.2 工廠函數返回另一個函數，實現參數化實例創建
  // 5.3 內部使用 switch-case 實現策略模式選擇
  // 5.4 提供錯誤處理機制（不支援的事件類型）
  //
  // 與 Named Binding 的區別：
  // - Named Binding: container.bind(TYPES.Service).to(ServiceClass)
  // - Factory Provider: container.bind(TYPES.Factory).toFactory(() => factoryFunction)

  // 步驟 5.1-5.3：註冊事件處理器工廠 - Factory Provider 模式
  /**
   * 無人機事件處理器工廠提供者 - Factory Provider
   * 
   * Factory Provider 概念：
   * - 不直接綁定具體實例，而是綁定一個工廠函數
   * - 工廠函數根據輸入參數動態決定返回哪個實例
   * - 實現策略模式：根據 eventType 選擇對應的處理器
   * - 延遲實例化：只有在需要時才創建實例
   */
  container.bind<(type: DroneEventType) => IDroneEventHandler>(TYPES.DroneEventHandlerFactory)
    .toFactory((_context) => {
      return (eventType: DroneEventType) => {
        // 根據事件類型動態選擇處理器
        switch (eventType) {
          case DroneEventType.POSITION:
            // 返回位置事件處理器
            return container.get<IDroneEventHandler>(TYPES.DronePositionEventHandler);
          case DroneEventType.STATUS:
            // 返回狀態事件處理器
            return container.get<IDroneEventHandler>(TYPES.DroneStatusEventHandler);
          case DroneEventType.COMMAND:
            // 返回命令事件處理器
            return container.get<IDroneEventHandler>(TYPES.DroneCommandEventHandler);
          default:
            // 錯誤處理：不支援的事件類型
            throw new Error(`Unsupported drone event type: ${eventType}`);
        }
      };
    });

  // 步驟 6：完成容器配置並返回
  console.log('✅ IoC Container configured with all services');
  
  return container;
}

/**
 * 全域容器實例
 * 整個應用使用同一個容器實例
 * 
 * 執行時機：模組載入時立即執行 createContainer() 函數
 */
export const container = createContainer();

/**
 * 容器工具函數
 * 
 * 提供便利的靜態方法來操作容器：
 * - get: 獲取服務實例
 * - isBound: 檢查服務是否已註冊
 * - rebind: 重新綁定服務（測試用）
 * - getContainerStats: 獲取容器統計信息
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
   * 重新綁定服務（主要用於測試）
   * 
   * @template T 服務類型
   * @param {symbol} serviceId 服務識別符
   * @param {T} instance 新的服務實例
   */
  static rebind<T>(serviceId: symbol, instance: T): void {
    if (container.isBound(serviceId)) {
      container.unbind(serviceId);
    }
    container.bind<T>(serviceId).toConstantValue(instance);
  }

  /**
   * 獲取位置查詢服務（透過工廠）
   * 
   * @returns {DronePositionQueriesSvc} 位置查詢服務實例
   */
  static getDronePositionQueries(): DronePositionQueriesSvc {
    const factory = container.get<() => DronePositionQueriesSvc>(TYPES.DronePositionQueriesFactory);
    return factory();
  }

  /**
   * 獲取位置命令服務（透過工廠）
   * 
   * @returns {DronePositionCommandsSvc} 位置命令服務實例
   */
  static getDronePositionCommands(): DronePositionCommandsSvc {
    const factory = container.get<() => DronePositionCommandsSvc>(TYPES.DronePositionCommandsFactory);
    return factory();
  }

  /**
   * 獲取狀態查詢服務（透過工廠）
   * 
   * @returns {DroneRealTimeStatusQueriesSvc} 狀態查詢服務實例
   */
  static getDroneStatusQueries(): DroneRealTimeStatusQueriesSvc {
    const factory = container.get<() => DroneRealTimeStatusQueriesSvc>(TYPES.DroneStatusQueriesFactory);
    return factory();
  }

  /**
   * 獲取狀態命令服務（透過工廠）
   * 
   * @returns {DroneRealTimeStatusCommandsSvc} 狀態命令服務實例
   */
  static getDroneStatusCommands(): DroneRealTimeStatusCommandsSvc {
    const factory = container.get<() => DroneRealTimeStatusCommandsSvc>(TYPES.DroneStatusCommandsFactory);
    return factory();
  }

  /**
   * 獲取 WebSocket 服務（透過工廠）
   * 
   * @returns {IWebSocketService} WebSocket 服務實例
   */
  static getWebSocketService(): IWebSocketService {
    const factory = container.get<() => IWebSocketService>(TYPES.WebSocketServiceFactory);
    return factory();
  }

  /**
   * 獲取 WebSocket 認證中間件（透過工廠）
   * 
   * @returns {IWebSocketAuthMiddleware} WebSocket 認證中間件實例
   */
  static getWebSocketAuthMiddleware(): IWebSocketAuthMiddleware {
    const factory = container.get<() => IWebSocketAuthMiddleware>(TYPES.WebSocketAuthMiddlewareFactory);
    return factory();
  }

  /**
   * 獲取位置事件處理器（透過工廠）
   * 
   * @returns {IDroneEventHandler} 位置事件處理器實例
   */
  static getDronePositionEventHandler(): IDroneEventHandler {
    const factory = container.get<() => IDroneEventHandler>(TYPES.DronePositionEventHandlerFactory);
    return factory();
  }

  /**
   * 獲取狀態事件處理器（透過工廠）
   * 
   * @returns {IDroneEventHandler} 狀態事件處理器實例
   */
  static getDroneStatusEventHandler(): IDroneEventHandler {
    const factory = container.get<() => IDroneEventHandler>(TYPES.DroneStatusEventHandlerFactory);
    return factory();
  }

  /**
   * 獲取命令事件處理器（透過工廠）
   * 
   * @returns {IDroneEventHandler} 命令事件處理器實例
   */
  static getDroneCommandEventHandler(): IDroneEventHandler {
    const factory = container.get<() => IDroneEventHandler>(TYPES.DroneCommandEventHandlerFactory);
    return factory();
  }

  /**
   * 獲取容器統計信息
   * 
   * @returns {object} 容器統計信息
   */
  static getContainerStats(): object {
    // InversifyJS 沒有內建統計 API，這裡返回基本信息
    return {
      timestamp: new Date().toISOString(),
      registeredServices: Object.keys(TYPES).length,
      containerCreated: true,
      factoryServicesAvailable: [
        'DronePositionQueries',
        'DronePositionCommands', 
        'DroneStatusQueries',
        'DroneStatusCommands',
        'WebSocketService',
        'WebSocketAuthMiddleware',
        'DronePositionEventHandler',
        'DroneStatusEventHandler',
        'DroneCommandEventHandler'
      ]
    };
  }
}
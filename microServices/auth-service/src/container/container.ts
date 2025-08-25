/**
 * @fileoverview Auth 服務的 IoC 容器配置
 * 
 * 簡化版本，只包含認證相關的服務和控制器
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../container/types.js';

// 認證服務
import { AuthCommandsService } from '../services/commands/AuthCommandsService.js';
import { AuthQueriesService } from '../services/queries/AuthQueriesService.js';
import { SessionQueriesService } from '../services/queries/SessionQueriesService.js';

// 認證控制器
import { AuthCommandsController } from '../controllers/commands/AuthCommandsCtrl.js';
import { AuthQueriesController } from '../controllers/queries/AuthQueriesCtrl.js';

// gRPC 和路由服務
import { AuthGrpcServer } from '../grpc/authGrpcServer.js';
import { AuthRoutes } from '../routes/authRoutes.js';
import { RouteRegistrar } from '../routes/index.js';
import { AuthMCPRoutes } from '../routes/mcpRoutes.js';

// JWT 安全服務 - 已移除，由 API Gateway 統一處理
// import { JwtBlacklistService } from 'aiot-shared-packages';

/**
 * 創建並配置 Auth 服務的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container();

  // ===== 認證服務註冊 =====
  
  // 認證服務
  container.bind<AuthCommandsService>(TYPES.AuthCommandsService)
    .to(AuthCommandsService)
    .inSingletonScope();
  // 說明: 註冊認證命令服務為 singleton，供全域注入使用
  
  container.bind<AuthQueriesService>(TYPES.AuthQueriesService)
    .to(AuthQueriesService)
    .inSingletonScope();
  // 說明: 查詢服務同樣以 singleton 註冊，避免多次建立 DB 連線
    
  container.bind<SessionQueriesService>(TYPES.SessionQueriesService)
    .to(SessionQueriesService)
    .inSingletonScope();
  // 說明: 會話查詢服務，用於驗證與查詢 session 資訊

  // 說明: JWT 黑名單服務不使用 DI，直接在 middleware 中實例化

  // ===== 認證控制器註冊 =====
  
  // 認證控制器
  container.bind<AuthCommandsController>(TYPES.AuthCommandsController)
    .to(AuthCommandsController)
    .inSingletonScope();
  
  container.bind<AuthQueriesController>(TYPES.AuthQueriesController)
    .to(AuthQueriesController)
    .inSingletonScope();

  // ===== gRPC 和路由服務註冊 =====
  
  // Auth gRPC 服務器
  container.bind<AuthGrpcServer>(TYPES.AuthGrpcServer)
    .to(AuthGrpcServer)
    .inSingletonScope();
  
  // Auth 路由
  container.bind<AuthRoutes>(TYPES.AuthRoutes)
    .to(AuthRoutes)
    .inSingletonScope();

  // MCP 路由
  container.bind<AuthMCPRoutes>(TYPES.AuthMCPRoutes)
    .to(AuthMCPRoutes)
    .inSingletonScope();
  
  // 路由註冊器
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
    .to(RouteRegistrar)
    .inSingletonScope();

  console.log('✅ Auth IoC Container configured with authentication services only');
  
  return container;
}

/**
 * 全域容器實例
 */
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
}
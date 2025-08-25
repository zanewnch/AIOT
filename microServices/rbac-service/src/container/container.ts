/**
 * @fileoverview RBAC 服務的 IoC 容器配置
 * 
 * 簡化版本，只包含 RBAC 相關的服務和控制器
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../container/types.js';

// RBAC 認證服務
import { UserCommandsService } from '../services/commands/UserCommandsService.js';
import { UserQueriesService } from '../services/queries/UserQueriesService.js';
import { RoleCommandsService } from '../services/commands/RoleCommandsService.js';
import { RoleQueriesService } from '../services/queries/RoleQueriesService.js';
import { PermissionCommandsService } from '../services/commands/PermissionCommandsService.js';
import { PermissionQueriesService } from '../services/queries/PermissionQueriesService.js';
import { UserToRoleCommandsService } from '../services/commands/UserToRoleCommandsService.js';
import { UserToRoleQueriesService } from '../services/queries/UserToRoleQueriesService.js';
import { RoleToPermissionCommandsService } from '../services/commands/RoleToPermissionCommandsService.js';
import { RoleToPermissionQueriesService } from '../services/queries/RoleToPermissionQueriesService.js';
import { SessionQueriesService } from '../services/queries/SessionQueriesService.js';

// RBAC 控制器
import { UserCommandsController } from '../controllers/commands/UserCommandsController.js';
import { UserQueriesController } from '../controllers/queries/UserQueriesController.js';
import { RoleCommandsController } from '../controllers/commands/RoleCommandsController.js';
import { RoleQueriesController } from '../controllers/queries/RoleQueriesController.js';
import { PermissionCommandsController } from '../controllers/commands/PermissionCommandsController.js';
import { PermissionQueriesController } from '../controllers/queries/PermissionQueriesController.js';
import { UserToRoleCommandsController } from '../controllers/commands/UserToRoleCommandsController.js';
import { UserToRoleQueriesController } from '../controllers/queries/UserToRoleQueriesController.js';
import { RoleToPermissionCommandsController } from '../controllers/commands/RoleToPermissionCommandsController.js';
import { RoleToPermissionQueriesController } from '../controllers/queries/RoleToPermissionQueriesController.js';

// JWT 安全服務
// import { JwtBlacklistService } from 'aiot-shared-packages';

// Repository 導入
import { UserQueriesRepository } from '../repo/queries/UserQueriesRepository.js';
import { PermissionQueriesRepository } from '../repo/queries/PermissionQueriesRepository.js';
import { RoleQueriesRepository } from '../repo/queries/RoleQueriesRepository.js';
import { UserRoleQueriesRepository } from '../repo/queries/UserRoleQueriesRepository.js';
import { RolePermissionQueriesRepository } from '../repo/queries/RolePermissionQueriesRepository.js';
import { UserCommandsRepository } from '../repo/commands/UserCommandsRepository.js';
import { PermissionCommandsRepository } from '../repo/commands/PermissionCommandsRepository.js';
import { RoleCommandsRepository } from '../repo/commands/RoleCommandsRepository.js';
import { UserRoleCommandsRepository } from '../repo/commands/UserRoleCommandsRepository.js';
import { RolePermissionCommandsRepository } from '../repo/commands/RolePermissionCommandsRepository.js';

// 路由相關導入
import { RouteRegistrar } from '../routes/RouteRegistrar.js';
import { createRbacRouter } from '../routes/rbacRoutes.js';
import docsRoutes from '../routes/docsRoutes.js';
import { RBACMCPRoutes } from '../routes/mcpRoutes.js';

/**
 * 創建並配置 RBAC 服務的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container();

  // ===== RBAC 服務註冊 =====
  
  // 用戶服務
  container.bind<UserCommandsService>(TYPES.UserCommandsService)
    .to(UserCommandsService)
    .inSingletonScope();

  container.bind<UserQueriesService>(TYPES.UserQueriesService)
    .to(UserQueriesService)
    .inSingletonScope();

  // 角色服務
  container.bind<RoleCommandsService>(TYPES.RoleCommandsService)
    .to(RoleCommandsService)
    .inSingletonScope();

  container.bind<RoleQueriesService>(TYPES.RoleQueriesService)
    .to(RoleQueriesService)
    .inSingletonScope();

  // 權限服務
  container.bind<PermissionCommandsService>(TYPES.PermissionCommandsService)
    .to(PermissionCommandsService)
    .inSingletonScope();

  container.bind<PermissionQueriesService>(TYPES.PermissionQueriesService)
    .to(PermissionQueriesService)
    .inSingletonScope();

  // 用戶角色關聯服務
  container.bind<UserToRoleCommandsService>(TYPES.UserToRoleCommandsService)
    .to(UserToRoleCommandsService)
    .inSingletonScope();

  container.bind<UserToRoleQueriesService>(TYPES.UserToRoleQueriesService)
    .to(UserToRoleQueriesService)
    .inSingletonScope();

  // 角色權限關聯服務
  container.bind<RoleToPermissionCommandsService>(TYPES.RoleToPermissionCommandsService)
    .to(RoleToPermissionCommandsService)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesService>(TYPES.RoleToPermissionQueriesService)
    .to(RoleToPermissionQueriesService)
    .inSingletonScope();

    
  container.bind<SessionQueriesService>(TYPES.SessionQueriesService)
    .to(SessionQueriesService)
    .inSingletonScope();

  // JWT 安全服務
//   container.bind<JwtBlacklistService>(TYPES.JwtBlacklistService)
//     .to(JwtBlacklistService)
//     .inSingletonScope();

  // ===== RBAC 控制器註冊 =====
  
  // 用戶控制器
  container.bind<UserCommandsController>(TYPES.UserCommandsController)
    .to(UserCommandsController)
    .inSingletonScope();

  container.bind<UserQueriesController>(TYPES.UserQueriesController)
    .to(UserQueriesController)
    .inSingletonScope();

  // 角色控制器
  container.bind<RoleCommandsController>(TYPES.RoleCommandsController)
    .to(RoleCommandsController)
    .inSingletonScope();

  container.bind<RoleQueriesController>(TYPES.RoleQueriesController)
    .to(RoleQueriesController)
    .inSingletonScope();

  // 權限控制器
  container.bind<PermissionCommandsController>(TYPES.PermissionCommandsController)
    .to(PermissionCommandsController)
    .inSingletonScope();

  container.bind<PermissionQueriesController>(TYPES.PermissionQueriesController)
    .to(PermissionQueriesController)
    .inSingletonScope();

  // 關聯命令控制器
  container.bind<UserToRoleCommandsController>(TYPES.UserToRoleCommandsController)
    .to(UserToRoleCommandsController)
    .inSingletonScope();

  container.bind<RoleToPermissionCommandsController>(TYPES.RoleToPermissionCommandsController)
    .to(RoleToPermissionCommandsController)
    .inSingletonScope();

  // 關聯查詢控制器
  container.bind<UserToRoleQueriesController>(TYPES.UserToRoleQueriesController)
    .to(UserToRoleQueriesController)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesController>(TYPES.RoleToPermissionQueriesController)
    .to(RoleToPermissionQueriesController)
    .inSingletonScope();

  // ===== Repository 註冊 =====
  
  // Queries Repositories
  container.bind<UserQueriesRepository>(TYPES.UserQueriesRepository)
    .to(UserQueriesRepository)
    .inSingletonScope();

  container.bind<PermissionQueriesRepository>(TYPES.PermissionQueriesRepository)
    .to(PermissionQueriesRepository)
    .inSingletonScope();

  container.bind<RoleQueriesRepository>(TYPES.RoleQueriesRepository)
    .to(RoleQueriesRepository)
    .inSingletonScope();

  container.bind<UserRoleQueriesRepository>(TYPES.UserRoleQueriesRepository)
    .to(UserRoleQueriesRepository)
    .inSingletonScope();

  container.bind<RolePermissionQueriesRepository>(TYPES.RolePermissionQueriesRepository)
    .to(RolePermissionQueriesRepository)
    .inSingletonScope();

  // Commands Repositories
  container.bind<UserCommandsRepository>(TYPES.UserCommandsRepository)
    .to(UserCommandsRepository)
    .inSingletonScope();

  container.bind<PermissionCommandsRepository>(TYPES.PermissionCommandsRepository)
    .to(PermissionCommandsRepository)
    .inSingletonScope();

  container.bind<RoleCommandsRepository>(TYPES.RoleCommandsRepository)
    .to(RoleCommandsRepository)
    .inSingletonScope();

  container.bind<UserRoleCommandsRepository>(TYPES.UserRoleCommandsRepository)
    .to(UserRoleCommandsRepository)
    .inSingletonScope();

  container.bind<RolePermissionCommandsRepository>(TYPES.RolePermissionCommandsRepository)
    .to(RolePermissionCommandsRepository)
    .inSingletonScope();

  // ===== 路由服務註冊 =====
  
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
    .to(RouteRegistrar)
    .inSingletonScope();

  // 綁定路由實例 (使用工廠函數延遲創建)
  container.bind(TYPES.RBACRoutes)
    .toDynamicValue(() => createRbacRouter());

  container.bind(TYPES.DocsRoutes)
    .toConstantValue(docsRoutes);

  // 綁定 MCP 路由
  container.bind<RBACMCPRoutes>(TYPES.RBACMCPRoutes)
    .to(RBACMCPRoutes)
    .inSingletonScope();

  console.log('✅ RBAC IoC Container configured with RBAC services, repositories, routes and MCP support');
  
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
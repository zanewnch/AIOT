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
import { UserCommandsSvc } from '../services/commands/UserCommandsSvc.js';
import { UserQueriesSvc } from '../services/queries/UserQueriesSvc.js';
import { RoleCommandsSvc } from '../services/commands/RoleCommandsSvc.js';
import { RoleQueriesSvc } from '../services/queries/RoleQueriesSvc.js';
import { PermissionCommandsSvc } from '../services/commands/PermissionCommandsSvc.js';
import { PermissionQueriesSvc } from '../services/queries/PermissionQueriesSvc.js';
import { UserToRoleCommandsSvc } from '../services/commands/UserToRoleCommandsSvc.js';
import { UserToRoleQueriesSvc } from '../services/queries/UserToRoleQueriesSvc.js';
import { RoleToPermissionCommandsSvc } from '../services/commands/RoleToPermissionCommandsSvc.js';
import { RoleToPermissionQueriesSvc } from '../services/queries/RoleToPermissionQueriesSvc.js';
import { SessionQueriesSvc } from '../services/queries/SessionQueriesSvc.js';

// RBAC 控制器
import { UserCommandsCtrl } from '../controllers/commands/UserCommandsCtrl.js';
import { UserQueriesCtrl } from '../controllers/queries/UserQueriesCtrl.js';
import { RoleCommandsCtrl } from '../controllers/commands/RoleCommandsCtrl.js';
import { RoleQueriesCtrl } from '../controllers/queries/RoleQueriesCtrl.js';
import { PermissionCommandsCtrl } from '../controllers/commands/PermissionCommandsCtrl.js';
import { PermissionQueriesCtrl } from '../controllers/queries/PermissionQueriesCtrl.js';
import { UserToRoleCommandsCtrl } from '../controllers/commands/UserToRoleCommandsCtrl.js';
import { UserToRoleQueriesCtrl } from '../controllers/queries/UserToRoleQueriesCtrl.js';
import { RoleToPermissionCommandsCtrl } from '../controllers/commands/RoleToPermissionCommandsCtrl.js';
import { RoleToPermissionQueriesCtrl } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';

// JWT 安全服務
// import { JwtBlacklistService } from 'aiot-shared-packages';

// Repository 導入
import { UserQueriesRepository } from '../repo/queries/UserQueriesRepository.js';
import { PermissionQueriesRepository } from '../repo/queries/PermissionQueriesRepository.js';
import { RoleQueriesRepository } from '../repo/queries/RoleQueriesRepository.js';
import { UserRoleQueriesRepository } from '../repo/queries/UserRoleQueriesRepository.js';
import { RolePermissionQueriesRepository } from '../repo/queries/RolePermissionQueriesRepository.js';
import { SessionQueriesRepository } from '../repo/queries/SessionQueriesRepository.js';
import { UserCommandsRepo } from '../repo/commands/UserCommandsRepository.js';
import { PermissionCommandsRepo } from '../repo/commands/PermissionCommandsRepository.js';
import { RoleCommandsRepo } from '../repo/commands/RoleCommandsRepository.js';
import { UserRoleCommandsRepo } from '../repo/commands/UserRoleCommandsRepository.js';
import { RolePermissionCommandsRepo } from '../repo/commands/RolePermissionCommandsRepository.js';

// 路由相關導入
import { RouteRegistrar } from '../routes/RouteRegistrar.js';
import { RbacRoutes } from '../routes/rbacRoutes.js';
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
  container.bind<UserCommandsSvc>(TYPES.UserCommandsService)
    .to(UserCommandsSvc)
    .inSingletonScope();

  container.bind<UserQueriesSvc>(TYPES.UserQueriesService)
    .to(UserQueriesSvc)
    .inSingletonScope();

  // 角色服務
  container.bind<RoleCommandsSvc>(TYPES.RoleCommandsService)
    .to(RoleCommandsSvc)
    .inSingletonScope();

  container.bind<RoleQueriesSvc>(TYPES.RoleQueriesService)
    .to(RoleQueriesSvc)
    .inSingletonScope();

  // 權限服務
  container.bind<PermissionCommandsSvc>(TYPES.PermissionCommandsService)
    .to(PermissionCommandsSvc)
    .inSingletonScope();

  container.bind<PermissionQueriesSvc>(TYPES.PermissionQueriesService)
    .to(PermissionQueriesSvc)
    .inSingletonScope();

  // 用戶角色關聯服務
  container.bind<UserToRoleCommandsSvc>(TYPES.UserToRoleCommandsService)
    .to(UserToRoleCommandsSvc)
    .inSingletonScope();

  container.bind<UserToRoleQueriesSvc>(TYPES.UserToRoleQueriesService)
    .to(UserToRoleQueriesSvc)
    .inSingletonScope();

  // 角色權限關聯服務
  container.bind<RoleToPermissionCommandsSvc>(TYPES.RoleToPermissionCommandsService)
    .to(RoleToPermissionCommandsSvc)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesSvc>(TYPES.RoleToPermissionQueriesService)
    .to(RoleToPermissionQueriesSvc)
    .inSingletonScope();

    
  container.bind<SessionQueriesSvc>(TYPES.SessionQueriesService)
    .to(SessionQueriesSvc)
    .inSingletonScope();

  // JWT 安全服務
//   container.bind<JwtBlacklistService>(TYPES.JwtBlacklistService)
//     .to(JwtBlacklistService)
//     .inSingletonScope();

  // ===== RBAC 控制器註冊 =====
  
  // 用戶控制器
  container.bind<UserCommandsCtrl>(TYPES.UserCommandsController)
    .to(UserCommandsCtrl)
    .inSingletonScope();

  container.bind<UserQueriesCtrl>(TYPES.UserQueriesController)
    .to(UserQueriesCtrl)
    .inSingletonScope();

  // 角色控制器
  container.bind<RoleCommandsCtrl>(TYPES.RoleCommandsController)
    .to(RoleCommandsCtrl)
    .inSingletonScope();

  container.bind<RoleQueriesCtrl>(TYPES.RoleQueriesController)
    .to(RoleQueriesCtrl)
    .inSingletonScope();

  // 權限控制器
  container.bind<PermissionCommandsCtrl>(TYPES.PermissionCommandsController)
    .to(PermissionCommandsCtrl)
    .inSingletonScope();

  container.bind<PermissionQueriesCtrl>(TYPES.PermissionQueriesController)
    .to(PermissionQueriesCtrl)
    .inSingletonScope();

  // 關聯命令控制器
  container.bind<UserToRoleCommandsCtrl>(TYPES.UserToRoleCommandsController)
    .to(UserToRoleCommandsCtrl)
    .inSingletonScope();

  container.bind<RoleToPermissionCommandsCtrl>(TYPES.RoleToPermissionCommandsController)
    .to(RoleToPermissionCommandsCtrl)
    .inSingletonScope();

  // 關聯查詢控制器
  container.bind<UserToRoleQueriesCtrl>(TYPES.UserToRoleQueriesController)
    .to(UserToRoleQueriesCtrl)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesCtrl>(TYPES.RoleToPermissionQueriesController)
    .to(RoleToPermissionQueriesCtrl)
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

  container.bind<SessionQueriesRepository>(TYPES.SessionQueriesRepository)
    .to(SessionQueriesRepository)
    .inSingletonScope();

  // Commands Repositories
  container.bind<UserCommandsRepo>(TYPES.UserCommandsRepository)
    .to(UserCommandsRepo)
    .inSingletonScope();

  container.bind<PermissionCommandsRepo>(TYPES.PermissionCommandsRepository)
    .to(PermissionCommandsRepo)
    .inSingletonScope();

  container.bind<RoleCommandsRepo>(TYPES.RoleCommandsRepository)
    .to(RoleCommandsRepo)
    .inSingletonScope();

  container.bind<UserRoleCommandsRepo>(TYPES.UserRoleCommandsRepository)
    .to(UserRoleCommandsRepo)
    .inSingletonScope();

  container.bind<RolePermissionCommandsRepo>(TYPES.RolePermissionCommandsRepository)
    .to(RolePermissionCommandsRepo)
    .inSingletonScope();

  // ===== 路由服務註冊 =====
  
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
    .to(RouteRegistrar)
    .inSingletonScope();

  // 綁定 RBAC 路由類別 (使用 DI)
  container.bind<RbacRoutes>(TYPES.RBACRoutes)
    .to(RbacRoutes)
    .inSingletonScope();

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
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
import { UserCommandsService } from.*Service.js';
import { UserQueriesService } from.*Service.js';
import { RoleCommandsService } from.*Service.js';
import { RoleQueriesService } from.*Service.js';
import { PermissionCommandsService } from.*Service.js';
import { PermissionQueriesService } from.*Service.js';
import { UserToRoleCommandsService } from.*Service.js';
import { UserToRoleQueriesService } from.*Service.js';
import { RoleToPermissionCommandsService } from.*Service.js';
import { RoleToPermissionQueriesService } from.*Service.js';
import { SessionQueriesService } from.*Service.js';

// RBAC 控制器
import { UserCommandsController } from.*Controller.js';
import { UserQueriesController } from.*Controller.js';
import { RoleCommandsController } from.*Controller.js';
import { RoleQueriesController } from.*Controller.js';
import { PermissionCommandsController } from.*Controller.js';
import { PermissionQueriesController } from.*Controller.js';
import { UserToRoleCommandsController } from.*Controller.js';
import { UserToRoleQueriesController } from.*Controller.js';
import { RoleToPermissionCommandsController } from.*Controller.js';
import { RoleToPermissionQueriesController } from.*Controller.js';

// JWT 安全服務
// import { JwtBlacklistService } from 'aiot-shared-packages';

// Repositorysitory 導入
import { UserQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import { PermissionQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import { RoleQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import { UserRoleQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import { RolePermissionQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import { UserCommandsRepositorysitory } from.*Repositorysitorysitory.js';
import { PermissionCommandsRepositorysitory } from.*Repositorysitorysitory.js';
import { RoleCommandsRepositorysitory } from.*Repositorysitorysitory.js';
import { UserRoleCommandsRepositorysitory } from.*Repositorysitorysitory.js';
import { RolePermissionCommandsRepositorysitory } from.*Repositorysitorysitory.js';

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

  // ===== Repositorysitory 註冊 =====
  
  // Queries Repositorysitorysitories
  container.bind<UserQueriesRepositorysitory>(TYPES.UserQueriesRepositorysitory)
    .to(UserQueriesRepositorysitory)
    .inSingletonScope();

  container.bind<PermissionQueriesRepositorysitory>(TYPES.PermissionQueriesRepositorysitory)
    .to(PermissionQueriesRepositorysitory)
    .inSingletonScope();

  container.bind<RoleQueriesRepositorysitory>(TYPES.RoleQueriesRepositorysitory)
    .to(RoleQueriesRepositorysitory)
    .inSingletonScope();

  container.bind<UserRoleQueriesRepositorysitory>(TYPES.UserRoleQueriesRepositorysitory)
    .to(UserRoleQueriesRepositorysitory)
    .inSingletonScope();

  container.bind<RolePermissionQueriesRepositorysitory>(TYPES.RolePermissionQueriesRepositorysitory)
    .to(RolePermissionQueriesRepositorysitory)
    .inSingletonScope();

  // Commands Repositorysitorysitories
  container.bind<UserCommandsRepositorysitory>(TYPES.UserCommandsRepositorysitory)
    .to(UserCommandsRepositorysitory)
    .inSingletonScope();

  container.bind<PermissionCommandsRepositorysitory>(TYPES.PermissionCommandsRepositorysitory)
    .to(PermissionCommandsRepositorysitory)
    .inSingletonScope();

  container.bind<RoleCommandsRepositorysitory>(TYPES.RoleCommandsRepositorysitory)
    .to(RoleCommandsRepositorysitory)
    .inSingletonScope();

  container.bind<UserRoleCommandsRepositorysitory>(TYPES.UserRoleCommandsRepositorysitory)
    .to(UserRoleCommandsRepositorysitory)
    .inSingletonScope();

  container.bind<RolePermissionCommandsRepositorysitory>(TYPES.RolePermissionCommandsRepositorysitory)
    .to(RolePermissionCommandsRepositorysitory)
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
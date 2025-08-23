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

// Repo 導入
import { UserQueriesRepo } from '../repo/queries/UserQueriesRepo.js';
import { PermissionQueriesRepo } from '../repo/queries/PermissionQueriesRepo.js';
import { RoleQueriesRepo } from '../repo/queries/RoleQueriesRepo.js';
import { UserRoleQueriesRepo } from '../repo/queries/UserRoleQueriesRepo.js';
import { RolePermissionQueriesRepo } from '../repo/queries/RolePermissionQueriesRepo.js';
import { UserCommandsRepo } from '../repo/commands/UserCommandsRepo.js';
import { PermissionCommandsRepo } from '../repo/commands/PermissionCommandsRepo.js';
import { RoleCommandsRepo } from '../repo/commands/RoleCommandsRepo.js';
import { UserRoleCommandsRepo } from '../repo/commands/UserRoleCommandsRepo.js';
import { RolePermissionCommandsRepo } from '../repo/commands/RolePermissionCommandsRepo.js';

// 路由相關導入
import { RouteRegistrar } from '../routes/RouteRegistrar.js';
import { router as rbacRoutes } from '../routes/rbacRoutes.js';
import docsRoutes from '../routes/docsRoutes.js';

/**
 * 創建並配置 RBAC 服務的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container();

  // ===== RBAC 服務註冊 =====
  
  // 用戶服務
  container.bind<UserCommandsSvc>(TYPES.UserCommandsSvc)
    .to(UserCommandsSvc)
    .inSingletonScope();

  container.bind<UserQueriesSvc>(TYPES.UserQueriesSvc)
    .to(UserQueriesSvc)
    .inSingletonScope();

  // 角色服務
  container.bind<RoleCommandsSvc>(TYPES.RoleCommandsSvc)
    .to(RoleCommandsSvc)
    .inSingletonScope();

  container.bind<RoleQueriesSvc>(TYPES.RoleQueriesSvc)
    .to(RoleQueriesSvc)
    .inSingletonScope();

  // 權限服務
  container.bind<PermissionCommandsSvc>(TYPES.PermissionCommandsSvc)
    .to(PermissionCommandsSvc)
    .inSingletonScope();

  container.bind<PermissionQueriesSvc>(TYPES.PermissionQueriesSvc)
    .to(PermissionQueriesSvc)
    .inSingletonScope();

  // 用戶角色關聯服務
  container.bind<UserToRoleCommandsSvc>(TYPES.UserToRoleCommandsSvc)
    .to(UserToRoleCommandsSvc)
    .inSingletonScope();

  container.bind<UserToRoleQueriesSvc>(TYPES.UserToRoleQueriesSvc)
    .to(UserToRoleQueriesSvc)
    .inSingletonScope();

  // 角色權限關聯服務
  container.bind<RoleToPermissionCommandsSvc>(TYPES.RoleToPermissionCommandsSvc)
    .to(RoleToPermissionCommandsSvc)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesSvc>(TYPES.RoleToPermissionQueriesSvc)
    .to(RoleToPermissionQueriesSvc)
    .inSingletonScope();

    
  container.bind<SessionQueriesSvc>(TYPES.SessionQueriesSvc)
    .to(SessionQueriesSvc)
    .inSingletonScope();

  // JWT 安全服務
//   container.bind<JwtBlacklistService>(TYPES.JwtBlacklistService)
//     .to(JwtBlacklistService)
//     .inSingletonScope();

  // ===== RBAC 控制器註冊 =====
  
  // 用戶控制器
  container.bind<UserCommandsCtrl>(TYPES.UserCommandsCtrl)
    .to(UserCommandsCtrl)
    .inSingletonScope();

  container.bind<UserQueriesCtrl>(TYPES.UserQueriesCtrl)
    .to(UserQueriesCtrl)
    .inSingletonScope();

  // 角色控制器
  container.bind<RoleCommandsCtrl>(TYPES.RoleCommandsCtrl)
    .to(RoleCommandsCtrl)
    .inSingletonScope();

  container.bind<RoleQueriesCtrl>(TYPES.RoleQueriesCtrl)
    .to(RoleQueriesCtrl)
    .inSingletonScope();

  // 權限控制器
  container.bind<PermissionCommandsCtrl>(TYPES.PermissionCommandsCtrl)
    .to(PermissionCommandsCtrl)
    .inSingletonScope();

  container.bind<PermissionQueriesCtrl>(TYPES.PermissionQueriesCtrl)
    .to(PermissionQueriesCtrl)
    .inSingletonScope();

  // 關聯命令控制器
  container.bind<UserToRoleCommandsCtrl>(TYPES.UserToRoleCommandsCtrl)
    .to(UserToRoleCommandsCtrl)
    .inSingletonScope();

  container.bind<RoleToPermissionCommandsCtrl>(TYPES.RoleToPermissionCommandsCtrl)
    .to(RoleToPermissionCommandsCtrl)
    .inSingletonScope();

  // 關聯查詢控制器
  container.bind<UserToRoleQueriesCtrl>(TYPES.UserToRoleQueriesCtrl)
    .to(UserToRoleQueriesCtrl)
    .inSingletonScope();

  container.bind<RoleToPermissionQueriesCtrl>(TYPES.RoleToPermissionQueriesCtrl)
    .to(RoleToPermissionQueriesCtrl)
    .inSingletonScope();

  // ===== Repo 註冊 =====
  
  // Queries Repositories
  container.bind<UserQueriesRepo>(TYPES.UserQueriesRepo)
    .to(UserQueriesRepo)
    .inSingletonScope();

  container.bind<PermissionQueriesRepo>(TYPES.PermissionQueriesRepo)
    .to(PermissionQueriesRepo)
    .inSingletonScope();

  container.bind<RoleQueriesRepo>(TYPES.RoleQueriesRepo)
    .to(RoleQueriesRepo)
    .inSingletonScope();

  container.bind<UserRoleQueriesRepo>(TYPES.UserRoleQueriesRepo)
    .to(UserRoleQueriesRepo)
    .inSingletonScope();

  container.bind<RolePermissionQueriesRepo>(TYPES.RolePermissionQueriesRepo)
    .to(RolePermissionQueriesRepo)
    .inSingletonScope();

  // Commands Repositories
  container.bind<UserCommandsRepo>(TYPES.UserCommandsRepo)
    .to(UserCommandsRepo)
    .inSingletonScope();

  container.bind<PermissionCommandsRepo>(TYPES.PermissionCommandsRepo)
    .to(PermissionCommandsRepo)
    .inSingletonScope();

  container.bind<RoleCommandsRepo>(TYPES.RoleCommandsRepo)
    .to(RoleCommandsRepo)
    .inSingletonScope();

  container.bind<UserRoleCommandsRepo>(TYPES.UserRoleCommandsRepo)
    .to(UserRoleCommandsRepo)
    .inSingletonScope();

  container.bind<RolePermissionCommandsRepo>(TYPES.RolePermissionCommandsRepo)
    .to(RolePermissionCommandsRepo)
    .inSingletonScope();

  // ===== 路由服務註冊 =====
  
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
    .to(RouteRegistrar)
    .inSingletonScope();

  // 綁定路由實例
  container.bind(TYPES.RBACRoutes)
    .toConstantValue(rbacRoutes);

  container.bind(TYPES.DocsRoutes)
    .toConstantValue(docsRoutes);

  console.log('✅ RBAC IoC Container configured with RBAC services, repositories, and routes');
  
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
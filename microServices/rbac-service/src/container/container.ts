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
import { UserCommands } from '../controllers/commands/UserCommandsCtrl.js';
import { UserQueries } from '../controllers/queries/UserQueriesCtrl.js';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl.js';
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl.js';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl.js';
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl.js';
import { UserToRoleCommands } from '../controllers/commands/UserToRoleCommandsCtrl.js';
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl.js';
import { RoleToPermissionCommands } from '../controllers/commands/RoleToPermissionCommandsCtrl.js';
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';

// JWT 安全服務
import { JwtBlacklistSvc } from '../../../../../aiot-shared-packages';

// Repository 導入
import { UserQueriesRepo } from '../repo/queries/UserQueriesRepo.js';
import { PermissionQueriesRepo } from '../repo/queries/PermissionQueriesRepo.js';
import { RoleQueriesRepo } from '../repo/queries/RoleQueriesRepo.js';
import { UserRoleQueriesRepo } from '../repo/queries/UserRoleQueriesRepo.js';
import { RolePermissionQueriesRepo } from '../repo/queries/RolePermissionQueriesRepo.js';
import { UserCommandsRepository } from '../repo/commands/UserCommandsRepo.js';
import { PermissionCommandsRepository } from '../repo/commands/PermissionCommandsRepo.js';
import { RoleCommandsRepository } from '../repo/commands/RoleCommandsRepo.js';
import { UserRoleCommandsRepository } from '../repo/commands/UserRoleCommandsRepo.js';
import { RolePermissionCommandsRepository } from '../repo/commands/RolePermissionCommandsRepo.js';

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
  container.bind<JwtBlacklistSvc>(TYPES.JwtBlacklistSvc)
    .to(JwtBlacklistSvc)
    .inSingletonScope();

  // ===== RBAC 控制器註冊 =====
  
  // 用戶控制器
  container.bind<UserCommands>(TYPES.UserCommandsCtrl)
    .to(UserCommands)
    .inSingletonScope();

  container.bind<UserQueries>(TYPES.UserQueriesCtrl)
    .to(UserQueries)
    .inSingletonScope();

  // 角色控制器
  container.bind<RoleCommands>(TYPES.RoleCommandsCtrl)
    .to(RoleCommands)
    .inSingletonScope();

  container.bind<RoleQueries>(TYPES.RoleQueriesCtrl)
    .to(RoleQueries)
    .inSingletonScope();

  // 權限控制器
  container.bind<PermissionCommands>(TYPES.PermissionCommandsCtrl)
    .to(PermissionCommands)
    .inSingletonScope();

  container.bind<PermissionQueries>(TYPES.PermissionQueriesCtrl)
    .to(PermissionQueries)
    .inSingletonScope();

  // 關聯命令控制器
  container.bind<UserToRoleCommands>(TYPES.UserToRoleCommandsCtrl)
    .to(UserToRoleCommands)
    .inSingletonScope();

  container.bind<RoleToPermissionCommands>(TYPES.RoleToPermissionCommandsCtrl)
    .to(RoleToPermissionCommands)
    .inSingletonScope();

  // 關聯查詢控制器
  container.bind<UserToRoleQueries>(TYPES.UserToRoleQueriesCtrl)
    .to(UserToRoleQueries)
    .inSingletonScope();

  container.bind<RoleToPermissionQueries>(TYPES.RoleToPermissionQueriesCtrl)
    .to(RoleToPermissionQueries)
    .inSingletonScope();

  // ===== Repository 註冊 =====
  
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
  container.bind<UserCommandsRepository>(TYPES.UserCommandsRepo)
    .to(UserCommandsRepository)
    .inSingletonScope();

  container.bind<PermissionCommandsRepository>(TYPES.PermissionCommandsRepo)
    .to(PermissionCommandsRepository)
    .inSingletonScope();

  container.bind<RoleCommandsRepository>(TYPES.RoleCommandsRepo)
    .to(RoleCommandsRepository)
    .inSingletonScope();

  container.bind<UserRoleCommandsRepository>(TYPES.UserRoleCommandsRepo)
    .to(UserRoleCommandsRepository)
    .inSingletonScope();

  container.bind<RolePermissionCommandsRepository>(TYPES.RolePermissionCommandsRepo)
    .to(RolePermissionCommandsRepository)
    .inSingletonScope();

  console.log('✅ RBAC IoC Container configured with RBAC services and repositories');
  
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
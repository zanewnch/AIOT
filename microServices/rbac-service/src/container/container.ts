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
import { TYPES } from '../container/types';

// RBAC 認證服務
import { UserCommandsSvc } from '../services/commands/UserCommandsSvc';
import { UserQueriesSvc } from '../services/queries/UserQueriesSvc';
import { RoleCommandsSvc } from '../services/commands/RoleCommandsSvc';
import { RoleQueriesSvc } from '../services/queries/RoleQueriesSvc';
import { PermissionCommandsSvc } from '../services/commands/PermissionCommandsSvc';
import { PermissionQueriesSvc } from '../services/queries/PermissionQueriesSvc';
import { UserToRoleCommandsSvc } from '../services/commands/UserToRoleCommandsSvc';
import { UserToRoleQueriesSvc } from '../services/queries/UserToRoleQueriesSvc';
import { RoleToPermissionCommandsSvc } from '../services/commands/RoleToPermissionCommandsSvc';
import { RoleToPermissionQueriesSvc } from '../services/queries/RoleToPermissionQueriesSvc';

// RBAC 控制器
import { UserCommands } from '../controllers/commands/UserCommandsCtrl';
import { UserQueries } from '../controllers/queries/UserQueriesCtrl';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl';
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl';
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl';
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl';
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl';
import { AuthCommands } from '../controllers/commands/AuthCommandsCtrl';

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

  // 關聯查詢控制器
  container.bind<UserToRoleQueries>(TYPES.UserToRoleQueriesCtrl)
    .to(UserToRoleQueries)
    .inSingletonScope();

  container.bind<RoleToPermissionQueries>(TYPES.RoleToPermissionQueriesCtrl)
    .to(RoleToPermissionQueries)
    .inSingletonScope();

  // 認證控制器
  container.bind<AuthCommands>(TYPES.AuthCommandsCtrl)
    .to(AuthCommands)
    .inSingletonScope();

  console.log('✅ RBAC IoC Container configured with RBAC services only');
  
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
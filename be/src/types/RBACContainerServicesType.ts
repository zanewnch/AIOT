/**
 * RBAC 容器服務類型定義
 * 
 * 定義 RBAC 依賴注入容器中可包含的服務類型，用於類型安全的服務管理。
 * 包含所有 RBAC 相關的控制器介面類型聯合。
 * 
 * @module Types
 */

import { IUserController, IRoleController, IPermissionController, IUserToRoleController, IRoleToPermissionController } from './controllers/index.js';

export type RBACContainerServicesType = IUserController | IRoleController | IPermissionController | IUserToRoleController | IRoleToPermissionController;
// Custom type definitions for the AIOT application

import { Router, Request, Response } from 'express';

// Type definitions (使用 名稱+Type 命名規範)
export type ApiResponseType<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type UserType = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend Express Request interface if needed
declare global {
  namespace Express {
    interface Request {
      // 使用自定義的UserType，但保持Express原有的命名
      customUser?: UserType;
    }
  }
}

// Controller interfaces for dependency injection (使用 I+名稱 命名規範)
export interface IUserController {
    router: Router;
    getUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
}

export interface IRoleController {
    router: Router;
    getRoles(req: Request, res: Response): Promise<void>;
    getRoleById(req: Request, res: Response): Promise<void>;
    createRole(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    deleteRole(req: Request, res: Response): Promise<void>;
}

export interface IPermissionController {
    router: Router;
    getPermissions(req: Request, res: Response): Promise<void>;
    getPermissionById(req: Request, res: Response): Promise<void>;
    createPermission(req: Request, res: Response): Promise<void>;
    updatePermission(req: Request, res: Response): Promise<void>;
    deletePermission(req: Request, res: Response): Promise<void>;
}

export interface IUserToRoleController {
    router: Router;
    getUserRoles(req: Request, res: Response): Promise<void>;
    assignRolesToUser(req: Request, res: Response): Promise<void>;
    removeRoleFromUser(req: Request, res: Response): Promise<void>;
}

export interface IRoleToPermissionController {
    router: Router;
    getRolePermissions(req: Request, res: Response): Promise<void>;
    assignPermissionsToRole(req: Request, res: Response): Promise<void>;
    removePermissionFromRole(req: Request, res: Response): Promise<void>;
}

// RBAC Controller interface
export interface IRBACController {
    router: Router;
} 
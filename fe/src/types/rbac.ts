/**
 * RBAC 相關接口
 */
export interface RbacUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RbacRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RbacPermission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
}

export interface CreateUserRoleRequest {
  userId: string;
  roleId: string;
  expiresAt?: string;
}

export interface UpdateUserRoleRequest {
  expiresAt?: string;
  isActive?: boolean;
}

export interface CreateRolePermissionRequest {
  roleId: string;
  permissionId: string;
}

export interface UpdateRolePermissionRequest {
  isActive?: boolean;
}
/**
 * @fileoverview RBAC 相關測試數據固定裝置
 * @description 為角色權限管理功能測試提供標準化的測試數據
 * @author AIOT Development Team
 * @version 1.0.0
 */

export const rbacFixtures = {
  // 角色列表
  roleList: [
    {
      id: 'role_001',
      name: 'admin',
      display_name: '系統管理員',
      description: '擁有系統全部權限的管理員角色',
      permissions: ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_roles'],
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'role_002',
      name: 'operator',
      display_name: '操作員',
      description: '負責無人機操作和監控的角色',
      permissions: ['read', 'write', 'operate_drone', 'view_analytics'],
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'role_003',
      name: 'viewer',
      display_name: '觀察員',
      description: '只能查看數據的角色',
      permissions: ['read', 'view_analytics'],
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'role_004',
      name: 'user',
      display_name: '普通用戶',
      description: '基本用戶角色',
      permissions: ['read'],
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ],

  // 權限列表
  permissionList: [
    {
      id: 'perm_001',
      name: 'read',
      display_name: '讀取權限',
      description: '允許讀取系統數據',
      resource: 'all',
      action: 'read',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_002',
      name: 'write',
      display_name: '寫入權限',
      description: '允許修改系統數據',
      resource: 'all',
      action: 'write',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_003',
      name: 'delete',
      display_name: '刪除權限',
      description: '允許刪除系統數據',
      resource: 'all',
      action: 'delete',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_004',
      name: 'admin',
      display_name: '系統管理權限',
      description: '系統管理員專用權限',
      resource: 'system',
      action: 'admin',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_005',
      name: 'manage_users',
      display_name: '用戶管理權限',
      description: '允許管理用戶帳戶',
      resource: 'users',
      action: 'manage',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_006',
      name: 'manage_roles',
      display_name: '角色管理權限',
      description: '允許管理角色和權限',
      resource: 'roles',
      action: 'manage',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_007',
      name: 'operate_drone',
      display_name: '無人機操作權限',
      description: '允許操作和控制無人機',
      resource: 'drones',
      action: 'operate',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'perm_008',
      name: 'view_analytics',
      display_name: '數據分析查看權限',
      description: '允許查看數據分析和報告',
      resource: 'analytics',
      action: 'view',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ],

  // 用戶角色關聯
  userRoleRelations: [
    {
      id: 'ur_001',
      user_id: 'user_001',
      role_id: 'role_001',
      assigned_at: '2024-01-01T00:00:00.000Z',
      assigned_by: 'system'
    },
    {
      id: 'ur_002',
      user_id: 'user_002',
      role_id: 'role_002',
      assigned_at: '2024-01-15T00:00:00.000Z',
      assigned_by: 'user_001'
    },
    {
      id: 'ur_003',
      user_id: 'user_003',
      role_id: 'role_003',
      assigned_at: '2024-02-01T00:00:00.000Z',
      assigned_by: 'user_001'
    }
  ],

  // 新角色範本
  newRoleTemplate: {
    name: 'new_role',
    display_name: '新角色',
    description: '新建的角色',
    permissions: ['read'],
    is_active: true
  },

  // 新權限範本
  newPermissionTemplate: {
    name: 'new_permission',
    display_name: '新權限',
    description: '新建的權限',
    resource: 'custom',
    action: 'custom',
    is_active: true
  }
};
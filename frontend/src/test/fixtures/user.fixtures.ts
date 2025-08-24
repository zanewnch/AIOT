/**
 * @fileoverview 用戶相關測試數據固定裝置
 * @description 為用戶管理功能測試提供標準化的測試數據
 * @author AIOT Development Team
 * @version 1.0.0
 */

export const userFixtures = {
  // 用戶列表
  userList: [
    {
      id: 'user_001',
      username: 'admin',
      email: 'admin@aiot.com',
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
      roles: ['admin'],
      permissions: ['read', 'write', 'delete', 'admin'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    },
    {
      id: 'user_002',
      username: 'operator1',
      email: 'operator1@aiot.com',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      roles: ['operator'],
      permissions: ['read', 'write'],
      created_at: '2024-01-15T00:00:00.000Z',
      updated_at: '2024-01-15T00:00:00.000Z',
      last_login: '2024-08-20T10:30:00.000Z'
    },
    {
      id: 'user_003',
      username: 'viewer1',
      email: 'viewer1@aiot.com',
      first_name: 'Jane',
      last_name: 'Smith',
      is_active: true,
      roles: ['viewer'],
      permissions: ['read'],
      created_at: '2024-02-01T00:00:00.000Z',
      updated_at: '2024-02-01T00:00:00.000Z',
      last_login: '2024-08-19T14:15:00.000Z'
    },
    {
      id: 'user_004',
      username: 'inactive_user',
      email: 'inactive@aiot.com',
      first_name: 'Inactive',
      last_name: 'User',
      is_active: false,
      roles: ['user'],
      permissions: ['read'],
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2024-03-01T00:00:00.000Z',
      last_login: '2024-03-05T00:00:00.000Z'
    },
    {
      id: 'user_005',
      username: 'testuser',
      email: 'test@aiot.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      roles: ['user'],
      permissions: ['read'],
      created_at: '2024-04-01T00:00:00.000Z',
      updated_at: '2024-04-01T00:00:00.000Z',
      last_login: null
    }
  ],

  // 新建用戶範本
  newUserTemplate: {
    username: 'newuser',
    email: 'newuser@aiot.com',
    first_name: 'New',
    last_name: 'User',
    password: 'securePassword123',
    is_active: true,
    roles: ['user']
  },

  // 用戶更新數據
  updateUserData: {
    first_name: 'Updated',
    last_name: 'Name',
    email: 'updated@aiot.com'
  },

  // 無效用戶數據
  invalidUserData: {
    username: '', // 空用戶名
    email: 'invalid-email', // 無效郵箱格式
    password: '123' // 密碼太短
  }
};
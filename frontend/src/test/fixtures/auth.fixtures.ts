/**
 * @fileoverview 認證相關測試數據固定裝置
 * @description 為認證功能測試提供標準化的測試數據
 * @author AIOT Development Team
 * @version 1.0.0
 */

export const authFixtures = {
  // 成功登入回應
  loginSuccess: {
    user: {
      id: 'user_001',
      username: 'admin',
      email: 'admin@aiot.com',
      roles: ['admin'],
      permissions: ['read', 'write', 'delete', 'admin'],
      last_login: new Date().toISOString(),
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: new Date().toISOString()
    },
    token: 'mock_jwt_token_12345',
    expires_in: 3600
  },

  // 當前用戶資訊
  currentUser: {
    id: 'user_001',
    username: 'admin',
    email: 'admin@aiot.com',
    roles: ['admin'],
    permissions: ['read', 'write', 'delete', 'admin'],
    last_login: new Date().toISOString(),
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: new Date().toISOString()
  },

  // 普通用戶
  regularUser: {
    id: 'user_002',
    username: 'user123',
    email: 'user123@aiot.com',
    roles: ['user'],
    permissions: ['read'],
    last_login: new Date().toISOString(),
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: new Date().toISOString()
  },

  // 登入失敗情況
  invalidCredentials: {
    username: 'invalid_user',
    password: 'wrong_password'
  },

  // 過期令牌
  expiredToken: {
    error: 'TokenExpiredError',
    message: '令牌已過期',
    expired_at: new Date(Date.now() - 3600000).toISOString()
  }
};
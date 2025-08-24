/**
 * @fileoverview Test setup configuration for RBAC service
 */

import { Sequelize } from 'sequelize';
import { container } from '../configs/DIContainer';
import { TYPES } from '../configs/types';
import request from 'supertest';
import express from 'express';

// 測試資料庫配置
export const testDbConfig = {
  database: ':memory:',
  dialect: 'sqlite' as const,
  logging: false,
  sync: { force: true }
};

// 創建測試用的 Sequelize 實例
export const createTestSequelize = (): Sequelize => {
  return new Sequelize(testDbConfig);
};

// 測試資料庫設置
export const setupTestDb = async (): Promise<Sequelize> => {
  const sequelize = createTestSequelize();
  
  // 註冊到容器中
  container.rebind(TYPES.Sequelize).toConstantValue(sequelize);
  
  // 同步模型
  await sequelize.sync({ force: true });
  
  return sequelize;
};

// 清理測試資料庫
export const cleanupTestDb = async (sequelize: Sequelize): Promise<void> => {
  await sequelize.close();
};

// 測試用戶數據
export const testUserData = {
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  isActive: true
};

// 測試角色數據
export const testRoleData = {
  name: 'test-role',
  displayName: 'Test Role',
  description: 'Test role for unit testing',
  isActive: true
};

// 測試權限數據
export const testPermissionData = {
  name: 'test-permission',
  description: 'Test permission for unit testing',
  category: 'test',
  isActive: true
};

// Mock 函數工具
export const createMockRepository = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  bulkCreate: jest.fn(),
  count: jest.fn()
});

// 測試助手函數
export const testHelpers = {
  /**
   * 創建測試用戶
   */
  createTestUser: async (sequelize: Sequelize, userData = testUserData) => {
    const User = sequelize.models.User;
    return await User.create(userData);
  },

  /**
   * 創建測試角色
   */
  createTestRole: async (sequelize: Sequelize, roleData = testRoleData) => {
    const Role = sequelize.models.Role;
    return await Role.create(roleData);
  },

  /**
   * 創建測試權限
   */
  createTestPermission: async (sequelize: Sequelize, permissionData = testPermissionData) => {
    const Permission = sequelize.models.Permission;
    return await Permission.create(permissionData);
  },

  /**
   * 創建用戶角色關聯
   */
  createUserRole: async (sequelize: Sequelize, userId: number, roleId: number) => {
    const UserRole = sequelize.models.UserRole;
    return await UserRole.create({
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy: userId
    });
  },

  /**
   * 創建角色權限關聯
   */
  createRolePermission: async (sequelize: Sequelize, roleId: number, permissionId: number) => {
    const RolePermission = sequelize.models.RolePermission;
    return await RolePermission.create({
      roleId,
      permissionId,
      grantedAt: new Date(),
      grantedBy: 1
    });
  },

  /**
   * 創建測試應用程序
   */
  createTestApp: (): express.Application => {
    const app = express();
    app.use(express.json());
    return app;
  },

  /**
   * 創建測試 gRPC 客戶端
   */
  createTestGrpcClient: (service: any) => {
    return {
      call: jest.fn(),
      request: jest.fn(),
      response: jest.fn()
    };
  }
};

// API 測試助手
export const apiTestHelpers = {
  /**
   * 執行 API 測試請求
   */
  makeRequest: (app: express.Application) => ({
    get: (url: string) => request(app).get(url),
    post: (url: string, data?: any) => request(app).post(url).send(data),
    put: (url: string, data?: any) => request(app).put(url).send(data),
    delete: (url: string) => request(app).delete(url)
  })
};

// Jest 全局設置
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

export default {
  setupTestDb,
  cleanupTestDb,
  testUserData,
  testRoleData,  
  testPermissionData,
  createMockRepository,
  testHelpers,
  apiTestHelpers
};
/**
 * @fileoverview Test setup configuration for General service
 */

import { Sequelize } from 'sequelize';
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
  
  // 同步模型
  await sequelize.sync({ force: true });
  
  return sequelize;
};

// 清理測試資料庫
export const cleanupTestDb = async (sequelize: Sequelize): Promise<void> => {
  await sequelize.close();
};

// 測試用戶偏好數據
export const testUserPreferenceData = {
  userId: 1,
  theme: 'dark',
  language: 'zh-TW',
  timezone: 'Asia/Taipei',
  dateFormat: 'YYYY-MM-DD',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  dashboard: {
    layout: 'grid',
    widgets: ['weather', 'drone-status', 'alerts'],
    refreshInterval: 30
  },
  privacy: {
    dataSharing: false,
    analyticsOptIn: true,
    locationTracking: true
  },
  isActive: true,
  metadata: {
    lastUpdated: new Date(),
    source: 'manual'
  }
};

// 測試文檔數據
export const testDocumentData = {
  id: 'doc-001',
  title: 'Test Document',
  content: 'This is a test document content',
  category: 'general',
  tags: ['test', 'documentation'],
  createdAt: new Date(),
  updatedAt: new Date(),
  isPublished: true,
  author: 'test-user',
  metadata: {
    version: '1.0',
    format: 'markdown'
  }
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
   * 創建測試用戶偏好
   */
  createTestUserPreference: async (sequelize: Sequelize, preferenceData = testUserPreferenceData) => {
    const UserPreference = sequelize.models.UserPreference;
    return await UserPreference.create(preferenceData);
  },

  /**
   * 創建多個用戶偏好記錄
   */
  createMultipleUserPreferences: async (
    sequelize: Sequelize, 
    count: number = 5
  ) => {
    const preferences = [];
    for (let i = 0; i < count; i++) {
      const preference = await testHelpers.createTestUserPreference(sequelize, {
        ...testUserPreferenceData,
        userId: i + 1,
        theme: i % 2 === 0 ? 'dark' : 'light',
        language: i % 2 === 0 ? 'zh-TW' : 'en-US',
        metadata: {
          ...testUserPreferenceData.metadata,
          lastUpdated: new Date(Date.now() - i * 60000) // 每分鐘一個記錄
        }
      });
      preferences.push(preference);
    }
    return preferences;
  },

  /**
   * 創建測試文檔
   */
  createTestDocument: async (sequelize: Sequelize, documentData = testDocumentData) => {
    // 由於 General service 可能不使用 Sequelize 存儲文檔
    // 這裡返回模擬的文檔對象
    return {
      ...documentData,
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };
  },

  /**
   * 創建多個測試文檔
   */
  createMultipleDocuments: async (
    sequelize: Sequelize,
    count: number = 5
  ) => {
    const documents = [];
    for (let i = 0; i < count; i++) {
      const document = await testHelpers.createTestDocument(sequelize, {
        ...testDocumentData,
        id: `doc-${String(i + 1).padStart(3, '0')}`,
        title: `Test Document ${i + 1}`,
        content: `Content for test document ${i + 1}`,
        category: i % 2 === 0 ? 'general' : 'technical',
        createdAt: new Date(Date.now() - i * 60000)
      });
      documents.push(document);
    }
    return documents;
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

// 用戶偏好設置助手
export const preferenceHelpers = {
  /**
   * 創建有效的偏好設置對象
   */
  createValidPreferences: (overrides: any = {}) => ({
    ...testUserPreferenceData,
    ...overrides
  }),

  /**
   * 創建無效的偏好設置對象（用於錯誤測試）
   */
  createInvalidPreferences: () => ({
    userId: 'invalid-user-id', // 應該是數字
    theme: 'invalid-theme',     // 無效主題
    language: 'xx-XX',          // 無效語言代碼
    timezone: 'Invalid/Timezone', // 無效時區
    notifications: 'not-an-object', // 應該是對象
    dashboard: null,            // 應該是對象
    privacy: undefined          // 應該是對象
  }),

  /**
   * 驗證偏好設置結構
   */
  validatePreferenceStructure: (preference: any): boolean => {
    return (
      typeof preference.userId === 'number' &&
      typeof preference.theme === 'string' &&
      typeof preference.language === 'string' &&
      typeof preference.timezone === 'string' &&
      typeof preference.notifications === 'object' &&
      typeof preference.dashboard === 'object' &&
      typeof preference.privacy === 'object'
    );
  }
};

// 文檔助手
export const documentHelpers = {
  /**
   * 創建文檔搜尋條件
   */
  createSearchCriteria: (query: string, category?: string, tags?: string[]) => ({
    query,
    category,
    tags,
    includeUnpublished: false,
    sortBy: 'relevance',
    sortOrder: 'desc'
  }),

  /**
   * 模擬文檔搜尋結果
   */
  mockSearchResults: (documents: any[], query: string) => {
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * 驗證文檔結構
   */
  validateDocumentStructure: (document: any): boolean => {
    return (
      typeof document.id === 'string' &&
      typeof document.title === 'string' &&
      typeof document.content === 'string' &&
      typeof document.category === 'string' &&
      Array.isArray(document.tags)
    );
  }
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
  testUserPreferenceData,
  testDocumentData,
  createMockRepository,
  testHelpers,
  apiTestHelpers,
  preferenceHelpers,
  documentHelpers
};
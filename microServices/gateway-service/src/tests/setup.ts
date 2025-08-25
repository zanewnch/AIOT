/**
 * @fileoverview Test setup configuration for Gateway service
 */

import { Sequelize } from 'sequelize';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// 測試資料庫配置 (Gateway service may not use database, but included for completeness)
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

// 測試用戶數據
export const testUserData = {
  id: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  roles: ['user'],
  permissions: ['read', 'write'],
  isActive: true
};

// 測試管理員數據
export const testAdminData = {
  id: 2,
  username: 'admin',
  email: 'admin@example.com',
  roles: ['admin'],
  permissions: ['read', 'write', 'admin', 'manage'],
  isActive: true
};

// 測試服務配置數據
export const testServiceConfig = {
  name: 'test-service',
  url: 'http://localhost:3001',
  healthCheck: '/health',
  timeout: 5000,
  retries: 3,
  loadBalancer: {
    strategy: 'round-robin',
    healthCheckInterval: 30000
  }
};

// 測試微服務實例數據
export const testMicroserviceData = {
  serviceName: 'rbac-service',
  instances: [
    {
      id: 'rbac-1',
      host: 'localhost',
      port: 50051,
      protocol: 'grpc',
      healthy: true,
      lastHealthCheck: new Date()
    },
    {
      id: 'rbac-2',
      host: 'localhost',
      port: 50052,
      protocol: 'grpc', 
      healthy: true,
      lastHealthCheck: new Date()
    }
  ],
  loadBalancer: {
    strategy: 'round-robin',
    currentIndex: 0
  }
};

// 測試路由配置數據
export const testRouteConfig = {
  path: '/api/test',
  method: 'GET',
  target: 'test-service',
  middleware: ['auth', 'rateLimit'],
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  }
};

// Mock 函數工具
export const createMockRepositorysitorysitory = () => ({
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
   * 創建測試應用程序
   */
  createTestApp: (): express.Application => {
    const app = express();
    app.use(express.json());
    
    // Add basic CORS for testing
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Methods', '*');
      next();
    });
    
    return app;
  },

  /**
   * 創建測試 JWT Token
   */
  createTestJWT: (payload: any = testUserData, secret: string = 'test-secret', expiresIn: string = '1h') => {
    return jwt.sign(payload, secret, { expiresIn });
  },

  /**
   * 創建過期的 JWT Token
   */
  createExpiredJWT: (payload: any = testUserData, secret: string = 'test-secret') => {
    return jwt.sign(payload, secret, { expiresIn: '-1h' }); // Already expired
  },

  /**
   * 創建無效的 JWT Token
   */
  createInvalidJWT: () => {
    return 'invalid.jwt.token';
  },

  /**
   * 創建測試微服務實例
   */
  createTestMicroservice: (name: string, instances: any[] = []) => {
    return {
      serviceName: name,
      instances: instances.length > 0 ? instances : [{
        id: `${name}-1`,
        host: 'localhost',
        port: Math.floor(Math.random() * 10000) + 3000,
        protocol: 'http',
        healthy: true,
        lastHealthCheck: new Date()
      }],
      loadBalancer: {
        strategy: 'round-robin',
        currentIndex: 0
      }
    };
  },

  /**
   * 創建多個測試微服務
   */
  createMultipleMicroservices: (count: number = 3) => {
    const services = [];
    for (let i = 1; i <= count; i++) {
      services.push(testHelpers.createTestMicroservice(`service-${i}`));
    }
    return services;
  },

  /**
   * 創建測試代理請求
   */
  createProxyRequest: (target: string, path: string = '/test', method: string = 'GET') => {
    return {
      url: path,
      method,
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent'
      },
      body: method === 'POST' || method === 'PUT' ? { test: 'data' } : undefined
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
    delete: (url: string) => request(app).delete(url),
    patch: (url: string, data?: any) => request(app).patch(url).send(data)
  }),

  /**
   * 執行帶有認證的 API 請求
   */
  makeAuthenticatedRequest: (app: express.Application, token?: string) => {
    const authToken = token || testHelpers.createTestJWT();
    
    return {
      get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${authToken}`),
      post: (url: string, data?: any) => request(app).post(url).send(data).set('Authorization', `Bearer ${authToken}`),
      put: (url: string, data?: any) => request(app).put(url).send(data).set('Authorization', `Bearer ${authToken}`),
      delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${authToken}`),
      patch: (url: string, data?: any) => request(app).patch(url).send(data).set('Authorization', `Bearer ${authToken}`)
    };
  }
};

// 網關功能測試助手
export const gatewayHelpers = {
  /**
   * 模擬微服務健康檢查回應
   */
  mockHealthCheckResponse: (healthy: boolean = true) => ({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'mock-service',
    version: '1.0.0',
    uptime: Math.floor(Math.random() * 86400) // Random uptime in seconds
  }),

  /**
   * 模擬負載平衡器選擇
   */
  mockLoadBalancerSelection: (instances: any[], strategy: string = 'round-robin') => {
    if (instances.length === 0) return null;
    
    switch (strategy) {
      case 'round-robin':
        return instances[Math.floor(Math.random() * instances.length)];
      case 'random':
        return instances[Math.floor(Math.random() * instances.length)];
      case 'least-connections':
        // Mock implementation - return first instance
        return instances[0];
      default:
        return instances[0];
    }
  },

  /**
   * 模擬限流狀態
   */
  mockRateLimitStatus: (requests: number, limit: number, windowMs: number) => ({
    allowed: requests < limit,
    remaining: Math.max(0, limit - requests),
    resetTime: Date.now() + windowMs,
    totalHits: requests
  }),

  /**
   * 驗證代理請求格式
   */
  validateProxyRequest: (request: any): boolean => {
    return (
      typeof request.url === 'string' &&
      typeof request.method === 'string' &&
      typeof request.headers === 'object'
    );
  },

  /**
   * 創建測試中間件
   */
  createTestMiddleware: (name: string, shouldFail: boolean = false) => {
    return (req: any, res: any, next: any) => {
      req.testMiddleware = req.testMiddleware || [];
      req.testMiddleware.push(name);
      
      if (shouldFail) {
        return res.status(500).json({ error: `${name} middleware failed` });
      }
      
      next();
    };
  }
};

// 服務發現測試助手
export const serviceDiscoveryHelpers = {
  /**
   * 創建測試服務註冊數據
   */
  createServiceRegistration: (serviceName: string, overrides: any = {}) => ({
    name: serviceName,
    id: `${serviceName}-${Date.now()}`,
    address: overrides.address || 'localhost',
    port: overrides.port || Math.floor(Math.random() * 10000) + 3000,
    tags: overrides.tags || ['api', 'microservice'],
    check: {
      http: overrides.healthCheck || `http://localhost:${overrides.port || 3000}/health`,
      interval: '10s',
      timeout: '5s'
    },
    meta: {
      version: '1.0.0',
      environment: 'test'
    }
  }),

  /**
   * 模擬服務發現回應
   */
  mockServiceDiscoveryResponse: (services: string[]) => {
    return services.map(serviceName => 
      serviceDiscoveryHelpers.createServiceRegistration(serviceName)
    );
  },

  /**
   * 驗證服務註冊數據
   */
  validateServiceRegistration: (registration: any): boolean => {
    return (
      typeof registration.name === 'string' &&
      typeof registration.id === 'string' &&
      typeof registration.address === 'string' &&
      typeof registration.port === 'number' &&
      Array.isArray(registration.tags)
    );
  }
};

// 監控和日誌測試助手
export const monitoringHelpers = {
  /**
   * 創建測試度量數據
   */
  createTestMetrics: () => ({
    requests: {
      total: Math.floor(Math.random() * 10000),
      successful: Math.floor(Math.random() * 8000),
      failed: Math.floor(Math.random() * 2000),
      averageResponseTime: Math.floor(Math.random() * 1000)
    },
    services: {
      healthy: Math.floor(Math.random() * 5) + 1,
      unhealthy: Math.floor(Math.random() * 2),
      total: Math.floor(Math.random() * 7) + 1
    },
    system: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      uptime: Math.floor(Math.random() * 86400)
    }
  }),

  /**
   * 模擬請求日誌條目
   */
  mockRequestLog: (method: string = 'GET', path: string = '/test', statusCode: number = 200) => ({
    timestamp: new Date().toISOString(),
    method,
    path,
    statusCode,
    responseTime: Math.floor(Math.random() * 1000),
    userAgent: 'test-agent',
    ip: '127.0.0.1',
    service: 'test-service'
  }),

  /**
   * 驗證日誌格式
   */
  validateLogEntry: (logEntry: any): boolean => {
    return (
      typeof logEntry.timestamp === 'string' &&
      typeof logEntry.method === 'string' &&
      typeof logEntry.path === 'string' &&
      typeof logEntry.statusCode === 'number'
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
  testUserData,
  testAdminData,
  testServiceConfig,
  testMicroserviceData,
  testRouteConfig,
  createMockRepositorysitorysitory,
  testHelpers,
  apiTestHelpers,
  gatewayHelpers,
  serviceDiscoveryHelpers,
  monitoringHelpers
};
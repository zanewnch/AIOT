/**
 * @fileoverview Test setup configuration for Drone service
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

// 測試無人機數據
export const testDroneData = {
  droneId: 'drone-001',
  model: 'DJI Phantom 4',
  status: 'idle',
  batteryLevel: 85,
  lastHeartbeat: new Date(),
  isActive: true,
  firmware: '1.4.0',
  metadata: { owner: 'test-user' }
};

// 測試位置數據
export const testPositionData = {
  droneId: 'drone-001',
  latitude: 25.0330,
  longitude: 121.5654,
  altitude: 100.5,
  heading: 180.0,
  speed: 15.2,
  accuracy: 3.5,
  gpsStatus: '3d_fix',
  recordedAt: new Date(),
  metadata: { source: 'gps' }
};

// 測試指令數據
export const testCommandData = {
  droneId: 'drone-001',
  commandType: 'takeoff',
  parameters: { altitude: 10 },
  priority: 5,
  timeout: 30,
  status: 'pending',
  sentBy: 1,
  metadata: { reason: 'test-flight' }
};

// 測試無人機狀態數據
export const testDroneStatusData = {
  droneId: 'drone-001',
  model: 'DJI Phantom 4',
  status: 'idle',
  batteryLevel: 85,
  lastHeartbeat: new Date(),
  isActive: true,
  firmware: '1.4.0',
  serial: 'DJI-001-SN123',
  metadata: { owner: 'test-user' }
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
   * 創建測試無人機
   */
  createTestDrone: async (sequelize: Sequelize, droneData = testDroneData) => {
    const DroneStatus = sequelize.models.DroneStatus;
    return await DroneStatus.create(droneData);
  },

  /**
   * 創建測試位置記錄
   */
  createTestPosition: async (sequelize: Sequelize, positionData = testPositionData) => {
    const DronePosition = sequelize.models.DronePosition;
    return await DronePosition.create(positionData);
  },

  /**
   * 創建測試指令
   */
  createTestCommand: async (sequelize: Sequelize, commandData = testCommandData) => {
    const DroneCommand = sequelize.models.DroneCommand;
    return await DroneCommand.create(commandData);
  },

  /**
   * 創建多個位置記錄
   */
  createMultiplePositions: async (
    sequelize: Sequelize, 
    droneId: string, 
    count: number = 5
  ) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const position = await testHelpers.createTestPosition(sequelize, {
        ...testPositionData,
        droneId,
        recordedAt: new Date(Date.now() - i * 60000), // 每分鐘一個記錄
        latitude: testPositionData.latitude + i * 0.001,
        longitude: testPositionData.longitude + i * 0.001
      });
      positions.push(position);
    }
    return positions;
  },

  /**
   * 創建測試無人機狀態
   */
  createTestDroneStatus: async (sequelize: Sequelize, statusData = testDroneStatusData) => {
    const DroneStatus = sequelize.models.DroneStatus;
    return await DroneStatus.create(statusData);
  },

  /**
   * 創建多個無人機狀態記錄
   */
  createMultipleDroneStatuses: async (
    sequelize: Sequelize, 
    count: number = 5
  ) => {
    const statuses = [];
    for (let i = 0; i < count; i++) {
      const status = await testHelpers.createTestDroneStatus(sequelize, {
        ...testDroneStatusData,
        droneId: `drone-${String(i + 1).padStart(3, '0')}`,
        lastHeartbeat: new Date(Date.now() - i * 60000), // 每分鐘一個記錄
        batteryLevel: Math.max(10, testDroneStatusData.batteryLevel - i * 10)
      });
      statuses.push(status);
    }
    return statuses;
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

// 地理計算助手
export const geoHelpers = {
  /**
   * 計算兩點間距離（米）
   */
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // 地球半徑（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  /**
   * 生成隨機座標
   */
  generateRandomCoordinates: (centerLat: number, centerLon: number, radiusKm: number) => {
    const radiusInDegrees = radiusKm / 111;
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);
    
    return {
      latitude: centerLat + x,
      longitude: centerLon + y
    };
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
  testDroneData,
  testPositionData,
  testCommandData,
  createMockRepositorysitorysitory,
  testHelpers,
  apiTestHelpers,
  geoHelpers
};
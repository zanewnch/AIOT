/**
 * @fileoverview AIOT Shared Packages 主要導出文件
 * 
 * 統一導出所有共用的服務、工具函式、型別定義等，
 * 供各個微服務使用。
 * 
 * @module AIOTSharedPackages
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

// ===== Redis 相關服務 =====
export { 
    BaseRedisService, 
    type RedisConnectionOptions 
} from './BaseRedisService.js';

export { 
    redisConnectionManager, 
    getRedisClient, 
    initializeRedis 
} from './RedisConnectionManager.js';

// ===== 工具函式 =====
export { ResResult } from './utils/ResResult.js';

// ===== 配置檔案 =====
export { redisConfig } from './configs/RedisConfig.js';

// ===== 服務類別 =====
export { JwtBlacklistService, type Logger as JwtLogger } from './services/JwtBlacklistService.js';

// ===== 設計模式 =====
export { loggerDecorator, type Logger } from './patterns/LoggerDecorator.js';

// ===== 型別定義 (未來擴展) =====
// export * from './types/index.js';

// ===== 常數定義 (未來擴展) =====
// export * from './constants/index.js';

// ===== 中介軟體 (未來擴展) =====
// export * from './middleware/index.js';

/**
 * 套件版本資訊
 */
export const PACKAGE_VERSION = '1.0.0';

/**
 * 套件名稱
 */
export const PACKAGE_NAME = '@aiot/shared-packages';

/**
 * 套件資訊
 */
export const PACKAGE_INFO = {
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    description: 'AIOT 項目共用套件 - Redis 服務、工具函式、型別定義等',
    author: 'AIOT Team'
};
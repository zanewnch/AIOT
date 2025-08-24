/**
 * @fileoverview AIOT 服務專用快取策略
 * 為每個微服務提供定制化的快取策略和配置
 */

import { cacheManager, CacheOptions } from './redis-cache-manager';
import { Cacheable, CacheEvict, CacheWarmup, CacheStats } from './cache-decorators';

export interface ServiceCacheConfig {
  serviceName: string;
  defaultTtl: number;
  namespace: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

/**
 * RBAC 服務快取策略
 */
export class RBACCacheStrategy {
  private config: ServiceCacheConfig = {
    serviceName: 'rbac-service',
    defaultTtl: 1800, // 30分鐘
    namespace: 'rbac',
    tags: ['users', 'roles', 'permissions'],
    priority: 'high'
  };

  /**
   * 用戶權限快取 - 高頻訪問，短TTL
   */
  @Cacheable({
    ttl: 300, // 5分鐘
    namespace: 'rbac',
    tags: ['user-permissions'],
    priority: 'high',
    keyGenerator: (userId: string) => `user-permissions:${userId}`,
    condition: (userId: string) => !!userId
  })
  @CacheStats({ namespace: 'rbac', includeArgs: false })
  async getUserPermissions(userId: string): Promise<string[]> {
    // 實際的數據庫查詢會在這裡實現
    console.log(`Loading permissions for user: ${userId}`);
    return [];
  }

  /**
   * 用戶角色快取 - 中等頻率訪問，中等TTL
   */
  @Cacheable({
    ttl: 900, // 15分鐘
    namespace: 'rbac',
    tags: ['user-roles'],
    priority: 'medium',
    keyGenerator: (userId: string) => `user-roles:${userId}`,
    refreshAhead: 300 // 提前5分鐘刷新
  })
  async getUserRoles(userId: string): Promise<any[]> {
    console.log(`Loading roles for user: ${userId}`);
    return [];
  }

  /**
   * 角色權限映射快取 - 低頻變更，長TTL
   */
  @Cacheable({
    ttl: 3600, // 1小時
    namespace: 'rbac',
    tags: ['role-permissions'],
    priority: 'medium',
    keyGenerator: (roleId: string) => `role-permissions:${roleId}`
  })
  async getRolePermissions(roleId: string): Promise<string[]> {
    console.log(`Loading permissions for role: ${roleId}`);
    return [];
  }

  /**
   * 用戶信息更新 - 清除相關快取
   */
  @CacheEvict({
    tags: ['user-permissions', 'user-roles'],
    condition: (userId: string) => !!userId
  })
  async updateUser(userId: string, userData: any): Promise<void> {
    console.log(`Updating user: ${userId}`);
    // 更新邏輯
  }

  /**
   * 角色權限更新 - 清除角色相關快取
   */
  @CacheEvict({
    tags: ['role-permissions', 'user-permissions'],
    beforeInvocation: false
  })
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    console.log(`Updating permissions for role: ${roleId}`);
    // 更新邏輯
  }

  /**
   * 預熱用戶權限快取
   */
  @CacheWarmup({
    dataLoader: async () => {
      // 載入活躍用戶的權限數據
      const activeUsers = ['user1', 'user2', 'user3']; // 從數據庫獲取
      const warmupData = new Map();
      
      for (const userId of activeUsers) {
        const permissions = await this.getUserPermissions(userId);
        warmupData.set(`user-permissions:${userId}`, permissions);
      }
      
      return warmupData;
    },
    namespace: 'rbac',
    ttl: 1800
  })
  async warmupActiveUserPermissions(): Promise<void> {
    console.log('Warming up active user permissions...');
  }
}

/**
 * 無人機服務快取策略
 */
export class DroneCacheStrategy {
  private config: ServiceCacheConfig = {
    serviceName: 'drone-service',
    defaultTtl: 60, // 1分鐘（實時數據）
    namespace: 'drone',
    tags: ['drone-positions', 'drone-status', 'drone-commands'],
    priority: 'high'
  };

  /**
   * 無人機最新位置 - 極高頻訪問，極短TTL
   */
  @Cacheable({
    ttl: 30, // 30秒
    namespace: 'drone',
    tags: ['drone-positions'],
    priority: 'high',
    keyGenerator: (droneId: string) => `drone-latest-position:${droneId}`,
    refreshAhead: 10 // 提前10秒刷新
  })
  @CacheStats({ namespace: 'drone' })
  async getDroneLatestPosition(droneId: string): Promise<any> {
    console.log(`Loading latest position for drone: ${droneId}`);
    return {};
  }

  /**
   * 無人機狀態 - 高頻訪問，短TTL
   */
  @Cacheable({
    ttl: 120, // 2分鐘
    namespace: 'drone',
    tags: ['drone-status'],
    priority: 'high',
    keyGenerator: (droneId: string) => `drone-status:${droneId}`
  })
  async getDroneStatus(droneId: string): Promise<any> {
    console.log(`Loading status for drone: ${droneId}`);
    return {};
  }

  /**
   * 無人機軌跡 - 中頻訪問，可壓縮
   */
  @Cacheable({
    ttl: 600, // 10分鐘
    namespace: 'drone',
    tags: ['drone-trajectory'],
    priority: 'medium',
    compress: true,
    keyGenerator: (droneId: string, startTime: string, endTime: string) => 
      `drone-trajectory:${droneId}:${startTime}:${endTime}`
  })
  async getDroneTrajectory(droneId: string, startTime: string, endTime: string): Promise<any[]> {
    console.log(`Loading trajectory for drone: ${droneId}`);
    return [];
  }

  /**
   * 批量獲取無人機狀態
   */
  async getBatchDroneStatuses(droneIds: string[]): Promise<Map<string, any>> {
    const cacheKeys = droneIds.map(id => `drone-status:${id}`);
    const cached = await cacheManager.mget(cacheKeys, 'drone');
    
    const result = new Map();
    const missedIds: string[] = [];
    
    droneIds.forEach((id, index) => {
      const cachedValue = cached.get(cacheKeys[index]);
      if (cachedValue) {
        result.set(id, cachedValue);
      } else {
        missedIds.push(id);
      }
    });

    // 載入缺失的數據
    if (missedIds.length > 0) {
      const freshData = new Map();
      for (const id of missedIds) {
        const status = await this.getDroneStatus(id);
        freshData.set(`drone-status:${id}`, status);
        result.set(id, status);
      }
      
      // 批量設置快取
      await cacheManager.mset(freshData, {
        ttl: 120,
        namespace: 'drone',
        tags: ['drone-status'],
        priority: 'high'
      });
    }

    return result;
  }

  /**
   * 無人機位置更新 - 清除位置快取
   */
  @CacheEvict({
    keys: [], // 動態計算
    condition: (droneId: string) => !!droneId
  })
  async updateDronePosition(droneId: string, positionData: any): Promise<void> {
    // 清除特定無人機的位置快取
    await cacheManager.delete(`drone-latest-position:${droneId}`, 'drone');
    
    console.log(`Updating position for drone: ${droneId}`);
    // 更新邏輯
  }

  /**
   * 預熱活躍無人機數據
   */
  @CacheWarmup({
    dataLoader: async () => {
      const activeDrones = ['drone1', 'drone2', 'drone3']; // 從數據庫獲取
      const warmupData = new Map();
      
      for (const droneId of activeDrones) {
        const [position, status] = await Promise.all([
          this.getDroneLatestPosition(droneId),
          this.getDroneStatus(droneId)
        ]);
        
        warmupData.set(`drone-latest-position:${droneId}`, position);
        warmupData.set(`drone-status:${droneId}`, status);
      }
      
      return warmupData;
    },
    namespace: 'drone',
    ttl: 300
  })
  async warmupActiveDroneData(): Promise<void> {
    console.log('Warming up active drone data...');
  }
}

/**
 * 通用服務快取策略
 */
export class GeneralCacheStrategy {
  private config: ServiceCacheConfig = {
    serviceName: 'general-service',
    defaultTtl: 1800, // 30分鐘
    namespace: 'general',
    tags: ['user-preferences', 'system-config'],
    priority: 'medium'
  };

  /**
   * 用戶偏好設定 - 中頻訪問，中等TTL
   */
  @Cacheable({
    ttl: 1800, // 30分鐘
    namespace: 'general',
    tags: ['user-preferences'],
    priority: 'medium',
    keyGenerator: (userId: string, category?: string) => 
      category ? `user-preferences:${userId}:${category}` : `user-preferences:${userId}`,
    compress: true
  })
  async getUserPreferences(userId: string, category?: string): Promise<any> {
    console.log(`Loading preferences for user: ${userId}, category: ${category}`);
    return {};
  }

  /**
   * 系統配置 - 低頻變更，長TTL
   */
  @Cacheable({
    ttl: 7200, // 2小時
    namespace: 'general',
    tags: ['system-config'],
    priority: 'low',
    keyGenerator: (configKey: string) => `system-config:${configKey}`
  })
  async getSystemConfig(configKey: string): Promise<any> {
    console.log(`Loading system config: ${configKey}`);
    return {};
  }

  /**
   * 批量用戶偏好設定
   */
  async getBatchUserPreferences(userIds: string[]): Promise<Map<string, any>> {
    const cacheKeys = userIds.map(id => `user-preferences:${id}`);
    return await cacheManager.mget(cacheKeys, 'general');
  }

  /**
   * 更新用戶偏好 - 清除相關快取
   */
  @CacheEvict({
    keyGenerator: (userId: string, category?: string) => 
      category ? `user-preferences:${userId}:${category}` : `user-preferences:${userId}`,
    namespace: 'general'
  })
  async updateUserPreferences(userId: string, preferences: any, category?: string): Promise<void> {
    console.log(`Updating preferences for user: ${userId}`);
    // 更新邏輯
  }

  /**
   * 系統配置更新 - 清除配置快取
   */
  @CacheEvict({
    tags: ['system-config'],
    beforeInvocation: false
  })
  async updateSystemConfig(configKey: string, configValue: any): Promise<void> {
    console.log(`Updating system config: ${configKey}`);
    // 更新邏輯
  }
}

/**
 * 跨服務快取協調器
 */
export class CrossServiceCacheCoordinator {
  private strategies: Map<string, any> = new Map();

  constructor() {
    this.strategies.set('rbac', new RBACCacheStrategy());
    this.strategies.set('drone', new DroneCacheStrategy());
    this.strategies.set('general', new GeneralCacheStrategy());
  }

  /**
   * 獲取服務快取策略
   */
  getStrategy(serviceName: string): any {
    return this.strategies.get(serviceName);
  }

  /**
   * 跨服務快取失效
   */
  async invalidateAcrossServices(event: {
    type: string;
    resourceId: string;
    affectedServices: string[];
  }): Promise<void> {
    const { type, resourceId, affectedServices } = event;

    switch (type) {
      case 'user-deleted':
        // 用戶刪除影響 RBAC 和 General 服務
        await Promise.all([
          cacheManager.invalidateByTags([`user-${resourceId}`], 'rbac'),
          cacheManager.invalidateByTags([`user-${resourceId}`], 'general')
        ]);
        break;

      case 'role-updated':
        // 角色更新影響 RBAC 服務的多個快取
        await cacheManager.invalidateByTags(['role-permissions', 'user-permissions'], 'rbac');
        break;

      case 'drone-decommissioned':
        // 無人機退役清除所有相關快取
        await cacheManager.invalidateByTags([`drone-${resourceId}`], 'drone');
        break;

      default:
        console.warn(`Unknown cross-service cache invalidation event: ${type}`);
    }
  }

  /**
   * 獲取所有服務的快取統計
   */
  async getAllServiceStats(): Promise<Map<string, any>> {
    const stats = await cacheManager.getStats();
    const serviceStats = new Map();

    for (const [layerName, layerStats] of stats) {
      serviceStats.set(layerName, layerStats);
    }

    return serviceStats;
  }

  /**
   * 協調預熱所有服務快取
   */
  async coordinatedWarmup(): Promise<void> {
    const warmupPromises = [];

    for (const [serviceName, strategy] of this.strategies) {
      if (strategy.warmupActiveUserPermissions) {
        warmupPromises.push(strategy.warmupActiveUserPermissions());
      }
      if (strategy.warmupActiveDroneData) {
        warmupPromises.push(strategy.warmupActiveDroneData());
      }
    }

    await Promise.all(warmupPromises);
    console.log('Cross-service cache warmup completed');
  }
}

// 導出實例
export const rbacCacheStrategy = new RBACCacheStrategy();
export const droneCacheStrategy = new DroneCacheStrategy();
export const generalCacheStrategy = new GeneralCacheStrategy();
export const crossServiceCacheCoordinator = new CrossServiceCacheCoordinator();
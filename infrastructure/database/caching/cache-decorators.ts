/**
 * @fileoverview AIOT 快取裝飾器
 * 提供方法級快取、自動失效和智能預載功能
 */

import { cacheManager, CacheOptions } from './redis-cache-manager';
import { createHash } from 'crypto';

export interface CacheDecoratorOptions extends CacheOptions {
  keyGenerator?: (...args: any[]) => string;
  condition?: (...args: any[]) => boolean;
  unless?: (...args: any[]) => boolean;
  refreshAhead?: number; // 提前刷新時間（秒）
}

/**
 * 快取方法裝飾器
 */
export function Cacheable(options: CacheDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      // 檢查條件
      if (options.condition && !options.condition.apply(this, args)) {
        return await originalMethod.apply(this, args);
      }

      if (options.unless && options.unless.apply(this, args)) {
        return await originalMethod.apply(this, args);
      }

      // 生成快取鍵
      const cacheKey = options.keyGenerator 
        ? options.keyGenerator.apply(this, args)
        : generateCacheKey(className, methodName, args);

      try {
        // 嘗試從快取獲取
        const cached = await cacheManager.get(cacheKey, {
          namespace: options.namespace || 'method-cache',
          ...options
        });

        if (cached !== null) {
          // 檢查是否需要提前刷新
          if (options.refreshAhead) {
            setImmediate(async () => {
              await checkAndRefreshAhead(
                cacheKey, 
                originalMethod.bind(this, ...args), 
                options
              );
            });
          }

          return cached;
        }

        // 執行原方法並快取結果
        const result = await originalMethod.apply(this, args);
        
        if (result !== undefined) {
          await cacheManager.set(cacheKey, result, {
            namespace: options.namespace || 'method-cache',
            ...options
          });
        }

        return result;
      } catch (error) {
        console.error(`Cache decorator error for ${className}.${methodName}:`, error);
        // 快取失敗時直接執行原方法
        return await originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * 快取失效裝飾器
 */
export function CacheEvict(options: {
  key?: string;
  keys?: string[];
  tags?: string[];
  namespace?: string;
  condition?: (...args: any[]) => boolean;
  beforeInvocation?: boolean;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const shouldEvict = !options.condition || options.condition.apply(this, args);
      
      if (shouldEvict && options.beforeInvocation) {
        await performEviction(options, className, methodName, args);
      }

      try {
        const result = await originalMethod.apply(this, args);
        
        if (shouldEvict && !options.beforeInvocation) {
          await performEviction(options, className, methodName, args);
        }

        return result;
      } catch (error) {
        // 如果設置了beforeInvocation但方法失敗，可能需要回滾快取
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 快取預熱裝飾器
 */
export function CacheWarmup(options: {
  keys?: string[];
  dataLoader?: () => Promise<Map<string, any>>;
  schedule?: string; // Cron 表達式
  namespace?: string;
  ttl?: number;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // 在類初始化時設置預熱
    if (options.schedule) {
      // 這裡可以整合 node-cron 或其他調度器
      console.log(`Warmup scheduled for ${target.constructor.name}.${propertyKey}: ${options.schedule}`);
    }

    descriptor.value = async function (...args: any[]) {
      // 檢查是否需要預熱
      if (options.dataLoader && (!options.keys || options.keys.length === 0)) {
        try {
          await cacheManager.warmup(options.dataLoader, {
            namespace: options.namespace || 'warmup-cache',
            ttl: options.ttl || 3600,
            priority: 'high'
          });
        } catch (error) {
          console.error('Cache warmup failed:', error);
        }
      }

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 分佈式鎖裝飾器（防止快取穿透）
 */
export function DistributedLock(options: {
  key?: string;
  timeout?: number;
  retryDelay?: number;
  maxRetries?: number;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const lockKey = options.key 
        ? options.key 
        : `lock:${className}:${methodName}:${generateCacheKey('', '', args)}`;
      
      const timeout = options.timeout || 30000; // 30秒預設
      const retryDelay = options.retryDelay || 100;
      const maxRetries = options.maxRetries || 10;

      let acquired = false;
      let retries = 0;

      try {
        // 嘗試獲取鎖
        while (!acquired && retries < maxRetries) {
          acquired = await acquireLock(lockKey, timeout);
          
          if (!acquired) {
            retries++;
            await sleep(retryDelay * Math.pow(2, retries)); // 指數退避
          }
        }

        if (!acquired) {
          throw new Error(`Failed to acquire lock for ${lockKey} after ${maxRetries} retries`);
        }

        // 執行原方法
        return await originalMethod.apply(this, args);
      } finally {
        // 釋放鎖
        if (acquired) {
          await releaseLock(lockKey);
        }
      }
    };

    return descriptor;
  };
}

/**
 * 快取統計裝飾器
 */
export function CacheStats(options: {
  namespace?: string;
  includeArgs?: boolean;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;
    const statsKey = `stats:${className}:${methodName}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const endTime = Date.now();
        
        // 記錄統計信息
        await recordStats(statsKey, {
          executionTime: endTime - startTime,
          success: true,
          timestamp: new Date().toISOString(),
          args: options.includeArgs ? args : undefined
        });

        return result;
      } catch (error) {
        const endTime = Date.now();
        
        // 記錄錯誤統計
        await recordStats(statsKey, {
          executionTime: endTime - startTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          args: options.includeArgs ? args : undefined
        });

        throw error;
      }
    };

    return descriptor;
  };
}

// 輔助函數

function generateCacheKey(className: string, methodName: string, args: any[]): string {
  const argsHash = createHash('md5')
    .update(JSON.stringify(args))
    .digest('hex')
    .substring(0, 8);
  
  return `${className}:${methodName}:${argsHash}`;
}

async function checkAndRefreshAhead(
  cacheKey: string, 
  refreshFunction: () => Promise<any>, 
  options: CacheDecoratorOptions
): Promise<void> {
  try {
    // 檢查快取的剩餘TTL
    const layers = (cacheManager as any).layers;
    if (!layers) return;

    for (const layer of layers.values()) {
      const ttl = await layer.redis.ttl(cacheKey);
      
      if (ttl > 0 && ttl <= (options.refreshAhead || 300)) {
        console.log(`Refreshing cache ahead for key: ${cacheKey}`);
        
        const newValue = await refreshFunction();
        await cacheManager.set(cacheKey, newValue, {
          namespace: options.namespace || 'method-cache',
          ...options
        });
        
        break;
      }
    }
  } catch (error) {
    console.error('Cache refresh-ahead failed:', error);
  }
}

async function performEviction(
  options: any, 
  className: string, 
  methodName: string, 
  args: any[]
): Promise<void> {
  try {
    if (options.tags && options.tags.length > 0) {
      await cacheManager.invalidateByTags(options.tags, options.namespace);
    }

    if (options.key) {
      await cacheManager.delete(options.key, options.namespace || 'method-cache');
    }

    if (options.keys && options.keys.length > 0) {
      const promises = options.keys.map((key: string) => 
        cacheManager.delete(key, options.namespace || 'method-cache')
      );
      await Promise.all(promises);
    }

    // 預設行為：清除該方法的所有快取
    if (!options.key && !options.keys && !options.tags) {
      const methodCacheKey = generateCacheKey(className, methodName, args);
      await cacheManager.delete(methodCacheKey, options.namespace || 'method-cache');
    }
  } catch (error) {
    console.error('Cache eviction failed:', error);
  }
}

async function acquireLock(lockKey: string, timeout: number): Promise<boolean> {
  try {
    // 使用 SET NX PX 原子操作獲取鎖
    const layers = (cacheManager as any).layers;
    if (!layers) return false;

    const lockLayer = layers.get('L1_HOT');
    if (!lockLayer) return false;

    const lockValue = Date.now().toString();
    const result = await lockLayer.redis.set(lockKey, lockValue, 'PX', timeout, 'NX');
    
    return result === 'OK';
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return false;
  }
}

async function releaseLock(lockKey: string): Promise<void> {
  try {
    const layers = (cacheManager as any).layers;
    if (!layers) return;

    const lockLayer = layers.get('L1_HOT');
    if (!lockLayer) return;

    await lockLayer.redis.del(lockKey);
  } catch (error) {
    console.error('Failed to release lock:', error);
  }
}

async function recordStats(statsKey: string, stats: any): Promise<void> {
  try {
    const layers = (cacheManager as any).layers;
    if (!layers) return;

    const statsLayer = layers.get('L4_PERSISTENT');
    if (!statsLayer) return;

    // 使用 Redis 的有序集合記錄統計信息
    const timestamp = Date.now();
    await statsLayer.redis.zadd(statsKey, timestamp, JSON.stringify(stats));
    
    // 只保留最近1000條記錄
    await statsLayer.redis.zremrangebyrank(statsKey, 0, -1001);
  } catch (error) {
    console.error('Failed to record stats:', error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {
  generateCacheKey,
  checkAndRefreshAhead,
  performEviction,
  acquireLock,
  releaseLock,
  recordStats
};
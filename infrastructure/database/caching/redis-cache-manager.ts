/**
 * @fileoverview AIOT Redis多層快取管理器
 * 提供分層快取策略、智能失效機制和性能監控
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  namespace?: string;
  priority?: 'low' | 'medium' | 'high';
  revalidate?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalMemory: number;
  usedMemory: number;
}

export interface CacheLayer {
  name: string;
  redis: Redis;
  ttl: number;
  priority: number;
}

/**
 * Redis多層快取管理器
 */
export class RedisCacheManager {
  private layers: Map<string, CacheLayer> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private compressionThreshold = 1024; // 1KB以上壓縮
  
  constructor() {
    this.initializeLayers();
    this.startStatsCollection();
  }

  /**
   * 初始化快取層
   */
  private initializeLayers(): void {
    // L1: 熱數據快取 (1分鐘TTL)
    this.addLayer('L1_HOT', {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      maxmemory: '256mb',
      'maxmemory-policy': 'allkeys-lru'
    }, 60, 3);

    // L2: 溫數據快取 (15分鐘TTL)
    this.addLayer('L2_WARM', {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      maxmemory: '512mb',
      'maxmemory-policy': 'allkeys-lru'
    }, 900, 2);

    // L3: 冷數據快取 (1小時TTL)
    this.addLayer('L3_COLD', {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 2,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      maxmemory: '1gb',
      'maxmemory-policy': 'allkeys-lru'
    }, 3600, 1);

    // L4: 持久快取 (24小時TTL)
    this.addLayer('L4_PERSISTENT', {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 3,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      'maxmemory-policy': 'noeviction'
    }, 86400, 0);
  }

  /**
   * 添加快取層
   */
  private addLayer(name: string, config: any, ttl: number, priority: number): void {
    const redis = new Redis(config);
    
    redis.on('error', (error) => {
      console.error(`Redis layer ${name} error:`, error);
    });

    redis.on('connect', () => {
      console.log(`Redis layer ${name} connected`);
    });

    this.layers.set(name, {
      name,
      redis,
      ttl,
      priority
    });

    this.stats.set(name, {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      totalMemory: 0,
      usedMemory: 0
    });
  }

  /**
   * 智能快取存取
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { namespace = 'default' } = options;
    const cacheKey = this.buildKey(key, namespace);
    
    // 按優先級順序查找
    const sortedLayers = Array.from(this.layers.values()).sort((a, b) => b.priority - a.priority);
    
    for (const layer of sortedLayers) {
      try {
        const cached = await layer.redis.get(cacheKey);
        
        if (cached) {
          // 更新統計
          const stats = this.stats.get(layer.name)!;
          stats.hits++;
          this.updateHitRate(layer.name);
          
          // 解壓縮和反序列化
          const value = await this.deserialize(cached);
          
          // 如果在較低層找到，提升到更高層
          if (layer.priority < 3) {
            await this.promoteToHigherLayer(cacheKey, value, options);
          }
          
          return value;
        } else {
          // 記錄未命中
          const stats = this.stats.get(layer.name)!;
          stats.misses++;
          this.updateHitRate(layer.name);
        }
      } catch (error) {
        console.error(`Cache get error in layer ${layer.name}:`, error);
      }
    }
    
    return null;
  }

  /**
   * 智能快取設置
   */
  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const { 
      ttl, 
      namespace = 'default', 
      priority = 'medium',
      tags = [],
      compress = true
    } = options;
    
    const cacheKey = this.buildKey(key, namespace);
    const serialized = await this.serialize(value, compress);
    
    // 根據優先級和數據大小選擇層
    const targetLayers = this.selectTargetLayers(serialized.length, priority, ttl);
    
    const promises = targetLayers.map(async (layer) => {
      try {
        const layerTtl = ttl || layer.ttl;
        
        // 設置主數據
        await layer.redis.setex(cacheKey, layerTtl, serialized);
        
        // 設置標籤映射（用於批量失效）
        if (tags.length > 0) {
          await this.setTagMappings(layer, cacheKey, tags, layerTtl);
        }
        
        // 更新統計
        const stats = this.stats.get(layer.name)!;
        stats.sets++;
        
        return true;
      } catch (error) {
        console.error(`Cache set error in layer ${layer.name}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(promises);
    return results.some(result => result);
  }

  /**
   * 刪除快取
   */
  async delete(key: string, namespace: string = 'default'): Promise<boolean> {
    const cacheKey = this.buildKey(key, namespace);
    
    const promises = Array.from(this.layers.values()).map(async (layer) => {
      try {
        const deleted = await layer.redis.del(cacheKey);
        
        if (deleted > 0) {
          const stats = this.stats.get(layer.name)!;
          stats.deletes++;
        }
        
        return deleted > 0;
      } catch (error) {
        console.error(`Cache delete error in layer ${layer.name}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(promises);
    return results.some(result => result);
  }

  /**
   * 基於標籤批量失效
   */
  async invalidateByTags(tags: string[], namespace: string = 'default'): Promise<number> {
    let totalInvalidated = 0;
    
    for (const layer of this.layers.values()) {
      try {
        for (const tag of tags) {
          const tagKey = this.buildTagKey(tag, namespace);
          const keys = await layer.redis.smembers(tagKey);
          
          if (keys.length > 0) {
            // 批量刪除
            const pipeline = layer.redis.pipeline();
            keys.forEach(key => pipeline.del(key));
            pipeline.del(tagKey); // 也刪除標籤集合
            
            const results = await pipeline.exec();
            totalInvalidated += results?.filter(r => r && r[1] as number > 0).length || 0;
          }
        }
      } catch (error) {
        console.error(`Tag invalidation error in layer ${layer.name}:`, error);
      }
    }
    
    return totalInvalidated;
  }

  /**
   * 批量操作
   */
  async mget<T = any>(keys: string[], namespace: string = 'default'): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();
    const cacheKeys = keys.map(key => this.buildKey(key, namespace));
    
    // 在最高優先級層執行批量獲取
    const highestLayer = Array.from(this.layers.values()).sort((a, b) => b.priority - a.priority)[0];
    
    try {
      const values = await highestLayer.redis.mget(cacheKeys);
      
      for (let i = 0; i < keys.length; i++) {
        const value = values[i];
        if (value) {
          result.set(keys[i], await this.deserialize(value));
        } else {
          result.set(keys[i], null);
        }
      }
    } catch (error) {
      console.error('Batch get error:', error);
      // 逐個獲取作為備選
      for (const key of keys) {
        result.set(key, await this.get(key, { namespace }));
      }
    }
    
    return result;
  }

  /**
   * 批量設置
   */
  async mset<T = any>(data: Map<string, T>, options: CacheOptions = {}): Promise<boolean> {
    const { namespace = 'default', ttl } = options;
    
    const promises = Array.from(data.entries()).map(([key, value]) => 
      this.set(key, value, { ...options, namespace, ttl })
    );
    
    const results = await Promise.all(promises);
    return results.every(result => result);
  }

  /**
   * 緩存預熱
   */
  async warmup<T = any>(
    dataLoader: () => Promise<Map<string, T>>, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      console.log('Starting cache warmup...');
      const data = await dataLoader();
      
      await this.mset(data, {
        ...options,
        priority: 'high',
        ttl: options.ttl || 3600 // 1小時預設TTL
      });
      
      console.log(`Cache warmup completed: ${data.size} items loaded`);
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  /**
   * 獲取快取統計
   */
  async getStats(): Promise<Map<string, CacheStats & { memoryInfo: any }>> {
    const result = new Map();
    
    for (const [layerName, layer] of this.layers) {
      try {
        const info = await layer.redis.info('memory');
        const memoryInfo = this.parseRedisInfo(info);
        
        const stats = this.stats.get(layerName)!;
        result.set(layerName, {
          ...stats,
          memoryInfo
        });
      } catch (error) {
        console.error(`Failed to get stats for layer ${layerName}:`, error);
      }
    }
    
    return result;
  }

  /**
   * 清理過期快取
   */
  async cleanup(): Promise<void> {
    for (const layer of this.layers.values()) {
      try {
        // 清理過期的標籤映射
        const tagKeys = await layer.redis.keys('tag:*');
        
        if (tagKeys.length > 0) {
          const pipeline = layer.redis.pipeline();
          
          for (const tagKey of tagKeys) {
            // 檢查標籤對應的鍵是否還存在
            const mappedKeys = await layer.redis.smembers(tagKey);
            const existingKeys = [];
            
            for (const mappedKey of mappedKeys) {
              const exists = await layer.redis.exists(mappedKey);
              if (exists) {
                existingKeys.push(mappedKey);
              }
            }
            
            if (existingKeys.length === 0) {
              // 如果沒有對應的鍵存在，刪除標籤
              pipeline.del(tagKey);
            } else if (existingKeys.length < mappedKeys.length) {
              // 如果部分鍵不存在，更新標籤集合
              pipeline.del(tagKey);
              if (existingKeys.length > 0) {
                pipeline.sadd(tagKey, ...existingKeys);
              }
            }
          }
          
          await pipeline.exec();
        }
      } catch (error) {
        console.error(`Cleanup error in layer ${layer.name}:`, error);
      }
    }
  }

  /**
   * 關閉所有連接
   */
  async disconnect(): Promise<void> {
    const promises = Array.from(this.layers.values()).map(layer => 
      layer.redis.quit()
    );
    
    await Promise.all(promises);
    console.log('All Redis cache layers disconnected');
  }

  // 私有方法

  private buildKey(key: string, namespace: string): string {
    const hash = createHash('md5').update(key).digest('hex').substring(0, 8);
    return `${namespace}:${hash}:${key}`;
  }

  private buildTagKey(tag: string, namespace: string): string {
    return `tag:${namespace}:${tag}`;
  }

  private async serialize(value: any, compress: boolean): Promise<string> {
    const json = JSON.stringify(value);
    
    if (compress && json.length > this.compressionThreshold) {
      const zlib = await import('zlib');
      const compressed = zlib.gzipSync(json);
      return 'gzip:' + compressed.toString('base64');
    }
    
    return json;
  }

  private async deserialize(data: string): Promise<any> {
    if (data.startsWith('gzip:')) {
      const zlib = await import('zlib');
      const compressed = Buffer.from(data.substring(5), 'base64');
      const decompressed = zlib.gunzipSync(compressed).toString();
      return JSON.parse(decompressed);
    }
    
    return JSON.parse(data);
  }

  private selectTargetLayers(dataSize: number, priority: string, customTtl?: number): CacheLayer[] {
    const layers = Array.from(this.layers.values());
    
    // 基於優先級和數據大小選擇層
    switch (priority) {
      case 'high':
        return customTtl && customTtl < 300 
          ? [layers.find(l => l.name === 'L1_HOT')!]
          : layers.slice(0, 3); // L1, L2, L3
      
      case 'medium':
        return dataSize > 10240 // 10KB
          ? [layers.find(l => l.name === 'L3_COLD')!]
          : layers.slice(1, 3); // L2, L3
      
      case 'low':
        return [layers.find(l => l.name === 'L4_PERSISTENT')!];
      
      default:
        return [layers.find(l => l.name === 'L2_WARM')!];
    }
  }

  private async promoteToHigherLayer(key: string, value: any, options: CacheOptions): Promise<void> {
    const hotLayer = this.layers.get('L1_HOT');
    if (hotLayer) {
      try {
        const serialized = await this.serialize(value, options.compress || true);
        await hotLayer.redis.setex(key, hotLayer.ttl, serialized);
      } catch (error) {
        console.error('Failed to promote to hot layer:', error);
      }
    }
  }

  private async setTagMappings(layer: CacheLayer, key: string, tags: string[], ttl: number): Promise<void> {
    const pipeline = layer.redis.pipeline();
    
    tags.forEach(tag => {
      const tagKey = this.buildTagKey(tag, 'default');
      pipeline.sadd(tagKey, key);
      pipeline.expire(tagKey, ttl + 60); // 標籤過期時間比數據長一點
    });
    
    await pipeline.exec();
  }

  private updateHitRate(layerName: string): void {
    const stats = this.stats.get(layerName)!;
    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });
    
    return result;
  }

  private startStatsCollection(): void {
    // 每分鐘更新一次內存統計
    setInterval(async () => {
      for (const [layerName, layer] of this.layers) {
        try {
          const info = await layer.redis.info('memory');
          const memoryInfo = this.parseRedisInfo(info);
          
          const stats = this.stats.get(layerName)!;
          stats.totalMemory = memoryInfo.maxmemory || 0;
          stats.usedMemory = memoryInfo.used_memory || 0;
        } catch (error) {
          // 忽略統計錯誤
        }
      }
    }, 60000);
  }
}

// 單例實例
export const cacheManager = new RedisCacheManager();
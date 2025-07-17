import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

/**
 * Redis 連線配置
 * ==================
 * 
 * 用於管理 Redis 連線實例，提供連線、斷線等功能
 * 主要用途：
 * - 會話管理 (Session Management)
 * - 快取資料 (Cache)
 * - 臨時資料存儲
 */

class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * 取得 RedisConfig 單例實例
   */
  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  /**
   * 建立 Redis 連線
   */
  public async connect(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        return;
      }

      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
      });

      // 設置錯誤處理
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis Client Ready');
      });

      this.client.on('end', () => {
        console.log('Redis Client Connection Ended');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * 取得 Redis 客戶端實例
   */
  public getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected. Please call connect() first.');
    }
    return this.client;
  }

  /**
   * 斷開 Redis 連線
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('Redis Client Disconnected');
    }
  }

  /**
   * 檢查連線狀態
   */
  public isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// 匯出單例實例
export const redisConfig = RedisConfig.getInstance();

// 匯出便利方法
export const getRedisClient = (): RedisClientType => {
  return redisConfig.getClient();
};
/**
 * @fileoverview Redis 快取資料庫配置模組
 * 此模組提供 Redis 連接管理和客戶端實例的單例模式實現
 * 用於會話管理、快取資料和臨時資料存儲
 */

import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

/**
 * Redis 連線配置類別
 * 使用單例模式管理 Redis 連接，確保整個應用程式只有一個 Redis 連接實例
 */
class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

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
    if (this.isConnected) {
      console.log('Redis already connected');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://aiot-redis:6379/0';
      
      this.client = createClient({
        url: redisUrl
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis server');
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * 斷開 Redis 連線
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('✅ Redis connection closed');
    }
  }

  /**
   * 取得 Redis 客戶端實例
   */
  public getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * 檢查連接狀態
   */
  public isClientConnected(): boolean {
    return this.isConnected;
  }
}

// 匯出單例實例
export const redisConfig = RedisConfig.getInstance();
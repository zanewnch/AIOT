/**
 * @fileoverview Redis 連線管理服務
 * 
 * 提供統一的 Redis 連線初始化邏輯，供所有微服務使用。
 * 實現單例模式，確保整個應用程式只有一個 Redis 連接實例。
 * 
 * 功能特點：
 * - 統一的 Redis 連線配置和管理
 * - 自動錯誤處理和重連機制
 * - 標準化的日誌記錄
 * - 環境變數配置支援
 * 
 * @module RedisConnectionManager
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

/**
 * Redis 連線管理器
 * 
 * 提供統一的 Redis 連線管理和客戶端實例的單例模式實現
 * 用於會話管理、快取資料和臨時資料存儲
 * 
 * @class RedisConnectionManager
 * @since 1.0.0
 */
class RedisConnectionManager {
  /** 單例實例靜態屬性 */
  private static instance: RedisConnectionManager;
  /** Redis 客戶端實例，初始為 null */
  private client: RedisClientType | null = null;
  /** 連接狀態標記，初始為 false */
  private isConnected: boolean = false;

  /** 私有建構函式，防止外部直接實例化 */
  private constructor() {}

  /**
   * 取得 RedisConnectionManager 單例實例
   * 如果實例不存在則建立新實例，確保全域唯一性
   * @returns {RedisConnectionManager} Redis 連線管理器單例實例
   */
  public static getInstance(): RedisConnectionManager {
    // 檢查是否已經存在實例
    if (!RedisConnectionManager.instance) {
      // 如果不存在，建立新的實例
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    // 返回單例實例
    return RedisConnectionManager.instance;
  }

  /**
   * 建立 Redis 連線
   * 使用環境變數配置連接參數，設定事件監聽器
   * @returns {Promise<void>} 無返回值的 Promise
   */
  public async connect(): Promise<void> {
    try {
      // 檢查是否已經連接，如果已連接則直接返回
      if (this.isConnected && this.client) {
        return;
      }

      // 建立 Redis 客戶端實例，配置連接參數
      this.client = createClient({
        // 設定 Socket 連接配置
        socket: {
          // 從環境變數獲取主機位址，docker 環境下使用容器名稱
          host: process.env.REDIS_HOST || 'aiot-redis',
          // 從環境變數獲取埠號並轉換為整數，預設為 6379
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        // 從環境變數獲取密碼，如果沒有則為 undefined
        password: process.env.REDIS_PASSWORD || undefined,
        // 從環境變數獲取資料庫編號並轉換為整數，預設為 0
        database: parseInt(process.env.REDIS_DB || '0'),
      });

      // 設置錯誤事件監聽器
      this.client.on('error', (err) => {
        // 記錄錯誤訊息到控制台
        console.error('Redis Client Error:', err);
        // 設定連接狀態為 false
        this.isConnected = false;
      });

      // 設置連接成功事件監聽器
      this.client.on('connect', () => {
        // 記錄連接成功訊息
        console.log('Redis Client Connected');
        // 設定連接狀態為 true
        this.isConnected = true;
      });

      // 設置準備就緒事件監聽器
      this.client.on('ready', () => {
        // 記錄準備就緒訊息
        console.log('Redis Client Ready');
      });

      // 設置連接結束事件監聽器
      this.client.on('end', () => {
        // 記錄連接結束訊息
        console.log('Redis Client Connection Ended');
        // 設定連接狀態為 false
        this.isConnected = false;
      });

      // 實際建立連接到 Redis 伺服器
      await this.client.connect();
    } catch (error) {
      // 記錄連接失敗錯誤
      console.error('Failed to connect to Redis:', error);
      // 重新拋出錯誤給調用者
      throw error;
    }
  }

  /**
   * 取得 Redis 客戶端實例
   * 檢查連接狀態後返回客戶端實例
   * @returns {RedisClientType} Redis 客戶端實例
   * @throws {Error} 當客戶端未連接時拋出錯誤
   */
  public getClient(): RedisClientType {
    // 檢查客戶端是否存在且已連接
    if (!this.client || !this.isConnected) {
      // 如果未連接，拋出錯誤提示需要先連接
      throw new Error('Redis client is not connected. Please call connect() first.');
    }
    // 返回客戶端實例
    return this.client;
  }

  /**
   * 斷開 Redis 連線
   * 優雅地關閉連接並清理資源
   * @returns {Promise<void>} 無返回值的 Promise
   */
  public async disconnect(): Promise<void> {
    // 檢查客戶端是否存在且已連接
    if (this.client && this.isConnected) {
      // 優雅地關閉連接
      await this.client.quit();
      // 清空客戶端實例
      this.client = null;
      // 設定連接狀態為 false
      this.isConnected = false;
      // 記錄斷開連接訊息
      console.log('Redis Client Disconnected');
    }
  }

  /**
   * 檢查連線狀態
   * 返回當前 Redis 連接是否可用
   * @returns {boolean} 連接狀態，true 表示已連接，false 表示未連接
   */
  public isClientConnected(): boolean {
    // 檢查連接狀態和客戶端實例是否都存在
    return this.isConnected && this.client !== null;
  }
}

// 匯出單例實例，供其他模組使用
export const redisConnectionManager = RedisConnectionManager.getInstance();

/**
 * 便利方法：取得 Redis 客戶端實例
 * 提供簡化的方式取得 Redis 客戶端，無需直接操作 redisConnectionManager 物件
 * @returns {RedisClientType} Redis 客戶端實例
 */
export const getRedisClient = (): RedisClientType => {
  // 通過 redisConnectionManager 單例取得客戶端實例
  return redisConnectionManager.getClient();
};

/**
 * 便利方法：初始化 Redis 連線
 * 提供統一的初始化邏輯，供各微服務在啟動時調用
 * @returns {Promise<void>} 無返回值的 Promise
 */
export const initializeRedis = async (): Promise<void> => {
  try {
    await redisConnectionManager.connect();
    console.log('Redis connection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis connection:', error);
    // 不拋出錯誤，允許服務在沒有 Redis 的情況下繼續運行
  }
};
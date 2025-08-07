/**
 * @fileoverview RabbitMQ 訊息佇列配置模組
 * 此模組提供 RabbitMQ 訊息佇列的配置和管理功能
 * 用於 IoT 設備事件和資料的異步訊息處理
 */

// 匯入 AMQP 函式庫用於 RabbitMQ 連接和操作
import amqp from 'amqplib';

/**
 * RabbitMQ 配置介面
 * 定義訊息佇列系統的完整配置結構
 */
export interface RabbitMQConfig {
  /** RabbitMQ 伺服器連接 URL */
  url: string;
  /** 交換器配置，用於訊息路由 */
  exchanges: {
    /** 設備事件交換器名稱 */
    DEVICE_EVENTS: string;
    /** 設備資料交換器名稱 */
    DEVICE_DATA: string;
  };
  /** 佇列配置，用於訊息儲存 */
  queues: {
    /** 設備命令佇列名稱 */
    DEVICE_COMMANDS: string;
    /** 設備事件佇列名稱 */
    DEVICE_EVENTS: string;
    /** 設備資料佇列名稱 */
    DEVICE_DATA: string;
  };
  /** 路由鍵配置，用於訊息分類 */
  routingKeys: {
    /** 設備離線路由鍵 */
    DEVICE_OFFLINE: string;
    /** 閾值超標路由鍵 */
    THRESHOLD_EXCEEDED: string;
    /** 設備狀態路由鍵 */
    DEVICE_STATUS: string;
    /** 感測器資料路由鍵 */
    SENSOR_DATA: string;
  };
}

/**
 * 獲取 RabbitMQ 配置物件
 * 從環境變數中讀取 RabbitMQ 連接參數並設定預設的交換器、佇列和路由鍵
 * @returns {RabbitMQConfig} 完整的 RabbitMQ 配置物件
 */
export const getRabbitMQConfig = (): RabbitMQConfig => ({
  // 從環境變數獲取 RabbitMQ 連接 URL，預設為本地端連接
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  // 定義訊息交換器配置
  exchanges: {
    // 設備事件交換器，用於處理設備狀態變化
    DEVICE_EVENTS: 'device.events',
    // 設備資料交換器，用於處理感測器資料
    DEVICE_DATA: 'device.data',
  },
  // 定義訊息佇列配置
  queues: {
    // 設備命令佇列，用於接收發送給設備的命令
    DEVICE_COMMANDS: 'device.commands',
    // 設備事件佇列，用於處理設備事件訊息
    DEVICE_EVENTS: 'device.events.queue',
    // 設備資料佇列，用於處理設備資料訊息
    DEVICE_DATA: 'device.data.queue',
  },
  // 定義路由鍵配置，用於訊息分類和路由
  routingKeys: {
    // 設備離線事件路由鍵
    DEVICE_OFFLINE: 'device.offline',
    // 閾值超標事件路由鍵
    THRESHOLD_EXCEEDED: 'threshold.exceeded',
    // 設備狀態更新路由鍵
    DEVICE_STATUS: 'device.status',
    // 感測器資料路由鍵
    SENSOR_DATA: 'sensor.data',
  }
});

/**
 * RabbitMQ 管理器類別
 * 提供 RabbitMQ 連接、通道管理和拓撲設定功能
 */
export class RabbitMQManager {
  /** RabbitMQ 連接實例 */
  private connection: any = null;
  /** RabbitMQ 通道實例 */
  private channel: any = null;
  /** RabbitMQ 配置物件 */
  private config: RabbitMQConfig;

  /**
   * 建構函式
   * 初始化 RabbitMQ 管理器並載入配置
   */
  constructor() {
    // 載入 RabbitMQ 配置
    this.config = getRabbitMQConfig();
  }

  /**
   * 建立 RabbitMQ 連接和通道
   * 如果連接不存在則建立新連接，如果通道不存在則建立新通道
   * @returns {Promise<any>} 返回 RabbitMQ 通道實例
   */
  async connect(): Promise<any> {
    try {
      // 檢查是否已有連接，如果沒有則建立新連接
      if (!this.connection) {
        // 使用配置的 URL 建立 RabbitMQ 連接
        this.connection = await amqp.connect(this.config.url);
        
        // 設定連接錯誤事件監聽器
        this.connection.on('error', (err: Error) => {
          console.error('❌ RabbitMQ connection error:', err);
          // 重置連接和通道為 null
          this.connection = null;
          this.channel = null;
        });
        
        // 設定連接關閉事件監聽器
        this.connection.on('close', () => {
          console.log('🔌 RabbitMQ connection closed');
          // 重置連接和通道為 null
          this.connection = null;
          this.channel = null;
        });
      }
      
      // 檢查是否已有通道，如果沒有則建立新通道
      if (!this.channel) {
        // 從連接中建立通道
        this.channel = await this.connection.createChannel();
        // 設定 RabbitMQ 拓撲結構
        await this.setupTopology();
      }

      // 返回通道實例
      return this.channel;
    } catch (error) {
      console.error('❌ Failed to create RabbitMQ channel:', error);
      throw error;
    }
  }

  /**
   * 設定 RabbitMQ 拓撲結構
   * 建立交換器、佇列並設定綁定關係
   * @returns {Promise<void>} 無返回值
   */
  private async setupTopology(): Promise<void> {
    try {
      // 從配置中提取交換器和佇列設定
      const { exchanges, queues } = this.config;

      // 建立設備事件交換器（topic 類型，持久化）
      await this.channel.assertExchange(exchanges.DEVICE_EVENTS, 'topic', { durable: true });
      // 建立設備資料交換器（topic 類型，持久化）
      await this.channel.assertExchange(exchanges.DEVICE_DATA, 'topic', { durable: true });
      
      // 建立設備命令佇列（持久化）
      await this.channel.assertQueue(queues.DEVICE_COMMANDS, { durable: true });
      // 建立設備事件佇列（持久化）
      await this.channel.assertQueue(queues.DEVICE_EVENTS, { durable: true });
      // 建立設備資料佇列（持久化）
      await this.channel.assertQueue(queues.DEVICE_DATA, { durable: true });
      
      // 將設備事件佇列綁定到設備事件交換器（接收所有訊息）
      await this.channel.bindQueue(queues.DEVICE_EVENTS, exchanges.DEVICE_EVENTS, '#');
      // 將設備資料佇列綁定到設備資料交換器（接收所有訊息）
      await this.channel.bindQueue(queues.DEVICE_DATA, exchanges.DEVICE_DATA, '#');
      
      console.log('✅ RabbitMQ topology setup completed');
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ topology:', error);
      throw error;
    }
  }

  /**
   * 關閉 RabbitMQ 連接和通道
   * 按順序關閉通道和連接，確保資源正確釋放
   * @returns {Promise<void>} 無返回值
   */
  async close(): Promise<void> {
    try {
      // 如果通道存在，先關閉通道
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      // 如果連接存在，再關閉連接
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  /**
   * 獲取 RabbitMQ 通道實例
   * 用於執行訊息發送和接收操作
   * @returns {any} RabbitMQ 通道實例
   */
  getChannel() {
    // 返回當前的通道實例
    return this.channel;
  }
}
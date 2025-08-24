/**
 * @fileoverview RabbitMQ 服務實作
 * 
 * 【設計意圖 (Intention)】
 * 提供穩定可靠的 RabbitMQ 訊息隊列服務，支援任務結果回報和延遲訊息發送
 * 實作自動重連機制確保服務穩定性
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 amqplib 進行 RabbitMQ 操作
 * - 實作連線池和自動重連機制
 * - 支援訊息確認和錯誤處理
 * - 提供延遲訊息和任務結果發佈功能
 */

import { injectable, inject } from 'inversify';
import amqp, { Connection, Channel, Message } from 'amqplib';
import { Logger } from 'winston';
import { RabbitMQService as IRabbitMQService, TaskResultMessage } from '../types/processor.types';
import { config } from '../configs/environment';
import { TYPES } from '../container/types';

@injectable()
export class RabbitMQService implements IRabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {}

  /**
   * 初始化 RabbitMQ 連線
   * 
   * 【連線策略】
   * - 建立持久化連線和通道
   * - 宣告必要的 exchange 和 queue
   * - 設置錯誤處理和重連機制
   */
  initialize = async (): Promise<void> => {
    try {
      await this.connect();
      await this.setupExchangesAndQueues();
      this.setupEventListeners();
      
      this.logger.info('RabbitMQ service initialized successfully');
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Failed to initialize RabbitMQ service', { error: err.message });
      throw error;
    }
  };

  /**
   * 建立 RabbitMQ 連線
   */
  private connect = async (): Promise<void> => {
    this.connection = await amqp.connect(config.rabbitmq.url);
    this.channel = await this.connection.createChannel();
    
    // 設置預取數量
    await this.channel.prefetch(config.rabbitmq.prefetch);
    
    this.isConnected = true;
    this.logger.info('Connected to RabbitMQ', { url: config.rabbitmq.url });
  };

  /**
   * 設置 Exchange 和 Queue
   * 
   * 【拓撲結構】
   * - scheduler exchange: 接收排程任務
   * - task-result queue: 發送任務執行結果
   */
  private setupExchangesAndQueues = async (): Promise<void> => {
    if (!this.channel) throw new Error('Channel not initialized');

    // 宣告 exchange
    await this.channel.assertExchange(config.rabbitmq.exchange, 'direct', {
      durable: true
    });

    // 宣告 queues
    await this.channel.assertQueue(config.rabbitmq.queues.archiveProcessor, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours TTL
        'x-dead-letter-exchange': `${config.rabbitmq.exchange}.dlx`
      }
    });

    await this.channel.assertQueue(config.rabbitmq.queues.taskResult, {
      durable: true
    });

    // 綁定 queue 到 exchange
    await this.channel.bindQueue(
      config.rabbitmq.queues.archiveProcessor,
      config.rabbitmq.exchange,
      'archive.process'
    );

    this.logger.info('RabbitMQ exchanges and queues setup completed');
  };

  /**
   * 設置事件監聽器
   */
  private setupEventListeners = (): void => {
    if (!this.connection || !this.channel) return;

    this.connection.on('error', (error) => {
      this.logger.error('RabbitMQ connection error', { error: error.message });
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.channel.on('error', (error) => {
      this.logger.error('RabbitMQ channel error', { error: error.message });
    });
  };

  /**
   * 排程重連
   */
  private scheduleReconnect = (): void => {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        this.logger.info('Attempting to reconnect to RabbitMQ...');
        await this.initialize();
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.error('Reconnection failed', { error: err.message });
        this.scheduleReconnect();
      }
    }, config.rabbitmq.reconnectDelay);
  };

  /**
   * 發佈任務執行結果
   */
  publishTaskResult = async (result: TaskResultMessage): Promise<boolean> => {
    try {
      if (!this.channel || !this.isConnected) {
        throw new Error('RabbitMQ not connected');
      }

      const message = Buffer.from(JSON.stringify(result));
      
      const published = this.channel.publish(
        config.rabbitmq.exchange,
        'task.result',
        message,
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: result.taskId,
          headers: {
            taskType: result.taskType,
            status: result.status
          }
        }
      );

      if (published) {
        this.logger.info('Task result published successfully', {
          taskId: result.taskId,
          status: result.status,
          taskType: result.taskType
        });
      }

      return published;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Failed to publish task result', {
        taskId: result.taskId,
        error: err.message
      });
      return false;
    }
  };

  /**
   * 發佈延遲訊息
   */
  publishDelayed = async <T>(routingKey: string, message: T, delay: number, options?: any): Promise<boolean> => {
    try {
      if (!this.channel || !this.isConnected) {
        throw new Error('RabbitMQ not connected');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const published = this.channel.publish(
        config.rabbitmq.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          expiration: delay.toString(),
          ...options
        }
      );

      if (published) {
        this.logger.info('Delayed message published successfully', {
          routingKey,
          delay,
          messageSize: messageBuffer.length
        });
      }

      return published;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Failed to publish delayed message', {
        routingKey,
        error: err.message
      });
      return false;
    }
  };

  /**
   * 啟動消費者
   */
  startConsumer = async (messageHandler: (message: any) => Promise<void>): Promise<void> => {
    if (!this.channel || !this.isConnected) {
      throw new Error('RabbitMQ not connected');
    }

    await this.channel.consume(
      config.rabbitmq.queues.archiveProcessor,
      async (msg: Message | null) => {
        if (!msg) return;

        try {
          const messageContent = JSON.parse(msg.content.toString());
          
          this.logger.info('Received message for processing', {
            messageId: msg.properties.messageId,
            routingKey: msg.fields.routingKey
          });

          await messageHandler(messageContent);
          
          // 確認訊息處理完成
          this.channel!.ack(msg);
          
          this.logger.info('Message processed successfully', {
            messageId: msg.properties.messageId
          });
          
        } catch (error: unknown) {
          const err = error as Error;
          this.logger.error('Error processing message', {
            messageId: msg.properties.messageId,
            error: err.message
          });
          
          // 拒絕訊息並重新排隊
          this.channel!.nack(msg, false, true);
        }
      }
    );

    this.logger.info('RabbitMQ consumer started', {
      queue: config.rabbitmq.queues.archiveProcessor
    });
  };

  /**
   * 關閉連線
   */
  close = async (): Promise<void> => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    this.isConnected = false;
    this.logger.info('RabbitMQ service closed');
  };

  /**
   * 健康檢查
   */
  isHealthy = (): boolean => {
    return this.isConnected && !!this.connection && !!this.channel;
  };
}
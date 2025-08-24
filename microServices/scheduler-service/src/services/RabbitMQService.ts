/**
 * @fileoverview RabbitMQ 服務類別
 * 
 * 負責 RabbitMQ 連線管理、消息發布和消費功能
 */

import { injectable, inject } from 'inversify';
import amqp, { Connection, Channel, Message } from 'amqplib';
import { Logger } from 'winston';
import { EXCHANGES, QUEUES, QUEUE_CONFIGS, RETRY_CONFIG } from '../config/queue.config';
import { 
  BaseScheduleTask, 
  TaskResultMessage,
  TaskType 
} from '../types/scheduler.types';
import { TYPES } from '../container/types';

export interface RabbitMQConfig {
  url: string;
  heartbeat?: number;
  prefetch?: number;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface PublishOptions {
  priority?: number;
  persistent?: boolean;
  expiration?: string;
  delay?: number;
  headers?: Record<string, any>;
}

export interface ConsumeOptions {
  noAck?: boolean;
  prefetch?: number;
  exclusive?: boolean;
}

@injectable()
export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    @inject(TYPES.RabbitMQConfig) private config: RabbitMQConfig,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 初始化 RabbitMQ 連線和設定
   */
  initialize = async (): Promise<void> => {
    try {
      await this.connect();
      await this.setupExchangesAndQueues();
      this.logger.info('RabbitMQ service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ service', error);
      throw error;
    }
  }

  /**
   * 建立連線
   */
  private connect = async (): Promise<void> => {
    try {
      this.connection = await amqp.connect(this.config.url, {
        heartbeat: this.config.heartbeat || 60
      });

      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(this.config.prefetch || 10);

      // 設定連線事件監聽器
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      this.logger.info('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      await this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * 設定交換器和隊列
   */
  private setupExchangesAndQueues = async (): Promise<void> => {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    try {
      // 創建交換器
      for (const exchange of Object.values(EXCHANGES)) {
        await this.channel.assertExchange(
          exchange.name,
          exchange.type,
          {
            durable: exchange.durable,
            arguments: exchange.arguments || {}
          }
        );
      }

      // 創建隊列並綁定到交換器
      for (const queueConfig of Object.values(QUEUE_CONFIGS)) {
        const queueOptions: any = {
          durable: queueConfig.durable,
          arguments: {}
        };

        // 設定優先級隊列
        if (queueConfig.priority) {
          queueOptions.arguments['x-max-priority'] = queueConfig.priority;
        }

        // 設定 TTL
        if (queueConfig.ttl) {
          queueOptions.arguments['x-message-ttl'] = queueConfig.ttl;
        }

        // 設定死信交換器
        if (queueConfig.deadLetterExchange) {
          queueOptions.arguments['x-dead-letter-exchange'] = queueConfig.deadLetterExchange;
          queueOptions.arguments['x-dead-letter-routing-key'] = 'dead-letter';
        }

        await this.channel.assertQueue(queueConfig.name, queueOptions);
        
        await this.channel.bindQueue(
          queueConfig.name,
          queueConfig.exchange,
          queueConfig.routingKey
        );
      }

      this.logger.info('RabbitMQ exchanges and queues setup completed');
    } catch (error) {
      this.logger.error('Failed to setup exchanges and queues', error);
      throw error;
    }
  }

  /**
   * 發布消息
   */
  async publish<T extends BaseScheduleTask>(
    exchange: string,
    routingKey: string,
    message: T,
    options: PublishOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const publishOptions: any = {
        persistent: options.persistent !== false,
        priority: options.priority || 5,
        timestamp: Date.now(),
        messageId: message.taskId,
        type: message.taskType,
        headers: {
          retryCount: message.retryCount || 0,
          maxRetries: message.maxRetries || RETRY_CONFIG.MAX_RETRIES,
          ...options.headers
        }
      };

      if (options.expiration) {
        publishOptions.expiration = options.expiration;
      }

      // 如果有延遲設定，使用延遲交換器
      if (options.delay && options.delay > 0) {
        publishOptions.headers['x-delay'] = options.delay;
        exchange = EXCHANGES.DELAYED.name;
      }

      const success = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        publishOptions
      );

      if (success) {
        this.logger.info(`Message published successfully`, {
          exchange,
          routingKey,
          taskId: message.taskId,
          taskType: message.taskType
        });
      } else {
        this.logger.warn('Message publish failed - channel write buffer full', {
          taskId: message.taskId
        });
      }

      return success;
    } catch (error) {
      this.logger.error('Failed to publish message', {
        error,
        taskId: message.taskId,
        exchange,
        routingKey
      });
      throw error;
    }
  }

  /**
   * 發布延遲消息
   */
  async publishDelayed<T extends BaseScheduleTask>(
    routingKey: string,
    message: T,
    delay: number,
    options: Omit<PublishOptions, 'delay'> = {}
  ): Promise<boolean> {
    return this.publish(
      EXCHANGES.DELAYED.name,
      routingKey,
      message,
      { ...options, delay }
    );
  }

  /**
   * 消費消息
   */
  async consume<T extends BaseScheduleTask>(
    queueName: string,
    handler: (message: T, ack: () => void, nack: (requeue?: boolean) => void) => Promise<void>,
    options: ConsumeOptions = {}
  ): Promise<string> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      if (options.prefetch) {
        await this.channel.prefetch(options.prefetch);
      }

      const consumerTag = await this.channel.consume(
        queueName,
        async (msg) => {
          if (!msg) return;

          try {
            const messageContent = JSON.parse(msg.content.toString()) as T;
            
            const ack = () => {
              if (this.channel && msg) {
                this.channel.ack(msg);
                this.logger.debug(`Message acknowledged`, {
                  taskId: messageContent.taskId,
                  queue: queueName
                });
              }
            };

            const nack = (requeue: boolean = false) => {
              if (this.channel && msg) {
                this.channel.nack(msg, false, requeue);
                this.logger.debug(`Message ${requeue ? 'requeued' : 'rejected'}`, {
                  taskId: messageContent.taskId,
                  queue: queueName
                });
              }
            };

            await handler(messageContent, ack, nack);

          } catch (error) {
            this.logger.error('Error processing message', {
              error,
              queue: queueName
            });
            
            if (this.channel && msg) {
              // 檢查重試次數
              const retryCount = msg.properties.headers?.retryCount || 0;
              const maxRetries = msg.properties.headers?.maxRetries || RETRY_CONFIG.MAX_RETRIES;
              
              if (retryCount < maxRetries) {
                // 重新排隊
                this.channel.nack(msg, false, true);
              } else {
                // 超過重試次數，發送到死信隊列
                this.channel.nack(msg, false, false);
              }
            }
          }
        },
        {
          noAck: options.noAck || false,
          exclusive: options.exclusive || false
        }
      );

      this.logger.info(`Started consuming from queue: ${queueName}`, {
        consumerTag: consumerTag.consumerTag
      });

      return consumerTag.consumerTag;
    } catch (error) {
      this.logger.error(`Failed to consume from queue: ${queueName}`, error);
      throw error;
    }
  }

  /**
   * 發布任務結果
   */
  publishTaskResult = async (result: TaskResultMessage): Promise<boolean> => {
    const routingKey = result.status === 'failed' ? 'result.failed' : 
                      result.status === 'partial' ? 'result.partial' : 
                      'result.success';

    return this.publish(
      EXCHANGES.MAIN.name,
      routingKey,
      result as any,
      { priority: 3 }
    );
  }

  /**
   * 處理連線錯誤
   */
  private handleConnectionError(error: Error): void {
    this.logger.error('RabbitMQ connection error', error);
    this.isConnected = false;
  }

  /**
   * 處理連線關閉
   */
  private handleConnectionClose(): void {
    this.logger.warn('RabbitMQ connection closed');
    this.isConnected = false;
    this.scheduleReconnect();
  }

  /**
   * 安排重新連線
   */
  private scheduleReconnect = async (): Promise<void> => {
    const maxAttempts = this.config.maxReconnectAttempts || 10;
    const delay = this.config.reconnectDelay || 5000;

    if (this.reconnectAttempts >= maxAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    this.logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts}/${maxAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error(`Reconnection attempt ${this.reconnectAttempts} failed`, error);
      }
    }, delay);
  }

  /**
   * 關閉連線
   */
  close = async (): Promise<void> => {
    try {
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
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  /**
   * 檢查連線狀態
   */
  isHealthy = (): boolean => {
    return this.isConnected && this.connection !== null && this.channel !== null;
  }

  /**
   * 獲取隊列統計信息
   */
  getQueueStats = async (queueName: string): Promise<any> => {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    try {
      const queueInfo = await this.channel.checkQueue(queueName);
      return {
        queue: queueName,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats for ${queueName}`, error);
      throw error;
    }
  }
}
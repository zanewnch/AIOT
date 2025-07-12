// RabbitMQ 配置常數
const RABBITMQ_CONFIG = {
  exchanges: {
    DEVICE_EVENTS: 'device.events',
    DEVICE_DATA: 'device.data',
  },
  queues: {
    DEVICE_COMMANDS: 'device.commands',
    DEVICE_EVENTS: 'device.events.queue',
    DEVICE_DATA: 'device.data.queue',
  },
  routingKeys: {
    DEVICE_OFFLINE: 'device.offline',
    THRESHOLD_EXCEEDED: 'threshold.exceeded',
    DEVICE_STATUS: 'device.status',
    SENSOR_DATA: 'sensor.data',
  }
};
import { Command } from '../models/Command.js';
import { Event } from '../models/Event.js';
import { DeviceData } from '../models/DeviceData.js';
import { Device } from '../models/Device.js';

export class RabbitMQService {
  private channel: any;

  constructor(channel: any) {
    this.channel = channel;
  }

  static create(channel: any): RabbitMQService {
    return new RabbitMQService(channel);
  }

  // 設備指令相關方法
  async sendDeviceCommand(command: Command): Promise<void> {
    const message = Buffer.from(JSON.stringify(command));
    
    await this.channel.sendToQueue(
      RABBITMQ_CONFIG.queues.DEVICE_COMMANDS,
      message,
      {
        persistent: true,
        priority: this.getCommandPriority(command.priority),
        expiration: command.timeout?.toString(),
      }
    );
    
    console.log(`📤 Command sent to device ${command.deviceId}: ${command.commandType}`);
  }

  async consumeDeviceCommands(callback: (command: Command) => Promise<void>): Promise<void> {
    await this.channel.consume(
      RABBITMQ_CONFIG.queues.DEVICE_COMMANDS,
      async (msg: any) => {
        if (msg) {
          try {
            const command = JSON.parse(msg.content.toString()) as Command;
            await callback(command);
            this.channel.ack(msg);
          } catch (error) {
            console.error('❌ Error processing command:', error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  // 事件發布相關方法
  async publishDeviceEvent(event: Event): Promise<void> {
    const routingKey = this.getEventRoutingKey(event.eventType);
    const message = Buffer.from(JSON.stringify(event));
    
    await this.channel.publish(
      RABBITMQ_CONFIG.exchanges.DEVICE_EVENTS,
      routingKey,
      message,
      {
        persistent: true,
        timestamp: Date.now(),
      }
    );
    
    console.log(`📢 Event published: ${event.eventType} from device ${event.deviceId}`);
  }

  async consumeDeviceEvents(callback: (event: Event) => Promise<void>): Promise<void> {
    await this.channel.consume(
      RABBITMQ_CONFIG.queues.DEVICE_EVENTS,
      async (msg: any) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString()) as Event;
            await callback(event);
            this.channel.ack(msg);
          } catch (error) {
            console.error('❌ Error processing event:', error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  // 設備數據相關方法
  async publishDeviceData(deviceData: DeviceData): Promise<void> {
    const routingKey = `${RABBITMQ_CONFIG.routingKeys.SENSOR_DATA}.${deviceData.deviceId}`;
    const message = Buffer.from(JSON.stringify(deviceData));
    
    await this.channel.publish(
      RABBITMQ_CONFIG.exchanges.DEVICE_DATA,
      routingKey,
      message,
      {
        persistent: true,
        timestamp: Date.now(),
      }
    );
    
    console.log(`📊 Device data published from device ${deviceData.deviceId}`);
  }

  async consumeDeviceData(callback: (deviceData: DeviceData) => Promise<void>): Promise<void> {
    await this.channel.consume(
      RABBITMQ_CONFIG.queues.DEVICE_DATA,
      async (msg: any) => {
        if (msg) {
          try {
            const deviceData = JSON.parse(msg.content.toString()) as DeviceData;
            await callback(deviceData);
            this.channel.ack(msg);
          } catch (error) {
            console.error('❌ Error processing device data:', error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  // 設備狀態變化通知
  async publishDeviceStatusChange(device: Device): Promise<void> {
    const routingKey = `${RABBITMQ_CONFIG.routingKeys.DEVICE_STATUS}.${device.id}`;
    const message = Buffer.from(JSON.stringify({
      deviceId: device.id,
      status: device.status,
      timestamp: new Date(),
      lastSeen: device.lastSeen,
    }));
    
    await this.channel.publish(
      RABBITMQ_CONFIG.exchanges.DEVICE_EVENTS,
      routingKey,
      message,
      {
        persistent: true,
        timestamp: Date.now(),
      }
    );
    
    console.log(`🔄 Device status change published: ${device.id} -> ${device.status}`);
  }

  /**
   * 獲取指令優先級數值
   * 
   * 將字串型別的優先級轉換為數值，用於RabbitMQ消息的優先級設定。
   * 數值越高表示優先級越高，系統會優先處理高優先級的指令。
   * 
   * @private
   * @param {('low' | 'normal' | 'high')} [priority] - 優先級字串，可選參數
   * @returns {number} 優先級數值 - high: 10, normal: 5, low: 1, 預設: 5
   * 
   * @example
   * ```typescript
   * const priority = this.getCommandPriority('high'); // 回傳 10
   * const defaultPriority = this.getCommandPriority(); // 回傳 5
   * ```
   */
  private getCommandPriority(priority?: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high': return 10;
      case 'normal': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

  /**
   * 獲取事件路由鍵
   * 
   * 根據事件類型產生對應的RabbitMQ路由鍵。路由鍵用於決定消息應該
   * 被發送到哪個佇列，確保不同類型的事件能夠被正確的消費者處理。
   * 
   * @private
   * @param {string} eventType - 事件類型名稱
   * @returns {string} RabbitMQ路由鍵
   * 
   * @example
   * ```typescript
   * const routingKey = this.getEventRoutingKey('device_offline');
   * // 回傳 RABBITMQ_CONFIG.routingKeys.DEVICE_OFFLINE
   * 
   * const customKey = this.getEventRoutingKey('custom_event');
   * // 回傳 'event.custom_event'
   * ```
   */
  private getEventRoutingKey(eventType: string): string {
    switch (eventType) {
      case 'device_offline':
        return RABBITMQ_CONFIG.routingKeys.DEVICE_OFFLINE;
      case 'threshold_exceeded':
        return RABBITMQ_CONFIG.routingKeys.THRESHOLD_EXCEEDED;
      default:
        return `event.${eventType}`;
    }
  }

  // 關閉連接
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
  }
}
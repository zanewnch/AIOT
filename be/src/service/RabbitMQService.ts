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

  // 輔助方法
  private getCommandPriority(priority?: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high': return 10;
      case 'normal': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

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
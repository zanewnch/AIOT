import { RabbitMQService } from './RabbitMQService.js';
import { Event } from '../models/Event.js';

export class DeviceEventService {
  private rabbitMQService: RabbitMQService;

  constructor(rabbitMQService: RabbitMQService) {
    this.rabbitMQService = rabbitMQService;
  }

  static async create(): Promise<DeviceEventService> {
    const rabbitMQService = await RabbitMQService.create();
    return new DeviceEventService(rabbitMQService);
  }

  async publishDeviceOfflineEvent(deviceId: string, lastSeen: Date): Promise<void> {
    const event: Event = {
      id: this.generateEventId(),
      deviceId,
      eventType: 'device_offline',
      message: `Device ${deviceId} went offline`,
      timestamp: new Date(),
      data: { lastSeen },
      severity: 'warning',
      correlationId: this.generateCorrelationId(),
    };

    await this.rabbitMQService.publishDeviceEvent(event);
  }

  async publishThresholdExceededEvent(
    deviceId: string,
    metric: string,
    value: number,
    threshold: number,
    severity: 'info' | 'warning' | 'critical' = 'warning'
  ): Promise<void> {
    const event: Event = {
      id: this.generateEventId(),
      deviceId,
      eventType: 'threshold_exceeded',
      message: `Device ${deviceId} ${metric} exceeded threshold: ${value} > ${threshold}`,
      timestamp: new Date(),
      data: { metric, value, threshold },
      severity,
      correlationId: this.generateCorrelationId(),
    };

    await this.rabbitMQService.publishDeviceEvent(event);
  }

  async publishCustomEvent(
    deviceId: string,
    eventType: string,
    message: string,
    data?: any,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<void> {
    const event: Event = {
      id: this.generateEventId(),
      deviceId,
      eventType: eventType as any,
      message,
      timestamp: new Date(),
      data,
      severity,
      correlationId: this.generateCorrelationId(),
    };

    await this.rabbitMQService.publishDeviceEvent(event);
  }

  async startEventProcessor(
    onEventReceived: (event: Event) => Promise<void>
  ): Promise<void> {
    await this.rabbitMQService.consumeDeviceEvents(async (event: Event) => {
      console.log(`📢 Processing event: ${event.eventType} from device ${event.deviceId}`);
      
      try {
        await onEventReceived(event);
        console.log(`✅ Event processed successfully: ${event.id}`);
      } catch (error) {
        console.error(`❌ Failed to process event ${event.id}:`, error);
        throw error;
      }
    });
  }

  // 監控設備狀態並自動發布離線事件
  async monitorDeviceStatus(
    getDeviceList: () => Promise<Array<{ id: string; lastSeen: Date }>>,
    offlineThresholdMs: number = 60000 // 60秒
  ): Promise<void> {
    setInterval(async () => {
      try {
        const devices = await getDeviceList();
        const now = new Date();
        
        for (const device of devices) {
          const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
          
          if (timeSinceLastSeen > offlineThresholdMs) {
            await this.publishDeviceOfflineEvent(device.id, device.lastSeen);
          }
        }
      } catch (error) {
        console.error('❌ Error monitoring device status:', error);
      }
    }, offlineThresholdMs / 2); // 檢查頻率為離線閾值的一半
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
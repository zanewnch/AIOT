import { RabbitMQService } from './RabbitMQService.js';
import { DeviceData } from '../models/DeviceData.js';

export class DeviceDataService {
  private rabbitMQService: RabbitMQService;

  constructor(rabbitMQService: RabbitMQService) {
    this.rabbitMQService = rabbitMQService;
  }

  static async create(): Promise<DeviceDataService> {
    const rabbitMQService = await RabbitMQService.create();
    return new DeviceDataService(rabbitMQService);
  }

  async publishSensorData(
    deviceId: string,
    data: Record<string, any>,
    source: 'hardware' | 'simulated' = 'hardware'
  ): Promise<void> {
    const deviceData: DeviceData = {
      id: this.generateDataId(),
      deviceId,
      timestamp: new Date(),
      data,
      source,
    };

    await this.rabbitMQService.publishDeviceData(deviceData);
  }

  async publishTemperatureData(
    deviceId: string,
    temperature: number,
    humidity?: number,
    source: 'hardware' | 'simulated' = 'hardware'
  ): Promise<void> {
    const data: Record<string, any> = { temperature };
    if (humidity !== undefined) {
      data.humidity = humidity;
    }

    await this.publishSensorData(deviceId, data, source);
  }

  async publishMotionData(
    deviceId: string,
    motion: boolean,
    source: 'hardware' | 'simulated' = 'hardware'
  ): Promise<void> {
    await this.publishSensorData(deviceId, { motion }, source);
  }

  async publishEnergyData(
    deviceId: string,
    power: number,
    voltage?: number,
    current?: number,
    source: 'hardware' | 'simulated' = 'hardware'
  ): Promise<void> {
    const data: Record<string, any> = { power };
    if (voltage !== undefined) data.voltage = voltage;
    if (current !== undefined) data.current = current;

    await this.publishSensorData(deviceId, data, source);
  }

  async startDataProcessor(
    onDataReceived: (deviceData: DeviceData) => Promise<void>
  ): Promise<void> {
    await this.rabbitMQService.consumeDeviceData(async (deviceData: DeviceData) => {
      console.log(`📊 Processing data from device ${deviceData.deviceId}`);
      
      try {
        await onDataReceived(deviceData);
        console.log(`✅ Data processed successfully: ${deviceData.id}`);
      } catch (error) {
        console.error(`❌ Failed to process data ${deviceData.id}:`, error);
        throw error;
      }
    });
  }

  // 批量處理設備數據
  async startBatchDataProcessor(
    onBatchReceived: (deviceDataBatch: DeviceData[]) => Promise<void>,
    batchSize: number = 10,
    batchTimeoutMs: number = 5000
  ): Promise<void> {
    let batch: DeviceData[] = [];
    let batchTimeout: NodeJS.Timeout | null = null;

    const processBatch = async () => {
      if (batch.length === 0) return;
      
      const currentBatch = [...batch];
      batch = [];
      
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }

      try {
        await onBatchReceived(currentBatch);
        console.log(`✅ Batch processed successfully: ${currentBatch.length} items`);
      } catch (error) {
        console.error(`❌ Failed to process batch:`, error);
        throw error;
      }
    };

    await this.rabbitMQService.consumeDeviceData(async (deviceData: DeviceData) => {
      batch.push(deviceData);
      
      if (batch.length >= batchSize) {
        await processBatch();
      } else if (!batchTimeout) {
        batchTimeout = setTimeout(processBatch, batchTimeoutMs);
      }
    });
  }

  // 數據聚合和分析
  async analyzeDeviceData(
    deviceId: string,
    dataHistory: DeviceData[],
    analysisType: 'average' | 'min' | 'max' | 'count'
  ): Promise<Record<string, number>> {
    const deviceData = dataHistory.filter(d => d.deviceId === deviceId);
    const result: Record<string, number> = {};

    if (deviceData.length === 0) return result;

    const allKeys = new Set<string>();
    deviceData.forEach(d => {
      Object.keys(d.data).forEach(key => {
        if (typeof d.data[key] === 'number') {
          allKeys.add(key);
        }
      });
    });

    for (const key of allKeys) {
      const values = deviceData
        .map(d => d.data[key])
        .filter(v => typeof v === 'number') as number[];

      if (values.length === 0) continue;

      switch (analysisType) {
        case 'average':
          result[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'min':
          result[key] = Math.min(...values);
          break;
        case 'max':
          result[key] = Math.max(...values);
          break;
        case 'count':
          result[key] = values.length;
          break;
      }
    }

    return result;
  }

  private generateDataId(): string {
    return `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
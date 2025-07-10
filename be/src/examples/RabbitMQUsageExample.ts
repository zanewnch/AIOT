import { 
  RabbitMQService, 
  DeviceCommandService, 
  DeviceEventService, 
  DeviceDataService 
} from '../service/index.js';

// 使用範例：展示如何在你的應用中集成 RabbitMQ

export class RabbitMQUsageExample {
  private commandService: DeviceCommandService;
  private eventService: DeviceEventService;
  private dataService: DeviceDataService;

  constructor(
    commandService: DeviceCommandService,
    eventService: DeviceEventService,
    dataService: DeviceDataService
  ) {
    this.commandService = commandService;
    this.eventService = eventService;
    this.dataService = dataService;
  }

  static async create(): Promise<RabbitMQUsageExample> {
    const commandService = await DeviceCommandService.create();
    const eventService = await DeviceEventService.create();
    const dataService = await DeviceDataService.create();
    
    return new RabbitMQUsageExample(commandService, eventService, dataService);
  }

  // 範例1: 發送設備控制指令
  async sendDeviceControlCommands(): Promise<void> {
    console.log('📋 範例1: 發送設備控制指令');
    
    // 開啟設備
    await this.commandService.sendTurnOnCommand('device-001', 'high');
    
    // 設定參數
    await this.commandService.sendSetParameterCommand('device-001', 'temperature', 25);
    
    // 關閉設備
    await this.commandService.sendTurnOffCommand('device-001');
  }

  // 範例2: 發布設備事件
  async publishDeviceEvents(): Promise<void> {
    console.log('📋 範例2: 發布設備事件');
    
    // 設備離線事件
    await this.eventService.publishDeviceOfflineEvent('device-002', new Date());
    
    // 閾值超標事件
    await this.eventService.publishThresholdExceededEvent(
      'device-003',
      'temperature',
      35,
      30,
      'critical'
    );
    
    // 自定義事件
    await this.eventService.publishCustomEvent(
      'device-004',
      'maintenance_required',
      'Device requires maintenance',
      { reason: 'filter_replacement' },
      'warning'
    );
  }

  // 範例3: 發布設備數據
  async publishDeviceData(): Promise<void> {
    console.log('📋 範例3: 發布設備數據');
    
    // 溫濕度感測器數據
    await this.dataService.publishTemperatureData('sensor-001', 24.5, 65);
    
    // 動作感測器數據
    await this.dataService.publishMotionData('sensor-002', true);
    
    // 能耗數據
    await this.dataService.publishEnergyData('meter-001', 1200, 220, 5.45);
    
    // 自定義感測器數據
    await this.dataService.publishSensorData('sensor-003', {
      light: 450,
      uv: 2.3,
      pressure: 1013.25
    });
  }

  // 範例4: 啟動消息處理器
  async startMessageProcessors(): Promise<void> {
    console.log('📋 範例4: 啟動消息處理器');
    
    // 啟動指令處理器
    await this.commandService.startCommandProcessor(async (command) => {
      console.log(`🔧 執行指令: ${command.commandType} 針對設備 ${command.deviceId}`);
      
      // 這裡可以加入實際的設備控制邏輯
      // 例如：調用設備API、更新資料庫狀態等
      
      // 模擬處理延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ 指令執行完成: ${command.id}`);
    });
    
    // 啟動事件處理器
    await this.eventService.startEventProcessor(async (event) => {
      console.log(`📢 處理事件: ${event.eventType} 來自設備 ${event.deviceId}`);
      
      // 這裡可以加入事件處理邏輯
      // 例如：發送通知、記錄日誌、觸發工作流程等
      
      switch (event.eventType) {
        case 'device_offline':
          console.log(`⚠️ 設備 ${event.deviceId} 離線了`);
          // 可以發送告警通知
          break;
        case 'threshold_exceeded':
          console.log(`🚨 設備 ${event.deviceId} 超過閾值`);
          // 可以觸發自動回應
          break;
        default:
          console.log(`ℹ️ 收到自定義事件: ${event.eventType}`);
      }
    });
    
    // 啟動數據處理器
    await this.dataService.startDataProcessor(async (deviceData) => {
      console.log(`📊 處理設備數據: ${deviceData.deviceId}`);
      
      // 這裡可以加入數據處理邏輯
      // 例如：存儲到資料庫、數據分析、觸發規則等
      
      // 範例：檢查溫度閾值
      if (deviceData.data.temperature && deviceData.data.temperature > 30) {
        await this.eventService.publishThresholdExceededEvent(
          deviceData.deviceId,
          'temperature',
          deviceData.data.temperature,
          30,
          'warning'
        );
      }
    });
  }

  // 範例5: 批量數據處理
  async startBatchDataProcessing(): Promise<void> {
    console.log('📋 範例5: 批量數據處理');
    
    await this.dataService.startBatchDataProcessor(async (batch) => {
      console.log(`📦 處理批量數據: ${batch.length} 筆資料`);
      
      // 批量插入資料庫的邏輯
      // 批量分析的邏輯
      
      for (const data of batch) {
        console.log(`  - 設備 ${data.deviceId}: ${JSON.stringify(data.data)}`);
      }
    }, 5, 3000); // 每5筆或3秒處理一次
  }

  // 範例6: 設備狀態監控
  async startDeviceStatusMonitoring(): Promise<void> {
    console.log('📋 範例6: 設備狀態監控');
    
    // 模擬獲取設備列表的函數
    const getDeviceList = async () => {
      return [
        { id: 'device-001', lastSeen: new Date(Date.now() - 90000) }, // 90秒前
        { id: 'device-002', lastSeen: new Date(Date.now() - 30000) }, // 30秒前
        { id: 'device-003', lastSeen: new Date(Date.now() - 120000) }, // 120秒前
      ];
    };
    
    // 啟動設備狀態監控 (60秒離線閾值)
    await this.eventService.monitorDeviceStatus(getDeviceList, 60000);
  }
}

// 使用範例的主函數
export async function runRabbitMQExample(): Promise<void> {
  console.log('🚀 啟動 RabbitMQ 使用範例');
  
  try {
    const example = await RabbitMQUsageExample.create();
    
    // 啟動各種處理器
    await example.startMessageProcessors();
    
    // 模擬發送一些消息
    setTimeout(() => example.sendDeviceControlCommands(), 2000);
    setTimeout(() => example.publishDeviceEvents(), 4000);
    setTimeout(() => example.publishDeviceData(), 6000);
    
    // 啟動監控
    await example.startDeviceStatusMonitoring();
    
    console.log('✅ RabbitMQ 範例啟動完成');
    
  } catch (error) {
    console.error('❌ RabbitMQ 範例啟動失敗:', error);
  }
}

// 如果直接執行此文件，則運行範例
if (import.meta.url === `file://${process.argv[1]}`) {
  runRabbitMQExample().catch(console.error);
}
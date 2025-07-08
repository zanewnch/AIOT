# RabbitMQ 整合指南

## 概述

本項目已完成 RabbitMQ 的全面整合，提供了完整的 IoT 設備管理消息系統。

## 功能特性

### 🚀 核心功能
- **設備指令管理**: 發送控制指令到設備（開啟/關閉/設置參數）
- **事件發布系統**: 處理設備離線、閾值超標等事件
- **數據流處理**: 即時處理感測器數據和遙測數據
- **狀態監控**: 自動監控設備狀態變化

### 🏗️ 架構設計
- **交換機 (Exchanges)**: 
  - `device.events` - 設備事件
  - `device.data` - 設備數據
- **佇列 (Queues)**: 
  - `device.commands` - 設備指令
  - `device.events.queue` - 事件處理
  - `device.data.queue` - 數據處理

## 環境配置

### 1. 設置 RabbitMQ URL

在你的 `.env` 文件中添加：

```env
RABBITMQ_URL=amqp://localhost:5672
# 或者對於雲服務
# RABBITMQ_URL=amqp://username:password@your-rabbitmq-server:5672
```

### 2. 安裝 RabbitMQ 服務器

**使用 Docker:**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

**使用 Docker Compose:**
```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
```

## 使用方法

### 1. 基本服務使用

```typescript
import { DeviceCommandService, DeviceEventService, DeviceDataService } from './src/service/index.js';

// 創建服務實例
const commandService = await DeviceCommandService.create();
const eventService = await DeviceEventService.create();
const dataService = await DeviceDataService.create();

// 發送設備指令
await commandService.sendTurnOnCommand('device-001', 'high');
await commandService.sendSetParameterCommand('device-001', 'temperature', 25);

// 發布事件
await eventService.publishDeviceOfflineEvent('device-002', new Date());
await eventService.publishThresholdExceededEvent('device-003', 'temperature', 35, 30);

// 發布數據
await dataService.publishTemperatureData('sensor-001', 24.5, 65);
await dataService.publishMotionData('sensor-002', true);
```

### 2. 啟動消息處理器

```typescript
// 處理設備指令
await commandService.startCommandProcessor(async (command) => {
  console.log(`執行指令: ${command.commandType} 針對設備 ${command.deviceId}`);
  // 實際的設備控制邏輯
});

// 處理設備事件
await eventService.startEventProcessor(async (event) => {
  console.log(`處理事件: ${event.eventType} 來自設備 ${event.deviceId}`);
  // 事件處理邏輯（通知、記錄、工作流程）
});

// 處理設備數據
await dataService.startDataProcessor(async (deviceData) => {
  console.log(`處理設備數據: ${deviceData.deviceId}`);
  // 數據處理邏輯（存儲、分析、規則引擎）
});
```

### 3. REST API 端點

項目提供了 REST API 端點來與 RabbitMQ 系統交互：

```bash
# 設備控制指令
POST /api/devices/{deviceId}/commands/turn-on
POST /api/devices/{deviceId}/commands/turn-off
POST /api/devices/{deviceId}/commands/set-parameter

# 設備事件
POST /api/devices/{deviceId}/events/offline
POST /api/devices/{deviceId}/events/threshold-exceeded

# 設備數據
POST /api/devices/{deviceId}/data
POST /api/devices/{deviceId}/data/temperature
POST /api/devices/{deviceId}/data/motion
POST /api/devices/{deviceId}/data/energy
```

**範例請求:**
```bash
# 開啟設備
curl -X POST http://localhost:8000/api/devices/device-001/commands/turn-on \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}'

# 提交溫度數據
curl -X POST http://localhost:8000/api/devices/sensor-001/data/temperature \
  -H "Content-Type: application/json" \
  -d '{"temperature": 24.5, "humidity": 65}'

# 報告閾值超標
curl -X POST http://localhost:8000/api/devices/sensor-002/events/threshold-exceeded \
  -H "Content-Type: application/json" \
  -d '{"metric": "temperature", "value": 35, "threshold": 30, "severity": "critical"}'
```

## 進階功能

### 1. 批量數據處理

```typescript
// 啟動批量數據處理 (每5筆或3秒處理一次)
await dataService.startBatchDataProcessor(async (batch) => {
  console.log(`處理批量數據: ${batch.length} 筆`);
  // 批量處理邏輯
}, 5, 3000);
```

### 2. 設備狀態監控

```typescript
// 自動監控設備狀態
await eventService.monitorDeviceStatus(async () => {
  // 返回設備列表和最後上線時間
  return await getDeviceList();
}, 60000); // 60秒離線閾值
```

### 3. 數據分析

```typescript
// 分析設備數據
const analysis = await dataService.analyzeDeviceData(
  'device-001',
  dataHistory,
  'average' // 'average', 'min', 'max', 'count'
);
```

## 監控和管理

### RabbitMQ 管理界面

訪問 http://localhost:15672 來管理 RabbitMQ：
- 用戶名: admin
- 密碼: admin

### 日誌監控

系統會自動記錄以下信息：
- 消息發送/接收狀態
- 連接狀態變化
- 錯誤和異常

## 錯誤處理

系統包含完整的錯誤處理機制：

- **連接重試**: 自動重連失敗的連接
- **消息確認**: 確保消息可靠傳遞
- **死信佇列**: 處理失敗的消息
- **優雅關閉**: 應用程式關閉時正確清理資源

## 性能優化

### 1. 連接池管理
系統使用單例模式管理 RabbitMQ 連接，避免重複連接。

### 2. 消息持久化
所有重要消息都標記為持久化，確保服務重啟後不丟失。

### 3. 批量處理
支持批量數據處理，提高大量數據的處理效率。

## 範例應用

查看 `src/examples/RabbitMQUsageExample.ts` 了解完整的使用範例。

要運行範例：
```bash
npx tsx src/examples/RabbitMQUsageExample.ts
```

## 疑難排解

### 常見問題

1. **連接失敗**
   - 確認 RabbitMQ 服務正在運行
   - 檢查 `RABBITMQ_URL` 環境變量

2. **消息丟失**
   - 確認消息持久化設置
   - 檢查消息確認機制

3. **性能問題**
   - 考慮使用批量處理
   - 優化消息大小
   - 增加消費者數量

### 監控指標

監控以下指標來確保系統健康：
- 消息處理速率
- 佇列長度
- 連接狀態
- 錯誤率

## 部署建議

### 生產環境配置

1. **RabbitMQ 集群**: 部署多節點集群確保高可用性
2. **監控**: 使用 Prometheus + Grafana 監控
3. **日誌**: 配置結構化日誌記錄
4. **備份**: 定期備份 RabbitMQ 數據

### Docker 部署

```dockerfile
# 在 Dockerfile 中添加 RabbitMQ 相關設置
ENV RABBITMQ_URL=amqp://rabbitmq:5672
```

## 總結

這個 RabbitMQ 整合提供了完整的 IoT 設備管理解決方案，包括：

- ✅ 完整的消息系統架構
- ✅ 易於使用的 API 服務
- ✅ REST API 端點
- ✅ 錯誤處理和重試機制
- ✅ 性能優化和監控
- ✅ 詳細的使用範例

現在你可以開始使用這個強大的 RabbitMQ 整合來構建你的 IoT 應用程序！
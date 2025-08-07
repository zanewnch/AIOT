# 🚀 RabbitMQ 整合完成設置指南

## ✅ 完成狀態

你的 IoT 項目已成功整合 RabbitMQ！以下是已完成的功能：

### 🏗️ 核心架構
- ✅ **統一控制器管理** (`src/controller/index.ts`)
- ✅ **RabbitMQ 配置** (`src/infrastructure/RabbitMQConfig.ts`)
- ✅ **消息服務** (`src/service/RabbitMQService.ts`)
- ✅ **專業服務層**：
  - DeviceCommandService - 設備指令
  - DeviceEventService - 事件處理  
  - DeviceDataService - 數據處理
- ✅ **REST API 端點** (`src/controller/DeviceController.ts`)
- ✅ **優雅關閉機制**

### 📋 實現功能

#### 1. 設備控制指令
```
POST /api/devices/{deviceId}/commands/turn-on
POST /api/devices/{deviceId}/commands/turn-off  
POST /api/devices/{deviceId}/commands/set-parameter
```

#### 2. 設備事件
```
POST /api/devices/{deviceId}/events/offline
POST /api/devices/{deviceId}/events/threshold-exceeded
```

#### 3. 設備數據
```
POST /api/devices/{deviceId}/data
POST /api/devices/{deviceId}/data/temperature
POST /api/devices/{deviceId}/data/motion
POST /api/devices/{deviceId}/data/energy
```

### 🛠️ 下一步操作

#### 1. 啟動 RabbitMQ 服務器

**使用 Docker:**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

**使用 Docker Compose (推薦):**
創建 `docker-compose.yml`:
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
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

然後運行：
```bash
docker-compose up -d
```

#### 2. 配置環境變量

檔案 `.env` 已創建，包含：
```env
RABBITMQ_URL=amqp://localhost:5672
```

如需要用戶名密碼：
```env
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

#### 3. 啟動應用程序

```bash
# 開發模式
npm run dev

# 生產模式
npm run build
npm run serve
```

#### 4. 測試 API

```bash
# 測試設備控制
curl -X POST http://localhost:8000/api/devices/device-001/commands/turn-on \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}'

# 測試數據提交
curl -X POST http://localhost:8000/api/devices/sensor-001/data/temperature \
  -H "Content-Type: application/json" \
  -d '{"temperature": 24.5, "humidity": 65}'

# 測試事件報告
curl -X POST http://localhost:8000/api/devices/sensor-002/events/threshold-exceeded \
  -H "Content-Type: application/json" \
  -d '{"metric": "temperature", "value": 35, "threshold": 30, "severity": "critical"}'
```

#### 5. 監控 RabbitMQ

訪問管理界面：http://localhost:15672
- 用戶名: `admin`
- 密碼: `admin`

### 📚 使用範例

查看 `src/examples/RabbitMQUsageExample.ts` 獲取完整使用範例：

```bash
# 運行範例
npx tsx src/examples/RabbitMQUsageExample.ts
```

### 🔧 進階配置

#### 1. 生產環境設置

```env
# .env.production
RABBITMQ_URL=amqp://username:password@production-rabbitmq:5672
JWT_SECRET=your-production-jwt-secret
PORT=8000
```

#### 2. 消息處理器集成

在你的應用中啟動消息處理器：

```typescript
import { DeviceCommandService, DeviceEventService, DeviceDataService } from './src/service/index.js';

// 啟動服務
const commandService = await DeviceCommandService.create();
const eventService = await DeviceEventService.create();
const dataService = await DeviceDataService.create();

// 啟動處理器
await commandService.startCommandProcessor(async (command) => {
  // 處理設備指令
  console.log(`執行指令: ${command.commandType}`);
});

await eventService.startEventProcessor(async (event) => {
  // 處理設備事件
  console.log(`處理事件: ${event.eventType}`);
});

await dataService.startDataProcessor(async (data) => {
  // 處理設備數據
  console.log(`處理數據: ${data.deviceId}`);
});
```

### 📖 文檔

- **完整整合指南**: `RABBITMQ_INTEGRATION.md`
- **控制器結構**: `src/controller/README.md`
- **API 文檔**: 可通過 Swagger 查看（如果已配置）

### 🎉 恭喜！

你的 IoT 項目現在擁有：
- 🔥 完整的 RabbitMQ 消息系統
- 🏗️ 統一的控制器架構 
- 🌐 RESTful API 端點
- 📊 實時數據處理
- 🔔 事件驅動通知
- ⚡ 高性能消息隊列

開始構建你的 IoT 應用程序吧！
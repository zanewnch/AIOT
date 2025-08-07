# Factory Pattern 使用指南

## 📋 概述
這份文件說明如何使用重構後的 `DroneEventHandlerFactory`。

## 🏭 Factory Pattern 優勢

### **之前 (Dispatcher Pattern)**
```typescript
// 固定的事件路由
socket.on('drone_position_subscribe', (data) => {
  this.positionHandler.handlePositionSubscription(socket, data);
});
```

### **現在 (Factory Pattern)**  
```typescript
// 動態的處理器獲取
socket.on('drone_position_subscribe', async (data) => {
  const handler = factory.getHandler('drone_position');
  if (handler) {
    await handler.handle(socket, { ...data, action: 'subscribe' });
  }
});
```

## 🚀 使用方式

### **1. 基本使用**
```typescript
import { DroneEventHandlerFactory } from './websocket/DroneEventHandlerFactory.js';

// 創建工廠實例
const factory = new DroneEventHandlerFactory(webSocketService);

// 獲取特定處理器
const positionHandler = factory.getHandler('drone_position');
const statusHandler = factory.getHandler('drone_status');
const commandHandler = factory.getHandler('drone_command');
```

### **2. 動態註冊新處理器**
```typescript
// 創建自定義處理器
class DroneVideoStreamHandler implements DroneEventHandler {
  async handle(socket: AuthenticatedSocket, data: any): Promise<void> {
    // 處理視頻流邏輯
    console.log('Handling video stream:', data);
  }
  
  getHandlerStats(): object {
    return { handlerType: 'DroneVideoStreamHandler' };
  }
}

// 註冊到工廠
const videoHandler = new DroneVideoStreamHandler();
factory.registerHandler('drone_video', videoHandler);

// 現在可以處理視頻流事件了！
socket.on('drone_video_start', async (data) => {
  const handler = factory.getHandler('drone_video');
  if (handler) {
    await handler.handle(socket, data);
  }
});
```

### **3. 統計信息和管理**
```typescript
// 獲取工廠統計
const stats = factory.getFactoryStats();
console.log('Factory stats:', stats);
// Output: {
//   registeredHandlers: 4,
//   totalRequests: 156,
//   lastActivity: "2024-01-01T10:30:00.000Z",
//   supportedEvents: ["drone_position", "drone_status", "drone_command", "drone_video"]
// }

// 獲取所有支援的事件類型
const supportedEvents = factory.getSupportedEvents();
console.log('Supported events:', supportedEvents);

// 聚合所有處理器統計
const allStats = factory.getSubscriptionStats();
console.log('All handler stats:', allStats);
```

### **4. 動態取消註冊**
```typescript
// 取消註冊處理器
factory.unregisterHandler('drone_video');

// 檢查是否還存在
const videoHandler = factory.getHandler('drone_video'); // null
```

## 🎯 實際使用案例

### **案例 1: A/B 測試不同處理邏輯**
```typescript
// 測試環境使用不同的命令處理器
if (process.env.NODE_ENV === 'testing') {
  const mockCommandHandler = new MockDroneCommandHandler();
  factory.registerHandler('drone_command', mockCommandHandler);
}
```

### **案例 2: 插件系統**
```typescript
// 動態載入插件處理器
async function loadPluginHandler(pluginName: string) {
  const pluginModule = await import(`./plugins/${pluginName}Handler.js`);
  const handler = new pluginModule.default();
  factory.registerHandler(pluginName, handler);
}

await loadPluginHandler('drone_thermal_camera');
await loadPluginHandler('drone_lidar');
```

### **案例 3: 微服務準備**
```typescript
// 未來可以輕鬆替換為遠程服務處理器
class RemoteDroneCommandHandler implements DroneEventHandler {
  async handle(socket: AuthenticatedSocket, data: any): Promise<void> {
    // 調用遠程微服務
    const response = await fetch('http://command-service/api/execute', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // 將結果回傳給前端
    const result = await response.json();
    socket.emit('drone_command_response', result);
  }
  
  getHandlerStats(): object {
    return { handlerType: 'RemoteDroneCommandHandler' };
  }
}
```

## 🔧 Migration Guide

### **從舊版本遷移**
```typescript
// 舊版本
const droneHandler = app.getDroneEventHandler();
const positionHandler = droneHandler.getPositionHandler();

// 新版本 (向後兼容)
const factory = app.getDroneEventHandlerFactory();
const positionHandler = factory.getHandler('drone_position');

// 或使用舊方法 (deprecated)
const factory = app.getDroneEventHandler(); // 仍然可用但不推薦
```

## 🎨 最佳實踐

1. **統一處理器接口**: 所有處理器都實現 `DroneEventHandler` 接口
2. **錯誤處理**: 總是檢查 `getHandler()` 的返回值
3. **統計監控**: 定期檢查工廠統計信息
4. **命名規範**: 使用清晰的事件類型命名 (`drone_*`)
5. **資源清理**: 不需要的處理器要及時取消註冊

## 🚀 未來擴展

Factory Pattern 為以下功能奠定基礎：
- **插件系統** - 動態載入處理器
- **微服務架構** - 輕鬆替換為遠程服務
- **A/B 測試** - 動態切換處理邏輯
- **熱更新** - 運行時更換處理器
- **多版本支持** - 同時支援不同版本的處理器
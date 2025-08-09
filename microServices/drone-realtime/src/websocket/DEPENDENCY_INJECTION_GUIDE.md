# 依賴注入重構指南

## 🎯 重構目標

解決 WebSocket 和 HTTP 服務邏輯重複的問題，實現：
- **統一業務邏輯** - WebSocket 和 HTTP 共用同一套服務實例
- **避免重複代碼** - 業務邏輯只在 Service 層實現一次
- **資料一致性** - 使用相同的服務實例確保資料一致
- **更好的可測試性** - 可以輕鬆 mock 依賴進行測試

## 🏗️ 架構變化

### **重構前的問題**
```typescript
// HTTP 控制器
class DroneCommandController {
  constructor() {
    this.droneCommandService = new DroneCommandService(); // ← 重複實例化
  }
}

// WebSocket 處理器
class DroneCommandEventHandler {
  constructor() {
    this.droneCommandService = new DroneCommandService(); // ← 重複實例化
  }
}
```

### **重構後的解決方案**
```typescript
// 統一的服務管理 (app.ts)
class App {
  constructor() {
    // 創建統一的服務實例
    this.droneCommandService = new DroneCommandService();
    this.dronePositionService = new DronePositionService();
    this.droneStatusService = new DroneRealTimeStatusService();
  }
  
  initializeWebSocket(httpServer: HTTPServer) {
    // 注入服務實例到 WebSocket Factory
    this.droneEventHandlerFactory = new DroneEventHandlerFactory({
      wsService: this.webSocketService,
      authMiddleware: authMiddleware,
      services: {
        commandService: this.droneCommandService,    // 注入統一實例
        positionService: this.dronePositionService,  // 注入統一實例
        statusService: this.droneStatusService       // 注入統一實例
      }
    });
  }
}
```

## 📊 依賴注入流程

### **1. 服務創建階段 (App 建構函式)**
```
App.constructor()
├── initializeBusinessServices()
│   ├── droneCommandService = new DroneCommandService()
│   ├── dronePositionService = new DronePositionService()
│   └── droneStatusService = new DroneRealTimeStatusService()
```

### **2. 依賴注入階段 (WebSocket 初始化)**
```
App.initializeWebSocket()
├── DroneEventHandlerFactory({
│   ├── wsService: WebSocketService
│   ├── authMiddleware: WebSocketAuthMiddleware
│   └── services: {
│       ├── commandService: app.droneCommandService    ← 注入
│       ├── positionService: app.dronePositionService  ← 注入
│       └── statusService: app.droneStatusService      ← 注入
│   }
│ })
```

### **3. 處理器創建階段 (Factory 內部)**
```
DroneEventHandlerFactory.initializeHandlersWithDependencies()
├── DronePositionEventHandler(wsService, authMiddleware, services.positionService)
├── DroneStatusEventHandler(wsService, authMiddleware, services.statusService)
└── DroneCommandEventHandler(wsService, authMiddleware, services.commandService)
```

## 🔄 使用方式對比

### **HTTP 控制器使用方式**
```typescript
// HTTP 控制器直接使用統一服務
class DroneCommandController {
  constructor(droneCommandService: DroneCommandService) {
    this.droneCommandService = droneCommandService; // 注入的統一實例
  }
  
  async executeCommand(req: Request, res: Response) {
    const result = await this.droneCommandService.executeCommand(req.body);
    res.json(ControllerResult.success(result));
  }
}
```

### **WebSocket 處理器使用方式**
```typescript
// WebSocket 處理器也使用相同的統一服務
class DroneCommandEventHandler {
  constructor(wsService, authMiddleware, droneCommandService) {
    this.droneCommandService = droneCommandService; // 注入的統一實例
  }
  
  async handle(socket: AuthenticatedSocket, data: any) {
    const result = await this.droneCommandService.executeCommand(data);
    socket.emit('drone_command_response', result);
  }
}
```

## 📝 實際使用例子

### **在 HTTP 控制器中**
```typescript
// HTTP API 調用
POST /api/drone/command
Body: { droneId: "001", command: "takeoff" }

↓ 調用
droneCommandService.executeCommand({ droneId: "001", command: "takeoff" })
↓ 返回
{ success: true, commandId: "cmd_123", message: "Command executed" }
```

### **在 WebSocket 中**
```typescript
// WebSocket 調用
socket.emit('drone_command_send', { droneId: "001", command: "takeoff" })

↓ 調用 (使用相同的服務實例!)
droneCommandService.executeCommand({ droneId: "001", command: "takeoff" })
↓ 返回
socket.emit('drone_command_response', { success: true, commandId: "cmd_123" })
```

## ✅ 重構優勢

### **1. 業務邏輯統一**
- ✅ 命令執行邏輯只在 `DroneCommandService` 中實現一次
- ✅ HTTP 和 WebSocket 都調用相同的業務方法
- ✅ 減少代碼重複，降低維護成本

### **2. 資料一致性**
- ✅ 使用相同的服務實例確保資料狀態一致
- ✅ 避免 HTTP 和 WebSocket 資料不同步問題
- ✅ 共享快取和連線池

### **3. 更好的可測試性**
```typescript
// 測試時可以輕鬆 mock 依賴
const mockCommandService = {
  executeCommand: jest.fn().mockResolvedValue({ success: true })
};

const factory = new DroneEventHandlerFactory({
  wsService: mockWsService,
  authMiddleware: mockAuth,
  services: {
    commandService: mockCommandService, // 注入 mock
    positionService: mockPositionService,
    statusService: mockStatusService
  }
});
```

### **4. 靈活的配置**
```typescript
// 可以根據環境注入不同的服務實現
const services = {
  commandService: process.env.NODE_ENV === 'test' 
    ? new MockDroneCommandService() 
    : new DroneCommandService(),
  // ...
};
```

## 🔮 未來擴展

### **1. 服務替換**
```typescript
// 可以輕鬆替換為遠程服務
const services = {
  commandService: new RemoteDroneCommandService('http://command-service'),
  positionService: new RemoteDronePositionService('http://position-service'),
  statusService: new RemoteDroneStatusService('http://status-service')
};
```

### **2. 多版本支援**
```typescript
// 支援不同版本的服務
const services = {
  commandService: apiVersion === 'v2' 
    ? new DroneCommandServiceV2() 
    : new DroneCommandService()
};
```

### **3. 服務容器**
```typescript
// 進一步發展為服務容器模式
class ServiceContainer {
  static register(name: string, service: any) { /* ... */ }
  static get(name: string) { /* ... */ }
}

ServiceContainer.register('droneCommandService', new DroneCommandService());
const commandService = ServiceContainer.get('droneCommandService');
```

## 🎯 總結

依賴注入重構成功解決了：
1. **業務邏輯重複** → 統一的服務實例
2. **資料不一致** → 共享服務狀態  
3. **維護困難** → 單一業務邏輯實現點
4. **測試複雜** → 輕鬆注入 mock 依賴

這為未來的微服務架構和更複雜的依賴管理奠定了基礎！
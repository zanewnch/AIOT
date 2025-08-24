# Decorator Pattern 設計模式實現 - Drone WebSocket Service

## 概述

這個目錄包含了正確實作的 Decorator Pattern 設計模式，用於為 Drone WebSocket Service 的 Controller、Service、Repository 和 WebSocket Handler 提供日誌功能。

**重要**：這不是 TypeScript 的 `@decorator` 語法糖，而是真正的設計模式實現。

## 特點

- ✅ 與 arrow function 完全兼容
- ✅ 不會產生 TypeScript 編譯錯誤
- ✅ 支援方法執行時間記錄
- ✅ 支援錯誤自動記錄
- ✅ 支援 HTTP 請求資訊記錄
- ✅ 支援 WebSocket 事件處理記錄
- ✅ 可組合和可擴展
- ✅ 完美適配 Drone WebSocket Service 的 logger 系統

## 使用方法

### 1. WebSocket Service 裝飾

```typescript
import { createLoggedWebSocketService } from '../patterns/LoggerDecorator.js';

@injectable()
class DroneRealTimeStatusCommandsSvc {
    constructor(private repo: DroneRealTimeStatusCommandsRepo) {}
    
    updateDroneStatus = async (droneId: string, status: any): Promise<void> => {
        // WebSocket 服務邏輯
    }
}

// 使用裝飾器包裝
export const createDroneRealTimeStatusCommandsSvc = (repo: DroneRealTimeStatusCommandsRepo) => {
    return createLoggedWebSocketService(
        new DroneRealTimeStatusCommandsSvc(repo), 
        'DroneRealTimeStatusCommandsSvc'
    );
};
```

### 2. Health Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class HealthRoutes {
    constructor() {}
    
    getHealth = async (req: Request, res: Response): Promise<void> => {
        // 健康檢查邏輯
    }
}

// 使用裝飾器包裝
export const createHealthRoutes = () => {
    return createLoggedController(
        new HealthRoutes(), 
        'HealthRoutes'
    );
};
```

### 3. Repository 裝飾

```typescript
import { createLoggedRepository } from '../patterns/LoggerDecorator.js';

@injectable()
class DroneRealTimeStatusCommandsRepo {
    constructor() {}
    
    updateStatus = async (droneId: string, data: any): Promise<any> => {
        // Repository 邏輯
    }
}

// 使用裝飾器包裝
export const createDroneRealTimeStatusCommandsRepo = () => {
    return createLoggedRepository(
        new DroneRealTimeStatusCommandsRepo(), 
        'DroneRealTimeStatusCommandsRepo'
    );
};
```

### 4. WebSocket Event Handler 裝飾

```typescript
import { createLoggedService } from '../patterns/LoggerDecorator.js';

@injectable()
class DroneStatusEventHandler {
    constructor() {}
    
    handleDroneStatusUpdate = async (data: any): Promise<void> => {
        // WebSocket 事件處理邏輯
    }
}

// 使用裝飾器包裝
export const createDroneStatusEventHandler = () => {
    return createLoggedService(
        new DroneStatusEventHandler(), 
        'DroneStatusEventHandler',
        { logLevel: 'debug' }
    );
};
```

### 5. 裝飾器鏈（進階用法）

```typescript
import { decorateComponent } from '../patterns/LoggerDecorator.js';

const decoratedService = decorateComponent(new DroneRealTimeStatusCommandsSvc(repo))
    .withLogger('DroneRealTimeStatusCommandsSvc', {
        logExecutionTime: true,
        logErrors: true,
        logLevel: 'info'
    })
    .build();
```

## 在 Container 中使用

```typescript
// container/container.ts
import { Container } from 'inversify';
import { 
    createLoggedController, 
    createLoggedService, 
    createLoggedRepository,
    createLoggedWebSocketService 
} from '../patterns/LoggerDecorator.js';

const container = new Container();

// Repository
container.bind(TYPES.DroneRealTimeStatusCommandsRepo).toDynamicValue(() => {
    return createLoggedRepository(
        new DroneRealTimeStatusCommandsRepo(),
        'DroneRealTimeStatusCommandsRepo'
    );
}).inSingletonScope();

// WebSocket Service
container.bind(TYPES.DroneRealTimeStatusCommandsSvc).toDynamicValue((context) => {
    const repo = context.container.get(TYPES.DroneRealTimeStatusCommandsRepo);
    return createLoggedWebSocketService(
        new DroneRealTimeStatusCommandsSvc(repo),
        'DroneRealTimeStatusCommandsSvc'
    );
}).inSingletonScope();

// Health Routes
container.bind(TYPES.HealthRoutes).toDynamicValue(() => {
    return createLoggedController(
        new HealthRoutes(),
        'HealthRoutes'
    );
}).inSingletonScope();
```

## 日誌輸出範例

```
[2025-08-13 10:30:15] [DRONE-REALTIME-DroneRealTimeStatusCommandsSvc] INFO: 開始執行 DroneRealTimeStatusCommandsSvc.updateDroneStatus
[2025-08-13 10:30:16] [DRONE-REALTIME-DroneRealTimeStatusCommandsSvc] INFO: DroneRealTimeStatusCommandsSvc.updateDroneStatus 執行完成 {"executionTime":"1200ms"}

[2025-08-13 10:31:20] [DRONE-REALTIME-HealthRoutes] INFO: GET /health 請求處理
[2025-08-13 10:31:20] [DRONE-REALTIME-HealthRoutes] INFO: HealthRoutes.getHealth 執行完成 {"executionTime":"50ms"}
```

## WebSocket 特定配置

### WebSocket Service 日誌配置
```typescript
const webSocketServiceOptions = {
    logExecutionTime: true,
    logErrors: true,
    logLevel: 'info' as const,
    logRequest: false  // WebSocket 不使用 HTTP 請求
};
```

### Event Handler 日誌配置
```typescript
const eventHandlerOptions = {
    logExecutionTime: true,
    logErrors: true,
    logLevel: 'debug' as const,
    logParameters: true  // 記錄 WebSocket 事件參數
};
```

## 與傳統 @decorator 的差異

| 特性 | TypeScript @decorator | Decorator Pattern |
|------|----------------------|------------------|
| 與 arrow function 兼容 | ❌ 否 | ✅ 是 |
| TypeScript 編譯錯誤 | ❌ 有錯誤 | ✅ 無錯誤 |
| 運行時動態組合 | ❌ 編譯時固定 | ✅ 運行時可組合 |
| 設計模式純度 | ❌ 語法糖 | ✅ 純設計模式 |
| WebSocket 適配 | ❌ 受限 | ✅ 完美適配 |

## 遷移步驟

1. **移除所有 TypeScript `@decorator`**
2. **使用新的工廠方法包裝實例**
3. **在 Container 中註冊裝飾後的實例**
4. **更新 WebSocket 服務和事件處理器**
5. **測試所有功能正常**

## 最佳實踐

1. **WebSocket Service** - 使用 `createLoggedWebSocketService`
2. **HTTP Controller** - 使用 `createLoggedController`
3. **Repository** - 使用 `createLoggedRepository`
4. **Event Handler** - 使用 `createLoggedService` 並設定 `logLevel: 'debug'`
5. **組合複雜服務** - 使用 `DecoratorChain` 進行鏈式配置
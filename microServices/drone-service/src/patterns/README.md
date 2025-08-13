# Decorator Pattern 設計模式實現

## 概述

這個目錄包含了正確實作的 Decorator Pattern 設計模式，用於為 Controller、Service、Repository 提供日誌功能。

**重要**：這不是 TypeScript 的 `@decorator` 語法糖，而是真正的設計模式實現。

## 特點

- ✅ 與 arrow function 完全兼容
- ✅ 不會產生 TypeScript 編譯錯誤
- ✅ 支援方法執行時間記錄
- ✅ 支援錯誤自動記錄
- ✅ 支援 HTTP 請求資訊記錄
- ✅ 可組合和可擴展

## 使用方法

### 1. Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class DroneCommandCommands {
    constructor(private service: DroneCommandCommandsSvc) {}
    
    createCommand = async (req: Request, res: Response): Promise<void> => {
        // 控制器邏輯
    }
}

// 使用裝飾器包裝
export const createDroneCommandCommands = (service: DroneCommandCommandsSvc) => {
    return createLoggedController(
        new DroneCommandCommands(service), 
        'DroneCommandCommands'
    );
};
```

### 2. Service 裝飾

```typescript
import { createLoggedService } from '../patterns/LoggerDecorator.js';

@injectable()
class DroneCommandCommandsSvc {
    constructor(private repo: DroneCommandCommandsRepo) {}
    
    createCommand = async (data: any): Promise<any> => {
        // 服務邏輯
    }
}

// 使用裝飾器包裝
export const createDroneCommandCommandsSvc = (repo: DroneCommandCommandsRepo) => {
    return createLoggedService(
        new DroneCommandCommandsSvc(repo), 
        'DroneCommandCommandsSvc'
    );
};
```

### 3. Repository 裝飾

```typescript
import { createLoggedRepository } from '../patterns/LoggerDecorator.js';

@injectable()
class DroneCommandCommandsRepo {
    constructor() {}
    
    create = async (data: any): Promise<any> => {
        // 倉庫邏輯
    }
}

// 使用裝飾器包裝
export const createDroneCommandCommandsRepo = () => {
    return createLoggedRepository(
        new DroneCommandCommandsRepo(), 
        'DroneCommandCommandsRepo'
    );
};
```

### 4. 裝飾器鏈（進階用法）

```typescript
import { decorateComponent } from '../patterns/LoggerDecorator.js';

const decoratedController = decorateComponent(new DroneCommandCommands(service))
    .withLogger('DroneCommandCommands', {
        logExecutionTime: true,
        logRequest: true,
        logErrors: true
    })
    .build();
```

## 在 Container 中使用

```typescript
// container.ts
import { Container } from 'inversify';
import { createLoggedController, createLoggedService, createLoggedRepository } from '../patterns/LoggerDecorator.js';

const container = new Container();

// Repository
container.bind(TYPES.DroneCommandCommandsRepo).toDynamicValue(() => {
    return createLoggedRepository(
        new DroneCommandCommandsRepo(),
        'DroneCommandCommandsRepo'
    );
}).inSingletonScope();

// Service
container.bind(TYPES.DroneCommandCommandsSvc).toDynamicValue((context) => {
    const repo = context.container.get(TYPES.DroneCommandCommandsRepo);
    return createLoggedService(
        new DroneCommandCommandsSvc(repo),
        'DroneCommandCommandsSvc'
    );
}).inSingletonScope();

// Controller
container.bind(TYPES.DroneCommandCommandsCtrl).toDynamicValue((context) => {
    const service = context.container.get(TYPES.DroneCommandCommandsSvc);
    return createLoggedController(
        new DroneCommandCommands(service),
        'DroneCommandCommands'
    );
}).inSingletonScope();
```

## 日誌輸出範例

```
[2025-08-13 10:30:15] [INFO] DroneCommandCommands: 開始執行 DroneCommandCommands.createCommand
[2025-08-13 10:30:15] [INFO] DroneCommandCommands: POST /api/drone-commands/data 請求處理
[2025-08-13 10:30:16] [INFO] DroneCommandCommands: DroneCommandCommands.createCommand 執行完成 {"executionTime":"1200ms"}
```

## 與傳統 @decorator 的差異

| 特性 | TypeScript @decorator | Decorator Pattern |
|------|----------------------|------------------|
| 與 arrow function 兼容 | ❌ 否 | ✅ 是 |
| TypeScript 編譯錯誤 | ❌ 有錯誤 | ✅ 無錯誤 |
| 運行時動態組合 | ❌ 編譯時固定 | ✅ 運行時可組合 |
| 設計模式純度 | ❌ 語法糖 | ✅ 純設計模式 |
| 可擴展性 | ❌ 受限 | ✅ 高度可擴展 |

## 遷移步驟

1. **移除所有 TypeScript `@decorator`**
2. **使用新的工廠方法包裝實例**
3. **在 Container 中註冊裝飾後的實例**
4. **測試所有功能正常**
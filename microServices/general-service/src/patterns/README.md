# Decorator Pattern 設計模式實現 - General Service

## 概述

這個目錄包含了正確實作的 Decorator Pattern 設計模式，用於為 General Service 的 Controller、Service、Repository、Routes 和 gRPC Service 提供日誌功能。

**重要**：這不是 TypeScript 的 `@decorator` 語法糖，而是真正的設計模式實現。

## 特點

- ✅ 與 arrow function 完全兼容
- ✅ 不會產生 TypeScript 編譯錯誤
- ✅ 支援方法執行時間記錄
- ✅ 支援錯誤自動記錄
- ✅ 支援 HTTP 請求資訊記錄
- ✅ 支援 gRPC 服務記錄
- ✅ 支援用戶偏好設定記錄
- ✅ 可組合和可擴展
- ✅ 完美適配 General Service 的 logger 系統

## 使用方法

### 1. User Preference Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class UserPreferenceCommandsCtrl {
    constructor(private service: UserPreferenceCommandsSvc) {}
    
    setUserPreference = async (req: Request, res: Response): Promise<void> => {
        // 用戶偏好設定控制器邏輯
    }
}

// 使用裝飾器包裝
export const createUserPreferenceCommandsCtrl = (service: UserPreferenceCommandsSvc) => {
    return createLoggedController(
        new UserPreferenceCommandsCtrl(service), 
        'UserPreferenceCommandsCtrl'
    );
};
```

### 2. Docs Service 裝飾

```typescript
import { createLoggedService } from '../patterns/LoggerDecorator.js';

@injectable()
class UserPreferenceCommandsSvc {
    constructor(private repo: UserPreferenceCommandsRepo) {}
    
    setPreference = async (userId: string, preferences: any): Promise<any> => {
        // 服務邏輯
    }
}

// 使用裝飾器包裝
export const createUserPreferenceCommandsSvc = (repo: UserPreferenceCommandsRepo) => {
    return createLoggedService(
        new UserPreferenceCommandsSvc(repo), 
        'UserPreferenceCommandsSvc'
    );
};
```

### 3. Repository 裝飾

```typescript
import { createLoggedRepository } from '../patterns/LoggerDecorator.js';

@injectable()
class UserPreferenceCommandsRepo {
    constructor() {}
    
    save = async (data: any): Promise<any> => {
        // Repository 邏輯
    }
}

// 使用裝飾器包裝
export const createUserPreferenceCommandsRepo = () => {
    return createLoggedRepository(
        new UserPreferenceCommandsRepo(), 
        'UserPreferenceCommandsRepo'
    );
};
```

### 4. Routes 裝飾

```typescript
import { createLoggedRoutes } from '../patterns/LoggerDecorator.js';

@injectable()
class UserPreferenceRoutes {
    constructor() {}
    
    setupRoutes = (): void => {
        // 路由設定邏輯
    }
}

// 使用裝飾器包裝
export const createUserPreferenceRoutes = () => {
    return createLoggedRoutes(
        new UserPreferenceRoutes(), 
        'UserPreferenceRoutes'
    );
};
```

### 5. gRPC Service 裝飾

```typescript
import { createLoggedGrpcService } from '../patterns/LoggerDecorator.js';

@injectable()
class GeneralGrpcServer {
    constructor() {}
    
    getUserPreference = async (call: any, callback: any): Promise<void> => {
        // gRPC 服務邏輯
    }
}

// 使用裝飾器包裝
export const createGeneralGrpcServer = () => {
    return createLoggedGrpcService(
        new GeneralGrpcServer(), 
        'GeneralGrpcServer'
    );
};
```

### 6. 裝飾器鏈（進階用法）

```typescript
import { decorateComponent } from '../patterns/LoggerDecorator.js';

const decoratedController = decorateComponent(new UserPreferenceCommandsCtrl(service))
    .withLogger('UserPreferenceCommandsCtrl', {
        logExecutionTime: true,
        logRequest: true,
        logErrors: true
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
    createLoggedRoutes,
    createLoggedGrpcService
} from '../patterns/LoggerDecorator.js';

const container = new Container();

// Repository
container.bind(TYPES.UserPreferenceCommandsRepo).toDynamicValue(() => {
    return createLoggedRepository(
        new UserPreferenceCommandsRepo(),
        'UserPreferenceCommandsRepo'
    );
}).inSingletonScope();

// Service
container.bind(TYPES.UserPreferenceCommandsSvc).toDynamicValue((context) => {
    const repo = context.container.get(TYPES.UserPreferenceCommandsRepo);
    return createLoggedService(
        new UserPreferenceCommandsSvc(repo),
        'UserPreferenceCommandsSvc'
    );
}).inSingletonScope();

// Controller
container.bind(TYPES.UserPreferenceCommandsCtrl).toDynamicValue((context) => {
    const service = context.container.get(TYPES.UserPreferenceCommandsSvc);
    return createLoggedController(
        new UserPreferenceCommandsCtrl(service),
        'UserPreferenceCommandsCtrl'
    );
}).inSingletonScope();

// Routes
container.bind(TYPES.UserPreferenceRoutes).toDynamicValue(() => {
    return createLoggedRoutes(
        new UserPreferenceRoutes(),
        'UserPreferenceRoutes'
    );
}).inSingletonScope();

// gRPC Service
container.bind(TYPES.GeneralGrpcServer).toDynamicValue(() => {
    return createLoggedGrpcService(
        new GeneralGrpcServer(),
        'GeneralGrpcServer'
    );
}).inSingletonScope();
```

## 日誌輸出範例

```
[2025-08-13 10:30:15] [GENERAL-UserPreferenceCommandsCtrl] INFO: POST /api/user-preference 請求處理
[2025-08-13 10:30:15] [GENERAL-UserPreferenceCommandsCtrl] INFO: 開始執行 UserPreferenceCommandsCtrl.setUserPreference
[2025-08-13 10:30:16] [GENERAL-UserPreferenceCommandsSvc] INFO: UserPreferenceCommandsSvc.setPreference 執行完成 {"executionTime":"800ms"}
[2025-08-13 10:30:16] [GENERAL-UserPreferenceCommandsCtrl] INFO: UserPreferenceCommandsCtrl.setUserPreference 執行完成 {"executionTime":"1200ms"}

[2025-08-13 10:31:20] [GENERAL-DocsQueriesCtrl] INFO: GET /docs/api 請求處理
[2025-08-13 10:31:20] [GENERAL-DocsQueriesCtrl] INFO: DocsQueriesCtrl.getDocs 執行完成 {"executionTime":"50ms"}
```

## General Service 特定配置

### Controller 日誌配置
```typescript
const controllerOptions = {
    logExecutionTime: true,
    logErrors: true,
    logRequest: true,
    logLevel: 'info' as const
};
```

### Service 日誌配置
```typescript
const serviceOptions = {
    logExecutionTime: true,
    logErrors: true,
    logRequest: false,
    logLevel: 'info' as const
};
```

### Repository 日誌配置
```typescript
const repositoryOptions = {
    logExecutionTime: true,
    logErrors: true,
    logLevel: 'debug' as const,
    logParameters: true
};
```

### gRPC Service 日誌配置
```typescript
const grpcOptions = {
    logExecutionTime: true,
    logErrors: true,
    logRequest: false,
    logLevel: 'info' as const
};
```

## 與舊版 TypeScript Decorator 的差異

| 特性 | TypeScript @decorator | Decorator Pattern |
|------|----------------------|------------------|
| 與 arrow function 兼容 | ❌ 否 | ✅ 是 |
| TypeScript 編譯錯誤 | ❌ 有錯誤 | ✅ 無錯誤 |
| 運行時動態組合 | ❌ 編譯時固定 | ✅ 運行時可組合 |
| 設計模式純度 | ❌ 語法糖 | ✅ 純設計模式 |
| gRPC 適配 | ❌ 受限 | ✅ 完美適配 |

## 遷移步驟

1. **移除舊的 TypeScript `@decorator`**
2. **替換 `/decorators/LoggerDecorator.ts` 中的實現**
3. **使用新的工廠方法包裝實例**
4. **在 Container 中註冊裝飾後的實例**
5. **更新 Routes 和 gRPC 服務**
6. **測試所有功能正常**

## 最佳實踐

1. **HTTP Controller** - 使用 `createLoggedController`
2. **Business Service** - 使用 `createLoggedService`
3. **Repository** - 使用 `createLoggedRepository`
4. **Routes Handler** - 使用 `createLoggedRoutes`
5. **gRPC Service** - 使用 `createLoggedGrpcService`
6. **組合複雜服務** - 使用 `DecoratorChain` 進行鏈式配置

## 遷移範例

### 舊版 (TypeScript Decorator)
```typescript
@Logger('UserPreferenceCommandsCtrl')
class UserPreferenceCommandsCtrl {
    @LogController()
    setUserPreference = async (req: Request, res: Response): Promise<void> => {
        // 實現
    }
}
```

### 新版 (Decorator Pattern)
```typescript
class UserPreferenceCommandsCtrl {
    setUserPreference = async (req: Request, res: Response): Promise<void> => {
        // 實現
    }
}

// Container 註冊
container.bind(TYPES.UserPreferenceCommandsCtrl).toDynamicValue(() => {
    return createLoggedController(
        new UserPreferenceCommandsCtrl(),
        'UserPreferenceCommandsCtrl'
    );
});
```
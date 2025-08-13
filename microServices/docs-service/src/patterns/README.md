# Decorator Pattern 設計模式實現 - Docs Service

## 概述

這個目錄包含了正確實作的 Decorator Pattern 設計模式，用於為 Docs Service 的 Controller、Service 和 Routes 提供日誌功能。

**重要**：這不是 TypeScript 的 `@decorator` 語法糖，而是真正的設計模式實現。

## 特點

- ✅ 與 arrow function 完全兼容
- ✅ 不會產生 TypeScript 編譯錯誤
- ✅ 支援方法執行時間記錄
- ✅ 支援錯誤自動記錄
- ✅ 支援 HTTP 請求資訊記錄
- ✅ **支援文檔存取專用記錄**
- ✅ **支援服務發現專用記錄**
- ✅ 可組合和可擴展
- ✅ 完美適配 Docs Service 的 logger 系統
- ✅ 新增完整的 Winston logger 配置

## 使用方法

### 1. Docs Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class DocsController {
    constructor(private docsService: DocsGenerationService) {}
    
    getDocs = async (req: Request, res: Response): Promise<void> => {
        // 文檔控制器邏輯
    }
    
    serveDocs = async (req: Request, res: Response): Promise<void> => {
        // 服務文檔邏輯
    }
}

// 使用裝飾器包裝
export const createDocsController = (docsService: DocsGenerationService) => {
    return createLoggedController(
        new DocsController(docsService), 
        'DocsController'
    );
};
```

### 2. Health Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class HealthController {
    constructor() {}
    
    getHealth = async (req: Request, res: Response): Promise<void> => {
        // 健康檢查邏輯
    }
}

// 使用裝飾器包裝
export const createHealthController = () => {
    return createLoggedController(
        new HealthController(), 
        'HealthController'
    );
};
```

### 3. Service Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class ServiceController {
    constructor() {}
    
    getServices = async (req: Request, res: Response): Promise<void> => {
        // 服務列表邏輯
    }
}

// 使用裝飾器包裝
export const createServiceController = () => {
    return createLoggedController(
        new ServiceController(), 
        'ServiceController'
    );
};
```

### 4. Docs Generation Service 裝飾

```typescript
import { createLoggedDocsService } from '../patterns/LoggerDecorator.js';

@injectable()
class DocsGenerationService {
    constructor() {}
    
    generateDocs = async (serviceName: string): Promise<string> => {
        // 文檔生成邏輯
    }
    
    discoverServices = async (): Promise<any[]> => {
        // 服務發現邏輯
    }
}

// 使用裝飾器包裝
export const createDocsGenerationService = () => {
    return createLoggedDocsService(
        new DocsGenerationService(), 
        'DocsGenerationService'
    );
};
```

### 5. Routes 裝飾

```typescript
import { createLoggedRoutes } from '../patterns/LoggerDecorator.js';

@injectable()
class DocsRoutes {
    constructor() {}
    
    setupRoutes = (): void => {
        // 路由設定邏輯
    }
}

// 使用裝飾器包裝
export const createDocsRoutes = () => {
    return createLoggedRoutes(
        new DocsRoutes(), 
        'DocsRoutes'
    );
};
```

### 6. 裝飾器鏈（進階用法）

```typescript
import { decorateComponent } from '../patterns/LoggerDecorator.js';

const decoratedController = decorateComponent(new DocsController(docsService))
    .withLogger('DocsController', {
        logExecutionTime: true,
        logRequest: true,
        logDocumentAccess: true,
        logServiceDiscovery: true,
        logErrors: true
    })
    .build();
```

## 在 Container 中使用

```typescript
// 由於 docs-service 目前沒有 DI Container，以下為建議實現

import { Container } from 'inversify';
import { 
    createLoggedController, 
    createLoggedService, 
    createLoggedDocsService,
    createLoggedRoutes
} from '../patterns/LoggerDecorator.js';

const container = new Container();

// Services
container.bind('DocsGenerationService').toDynamicValue(() => {
    return createLoggedDocsService(
        new DocsGenerationService(),
        'DocsGenerationService'
    );
}).inSingletonScope();

// Controllers
container.bind('DocsController').toDynamicValue((context) => {
    const docsService = context.container.get('DocsGenerationService');
    return createLoggedController(
        new DocsController(docsService),
        'DocsController'
    );
}).inSingletonScope();

container.bind('HealthController').toDynamicValue(() => {
    return createLoggedController(
        new HealthController(),
        'HealthController'
    );
}).inSingletonScope();

container.bind('ServiceController').toDynamicValue(() => {
    return createLoggedController(
        new ServiceController(),
        'ServiceController'
    );
}).inSingletonScope();

// Routes
container.bind('DocsRoutes').toDynamicValue(() => {
    return createLoggedRoutes(
        new DocsRoutes(),
        'DocsRoutes'
    );
}).inSingletonScope();
```

## 日誌輸出範例

### 文檔存取日誌
```
[2025-08-13 10:30:15] [DOCS-DocsController] INFO: GET /docs/rbac/ 請求處理
[2025-08-13 10:30:15] [DOCS-DocsController] INFO: Documentation access {"documentType":"rbac-docs","documentPath":"/docs/rbac/","userAgent":"Mozilla/5.0...","timestamp":"2025-08-13T10:30:15.123Z"}
[2025-08-13 10:30:16] [DOCS-DocsController] INFO: DocsController.getDocs 執行完成 {"executionTime":"800ms"}
```

### 服務發現日誌
```
[2025-08-13 10:31:20] [DOCS-ServiceController] INFO: GET /api/services 請求處理
[2025-08-13 10:31:20] [DOCS-DocsGenerationService] INFO: Service discovery: list for all-services
[2025-08-13 10:31:21] [DOCS-ServiceController] INFO: ServiceController.getServices 執行完成 {"executionTime":"500ms"}
```

### 健康檢查日誌
```
[2025-08-13 10:32:30] [DOCS-HealthController] INFO: GET /health 請求處理
[2025-08-13 10:32:30] [DOCS-DocsGenerationService] DEBUG: Service discovery: health_check for docs-service
[2025-08-13 10:32:30] [DOCS-HealthController] INFO: HealthController.getHealth 執行完成 {"executionTime":"50ms"}
```

## Docs Service 特定配置

### Docs Controller 配置
```typescript
const docsControllerOptions = {
    logExecutionTime: true,
    logErrors: true,
    logRequest: true,
    logDocumentAccess: true,
    logServiceDiscovery: true,
    logLevel: 'info' as const
};
```

### Docs Service 配置
```typescript
const docsServiceOptions = {
    logExecutionTime: true,
    logErrors: true,
    logDocumentAccess: true,
    logServiceDiscovery: true,
    logLevel: 'info' as const
};
```

### Health Controller 配置
```typescript
const healthControllerOptions = {
    logExecutionTime: true,
    logErrors: true,
    logRequest: true,
    logServiceDiscovery: true,
    logLevel: 'debug' as const
};
```

### Routes 配置
```typescript
const routesOptions = {
    logExecutionTime: false,  // 路由層不需要執行時間
    logErrors: true,
    logRequest: true,
    logLevel: 'info' as const
};
```

## 特殊功能

### 1. 自動文檔存取日誌
系統會自動識別文檔相關方法並記錄：
- 文檔類型（rbac-docs, drone-docs, etc.）
- 文檔路徑
- 用戶代理資訊
- 存取時間戳

### 2. 自動服務發現日誌
系統會自動識別服務發現相關方法並記錄：
- 服務名稱
- 操作類型（discover/list/health_check）
- 請求詳情

### 3. 智慧推斷
根據 URL 路徑和方法名稱自動推斷：
- 文檔類型和服務名稱
- 操作意圖

## Logger 配置更新

### 新增的 Logger 功能
- **完整的 Winston 配置**
- **檔案輪轉日誌**
- **彩色控制台輸出**
- **異常和 Promise 拒絕處理**
- **文檔存取專用日誌函數**
- **服務發現專用日誌函數**

### 日誌檔案位置
```
logs/docs/
├── docs-app-2025-08-13.log      # 一般日誌
├── docs-error-2025-08-13.log    # 錯誤日誌
├── docs-exceptions.log          # 異常日誌
└── docs-rejections.log          # Promise 拒絕日誌
```

## 與其他微服務的差異

| 特性 | 其他微服務 | Docs Service |
|------|-----------|-------------|
| Logger 配置 | 已存在 | ✅ 新建完整配置 |
| DI Container | 有 | ❌ 建議新增 |
| 文檔存取記錄 | ❌ | ✅ 專門支援 |
| 服務發現記錄 | ❌ | ✅ 專門支援 |
| 靜態檔案服務 | ❌ | ✅ 自動記錄 |

## 遷移步驟

1. **安裝 Winston 和相關依賴**
   ```bash
   npm install winston winston-daily-rotate-file
   ```

2. **整合新的 Logger 配置**
   - 將 `loggerConfig.ts` 整合到現有配置中
   - 更新 import 路徑

3. **使用新的工廠方法包裝實例**
4. **考慮引入 DI Container**
5. **測試所有功能正常**
6. **驗證文檔存取和服務發現日誌**

## 最佳實踐

1. **Docs Controller** - 使用 `createLoggedController` 並啟用所有記錄功能
2. **Docs Service** - 使用 `createLoggedDocsService` 專門優化配置
3. **Health Controller** - 使用 `createLoggedController` 並設定 `logLevel: 'debug'`
4. **Routes Handler** - 使用 `createLoggedRoutes`
5. **組合服務** - 使用 `DecoratorChain` 進行複雜配置

## 安全性和效能考量

1. **文檔路徑記錄** - 避免記錄敏感的檔案系統路徑
2. **用戶代理資訊** - 記錄但不追蹤個人資訊
3. **服務發現** - 只記錄公開的服務資訊
4. **檔案存取** - 監控大檔案下載的效能影響
5. **日誌輪轉** - 確保日誌檔案不會無限制增長
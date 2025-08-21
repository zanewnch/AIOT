# Decorator Pattern 設計模式實現 - RBAC Service

## 概述

這個目錄包含了正確實作的 Decorator Pattern 設計模式，用於為 RBAC Service 的 Controller、Service、Repo 和 gRPC Service 提供日誌功能。

**重要**：這不是 TypeScript 的 `@decorator` 語法糖，而是真正的設計模式實現。

## 特點

- ✅ 與 arrow function 完全兼容
- ✅ 不會產生 TypeScript 編譯錯誤
- ✅ 支援方法執行時間記錄
- ✅ 支援錯誤自動記錄
- ✅ 支援 HTTP 請求資訊記錄
- ✅ **支援權限檢查專用記錄**
- ✅ **支援認證事件專用記錄**
- ✅ 支援 gRPC 服務記錄
- ✅ 可組合和可擴展
- ✅ 完美適配 RBAC Service 的 logger 系統

## 使用方法

### 1. Authentication Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class AuthCommandsCtrl {
    constructor(private authService: AuthQueriesSvc) {}
    
    login = async (req: Request, res: Response): Promise<void> => {
        // 登入控制器邏輯
    }
    
    logout = async (req: Request, res: Response): Promise<void> => {
        // 登出控制器邏輯
    }
}

// 使用裝飾器包裝
export const createAuthCommandsCtrl = (authService: AuthQueriesSvc) => {
    return createLoggedController(
        new AuthCommandsCtrl(authService), 
        'AuthCommandsCtrl'
    );
};
```

### 2. User Management Controller 裝飾

```typescript
import { createLoggedController } from '../patterns/LoggerDecorator.js';

@injectable()
class UserCommandsCtrl {
    constructor(private service: UserCommandsSvc) {}
    
    createUser = async (req: Request, res: Response): Promise<void> => {
        // 用戶管理控制器邏輯
    }
}

// 使用裝飾器包裝
export const createUserCommandsCtrl = (service: UserCommandsSvc) => {
    return createLoggedController(
        new UserCommandsCtrl(service), 
        'UserCommandsCtrl'
    );
};
```

### 3. Permission Service 裝飾

```typescript
import { createLoggedPermissionService } from '../patterns/LoggerDecorator.js';

@injectable()
class PermissionCommandsSvc {
    constructor(private repo: PermissionCommandsRepo) {}
    
    checkPermission = async (userId: number, permission: string): Promise<boolean> => {
        // 權限檢查邏輯
    }
}

// 使用裝飾器包裝
export const createPermissionCommandsSvc = (repo: PermissionCommandsRepo) => {
    return createLoggedPermissionService(
        new PermissionCommandsSvc(repo), 
        'PermissionCommandsSvc'
    );
};
```

### 4. Authentication Service 裝飾

```typescript
import { createLoggedAuthService } from '../patterns/LoggerDecorator.js';

@injectable()
class AuthQueriesSvc {
    constructor(private userRepo: UserQueriesRepo) {}
    
    validateLogin = async (username: string, password: string): Promise<any> => {
        // 認證服務邏輯
    }
}

// 使用裝飾器包裝
export const createAuthQueriesSvc = (userRepo: UserQueriesRepo) => {
    return createLoggedAuthService(
        new AuthQueriesSvc(userRepo), 
        'AuthQueriesSvc'
    );
};
```

### 5. Repo 裝飾

```typescript
import { createLoggedRepo } from '../patterns/LoggerDecorator.js';

@injectable()
class UserCommandsRepo {
    constructor() {}
    
    create = async (userData: any): Promise<any> => {
        // Repo 邏輯
    }
}

// 使用裝飾器包裝
export const createUserCommandsRepo = () => {
    return createLoggedRepo(
        new UserCommandsRepo(), 
        'UserCommandsRepo'
    );
};
```

### 6. gRPC Service 裝飾

```typescript
import { createLoggedGrpcService } from '../patterns/LoggerDecorator.js';

@injectable()
class RbacGrpcServer {
    constructor() {}
    
    checkUserPermission = async (call: any, callback: any): Promise<void> => {
        // gRPC 服務邏輯
    }
}

// 使用裝飾器包裝
export const createRbacGrpcServer = () => {
    return createLoggedGrpcService(
        new RbacGrpcServer(), 
        'RbacGrpcServer'
    );
};
```

### 7. 裝飾器鏈（進階用法）

```typescript
import { decorateComponent } from '../patterns/LoggerDecorator.js';

const decoratedAuthController = decorateComponent(new AuthCommandsCtrl(authService))
    .withLogger('AuthCommandsCtrl', {
        logExecutionTime: true,
        logRequest: true,
        logAuthEvent: true,
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
    createLoggedRepo,
    createLoggedAuthService,
    createLoggedPermissionService,
    createLoggedGrpcService
} from '../patterns/LoggerDecorator.js';

const container = new Container();

// Repositories
container.bind(TYPES.UserCommandsRepo).toDynamicValue(() => {
    return createLoggedRepo(
        new UserCommandsRepo(),
        'UserCommandsRepo'
    );
}).inSingletonScope();

// Services
container.bind(TYPES.AuthQueriesSvc).toDynamicValue((context) => {
    const userRepo = context.container.get(TYPES.UserQueriesRepo);
    return createLoggedAuthService(
        new AuthQueriesSvc(userRepo),
        'AuthQueriesSvc'
    );
}).inSingletonScope();

container.bind(TYPES.PermissionCommandsSvc).toDynamicValue((context) => {
    const repo = context.container.get(TYPES.PermissionCommandsRepo);
    return createLoggedPermissionService(
        new PermissionCommandsSvc(repo),
        'PermissionCommandsSvc'
    );
}).inSingletonScope();

// Controllers
container.bind(TYPES.AuthCommandsCtrl).toDynamicValue((context) => {
    const authService = context.container.get(TYPES.AuthQueriesSvc);
    return createLoggedController(
        new AuthCommandsCtrl(authService),
        'AuthCommandsCtrl'
    );
}).inSingletonScope();

container.bind(TYPES.UserCommandsCtrl).toDynamicValue((context) => {
    const service = context.container.get(TYPES.UserCommandsSvc);
    return createLoggedController(
        new UserCommandsCtrl(service),
        'UserCommandsCtrl'
    );
}).inSingletonScope();

// gRPC Service
container.bind(TYPES.RbacGrpcServer).toDynamicValue(() => {
    return createLoggedGrpcService(
        new RbacGrpcServer(),
        'RbacGrpcServer'
    );
}).inSingletonScope();
```

## 日誌輸出範例

### 認證相關日誌
```
[2025-08-13 10:30:15] [RBAC-AuthCommandsCtrl] INFO: POST /api/auth/login 請求處理
[2025-08-13 10:30:15] [RBAC-AuthQueriesSvc] INFO: 開始執行 AuthQueriesSvc.validateLogin
[2025-08-13 10:30:16] [RBAC-AuthQueriesSvc] INFO: Auth event: login for admin - SUCCESS
[2025-08-13 10:30:16] [RBAC-AuthCommandsCtrl] INFO: AuthCommandsCtrl.login 執行完成 {"executionTime":"1200ms"}
```

### 權限檢查日誌
```
[2025-08-13 10:31:20] [RBAC-PermissionCommandsSvc] INFO: 開始執行 PermissionCommandsSvc.checkPermission
[2025-08-13 10:31:20] [RBAC-PermissionCommandsSvc] INFO: Permission check: user_management for user 1 - GRANTED
[2025-08-13 10:31:21] [RBAC-PermissionCommandsSvc] INFO: PermissionCommandsSvc.checkPermission 執行完成 {"executionTime":"500ms"}
```

### 用戶管理日誌
```
[2025-08-13 10:32:30] [RBAC-UserCommandsCtrl] INFO: POST /api/users 請求處理
[2025-08-13 10:32:30] [RBAC-UserCommandsSvc] INFO: UserCommandsSvc.createUser 執行完成 {"executionTime":"800ms"}
[2025-08-13 10:32:30] [RBAC-UserCommandsCtrl] INFO: UserCommandsCtrl.createUser 執行完成 {"executionTime":"1000ms"}
```

## RBAC Service 特定配置

### Authentication Controller 配置
```typescript
const authControllerOptions = {
    logExecutionTime: true,
    logErrors: true,
    logRequest: true,
    logAuthEvent: true,
    logLevel: 'info' as const
};
```

### Permission Service 配置
```typescript
const permissionServiceOptions = {
    logExecutionTime: true,
    logErrors: true,
    logPermissionCheck: true,
    logLevel: 'info' as const
};
```

### Authentication Service 配置
```typescript
const authServiceOptions = {
    logExecutionTime: true,
    logErrors: true,
    logAuthEvent: true,
    logLevel: 'info' as const
};
```

### Repo 配置
```typescript
const repositoryOptions = {
    logExecutionTime: true,
    logErrors: true,
    logLevel: 'debug' as const,
    logParameters: true  // 用於調試 SQL 查詢
};
```

## 特殊功能

### 1. 自動權限檢查日誌
系統會自動識別權限相關方法並記錄：
- 用戶 ID
- 檢查的權限
- 檢查結果（GRANTED/DENIED）

### 2. 自動認證事件日誌
系統會自動識別認證相關方法並記錄：
- 事件類型（login/logout/token_refresh）
- 用戶名
- 成功/失敗狀態

### 3. 敏感操作追蹤
所有用戶、角色、權限的 CRUD 操作都會被詳細記錄。

## 與傳統 @decorator 的差異

| 特性 | TypeScript @decorator | Decorator Pattern |
|------|----------------------|------------------|
| 與 arrow function 兼容 | ❌ 否 | ✅ 是 |
| TypeScript 編譯錯誤 | ❌ 有錯誤 | ✅ 無錯誤 |
| 運行時動態組合 | ❌ 編譯時固定 | ✅ 運行時可組合 |
| 權限檢查日誌 | ❌ 需手動實現 | ✅ 自動識別記錄 |
| 認證事件日誌 | ❌ 需手動實現 | ✅ 自動識別記錄 |
| RBAC 特化功能 | ❌ 通用實現 | ✅ RBAC 專門優化 |

## 遷移步驟

1. **分析現有的 RBAC 架構**
2. **移除所有 TypeScript `@decorator`**
3. **使用新的工廠方法包裝實例**
4. **在 Container 中註冊裝飾後的實例**
5. **更新認證和權限相關服務**
6. **測試所有認證和權限功能**
7. **驗證日誌記錄的完整性**

## 最佳實踐

1. **Authentication Controller** - 使用 `createLoggedController` 並啟用 `logAuthEvent`
2. **Permission Service** - 使用 `createLoggedPermissionService` 並啟用 `logPermissionCheck`
3. **User/Role Management** - 使用 `createLoggedController` 並啟用完整日誌
4. **Repo** - 使用 `createLoggedRepo` 並設定 `logLevel: 'debug'`
5. **gRPC Service** - 使用 `createLoggedGrpcService`
6. **敏感操作** - 使用 `DecoratorChain` 進行多層日誌配置

## 安全性考量

1. **密碼和敏感資料** - 確保不會記錄在 parameters 中
2. **Token 資訊** - 只記錄成功/失敗狀態，不記錄實際 token
3. **權限檢查** - 詳細記錄所有權限檢查結果
4. **操作審計** - 記錄所有 CRUD 操作的執行者和時間
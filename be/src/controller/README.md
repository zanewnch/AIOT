# 控制器統一入口

## 概述

此 `index.ts` 文件提供了所有控制器的統一入口點，簡化了項目的依賴管理和初始化過程。

## 結構

```
src/controller/
├── index.ts                    # 統一入口文件
├── DeviceController.ts         # 設備控制器 (RabbitMQ 集成)
├── InitializationController.ts # 初始化控制器
├── JWTAuthController.ts        # JWT 認證控制器
└── rbac/                       # RBAC 控制器目錄
    ├── index.ts                # RBAC 控制器統一入口
    ├── RBACController.ts       # 主 RBAC 控制器
    ├── UserController.ts       # 用戶控制器
    ├── RoleController.ts       # 角色控制器
    ├── PermissionController.ts # 權限控制器
    ├── UserToRoleController.ts # 用戶角色關聯控制器
    └── RoleToPermissionController.ts # 角色權限關聯控制器
```

## 使用方式

### 1. 統一初始化所有控制器

```typescript
import { setupControllers } from './controller/index.js';

// 在 server.ts 中
const controllers = await setupControllers(app);
```

### 2. 單獨導入特定控制器

```typescript
import { 
  DeviceController, 
  RBACController, 
  InitializationController 
} from './controller/index.js';

// 創建實例
const deviceController = await DeviceController.create();
const rbacController = new RBACController();
```

## 特性

### ✅ 統一管理
- 所有控制器在一個地方管理
- 統一的初始化流程
- 自動路由配置

### ✅ 異步支持
- 支持異步控制器初始化（如 DeviceController）
- 正確的依賴順序處理

### ✅ 類型安全
- 完整的 TypeScript 類型定義
- 清晰的接口定義

### ✅ 模塊化
- 保持各控制器的獨立性
- 支持按需導入

## 路由配置

`setupControllers` 函數會自動配置以下路由：

```
/api/init          - 初始化相關端點
/api/auth          - JWT 認證端點
/api/rbac          - RBAC 權限管理端點
/api/devices       - 設備管理端點 (RabbitMQ)
```

## 最佳實踐

1. **統一初始化**: 使用 `setupControllers` 函數統一初始化所有控制器
2. **按需導入**: 當需要特定控制器時，從 index.ts 導入
3. **類型安全**: 使用 `Controllers` 接口確保類型安全
4. **錯誤處理**: 在 `setupControllers` 中適當處理初始化錯誤

## 依賴關係

```
setupControllers
├── InitializationController (同步)
├── JWTAuthController (同步)
├── RBACController (同步)
└── DeviceController (異步, 需要 RabbitMQ)
```

## 範例

### 完整的服務器初始化

```typescript
import app from './app.js';
import { setupControllers } from './controller/index.js';

(async () => {
  try {
    // 初始化資料庫
    await database.sync();
    
    // 初始化 RabbitMQ
    await createRabbitChannel();
    
    // 初始化所有控制器
    const controllers = await setupControllers(app);
    
    // 啟動服務器
    server.listen(port);
    
    console.log('🚀 Server ready with all controllers initialized');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
})();
```

這種統一入口的設計讓項目更容易維護，並且提供了清晰的依賴管理。
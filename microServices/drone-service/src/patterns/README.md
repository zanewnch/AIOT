# 簡單的 Logger Decorator 實現

## 概述

這是一個簡單易懂的 Logger Decorator 實現，接收兩個參數：
1. `originalFunction` - 原始函數
2. `methodName` - 方法名稱（用於日誌顯示）

## 特點

- ✅ 簡單易懂，只有兩個參數
- ✅ 與 arrow function 完全兼容
- ✅ 自動記錄方法執行時間
- ✅ 自動捕獲和記錄錯誤
- ✅ 不會產生 TypeScript 編譯錯誤

## 使用方法

### 基本用法

```typescript
import { loggerDecorator } from '../patterns/LoggerDecorator.js';

class SomeController {
  // 直接包裝 arrow function
  someMethod = loggerDecorator(async (req, res) => {
    // 你的原始邏輯
    const result = await this.service.doSomething();
    res.json(result);
  }, 'SomeController.someMethod');
}
```

### 使用便捷方法

```typescript
import { logController, logService, logRepository } from '../patterns/LoggerDecorator.js';

// 控制器
class DroneController {
  createDrone = logController(async (req, res) => {
    // 控制器邏輯
  }, 'createDrone');
}

// 服務
class DroneService {
  saveDrone = logService(async (data) => {
    // 服務邏輯
  }, 'saveDrone');
}

// 存儲庫
class DroneRepository {
  findById = logRepository(async (id) => {
    // 存儲庫邏輯
  }, 'findById');
}
```

## 日誌輸出範例

### 成功執行
```
[2025-08-13 10:30:15] [DECORATOR] INFO: 開始執行 Controller.createDrone
[2025-08-13 10:30:16] [DECORATOR] INFO: Controller.createDrone 執行完成 {"executionTime":"800ms"}
```

### 錯誤執行
```
[2025-08-13 10:30:15] [DECORATOR] INFO: 開始執行 Service.saveDrone
[2025-08-13 10:30:15] [DECORATOR] ERROR: Service.saveDrone 執行失敗 {"error":"Database connection failed","executionTime":"50ms"}
```

## 可用的便捷函數

- `loggerDecorator(originalFunction, methodName)` - 基本裝飾器
- `logController(originalFunction, methodName)` - 控制器專用
- `logService(originalFunction, methodName)` - 服務專用
- `logRepository(originalFunction, methodName)` - 存儲庫專用

## 完整範例

```typescript
import { logController } from '../patterns/LoggerDecorator.js';
import { ControllerResult } from '../utils/ControllerResult.js';

@injectable()
export class DroneCommandCommands {
    constructor(private readonly commandService: DroneCommandCommandsSvc) {}

    createCommand = logController(async (req, res) => {
        try {
            const commandData = req.body;
            
            // 基本驗證
            if (!commandData.drone_id) {
                const result = ControllerResult.badRequest('無人機 ID 為必填項');
                res.status(result.status).json(result);
                return;
            }

            // 調用服務
            const command = await this.commandService.createCommand(commandData);
            
            const result = ControllerResult.success(command, '無人機指令創建成功');
            res.status(result.status).json(result);
        } catch (error) {
            const result = ControllerResult.internalServerError('創建無人機指令時發生錯誤');
            res.status(result.status).json(result);
        }
    }, 'createCommand');
}
```

## 對比舊版本

| 特性 | 舊版本 (複雜) | 新版本 (簡單) |
|------|-------------|-------------|
| 參數數量 | 複雜的配置物件 | 只要 2 個參數 |
| 理解難度 | 需要學習複雜的類別和介面 | 一眼就懂 |
| 使用方式 | 工廠方法 + 泛型 + Proxy | 直接包裝函數 |
| 程式碼行數 | 200+ 行 | 50 行左右 |
| TypeScript 錯誤 | 複雜的類型問題 | 無類型問題 |

## 為什麼選擇簡單版本？

1. **可讀性高** - 任何開發者都能立即理解
2. **易於維護** - 程式碼簡短，bug 少
3. **實用性強** - 滿足 99% 的日誌需求
4. **無學習成本** - 不需要記住複雜的 API
5. **TypeScript 友好** - 無複雜的類型轉換問題
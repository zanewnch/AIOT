# @aiot/shared-packages

AIOT 項目的共用套件庫，提供各微服務間共用的基礎類別、工具函式和型別定義。

## 🚀 功能特色

- **BaseRedisService**：統一的 Redis 連線管理和錯誤處理
- **優雅降級**：Redis 不可用時自動 fallback 到資料庫操作
- **統一日誌**：可配置的日誌記錄機制
- **TypeScript 支援**：完整的型別定義和 IntelliSense 支援

## 📦 安裝

```bash
npm install @aiot/shared-packages
```

## 🔧 使用方式

### BaseRedisService

用於統一管理 Redis 連線和快取操作的基礎類別。

#### 基本使用

```typescript
import { BaseRedisService, RedisConnectionOptions } from '@aiot/shared-packages';
import { getRedisClient } from '../configs/redisConfig.js';
import { createLogger } from '../configs/loggerConfig.js';

@injectable()
export class PermissionService extends BaseRedisService {
    private static readonly PERMISSION_CACHE_PREFIX = 'permission:';

    constructor() {
        super({
            serviceName: 'PermissionService',
            defaultTTL: 3600, // 1 小時
            enableDebugLogs: true,
            logger: createLogger('PermissionService')
        });
    }

    // 實作抽象方法
    protected getRedisClientFactory() {
        return getRedisClient;
    }

    // 使用基礎類別的方法進行快取操作
    async cachePermission(permission: Permission): Promise&lt;void&gt; {
        await this.safeRedisWrite(
            async (redis) => {
                const key = this.createCacheKey(
                    PermissionService.PERMISSION_CACHE_PREFIX, 
                    permission.id
                );
                await redis.setEx(key, this.defaultTTL, JSON.stringify(permission));
            },
            'cachePermission'
        );
    }

    async getCachedPermission(permissionId: number): Promise&lt;Permission | null&gt; {
        return this.safeRedisOperation(
            async (redis) => {
                const key = this.createCacheKey(
                    PermissionService.PERMISSION_CACHE_PREFIX, 
                    permissionId
                );
                const cached = await redis.get(key);
                return cached ? JSON.parse(cached) : null;
            },
            'getCachedPermission',
            null
        );
    }
}
```

#### 重構現有服務

**重構前的代碼**：
```typescript
export class PermissionCommandsSvc {
    private redisClient: RedisClientType | null;
    private isRedisAvailable: boolean;

    constructor() {
        try {
            this.redisClient = getRedisClient();
            this.isRedisAvailable = true;
            logger.info('Redis client initialized successfully...');
        } catch (error) {
            this.redisClient = null;
            this.isRedisAvailable = false;
            logger.warn('Redis not available...');
        }
    }

    private getRedisClient(): RedisClientType | null {
        return this.isRedisAvailable ? this.redisClient : null;
    }
}
```

**重構後的代碼**：
```typescript
import { BaseRedisService } from '@aiot/shared-packages';

export class PermissionCommandsSvc extends BaseRedisService {
    constructor() {
        super({
            serviceName: 'PermissionCommandsSvc',
            logger: createLogger('PermissionCommandsSvc')
        });
    }

    protected getRedisClientFactory() {
        return getRedisClient;
    }
    
    // 其他業務邏輯保持不變，但使用基礎類別的方法
}
```

## 📋 API 參考

### BaseRedisService

#### 建構函式選項

| 選項 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `serviceName` | string | class name | 服務名稱，用於日誌識別 |
| `defaultTTL` | number | 3600 | 預設快取 TTL（秒） |
| `enableDebugLogs` | boolean | false | 是否啟用詳細日誌 |
| `logger` | any | console | Logger 實例 |

#### 保護方法

- `getRedisClient()`: 取得 Redis 客戶端實例
- `safeRedisOperation&lt;T&gt;()`: 安全執行 Redis 讀取操作
- `safeRedisWrite()`: 安全執行 Redis 寫入操作
- `createCacheKey()`: 建立統一的快取鍵值
- `clearCacheByPattern()`: 批量刪除快取

#### 公開方法

- `isRedisEnabled()`: 檢查 Redis 是否可用
- `reconnectRedis()`: 重新連線 Redis
- `getServiceStatus()`: 取得服務狀態資訊

## 🔄 遷移指南

### 1. 安裝套件

```bash
cd microServices/your-service
npm install @aiot/shared-packages
```

### 2. 修改服務類別

將現有的 Redis 連線處理邏輯替換為繼承 BaseRedisService：

```typescript
// 原本的 import
import { getRedisClient } from '../configs/redisConfig.js';

// 新增的 import
import { BaseRedisService } from '@aiot/shared-packages';

// 修改類別定義
export class YourService extends BaseRedisService {
    constructor() {
        super({
            serviceName: 'YourService',
            logger: createLogger('YourService')
        });
    }

    protected getRedisClientFactory() {
        return getRedisClient;
    }
}
```

### 3. 移除重複代碼

刪除以下重複的代碼：
- `private redisClient: RedisClientType | null;`
- `private isRedisAvailable: boolean;`
- Redis 初始化邏輯
- `getRedisClient()` 方法

### 4. 使用新的 API

將原本的 Redis 操作替換為新的安全方法：

```typescript
// 原本
const redis = this.getRedisClient();
if (redis) {
    await redis.setEx(key, ttl, value);
}

// 現在
await this.safeRedisWrite(
    async (redis) => await redis.setEx(key, ttl, value),
    'operationName'
);
```

## 🧪 測試

```bash
# 建置套件
npm run build

# 執行測試
npm test

# 開發模式（監視變更）
npm run dev
```

## 📈 效益

- **減少重複代碼**：每個服務節省 ~50 行重複代碼
- **統一錯誤處理**：一致的 Redis 錯誤處理機制
- **更好的維護性**：集中管理 Redis 相關邏輯
- **更容易測試**：統一的 mocking 介面

## 🤝 貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md) 了解如何為此項目做出貢獻。

## 📄 授權

MIT License - 詳見 [LICENSE](../LICENSE) 文件。
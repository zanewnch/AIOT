# Archive Consumer Service

## 📋 服務概覽

Archive Consumer Service 是 AIOT 系統中負責數據歸檔處理的消費者微服務。它從消息隊列中接收歸檔任務，執行數據轉移、壓縮、存儲和清理等操作，確保系統歷史數據得到妥善管理和長期保存。

### 🚀 主要功能

- **消息隊列消費**：從 RabbitMQ 接收歸檔任務
- **數據歸檔**：將活躍數據轉移到歸檔存儲
- **數據壓縮**：對歷史數據進行壓縮優化存儲空間
- **生命周期管理**：根據策略自動清理過期數據
- **批量處理**：高效的批量數據處理機制
- **錯誤恢復**：任務失敗的重試和恢復機制
- **進度監控**：實時監控歸檔進度和狀態

## 🏗️ 系統架構

### 核心組件

| 組件 | 職責 | 技術棧 |
|------|------|--------|
| **消息消費者** | RabbitMQ 任務接收 | amqplib + TypeScript |
| **歸檔處理器** | 數據歸檔邏輯 | Custom Processor |
| **數據存取層** | 數據庫操作 | Sequelize ORM |
| **存儲引擎** | 歸檔數據存儲 | File System / S3 |
| **任務調度** | 批量處理調度 | Bull Queue |

### 服務端口

- **HTTP 端口**: 3006
- **健康檢查**: `/health`
- **任務狀態**: `/api/archive/status`
- **處理統計**: `/api/archive/metrics`

## 📊 數據歸檔流程

### 歸檔流程圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   活躍數據庫     │    │   歸檔處理器     │    │   歸檔存儲      │
│  (Production)   │ -> │   (Consumer)    │ -> │   (Archive)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ↑                       ↑                       ↓
        │              ┌─────────────────┐               ↓
        │              │   消息隊列      │        ┌─────────────────┐
        │              │  (RabbitMQ)    │        │   清理機制      │
        │              └─────────────────┘        │  (Cleanup)     │
        └──────────────────────────────────────────└─────────────────┘
```

### 處理步驟

1. **接收任務**: 從 RabbitMQ 接收歸檔請求
2. **數據驗證**: 驗證待歸檔數據完整性
3. **數據提取**: 從生產數據庫提取目標數據
4. **數據轉換**: 數據格式轉換和優化
5. **數據存儲**: 將數據存儲到歸檔位置
6. **數據壓縮**: 對存儲數據進行壓縮
7. **源數據清理**: 從生產環境清理已歸檔數據
8. **任務完成**: 標記任務狀態並發送通知

## 🔧 API 端點

### 監控端點

| 方法 | 端點 | 描述 | 回應格式 |
|------|------|------|----------|
| GET | `/health` | 服務健康檢查 | JSON |
| GET | `/metrics` | 處理性能指標 | JSON |
| GET | `/api/archive/status` | 歸檔狀態總覽 | JSON |
| GET | `/api/archive/jobs` | 當前任務列表 | JSON |
| GET | `/api/archive/history` | 歷史任務記錄 | JSON |

### 控制端點

| 方法 | 端點 | 描述 | 參數 |
|------|------|------|------|
| POST | `/api/archive/pause` | 暫停歸檔處理 | - |
| POST | `/api/archive/resume` | 恢復歸檔處理 | - |
| POST | `/api/archive/retry/:id` | 重試失敗任務 | 任務 ID |
| DELETE | `/api/archive/job/:id` | 取消任務 | 任務 ID |

## 📋 消息隊列配置

### RabbitMQ 設置

```javascript
const queueConfig = {
  // 歸檔任務隊列
  archiveQueue: 'archive.tasks',
  
  // 死信隊列（失敗任務）
  deadLetterQueue: 'archive.failed',
  
  // 優先級隊列
  priorityQueue: 'archive.priority',
  
  // 延遲隊列
  delayedQueue: 'archive.delayed'
};
```

### 消息格式

```javascript
// 歸檔任務消息
{
  "taskId": "arch_20250824_001",
  "type": "drone_data_archive",
  "priority": 5,
  "payload": {
    "sourceTable": "drone_positions",
    "targetPath": "/archive/2025/08/drone_positions",
    "dateRange": {
      "start": "2025-08-01T00:00:00Z",
      "end": "2025-08-23T23:59:59Z"
    },
    "compression": "gzip",
    "retentionDays": 2555  // 7年
  },
  "metadata": {
    "createdBy": "scheduler-service",
    "createdAt": "2025-08-24T10:00:00Z",
    "estimatedRecords": 50000
  }
}
```

## 🎯 歸檔策略

### 數據類型歸檔規則

| 數據類型 | 歸檔週期 | 壓縮方式 | 保留期限 |
|---------|----------|----------|----------|
| **無人機位置數據** | 每週 | GZIP | 7年 |
| **狀態數據** | 每月 | GZIP | 5年 |
| **命令歷史** | 每季 | ZIP | 3年 |
| **系統日誌** | 每日 | LZ4 | 1年 |
| **用戶操作記錄** | 每月 | GZIP | 7年 |

### 自動歸檔觸發條件

```javascript
const archiveTriggers = {
  // 基於時間的觸發
  timeBased: {
    dronePositions: "0 2 * * 0",    // 每週日凌晨2點
    systemLogs: "0 1 * * *",        // 每日凌晨1點
    userActions: "0 3 1 * *"        // 每月1號凌晨3點
  },
  
  // 基於數據量的觸發
  sizeBased: {
    threshold: "10GB",              // 超過10GB觸發
    checkInterval: "6h"             // 每6小時檢查
  },
  
  // 基於性能的觸發
  performanceBased: {
    queryTimeThreshold: "5s",       // 查詢超過5秒觸發
    monitorInterval: "1h"           // 每小時監控
  }
};
```

## 📊 性能監控

### 關鍵指標

```bash
curl http://localhost:3006/api/archive/metrics
```

回應範例：
```json
{
  "service": "archive-consumer-service",
  "timestamp": "2025-08-24T10:00:00Z",
  "processing": {
    "tasksInQueue": 5,
    "activeJobs": 2,
    "completedToday": 15,
    "failedToday": 1,
    "averageProcessingTime": "45.2s"
  },
  "performance": {
    "throughputMBps": 12.5,
    "compressionRatio": 0.35,
    "diskSpaceSaved": "850GB",
    "memoryUsage": "256MB"
  },
  "storage": {
    "totalArchived": "15.2TB",
    "archiveLocation": "/var/archive",
    "freeSpace": "2.8TB"
  }
}
```

### 處理統計

| 指標 | 描述 | 監控閾值 |
|------|------|----------|
| **處理速度** | MB/秒 | > 10 MB/s |
| **壓縮比** | 壓縮後/原始大小 | < 0.5 |
| **成功率** | 成功任務/總任務 | > 95% |
| **平均延遲** | 任務完成時間 | < 60 秒 |

## 💾 存儲管理

### 存儲結構

```
/var/archive/
├── 2025/
│   ├── 01/                     # 按月分組
│   │   ├── drone_positions/    # 按數據類型分組
│   │   │   ├── data.gz        # 壓縮數據文件
│   │   │   └── metadata.json  # 元數據文件
│   │   └── system_logs/
│   └── 02/
├── index/                      # 索引文件
│   ├── date_index.json
│   └── type_index.json
└── temp/                       # 臨時處理目錄
```

### 元數據格式

```json
{
  "archiveId": "arch_20250824_001",
  "sourceTable": "drone_positions",
  "dateRange": {
    "start": "2025-08-01T00:00:00Z",
    "end": "2025-08-23T23:59:59Z"
  },
  "statistics": {
    "recordCount": 2500000,
    "originalSize": "1.2GB",
    "compressedSize": "420MB",
    "compressionRatio": 0.35
  },
  "archiveInfo": {
    "createdAt": "2025-08-24T10:30:00Z",
    "format": "gzip",
    "checksumMD5": "a1b2c3d4e5f6...",
    "retentionUntil": "2032-08-24T00:00:00Z"
  }
}
```

## 🔒 安全與合規

### 數據安全

- **加密存儲**：歸檔數據使用 AES-256 加密
- **訪問控制**：基於角色的歸檔數據訪問
- **審計日誌**：完整的歸檔操作審計記錄
- **數據完整性**：MD5/SHA256 校驗和驗證

### 合規要求

- **數據保留**：符合行業數據保留規範
- **隱私保護**：個人敏感數據匿名化處理
- **法規遵循**：滿足 GDPR、CCPA 等法規要求
- **審計追蹤**：可審計的歸檔和清理記錄

## 🛠️ 開發設置

### 環境要求

- Node.js 18+
- TypeScript 5.0+
- RabbitMQ 3.11+
- MySQL 8.0+
- Redis (可選，用於緩存)

### 安裝與啟動

```bash
# 安裝依賴
npm install

# 環境配置
cp .env.example .env

# 數據庫初始化
npm run db:migrate

# 開發模式啟動
npm run dev

# 生產模式
npm run build
npm start
```

### 環境變量

```env
NODE_ENV=development
PORT=3006

# RabbitMQ 配置
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_VHOST=/
RABBITMQ_USER=archive_user
RABBITMQ_PASS=archive_pass

# 數據庫配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=archive_user
DB_PASS=archive_pass
DB_NAME=archive_db

# 存儲配置
ARCHIVE_ROOT_PATH=/var/archive
TEMP_PATH=/var/archive/temp
MAX_CONCURRENT_JOBS=3
COMPRESSION_LEVEL=6

# 監控配置
METRICS_ENABLED=true
LOG_LEVEL=info
```

## 🚀 部署指南

### Docker 部署

```bash
# 建置鏡像
docker build -f Dockerfile.dev -t archive-consumer-service .

# 執行容器
docker run -d \
  --name archive-consumer-service \
  -p 3006:3006 \
  -v /var/archive:/var/archive \
  -e RABBITMQ_URL=amqp://rabbitmq:5672 \
  -e DB_HOST=mysql \
  archive-consumer-service
```

### 生產部署注意事項

- **存儲擴展**：配置可擴展的歸檔存儲（如 NFS、S3）
- **容錯設計**：多實例部署避免單點故障
- **監控告警**：歸檔失敗和存儲空間告警
- **備份策略**：歸檔數據的備份和災難恢復
- **性能調優**：基於數據量調整併發處理數

## 🔧 配置調優

### 處理性能優化

```javascript
const processingConfig = {
  batchSize: 10000,           // 批量處理大小
  concurrentJobs: 3,          // 併發任務數
  compressionLevel: 6,        // 壓縮等級 (1-9)
  memoryLimit: '1GB',         // 記憶體限制
  tempCleanupInterval: 3600   // 臨時文件清理間隔（秒）
};
```

### 隊列配置

```javascript
const queueSettings = {
  prefetch: 1,                // 每次預取任務數
  maxRetries: 3,              // 最大重試次數
  retryDelay: 30000,          // 重試延遲（毫秒）
  messageTimeout: 3600000,    // 消息處理超時（1小時）
  deadLetterTTL: 86400000     // 死信過期時間（24小時）
};
```

## 🔍 故障排除

### 常見問題

1. **歸檔任務堆積**
   ```bash
   # 檢查隊列狀態
   curl http://localhost:3006/api/archive/status
   
   # 增加處理併發數
   # 在環境變量中設定 MAX_CONCURRENT_JOBS=5
   ```

2. **存儲空間不足**
   ```bash
   # 檢查存儲使用量
   df -h /var/archive
   
   # 清理過期數據
   curl -X POST http://localhost:3006/api/archive/cleanup
   ```

3. **處理性能低下**
   - 調整批量處理大小
   - 優化數據庫查詢
   - 檢查網絡延遲
   - 監控記憶體使用

### 調試指令

```bash
# 檢查服務狀態
curl http://localhost:3006/health

# 查看處理指標
curl http://localhost:3006/metrics

# 查看活躍任務
curl http://localhost:3006/api/archive/jobs

# 重試失敗任務
curl -X POST http://localhost:3006/api/archive/retry/task123
```

---

**維護團隊**: AIOT Development Team  
**最後更新**: 2025-08-24  
**版本**: 1.0.0
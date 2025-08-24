# Scheduler Service

## 📋 服務概覽

Scheduler Service 是 AIOT 系統中負責任務調度和定時作業的微服務。它提供靈活的排程功能，支援週期性任務、一次性任務和複雜的調度策略，確保系統各項定時作業能夠準確可靠地執行。

### 🚀 主要功能

- **定時任務調度**：支援 Cron 表達式的靈活排程
- **任務隊列管理**：高效的任務隊列處理機制
- **任務優先級**：支援任務重要性分級
- **故障恢復**：任務執行失敗的自動重試機制
- **任務監控**：實時監控任務執行狀態
- **分散式調度**：支援多實例分散式部署
- **任務歷史**：完整的任務執行歷史記錄

## 🏗️ 系統架構

### 核心組件

| 組件 | 職責 | 技術棧 |
|------|------|--------|
| **調度引擎** | 任務排程和觸發 | node-cron + TypeScript |
| **任務隊列** | 任務緩存和分發 | Bull Queue + Redis |
| **執行器** | 任務具體執行 | Worker Threads |
| **監控器** | 任務狀態監控 | Custom Monitoring |
| **存儲層** | 任務和日誌存儲 | MySQL + Sequelize |

### 服務端口

- **HTTP 端口**: 3005
- **健康檢查**: `/health`
- **任務管理**: `/api/tasks/*`
- **調度狀態**: `/api/scheduler/status`

## ⏰ 調度功能

### Cron 表達式支援

```javascript
// 每分鐘執行
'* * * * *'

// 每小時的第 0 分鐘執行
'0 * * * *'

// 每天凌晨 2:30 執行
'30 2 * * *'

// 每周一上午 9:00 執行
'0 9 * * 1'

// 每月 1 號凌晨 0:00 執行
'0 0 1 * *'
```

### 任務類型

| 類型 | 描述 | 使用場景 |
|------|------|----------|
| **一次性任務** | 指定時間執行一次 | 定時發送通知、數據備份 |
| **週期性任務** | 按 Cron 規則重複執行 | 系統清理、報表生成 |
| **延遲任務** | 延遲指定時間後執行 | 用戶操作確認、超時處理 |
| **條件任務** | 滿足特定條件後執行 | 閾值監控、事件觸發 |

## 🔧 API 端點

### 任務管理

| 方法 | 端點 | 描述 | 參數 |
|------|------|------|------|
| POST | `/api/tasks` | 創建新任務 | 任務配置 |
| GET | `/api/tasks` | 獲取任務列表 | 分頁、篩選 |
| GET | `/api/tasks/:id` | 獲取任務詳情 | 任務 ID |
| PUT | `/api/tasks/:id` | 更新任務 | 任務 ID + 更新內容 |
| DELETE | `/api/tasks/:id` | 刪除任務 | 任務 ID |
| POST | `/api/tasks/:id/start` | 手動啟動任務 | 任務 ID |
| POST | `/api/tasks/:id/stop` | 停止任務 | 任務 ID |

### 調度控制

| 方法 | 端點 | 描述 | 回應 |
|------|------|------|------|
| GET | `/api/scheduler/status` | 調度器狀態 | 運行統計 |
| POST | `/api/scheduler/start` | 啟動調度器 | 操作結果 |
| POST | `/api/scheduler/stop` | 停止調度器 | 操作結果 |
| POST | `/api/scheduler/restart` | 重啟調度器 | 操作結果 |

### 任務執行記錄

| 方法 | 端點 | 描述 | 參數 |
|------|------|------|------|
| GET | `/api/executions` | 獲取執行記錄 | 任務ID、時間範圍 |
| GET | `/api/executions/:id` | 獲取執行詳情 | 執行 ID |
| DELETE | `/api/executions/clean` | 清理舊記錄 | 保留天數 |

## 📊 任務配置範例

### 創建週期性任務

```javascript
POST /api/tasks
{
  "name": "系統清理任務",
  "description": "清理系統臨時文件和過期日誌",
  "type": "recurring",
  "schedule": "0 2 * * *",  // 每天凌晨2點
  "timezone": "Asia/Taipei",
  "payload": {
    "action": "system_cleanup",
    "directories": ["/tmp", "/var/log/old"],
    "retention_days": 7
  },
  "retry": {
    "max_attempts": 3,
    "backoff_strategy": "exponential",
    "initial_delay": 1000
  },
  "notifications": {
    "on_success": true,
    "on_failure": true,
    "webhook_url": "https://api.example.com/notifications"
  }
}
```

### 創建延遲任務

```javascript
POST /api/tasks
{
  "name": "用戶確認提醒",
  "type": "delayed",
  "delay": 3600000,  // 1小時後執行（毫秒）
  "payload": {
    "action": "send_reminder",
    "user_id": "user123",
    "message": "請確認您的操作"
  }
}
```

## 🔍 監控與統計

### 調度器狀態

```bash
curl http://localhost:3005/api/scheduler/status
```

回應範例：
```json
{
  "status": "running",
  "uptime": 3600000,
  "stats": {
    "total_tasks": 15,
    "active_tasks": 8,
    "completed_today": 45,
    "failed_today": 2,
    "average_execution_time": 1250
  },
  "memory_usage": {
    "heap_used": 45.2,
    "heap_total": 67.8,
    "rss": 89.1
  },
  "queue_status": {
    "pending": 3,
    "active": 1,
    "completed": 142,
    "failed": 5
  }
}
```

### 任務執行統計

```bash
curl "http://localhost:3005/api/executions?from=2025-08-01&to=2025-08-24"
```

## ⚡ 性能優化

### 調度策略

- **任務分片**：大型任務分解為小任務並行處理
- **優先級隊列**：重要任務優先執行
- **負載均衡**：多實例間任務分配
- **資源限制**：控制併發執行數量

### 記憶體管理

- **任務緩存**：合理控制記憶體中任務數量
- **結果清理**：定期清理執行結果
- **連接池**：數據庫連接池優化
- **垃圾回收**：主動觸發 GC 避免記憶體洩漏

## 🔒 安全特性

### 任務安全

- **權限驗證**：任務創建和執行權限控制
- **輸入驗證**：嚴格的參數校驗
- **沙盒執行**：隔離環境執行任務
- **日誌審計**：完整的操作審計日誌

### 系統安全

- **資源限制**：CPU 和記憶體使用限制
- **超時保護**：任務執行超時自動終止
- **錯誤隔離**：單個任務失敗不影響其他任務
- **恢復機制**：系統重啟後任務狀態恢復

## 🛠️ 開發設置

### 環境要求

- Node.js 18+
- TypeScript 5.0+
- Redis 6.0+
- MySQL 8.0+

### 安裝與啟動

```bash
# 安裝依賴
npm install

# 環境配置
cp .env.example .env

# 數據庫遷移
npm run migrate

# 開發模式啟動
npm run dev

# 生產模式
npm run build
npm start
```

### 環境變量

```env
NODE_ENV=development
PORT=3005

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=scheduler_user
DB_PASS=scheduler_pass
DB_NAME=scheduler_db

# 調度配置
MAX_CONCURRENT_JOBS=10
DEFAULT_JOB_TIMEOUT=300000
CLEANUP_INTERVAL=3600000

# 監控配置
METRICS_ENABLED=true
LOG_LEVEL=info
```

## 🚀 部署指南

### Docker 部署

```bash
# 建置鏡像
docker build -f Dockerfile.dev -t scheduler-service .

# 執行容器
docker run -d \
  --name scheduler-service \
  -p 3005:3005 \
  -e REDIS_URL=redis://redis:6379 \
  -e DB_HOST=mysql \
  scheduler-service
```

### 生產部署注意事項

- **高可用性**：部署多個實例避免單點故障
- **數據持久化**：Redis 和 MySQL 數據持久化
- **監控告警**：集成監控系統和告警機制
- **備份策略**：定期備份任務配置和執行歷史
- **擴展策略**：基於負載自動擴縮容

## 🔧 配置調優

### 併發控制

```javascript
const queueConfig = {
  concurrency: 10,          // 最大併發數
  maxRetries: 3,           // 最大重試次數
  retryDelay: 2000,        // 重試延遲
  timeout: 300000,         // 任務超時時間
  removeOnComplete: 100,   // 保留完成任務數
  removeOnFail: 50         // 保留失敗任務數
};
```

### 調度精度

- **最小間隔**：1 秒（不建議更短）
- **時區支援**：自動處理夏令時轉換
- **漂移控制**：自動校正時間漂移
- **精確性**：±100ms 執行精度

## 🔍 故障排除

### 常見問題

1. **任務不執行**
   - 檢查 Cron 表達式語法
   - 確認調度器運行狀態
   - 查看任務啟用狀態

2. **記憶體洩漏**
   - 監控任務執行時間
   - 檢查資源清理機制
   - 調整隊列大小限制

3. **任務堆積**
   - 增加併發執行數
   - 優化任務執行邏輯
   - 分析性能瓶頸

### 調試指令

```bash
# 檢查調度器狀態
curl http://localhost:3005/api/scheduler/status

# 查看活躍任務
curl http://localhost:3005/api/tasks?status=active

# 查看失敗任務
curl http://localhost:3005/api/executions?status=failed

# 重啟調度器
curl -X POST http://localhost:3005/api/scheduler/restart
```

---

**維護團隊**: AIOT Development Team  
**最後更新**: 2025-08-24  
**版本**: 1.0.0
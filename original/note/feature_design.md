# AIOT 系統資料庫表格設計





## 使用者活動表 (`user_activities`)
- **id**: 主鍵識別碼
- **userId**: 使用者外鍵
- **lastLoginAt**: 最後登入時間
- **loginCount**: 登入次數統計
- **lastActiveAt**: 最後活動時間
- **mostVisitedPage**: 最常造訪頁面
- **pageVisitCounts**: 頁面造訪次數統計
- **sessionDuration**: 會話持續時間（分鐘）
- **deviceInfo**: 裝置資訊
- **ipAddress**: IP 地址
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
{
  "id": 1,
  "userId": 2,
  "lastLoginAt": "2025-07-28T09:15:30.000Z",
  "loginCount": 45,
  "lastActiveAt": "2025-07-28T14:22:10.000Z",
  "mostVisitedPage": "/dashboard",
  "pageVisitCounts": {
    "/dashboard": 125,
    "/profile": 23,
    "/settings": 12,
    "/rtk-data": 67
  },
  "sessionDuration": 180,
  "deviceInfo": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "ipAddress": "192.168.1.100",
  "createdAt": "2025-07-15T10:00:00.000Z",
  "updatedAt": "2025-07-28T14:22:10.000Z"
}
```

## 使用者偏好表 (`user_preferences`)
- **id**: 主鍵識別碼
- **userId**: 使用者外鍵
- **theme**: 主題設定
- **language**: 語言代碼
- **timezone**: 時區設定
- **autoSave**: 自動儲存設定
- **notifications**: 通知設定
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
{
  "id": 1,
  "userId": 2,
  "theme": "dark",
  "language": "zh-TW",
  "timezone": "Asia/Taipei",
  "autoSave": true,
  "notifications": false,
  "createdAt": "2025-07-15T10:05:00.000Z",
  "updatedAt": "2025-07-25T16:30:00.000Z"
}
```


---

# 無人機即時追蹤功能設計 Brainstorm

## 功能需求分析
- **目標**: 10台無人機即時回傳位置資料（altitude, longitude）
- **特性**: 即時性、高頻資料更新、多裝置並發

## 建議資料表設計






### 4. 無人機任務表 (`drone_missions`) *可選*
- **id**: 主鍵識別碼
- **drone_id**: 無人機外鍵
- **mission_name**: 任務名稱
- **start_time**: 任務開始時間
- **end_time**: 任務結束時間
- **status**: 任務狀態
- **waypoints**: 航點資料（JSON格式）
- **created_by**: 創建者
- **created_at**: 建立時間
- **updated_at**: 更新時間

## 技術考量

### 資料庫優化
1. **索引策略**
   - `drone_positions` 表需要複合索引 (drone_id, timestamp)
   - 考慮時間分區索引提升查詢效能

2. **資料清理策略**
   - 設定自動清理機制，保留最近30天資料
   - 歷史資料可壓縮存檔或移至冷儲存

3. **性能優化**
   - 考慮使用時間序列資料庫（如 InfluxDB）處理大量時間序列資料
   - 實作資料分批寫入，避免頻繁小量更新

### 即時性考量
1. **WebSocket 連接**
   - 前端使用 WebSocket 接收即時位置更新
   - 後端實作 Socket.IO 或原生 WebSocket

2. **資料快取**
   - Redis 快取最新位置資料
   - 實作 Pub/Sub 模式廣播位置更新

3. **API 設計**
   ```
   GET /api/drones - 取得所有無人機列表
   GET /api/drones/:id/positions - 取得特定無人機位置歷史
   GET /api/drones/:id/latest-position - 取得最新位置
   POST /api/drones/:id/position - 更新位置資料
   WebSocket /ws/drone-positions - 即時位置廣播
   ```

### 權限控制
- **drone.read**: 檢視無人機資料
- **drone.control**: 控制無人機
- **position.read**: 檢視位置資料
- **position.write**: 更新位置資料
- **mission.create**: 創建任務
- **mission.manage**: 管理任務

## 前端UI建議
1. **即時地圖顯示**
   - 整合 Google Maps 或 Leaflet
   - 顯示所有無人機即時位置
   - 不同顏色/圖示區分無人機狀態

2. **資料面板**
   - 無人機列表及狀態
   - 即時遙測資料顯示
   - 歷史軌跡播放功能

3. **警報系統**
   - 低電量警報
   - 超出飛行範圍警報
   - 信號丟失警報


不使用dao and dto
1. dao: 因為已經使用 sequelize, which already encapsulate the database interaction logic, 所以不需要特別再寫dao, 直接在repo to invoke 就好
2. dto: model 可以直接當作dto 使用, return model type 就好 不需要再寫額外的dto

## 無人機系統資料表設計草案






## 📊 系統需求確認
- ✅ **位置資料頻率**: 每秒更新一次
- ✅ **資料保留期**: 永久保留
- ✅ **額外感測資料**: 電池、速度、航向、溫度、GPS信號強度

## 🚀 技術實作考量
### 高頻資料處理
- 每台無人機每秒產生一筆位置記錄
- 10台無人機 × 1秒 × 86400秒/天 = 864,000筆/天
- 建議使用批次寫入和資料庫索引優化

### 即時性需求
- WebSocket 連接處理即時位置廣播
- Redis 快取最新位置資料
- 考慮使用時間序列資料庫處理大量時序資料

## 📦 Archive 資料表設計



## 🔄 Archive 策略設計

### 自動歷檔排程
```javascript
// 範例：每月歸檔策略
const archiveStrategy = {
  positions: {
    retention_days: 30,        // 主表保留30天
    archive_schedule: "0 2 1 * *", // 每月1日凌晨2點執行
    batch_size: 10000,         // 每批處理10000筆
    compression: true          // 啟用資料壓縮
  },
  commands: {
    retention_days: 90,        // 指令記錄保留90天
    archive_schedule: "0 3 1 * *", // 每月1日凌晨3點執行
    batch_size: 5000
  },
  status_logs: {
    retention_days: 365,       // 狀態記錄保留1年
    archive_schedule: "0 4 1 1 *", // 每年1月1日執行
    batch_size: 1000
  }
}
```

### Archive 流程
1. **識別歸檔資料**: 根據時間範圍篩選需歸檔的記錄
2. **建立歸檔任務**: 在 `archive_jobs` 表中建立任務記錄
3. **分批處理**: 避免長時間鎖表，分批移動資料
4. **資料驗證**: 確認歸檔資料完整性
5. **清理原表**: 刪除已歸檔的記錄
6. **更新任務狀態**: 標記任務完成

### 資料查詢策略
```sql
-- 查詢最近資料（主表）
SELECT * FROM drone_positions 
WHERE timestamp >= '2025-07-01' 
ORDER BY timestamp DESC;

-- 查詢歷史資料（歸檔表）
SELECT * FROM drone_positions_archive 
WHERE timestamp BETWEEN '2025-01-01' AND '2025-06-30'
ORDER BY timestamp DESC;

-- 跨表聯合查詢（最近30天 + 歷史資料）
SELECT * FROM (
  SELECT * FROM drone_positions WHERE timestamp >= '2025-06-28'
  UNION ALL
  SELECT original_id as id, drone_id, latitude, longitude, altitude, 
         timestamp, signal_strength, speed, heading, battery_level, 
         temperature, created_at, created_at as updated_at
  FROM drone_positions_archive 
  WHERE timestamp BETWEEN '2025-06-01' AND '2025-06-27'
) combined_data 
ORDER BY timestamp DESC;
```

### 效能考量
- **索引策略**: 歸檔表建立 (drone_id, timestamp) 複合索引
- **分區表**: 按月或季度分區存儲歷史資料
- **壓縮存儲**: 使用資料庫壓縮減少存儲空間
- **讀取優化**: 歷史資料查詢使用唯讀副本

### 監控與維護
- **存儲空間監控**: 定期檢查歸檔表大小
- **歸檔任務監控**: 追蹤歷檔任務執行狀態
- **資料完整性檢查**: 定期驗證歸檔資料
- **效能監控**: 追蹤查詢效能變化

## 🔐 Archive 相關權限
- **archive.read**: 檢視歷檔資料
- **archive.manage**: 管理歷檔任務
- **archive.restore**: 還原歷檔資料

## 🚀 API 設計規劃

### 1. 無人機管理 API (`/api/drones`)

| Method | Endpoint | 描述 | 權限要求 |
|--------|----------|------|----------|
| GET | /api/drones | 取得所有無人機列表 | drone.read |
| GET | /api/drones/:id | 取得特定無人機詳情 | drone.read |
| POST | /api/drones | 建立新無人機 | drone.create |
| PUT | /api/drones/:id | 更新無人機資訊 | drone.update |
| DELETE | /api/drones/:id | 刪除無人機 | drone.delete |
| PATCH | /api/drones/:id/status | 更新無人機狀態 | drone.update |
| GET | /api/drones/owner/:userId | 取得特定使用者的無人機 | drone.read |

### 2. 即時位置 API (`/api/positions`)

| Method | Endpoint | 描述 | 權限要求 |
|--------|----------|------|----------|
| GET | /api/positions/latest | 取得所有無人機最新位置 | position.read |
| GET | /api/positions/drone/:id/latest | 取得特定無人機最新位置 | position.read |
| POST | /api/positions | 建立位置記錄（無人機上傳） | position.write |
| GET | /api/positions/drone/:id/history | 取得特定無人機位置歷史 | position.read |
| GET | /api/positions/range | 依時間範圍查詢位置 | position.read |
| GET | /api/positions/area | 依地理範圍查詢位置 | position.read |

### 3. 無人機指令 API (`/api/commands`)

| Method | Endpoint | 描述 | 權限要求 |
|--------|----------|------|----------|
| POST | /api/commands/drone/:id/takeoff | 無人機起飛指令 | drone.control |
| POST | /api/commands/drone/:id/land | 無人機降落指令 | drone.control |
| POST | /api/commands/drone/:id/move | 無人機移動指令 | drone.control |
| POST | /api/commands/drone/:id/hover | 無人機懸停指令 | drone.control |
| POST | /api/commands/drone/:id/return | 無人機返航指令 | drone.control |
| GET | /api/commands/drone/:id | 取得無人機指令歷史 | command.read |
| GET | /api/commands/:commandId/status | 查詢指令執行狀態 | command.read |
| PUT | /api/commands/:commandId/cancel | 取消待執行指令 | drone.control |

### 4. 狀態歷史 API (`/api/status-logs`)

| Method | Endpoint | 描述 | 權限要求 |
|--------|----------|------|----------|
| GET | /api/status-logs/drone/:id | 取得無人機狀態歷史 | drone.read |
| POST | /api/status-logs | 建立狀態變更記錄 | drone.update |
| GET | /api/status-logs/timeline | 取得所有無人機狀態時間軸 | drone.read |

### 5. 歷檔資料 API (`/api/archive`)

| Method | Endpoint | 描述 | 權限要求 |
|--------|----------|------|----------|
| GET | /api/archive/positions | 查詢歷史位置資料 | archive.read |
| GET | //archive/commands | 查詢歷史指令資料 | archive.read |
| POST | /api/archive/jobs | 建立歷檔任務 | archive.manage |
| GET | /api/archive/jobs | 取得歷檔任務列表 | archive.manage |
| GET | /api/archive/jobs/:id/status | 查詢歷檔任務狀態 | archive.manage |

### 6. 即時通訊 WebSocket (`/ws`)

| Event | 描述 | 權限要求 |
|-------|------|----------|
| position-update | 即時位置更新廣播 | position.read |
| drone-status | 無人機狀態變更通知 | drone.read |
| command-result | 指令執行結果通知 | command.read |
| system-alert | 系統警報（低電量、失聯等） | drone.read |

### 7. 統計分析 API (`/api/analytics`)

| Method | Endpoint | 描述 | 權限要求 |
|--------|----------|------|----------|
| GET | /api/analytics/flight-time | 飛行時間統計 | drone.read |
| GET | /api/analytics/battery-usage | 電池使用分析 | drone.read |
| GET | /api/analytics/flight-paths | 飛行軌跡分析 | position.read |
| GET | /api/analytics/operational-status | 運營狀態儀表板 | drone.read |
| GET | /api/analytics/alert-summary | 警報統計摘要 | drone.read |

## 🎯 面試技術亮點評估

### ✅ **Architecture Complexity Score: 8.5/10**

**高難度技術挑戰：**
1. **高頻資料處理** - 每秒10筆 × 86400秒 = 864K records/day
2. **即時系統設計** - WebSocket + Redis 快取架構  
3. **資料歷檔策略** - 自動化歸檔 + 跨表查詢優化
4. **RBAC 權限系統** - 細粒度權限控制
5. **微服務架構** - 前後端分離 + API 設計
6. **效能優化** - 索引策略 + 批次處理

**展現的技能領域：**
- ⚡ **Backend Architecture**: RESTful API + WebSocket
- 🗄️ **Database Design**: 關聯式設計 + 效能調優  
- 🔒 **Security**: RBAC + JWT + 資料驗證
- 📊 **Big Data**: 時間序列資料 + 歷檔策略
- 🌐 **Real-time Systems**: 即時通訊 + 推播機制
- 🧪 **DevOps**: Docker + 容器化部署

### 🚀 **進階加分項目**

**可以額外提及的進階概念：**
1. **負載均衡**: Nginx + 多節點部署
2. **監控系統**: ELK Stack + Prometheus 
3. **容錯機制**: 斷線重連 + 資料補償
4. **API 限流**: Rate Limiting + DDoS 防護
5. **資料備份**: 冷熱資料分離 + 災難恢復
6. **AI 整合**: 飛行路徑優化 + 異常檢測

### 💡 **面試展示建議**

**重點強調：**
1. **系統擴展性** - 支援更多無人機擴展
2. **資料處理能力** - 大量時序資料管理  
3. **即時性需求** - 毫秒級延遲處理
4. **安全性考量** - 完整的權限控制體系
5. **效能優化** - 資料庫調優和快取策略

**可能的面試問題準備：**
- 如何處理無人機斷線重連？
- 資料庫瓶頸時如何優化？ 
- 如何確保指令傳送的可靠性？
- 大量歷史資料的查詢優化？
- 系統監控和警報機制？

## 📋 前端功能需求
- 🗺️ **即時地圖顯示**: 10台無人機位置追蹤
- 🎮 **飛行模擬器**: 3D 飛行軌跡模擬
- 🎛️ **指令控制面板**: 個別無人機操控介面  
- 📊 **統計圖表**: 飛行數據視覺化分析
- 🚨 **警報系統**: 即時狀態監控和通知
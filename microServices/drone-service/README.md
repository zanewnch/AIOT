# 🚁 Drone Service

無人機控制與監控服務，負責無人機的飛行控制、位置追蹤和狀態監控。

## 📋 服務概述

Drone Service 是 AIOT 系統的核心無人機管理服務，提供完整的無人機控制、監控和資料管理功能。

### 🎯 主要功能

- **飛行控制**: 無人機起飛、降落、導航控制
- **位置追蹤**: 實時 GPS 位置監控和軌跡記錄
- **狀態監控**: 電池電量、信號強度、系統狀態監控
- **任務管理**: 自動飛行任務規劃和執行
- **資料收集**: 飛行資料記錄和分析

### 🏗️ 技術架構

- **框架**: Node.js + TypeScript + Express
- **通訊協議**: gRPC (內部) + HTTP (Gateway)
- **資料庫**: PostgreSQL (生產) / SQLite (開發)
- **實時通訊**: WebSocket (透過 Drone WebSocket Service)
- **時序資料**: PostgreSQL Time Series

## 🚀 服務端點

### gRPC 服務
- **端口**: 50052
- **健康檢查**: `grpc_health_probe -addr=localhost:50052`

### HTTP API (透過 Gateway)
```
# 無人機狀態
GET    /api/drone/status           # 獲取所有無人機狀態
GET    /api/drone/status/:id       # 獲取特定無人機狀態
POST   /api/drone/status/:id       # 更新無人機狀態

# 位置管理
GET    /api/drone/positions        # 獲取無人機位置記錄
POST   /api/drone/positions        # 更新位置資料
GET    /api/drone/positions/:id/history    # 獲取軌跡歷史

# 飛行控制
POST   /api/drone/commands         # 發送控制命令
GET    /api/drone/commands/:id     # 查詢命令狀態
POST   /api/drone/takeoff          # 起飛命令
POST   /api/drone/land             # 降落命令
POST   /api/drone/return           # 返航命令

# 任務管理
GET    /api/drone/missions         # 獲取任務列表
POST   /api/drone/missions         # 創建新任務
GET    /api/drone/missions/:id     # 獲取任務詳情
PUT    /api/drone/missions/:id     # 更新任務
DELETE /api/drone/missions/:id     # 刪除任務
POST   /api/drone/missions/:id/execute    # 執行任務

# 健康檢查
GET    /api/drone/health           # 服務健康檢查
```

## 📁 專案結構

```
drone-service/
├── src/
│   ├── controllers/           # 控制器層
│   │   ├── commands/         # 命令處理器
│   │   └── queries/          # 查詢處理器
│   ├── services/             # 業務邏輯層
│   │   ├── flightControl/    # 飛行控制服務
│   │   ├── positioning/      # 定位服務
│   │   └── monitoring/       # 監控服務
│   ├── repositories/         # 資料存取層
│   ├── entities/             # 資料實體
│   ├── routes/               # 路由定義
│   ├── middleware/           # 中間件
│   ├── configs/              # 配置文件
│   └── types/                # TypeScript 類型
├── protos/                   # gRPC 原型定義
└── tests/                    # 測試文件
```

## 🔧 開發指南

### 本地開發
```bash
# 安裝依賴
npm install

# 開發模式 (Hot Reload)
npm run dev

# 建置服務
npm run build

# 類型檢查
npm run type-check

# 代碼檢查
npm run lint
```

### 測試
```bash
# 單元測試
npm run test:unit

# 整合測試
npm run test:integration

# 模擬器測試
npm run test:simulator
```

## 🔍 健康檢查

```bash
# gRPC 健康檢查
grpc_health_probe -addr=localhost:50052

# HTTP 健康檢查 (透過 Gateway)
curl -f http://localhost:8000/api/drone/health
```

## 🛠️ 配置說明

### 環境變數
```bash
NODE_ENV=development           # 環境模式
GRPC_PORT=50052               # gRPC 端口
DB_TYPE=sqlite                # 資料庫類型
FLIGHT_SIMULATION_MODE=true   # 模擬模式
MAX_FLIGHT_ALTITUDE=120       # 最大飛行高度 (米)
GEOFENCE_ENABLED=true         # 地理圍欄啟用
EMERGENCY_LAND_THRESHOLD=15   # 緊急降落電量閾值 (%)
```

## 📊 資料模型

### 無人機 (Drone)
```typescript
interface Drone {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  status: DroneStatus;
  battery_level: number;
  signal_strength: number;
  current_position: Position;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}
```

### 位置資料 (Position)
```typescript
interface Position {
  id: string;
  drone_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  timestamp: Date;
}
```

### 飛行任務 (Mission)
```typescript
interface Mission {
  id: string;
  name: string;
  drone_id: string;
  waypoints: Waypoint[];
  status: MissionStatus;
  start_time: Date;
  end_time: Date;
  created_by: string;
  created_at: Date;
}
```

### 控制命令 (Command)
```typescript
interface Command {
  id: string;
  drone_id: string;
  command_type: CommandType;
  parameters: object;
  status: CommandStatus;
  response: string;
  executed_at: Date;
  created_at: Date;
}
```

## 📝 API 使用範例

### 獲取無人機狀態
```bash
curl -X GET "http://localhost:8000/api/drone/status?limit=10" \
  -H "Cookie: auth_token=your_jwt_token"
```

### 發送起飛命令
```bash
curl -X POST http://localhost:8000/api/drone/takeoff \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_jwt_token" \
  -d '{
    "drone_id": "drone_001",
    "altitude": 10,
    "duration": 30
  }'
```

### 創建飛行任務
```bash
curl -X POST http://localhost:8000/api/drone/missions \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_jwt_token" \
  -d '{
    "name": "巡邏任務 A",
    "drone_id": "drone_001",
    "waypoints": [
      {"latitude": 25.0330, "longitude": 121.5654, "altitude": 50},
      {"latitude": 25.0340, "longitude": 121.5664, "altitude": 50}
    ]
  }'
```

### 獲取位置軌跡
```bash
curl -X GET "http://localhost:8000/api/drone/positions/drone_001/history?hours=1" \
  -H "Cookie: auth_token=your_jwt_token"
```

## 🛡️ 安全功能

### 飛行安全
- **地理圍欄**: 限制飛行區域
- **高度限制**: 最大飛行高度控制
- **緊急降落**: 低電量自動返航
- **失聯保護**: 通訊中斷自動處理

### 資料安全
- **命令驗證**: 控制命令身份驗證
- **操作日誌**: 所有操作記錄追蹤
- **權限控制**: 基於角色的操作權限
- **資料加密**: 敏感資料傳輸加密

## 🔧 命令類型

### 基本控制
- **TAKEOFF**: 起飛
- **LAND**: 降落
- **RETURN_TO_HOME**: 返航
- **HOVER**: 懸停
- **EMERGENCY_STOP**: 緊急停止

### 導航控制
- **GO_TO_POSITION**: 飛往指定位置
- **SET_ALTITUDE**: 設定高度
- **SET_SPEED**: 設定速度
- **FOLLOW_WAYPOINTS**: 航點飛行

### 系統控制
- **SET_HOME_POSITION**: 設定起始點
- **CALIBRATE_COMPASS**: 羅盤校準
- **BATTERY_CHECK**: 電池檢查
- **SYSTEM_RESET**: 系統重置

## 📊 監控指標

- 無人機在線數量
- 平均飛行時間
- 電池使用統計
- 任務成功率
- 位置更新頻率
- 命令執行延遲
- 系統錯誤率

---

**🏗️ AIOT Development Team**  
**版本**: 1.0.0  
**最後更新**: 2025-08-24
# AIOT Drone Real-time Service

無人機即時通訊微服務，專門處理 WebSocket 連線和即時資料廣播。

## 🎯 服務職責

### 主要功能
- **WebSocket 連線管理**：處理客戶端 WebSocket 連線
- **即時資料廣播**：無人機位置和狀態的即時推送
- **房間管理**：基於無人機 ID 的訂閱管理
- **安全整合**：與 OPA 權限管理整合

### 與其他服務的關係
```
前端 WebSocket 連線 → Kong Gateway → drone-realtime-service
```

## 🚀 快速開始

### 開發環境
```bash
# 安裝依賴
npm install

# 複製環境配置
cp .env.example .env

# 啟動開發伺服器
npm run dev
```

### Docker 部署
```bash
# 使用 Docker Compose 啟動
docker-compose up drone-realtime-service
```

## 📡 WebSocket API

### 連線端點
```
ws://localhost:3004/socket.io
```

### 事件列表

#### 訂閱無人機位置
```javascript
socket.emit('drone:position:subscribe', { droneId: 'drone-001' });
```

#### 取消訂閱無人機位置
```javascript
socket.emit('drone:position:unsubscribe', { droneId: 'drone-001' });
```

#### 訂閱無人機狀態
```javascript
socket.emit('drone:status:subscribe', { droneId: 'drone-001' });
```

#### 接收位置更新
```javascript
socket.on('drone:position:update', (data) => {
  console.log('Position update:', data);
  // { droneId: 'drone-001', data: {...}, timestamp: '...' }
});
```

#### 接收狀態更新
```javascript
socket.on('drone:status:update', (data) => {
  console.log('Status update:', data);
  // { droneId: 'drone-001', data: {...}, timestamp: '...' }
});
```

## 🔧 配置

### 環境變數
- `SERVICE_PORT`: 服務端口 (預設: 3004)
- `REDIS_URL`: Redis 連線 URL
- `CORS_ORIGIN`: CORS 允許的來源

### 認證和授權
- **認證**: 由 Kong Gateway + OPA 統一處理
- **WebSocket 連線**: 通過 Kong Gateway 代理，支援認證用戶
- **權限控制**: 基於 OPA (Open Policy Agent) 進行集中式管理
- **無需 JWT**: 服務本身不處理認證邏輯，專注於即時通訊

## 📊 健康檢查

```bash
curl http://localhost:3004/health
```

回應:
```json
{
  "status": "healthy",
  "service": "drone-realtime-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "websocket": {
    "enabled": true,
    "totalConnections": 5,
    "authenticatedConnections": 3
  }
}
```

## 🏗️ 架構說明

### 服務分離理由
- **單一責任**：專注於即時通訊功能
- **獨立擴展**：根據連線數獨立擴展
- **故障隔離**：與 API 服務互不影響
- **協議最佳化**：針對 WebSocket 最佳化

### 技術選擇
- **Express.js**: 輕量 HTTP 伺服器
- **Socket.IO**: WebSocket 連線管理
- **Redis**: 連線狀態快取
- **TypeScript**: 類型安全

## 🔗 相關服務

- `drone-service`: 無人機 API 服務 (gRPC)
- `rbac-service`: 權限管理服務
- `kong`: API Gateway
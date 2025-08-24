# API Gateway Service

## 📋 服務概覽

API Gateway Service 是 AIOT 系統的核心入口點，負責統一管理和路由所有客戶端請求到相應的微服務。作為系統的前門，它提供認證、授權、負載均衡、監控等關鍵功能。

### 🚀 主要功能

- **統一入口點**：所有客戶端請求的單一入口
- **協議轉換**：HTTP 到 gRPC 的無縫轉換
- **身份驗證**：JWT 令牌驗證和用戶身份識別
- **權限控制**：基於角色的訪問控制（RBAC）
- **負載均衡**：智能路由和負載分配
- **限流保護**：防止服務過載和濫用
- **監控統計**：請求追蹤和性能監控
- **WebSocket 代理**：即時通訊服務代理

## 🏗️ 系統架構

### 核心組件

| 組件 | 職責 | 技術棧 |
|------|------|--------|
| **路由代理** | HTTP → gRPC 轉換 | Express.js + http-proxy-middleware |
| **認證中間件** | JWT 驗證 | jsonwebtoken |
| **限流中間件** | 請求限制 | express-rate-limit |
| **監控中間件** | 性能追蹤 | Custom Middleware |
| **負載均衡** | 服務發現和路由 | Consul + Custom LB |
| **WebSocket 代理** | 即時通訊 | node-http-proxy |

### 服務端口

- **HTTP 端口**: 8000
- **健康檢查**: `/health`
- **系統監控**: `/api/health/system`
- **服務狀態**: `/api/health/services`

## 🌐 API 路由

### 認證相關

| 路徑 | 目標服務 | 描述 |
|------|---------|------|
| `/api/auth/*` | auth-service (50054) | 用戶認證和授權 |

### 核心業務

| 路徑 | 目標服務 | 描述 |
|------|---------|------|
| `/api/rbac/*` | rbac-service (50051) | 角色權限管理 |
| `/api/drone/*` | drone-service (50052) | 無人機控制和監控 |
| `/api/general/*` | general-service (50053) | 通用功能服務 |

### 即時通訊

| 路徑 | 目標服務 | 描述 |
|------|---------|------|
| `/socket.io/*` | drone-websocket-service (3004) | WebSocket 連接 |
| `/ws/*` | llm-service (8021) | LLM WebSocket 連接 |

### 系統管理

| 路徑 | 描述 | 回應格式 |
|------|------|----------|
| `/health` | 基本健康檢查 | JSON |
| `/api/health/system` | 系統整體健康狀態 | JSON |
| `/api/health/services` | 所有微服務狀態 | JSON |
| `/api/docs` | 文檔中心 | HTML |

## 🔐 安全機制

### JWT 認證流程

```javascript
// 1. 用戶登入
POST /api/auth/login
{
  "username": "user",
  "password": "password"
}

// 2. 獲取 JWT Token (設置在 HttpOnly Cookie)
Response: Set-Cookie: auth_token=eyJ...

// 3. 後續請求自動攜帶 Token
GET /api/rbac/users
Cookie: auth_token=eyJ...
```

### 權限驗證

```javascript
// 檢查登入狀態
GET /api/auth/me
Response: {
  "id": "user123",
  "username": "john",
  "roles": ["admin", "operator"]
}
```

## ⚡ 負載均衡策略

### 服務發現

- **Consul 集成**：自動發現可用的微服務實例
- **健康檢查**：定期檢查服務健康狀態
- **故障轉移**：自動將請求路由到健康的實例

### 負載均衡算法

- **輪詢（Round Robin）**：預設策略
- **權重分配**：基於服務性能調整
- **最少連接**：選擇連接數最少的實例

## 🛡️ 安全保護

### 限流策略

```javascript
// 全域限制
- 每個 IP: 100 req/min
- 每個用戶: 1000 req/hour

// API 特殊限制
- 登入端點: 5 req/min
- 上傳端點: 10 req/min
- 查詢端點: 60 req/min
```

### CORS 配置

```javascript
const corsConfig = {
  origin: [
    'http://localhost:3000',      // 前端開發
    'http://localhost:8000',      // Gateway 自身
    'http://aiot-frontend:3000',  // Docker 內部
  ],
  credentials: true,              // 支援 Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};
```

## 📊 監控與診斷

### 健康檢查端點

```bash
# 基本健康檢查
curl http://localhost:8000/health

# 系統整體狀態
curl http://localhost:8000/api/health/system

# 個別服務狀態
curl http://localhost:8000/api/health/services
```

### 監控指標

- **請求量**: 每秒請求數 (RPS)
- **響應時間**: 平均/P95/P99 延遲
- **錯誤率**: 4xx/5xx 錯誤比例
- **連接數**: WebSocket 活躍連接
- **服務健康度**: 微服務可用性

### 日誌等級

- **INFO**: 一般請求和系統事件
- **WARN**: 服務異常和限流警告
- **ERROR**: 代理錯誤和服務不可用
- **DEBUG**: 詳細的路由和認證信息

## 🔧 配置說明

### 環境變量

```env
NODE_ENV=development
PORT=8000

# 服務發現
CONSUL_HOST=consul
CONSUL_PORT=8500

# 微服務配置
AUTH_SERVICE_URL=http://auth-service:50054
RBAC_SERVICE_URL=grpc://rbac-service:50051
DRONE_SERVICE_URL=grpc://drone-service:50052
GENERAL_SERVICE_URL=grpc://general-service:50053

# WebSocket 代理
DRONE_WS_URL=http://drone-websocket-service:3004
LLM_WS_URL=http://llm-service:8021

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h
```

### 代理配置

```javascript
const proxyConfig = {
  timeout: 30000,           // 30 秒超時
  retries: 3,              // 重試 3 次
  retryDelay: 1000,        // 重試間隔 1 秒
  keepAlive: true,         // 保持連接
  changeOrigin: true       // 修改 Origin 標頭
};
```

## 🚀 部署指南

### Docker 部署

```bash
# 建置鏡像
docker build -f Dockerfile.dev -t gateway-service .

# 運行容器
docker run -p 8000:8000 \
  -e CONSUL_HOST=consul \
  -e NODE_ENV=production \
  gateway-service
```

### 生產部署注意事項

1. **反向代理**: 建議在前面放置 Nginx 或 CloudFlare
2. **SSL/TLS**: 配置 HTTPS 證書
3. **監控**: 集成 Prometheus 和 Grafana
4. **日誌**: 配置集中式日誌收集
5. **備份**: 定期備份配置和證書

## 🔍 故障排除

### 常見問題

1. **服務連接失敗**
   ```bash
   # 檢查微服務狀態
   curl http://localhost:8000/api/health/services
   
   # 檢查 Consul 服務註冊
   curl http://consul:8500/v1/health/service/rbac-service
   ```

2. **認證失敗**
   ```bash
   # 檢查 JWT Token
   curl -b cookies.txt http://localhost:8000/api/auth/me
   
   # 重新登入
   curl -X POST -d '{"username":"admin","password":"admin"}' \
     -H "Content-Type: application/json" \
     -c cookies.txt http://localhost:8000/api/auth/login
   ```

3. **WebSocket 連接問題**
   - 檢查防火牆設置
   - 確認 WebSocket 升級支援
   - 驗證代理配置

### 效能優化

1. **連接池優化**: 調整 HTTP 代理連接池大小
2. **緩存策略**: 實施適當的響應緩存
3. **壓縮**: 啟用 gzip 壓縮
4. **靜態資源**: CDN 分發靜態文件

---

**維護團隊**: AIOT Development Team  
**最後更新**: 2025-08-24  
**版本**: 1.0.0
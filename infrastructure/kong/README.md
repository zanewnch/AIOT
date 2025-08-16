# AIOT Kong Gateway 配置說明

## 📋 概述

Kong Gateway 作為 AIOT 微服務架構的 API 閘道，負責：
- **流量路由**：將外部請求路由到對應的微服務
- **身份驗證**：JWT Token 驗證和權限控制
- **監控日誌**：API 調用監控和效能指標收集
- **負載均衡**：微服務實例間的負載分散
- **健康檢查**：自動檢測後端服務健康狀態

## 🏗️ 架構流程

```
客戶端請求 → Kong Gateway → 身份驗證 → 路由匹配 → 微服務
     ↓              ↓           ↓          ↓          ↓
   HTTP/HTTPS    插件處理    JWT驗證    負載均衡    後端服務
     ↓              ↓           ↓          ↓          ↓
   監控記錄      日誌收集    權限檢查    健康檢查    回應處理
```

## 📁 配置文件結構

### 主配置文件 (`kong.yaml`)
```yaml
_format_version: "3.0"    # Kong 配置格式版本
_transform: true          # 啟用配置轉換
_includes:                # 模組化配置文件
  - services.yaml         # 服務定義
  - routes.yaml          # 路由規則
  - plugins.yaml         # 插件配置
  - upstreams.yaml       # 負載均衡
  - consumers.yaml       # 消費者和認證
```

**作用**：統一入口點，組織所有配置文件，使配置更模組化和易維護。

---

## 🔧 各配置文件詳解

### 1. Services (`services.yaml`) - 後端服務定義

**實際邏輯**：定義 Kong 如何與後端微服務通信

```yaml
services:
  - name: rbac-service           # 服務名稱
    url: http://rbac-service:3001  # 後端服務 URL
    connect_timeout: 60000       # 連接超時 (60秒)
    write_timeout: 60000         # 寫入超時
    read_timeout: 60000          # 讀取超時
    retries: 5                   # 重試次數
    tags: [auth, rbac]           # 服務標籤
```

**實現步驟**：
1. Kong 接收到請求後，根據路由規則找到對應的 Service
2. 使用 Service 配置中的 URL 和參數連接後端
3. 如果連接失敗，根據 `retries` 設定重試
4. 超時控制確保請求不會無限等待

**每個服務的用途**：
- **rbac-service** (3001)：用戶認證、角色權限管理
- **drone-service** (3002)：無人機控制、WebSocket 即時通信
- **fesetting-service** (3003)：用戶偏好設定、前端配置

---

### 2. Routes (`routes.yaml`) - 路由規則

**實際邏輯**：根據請求路徑將流量分發到不同服務

```yaml
routes:
  - name: rbac-auth-routes
    service: rbac-service        # 對應的服務
    paths: [/api/auth]          # 匹配路徑
    strip_path: false           # 保留完整路徑
    protocols: [http, https]    # 支援的協議
```

**實現步驟**：
1. **請求匹配**：Kong 檢查請求路徑是否匹配 `paths`
2. **協議驗證**：確認請求協議在允許範圍內
3. **服務轉發**：將請求轉發到對應的 Service
4. **路徑處理**：根據 `strip_path` 決定是否保留路徑前綴

**路由對應關係**：
```
/api/auth/*         → rbac-service   (登入、認證)
/api/rbac/*         → rbac-service   (角色權限)
/api/drone/*        → drone-service  (無人機 API)
/socket.io/*        → drone-service  (WebSocket)
/api/user-preferences/* → fesetting-service (用戶設定)
```

---

### 3. Plugins (`plugins.yaml`) - 插件功能

**實際邏輯**：為請求添加橫切面功能（認證、監控、限流等）

#### 3.1 全局插件
```yaml
- name: prometheus              # Prometheus 監控
  config:
    per_consumer: true          # 按消費者統計
    status_code_metrics: true   # HTTP 狀態碼統計
    latency_metrics: true       # 延遲統計
```

#### 3.2 JWT 認證插件
```yaml
- name: jwt
  route: rbac-routes           # 套用到特定路由
  config:
    cookie_names: [jwt]        # 從 Cookie 讀取 Token
    header_names: [authorization] # 從 Header 讀取 Token
    claims_to_verify: [exp, iat]  # 驗證 Token 有效期
```

**實現步驟**：
1. **請求攔截**：插件在請求到達後端前攔截
2. **Token 提取**：從 Cookie 或 Header 中提取 JWT Token
3. **Token 驗證**：驗證 Token 簽名、有效期、發行者
4. **權限檢查**：確認用戶是否有權限訪問資源
5. **請求放行**：驗證通過後轉發到後端服務

#### 3.3 其他插件功能
- **correlation-id**：為每個請求生成唯一 ID，方便日誌追蹤
- **request-size-limiting**：限制請求大小，防止大文件攻擊

---

### 4. Upstreams (`upstreams.yaml`) - 負載均衡

**實際邏輯**：管理後端服務實例，實現負載均衡和健康檢查

```yaml
upstreams:
  - name: rbac-upstream
    algorithm: round-robin      # 輪詢負載均衡
    healthchecks:
      active:
        http_path: /health      # 健康檢查路徑
        interval: 10            # 檢查間隔 (秒)
        healthy:
          http_statuses: [200, 302]  # 健康狀態碼
          successes: 2               # 連續成功次數
        unhealthy:
          http_statuses: [500, 502, 503, 504]  # 異常狀態碼
          tcp_failures: 3                      # TCP 失敗次數
```

**實現步驟**：
1. **實例註冊**：後端服務實例註冊到 Upstream
2. **健康檢查**：定期向 `/health` 端點發送檢查請求
3. **狀態更新**：根據回應更新服務實例健康狀態
4. **負載分發**：只向健康的實例分發請求
5. **故障轉移**：不健康的實例自動從負載均衡中移除

---

### 5. Consumers (`consumers.yaml`) - 消費者認證

**實際邏輯**：定義 API 消費者和 JWT 密鑰配置

```yaml
consumers:
  - username: aiot-jwt-consumer  # 消費者名稱
    custom_id: aiot-system      # 自定義 ID

jwt_secrets:
  - consumer: aiot-jwt-consumer
    key: aiot-jwt-issuer        # JWT 發行者標識
    secret: aiot-jwt-secret-key-2024  # JWT 簽名密鑰
    algorithm: HS256            # 加密算法
```

**實現步驟**：
1. **Consumer 建立**：定義 API 使用者身份
2. **密鑰配置**：設定 JWT Token 驗證所需的密鑰
3. **Token 簽名**：後端服務使用相同密鑰簽名 Token
4. **Token 驗證**：Kong 使用密鑰驗證 Token 有效性

---

## 🔄 完整請求流程

### 1. 用戶登入流程
```
1. POST /api/auth/login → Kong → rbac-service
2. rbac-service 驗證用戶名密碼
3. 生成 JWT Token (使用 aiot-jwt-secret-key-2024)
4. 設置 httpOnly Cookie 返回給客戶端
```

### 2. API 請求流程
```
1. 客戶端請求 /api/rbac/roles (攜帶 JWT Cookie)
2. Kong 路由匹配 rbac-routes
3. JWT 插件提取並驗證 Token
4. Token 有效 → 轉發到 rbac-service
5. rbac-service 處理業務邏輯
6. 回應通過 Kong 返回客戶端
```

### 3. WebSocket 連接流程
```
1. 客戶端建立 WebSocket 連接 /socket.io
2. Kong 路由到 drone-websocket-routes
3. 升級協議到 WebSocket (ws/wss)
4. 建立與 drone-service 的持久連接
5. 即時數據雙向傳輸
```

## 📊 監控和日誌

### Prometheus 監控指標
- **請求量**：每個服務的 QPS
- **延遲**：P50, P95, P99 回應時間
- **錯誤率**：4xx, 5xx 錯誤統計
- **上游健康**：後端服務健康狀態

### 日誌記錄
- **Access Log**：所有 API 訪問記錄
- **Error Log**：錯誤和異常日誌
- **Correlation ID**：請求追蹤標識

## 🛡️ 安全機制

1. **JWT 認證**：無狀態 Token 驗證
2. **Cookie 安全**：httpOnly + secure flags
3. **HTTPS 支援**：加密傳輸
4. **請求限制**：大小和頻率限制
5. **健康檢查**：自動故障轉移

## 🚀 部署配置

Kong 通過 Docker Compose 部署：
```yaml
environment:
  - KONG_DATABASE=off                    # 無資料庫模式
  - KONG_DECLARATIVE_CONFIG=/kong/kong.yaml # 聲明式配置
volumes:
  - ../kong:/kong:ro                     # 配置文件掛載
```

## 🎯 總結

這種設計實現了高可用、高效能、安全的 API 閘道服務！

### 核心優勢：
- **模組化配置**：易於維護和擴展
- **安全認證**：JWT + httpOnly Cookie 雙重保護
- **自動監控**：Prometheus 整合，全面監控
- **負載均衡**：自動健康檢查和故障轉移
- **即時通信**：支援 WebSocket 協議
- **無狀態部署**：Docker 容器化，易於部署

Kong Gateway 為 AIOT 系統提供了完整的 API 管理解決方案！
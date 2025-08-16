# Kong Gateway gRPC 配置說明

## 架構概覽

```
Frontend (HTTPS/WSS) → Kong Gateway → Microservices
                                         ├─ RBAC (gRPC:50051)
                                         ├─ Drone (gRPC:50052)  
                                         ├─ FeSetting (gRPC:50053)
                                         └─ Drone-realtime (WebSocket:3004)
```

## 核心功能

Kong Gateway 作為 API 閘道，提供以下功能：

1. **協議轉換**: HTTP/HTTPS ↔ gRPC
2. **認證授權**: 通過 OPA (Open Policy Agent)
3. **負載均衡**: gRPC 服務的負載均衡
4. **監控**: Prometheus 指標收集
5. **限流**: API 請求限流

## gRPC-Gateway 插件配置

### 支援的 API 端點

#### RBAC 服務
- `GET /api/rbac/users` - 獲取使用者列表
- `POST /api/rbac/users` - 創建使用者

#### Drone 服務  
- `GET /api/drone/statuses` - 獲取無人機狀態
- `POST /api/drone/statuses` - 創建無人機狀態
- `GET /api/drone/positions` - 獲取無人機位置
- `POST /api/drone/commands` - 發送無人機命令

#### FeSetting 服務
- `GET /api/user-preferences` - 獲取使用者偏好設定
- `POST /api/user-preferences` - 創建使用者偏好設定
- `PUT /api/user-preferences/{preference_id}` - 更新使用者偏好設定

### WebSocket 服務
- `wss://localhost:8443/socket.io` - Drone 即時通訊

## 配置文件說明

### services.yaml
- 定義各個微服務的連接資訊
- 指定協議類型 (gRPC/WebSocket)
- 配置健康檢查和超時設定

### routes.yaml  
- 定義外部訪問路由
- 僅允許 HTTPS/WSS 協議
- 配置路徑映射

### plugins.yaml
- gRPC-Gateway 插件配置
- HTTP 到 gRPC 的映射規則
- OPA 認證配置
- CORS、限流等其他插件

### upstreams.yaml
- 定義上游服務
- 負載均衡配置
- 健康檢查設定

## 測試方法

### 啟動服務
```bash
# 啟動所有服務
cd /home/user/GitHub/AIOT/infrastructure/docker
docker-compose up -d

# 檢查服務狀態
docker-compose ps
```

### 運行測試
```bash
# 執行 gRPC-Gateway 測試
cd /home/user/GitHub/AIOT/infrastructure/kong
./test-grpc-gateway.sh
```

### 手動測試範例

#### 測試 RBAC 服務
```bash
# 獲取使用者列表
curl -X GET https://localhost:8443/api/rbac/users \
  -H "Content-Type: application/json" \
  -k

# 創建使用者
curl -X POST https://localhost:8443/api/rbac/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com", 
    "password": "password123"
  }' \
  -k
```

#### 測試 Drone 服務  
```bash
# 獲取無人機狀態
curl -X GET https://localhost:8443/api/drone/statuses \
  -H "Content-Type: application/json" \
  -k

# 發送無人機命令
curl -X POST https://localhost:8443/api/drone/commands \
  -H "Content-Type: application/json" \
  -d '{
    "drone_id": "drone-001",
    "command_type": "takeoff",
    "parameters": "{\"altitude\": 100}"
  }' \
  -k
```

## 故障排除

### 常見問題

1. **gRPC 服務連接失敗**
   - 檢查微服務是否正常啟動
   - 確認 gRPC 端口是否正確暴露
   - 檢查 Docker 網路連接

2. **HTTP 到 gRPC 轉換錯誤**
   - 檢查 proto 文件是否正確
   - 確認 HTTP 映射規則
   - 查看 Kong 錯誤日誌

3. **認證問題**
   - 確認 OPA 服務運行正常
   - 檢查認證策略配置
   - 驗證 JWT token

### 查看日誌
```bash
# Kong Gateway 日誌
docker logs aiot-kong

# 微服務日誌  
docker logs aiot-rbac-service
docker logs aiot-drone-service
docker logs aiot-fesetting-service

# OPA 日誌
docker logs aiot-opa
```

## 開發指南

### 添加新的 API 端點

1. 在對應的 proto 文件中添加 HTTP 映射
2. 在 plugins.yaml 中更新 gRPC-Gateway 配置
3. 重啟 Kong Gateway
4. 測試新端點

### 修改 gRPC 服務

1. 更新 proto 文件
2. 重新生成 gRPC 程式碼
3. 更新服務實作
4. 重啟對應的微服務

## 監控和維護

### 健康檢查端點
- Kong Admin API: http://localhost:8001
- Prometheus 指標: http://localhost:8001/metrics
- OPA API: http://localhost:8181

### 效能監控
使用 Prometheus + Grafana 監控：
- API 請求量和延遲
- gRPC 服務健康狀態
- 資源使用情況

## 安全考慮

1. **HTTPS Only**: 所有外部通訊使用 HTTPS
2. **內部 gRPC**: 微服務間使用 gRPC 提升效能
3. **集中認證**: 通過 OPA 統一管理權限
4. **限流保護**: 防止 API 濫用
5. **日誌監控**: 完整的請求日誌記錄
# Kong Gateway 插件配置文檔

## 📋 已配置的插件列表

### 🔒 **安全類插件**

#### 1. OPA (Open Policy Agent)
- **功能**: 集中式認證授權
- **適用**: 所有路由
- **配置**: 連接到 aiot-opa:8181
- **效果**: 統一權限管理，無需在微服務中實作認證

#### 2. Bot Detection  
- **功能**: 檢測和阻擋惡意機器人
- **適用**: 全局
- **配置**: 
  - 允許: googlebot, bingbot, slackbot
  - 阻擋: BadBot, MaliciousBot
- **效果**: 防護爬蟲和惡意訪問

### 📊 **監控類插件**

#### 3. Prometheus
- **功能**: 指標收集
- **適用**: 全局
- **端點**: http://localhost:8001/metrics
- **指標**: 請求數、延遲、狀態碼、頻寬使用

#### 4. File Log
- **功能**: 訪問日誌記錄
- **適用**: 全局
- **日誌位置**: /tmp/kong-access.log
- **格式**: JSON 格式，包含請求詳情

#### 5. Correlation ID
- **功能**: 請求追蹤 ID
- **適用**: 全局
- **標頭**: X-Request-ID
- **用途**: 分散式追蹤和問題排查

### 🚀 **性能類插件**

#### 6. Gzip
- **功能**: 回應壓縮
- **適用**: 全局
- **支援類型**: JSON, HTML, CSS, JavaScript, XML
- **效果**: 減少頻寬使用，提升載入速度

#### 7. Proxy Cache
- **功能**: API 回應快取
- **適用**: 全局
- **快取時間**: 300 秒 (TTL)
- **存儲時間**: 3600 秒 (Storage TTL)
- **策略**: 記憶體快取
- **適用方法**: GET, HEAD
- **效果**: 減少後端負載，提升回應速度

### 🔄 **轉換類插件**

#### 8. Request Transformer Advanced
- **功能**: 請求標頭轉換和追蹤
- **適用**: 全局
- **添加標頭**:
  - `X-Service-Name: AIOT`
  - `X-Version: v1.0`
  - `X-Request-ID: $(uuid)`
  - `X-Timestamp: $(timestamp)`
  - `X-Client-IP: $(client_ip)`
- **移除標頭**: X-Internal-Secret
- **效果**: 請求追蹤和內部資訊保護

#### 9. Response Transformer
- **功能**: 回應標頭轉換
- **適用**: 全局
- **添加標頭**:
  - `X-Powered-By: AIOT-Kong-Gateway`
  - `X-Response-Time: $(latency)`
  - `X-Kong-Upstream-Latency: $(upstream_response_time)`
  - `X-Kong-Proxy-Latency: $(kong_proxy_latency)`
- **移除標頭**: X-Internal-Info, Server
- **效果**: 統一回應格式，隱藏內部資訊

#### 10. gRPC-Gateway
- **功能**: HTTP 到 gRPC 協議轉換
- **適用**: RBAC, Drone, FeSetting 服務
- **效果**: JSON 請求自動轉換為 gRPC 調用

### 🛡️ **流量控制類插件**

#### 11. Rate Limiting
- **功能**: API 請求限流
- **適用**: 各路由
- **配置**:
  - RBAC Auth: 100/分鐘, 1000/小時
  - RBAC: 100/分鐘, 1000/小時  
  - Drone: 200/分鐘, 2000/小時
  - FeSetting: 50/分鐘, 500/小時
- **效果**: 防止 API 濫用

#### 12. Request Size Limiting
- **功能**: 限制請求大小
- **適用**: 全局
- **限制**: 10MB
- **效果**: 防止大檔案攻擊

#### 13. CORS
- **功能**: 跨來源資源共享
- **適用**: 所有路由
- **配置**: 允許所有來源，支援常用 HTTP 方法
- **效果**: 支援前端跨域訪問

## 📈 **插件效果監控**

### 訪問日誌格式
```json
{
  "request": {
    "method": "GET",
    "uri": "/api/rbac/users",
    "size": 0,
    "querystring": {}
  },
  "response": {
    "status": 200,
    "size": 1024
  },
  "latencies": {
    "kong": 45,
    "proxy": 123,
    "request": 168
  },
  "client_ip": "192.168.1.100",
  "started_at": 1640995200000
}
```

### Prometheus 指標
- `kong_http_requests_total` - 總請求數
- `kong_http_status` - HTTP 狀態碼分佈
- `kong_latency` - 回應延遲
- `kong_bandwidth` - 頻寬使用

## 🔧 **測試和驗證**

### 手動測試插件功能

#### 測試 Gzip 壓縮
```bash
curl -H "Accept-Encoding: gzip" \
     -v https://localhost:8443/api/rbac/users \
     -k
# 檢查回應標頭中的 Content-Encoding: gzip
```

#### 測試快取功能
```bash
# 首次請求
time curl https://localhost:8443/api/rbac/users -k

# 第二次請求 (應該更快)
time curl https://localhost:8443/api/rbac/users -k
```

#### 測試機器人檢測
```bash
# 正常請求
curl https://localhost:8443/api/rbac/users \
     -H "User-Agent: Chrome/91.0" -k

# 惡意機器人 (應該被阻擋)
curl https://localhost:8443/api/rbac/users \
     -H "User-Agent: BadBot" -k
```

#### 檢查追蹤標頭
```bash
curl -I https://localhost:8443/api/rbac/users -k
# 應該看到：
# X-Service-Name: AIOT
# X-Version: v1.0
# X-Request-ID: [UUID]
# X-Response-Time: [時間]
```

### 自動化測試
```bash
cd /home/user/GitHub/AIOT/infrastructure/kong
./test-grpc-gateway.sh
```

## 📋 **維護指南**

### 查看插件狀態
```bash
# 列出所有啟用的插件
curl http://localhost:8001/plugins

# 查看特定插件配置
curl http://localhost:8001/plugins/{plugin-id}
```

### 查看日誌
```bash
# Kong 容器日誌
docker logs aiot-kong

# 訪問日誌
docker exec aiot-kong tail -f /tmp/kong-access.log

# Prometheus 指標
curl http://localhost:8001/metrics
```

### 插件管理
```bash
# 停用插件
curl -X PATCH http://localhost:8001/plugins/{plugin-id} \
     -d "enabled=false"

# 啟用插件
curl -X PATCH http://localhost:8001/plugins/{plugin-id} \
     -d "enabled=true"
```

## 🎯 **最佳實踐**

1. **監控指標**: 定期檢查 Prometheus 指標
2. **日誌分析**: 分析訪問日誌以了解使用模式
3. **快取策略**: 根據 API 特性調整快取 TTL
4. **限流調整**: 根據實際使用量調整限流參數
5. **安全更新**: 定期檢查和更新安全相關插件
6. **效能調優**: 監控延遲指標，調整插件配置

## 🚨 **故障排除**

### 常見問題

1. **插件不生效**
   - 檢查插件配置語法
   - 確認插件啟用狀態
   - 查看 Kong 錯誤日誌

2. **快取未命中**
   - 檢查快取策略配置
   - 確認請求方法和內容類型
   - 查看快取相關標頭

3. **日誌文件為空**
   - 檢查文件權限
   - 確認掛載路徑正確
   - 驗證插件配置

4. **機器人檢測誤判**
   - 調整 User-Agent 規則
   - 檢查白名單配置
   - 查看檢測日誌

通過這些插件，你的 AIOT 系統現在具備了企業級的 API 閘道功能！🚀
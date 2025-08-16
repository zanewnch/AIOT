# AIOT OPA + JWT 整合方案

## 🚨 當前問題分析

### 發現的問題
1. **Kong 有 JWT secret 但沒有 JWT 插件**
2. **OPA 策略假設 JWT 已解析但實際沒有**
3. **認證流程不完整**

## 🔧 完整解決方案

### 1. Kong JWT 插件配置

**創建 JWT 插件配置檔案**：`infrastructure/kong/jwt-plugins.yaml`

```yaml
_format_version: "3.0"

plugins:
  # JWT 插件 - 應用到需要認證的路由
  - name: jwt
    route: rbac-routes
    config:
      secret_is_base64: false
      key_claim_name: iss
      claims_to_verify:
        - exp
        - iat
      header_names:
        - authorization
      cookie_names: []
      uri_param_names: []
      anonymous: null
      run_on_preflight: true

  - name: jwt
    route: drone-api-routes
    config:
      secret_is_base64: false
      key_claim_name: iss
      claims_to_verify:
        - exp
        - iat
      header_names:
        - authorization
```

### 2. JWT 格式標準化

**RBAC Service 需要生成標準 JWT**：

```javascript
// 應該生成這種格式的 JWT
const jwtPayload = {
  iss: "aiot-jwt-issuer",        // 對應 Kong consumer key
  sub: user.id,                  // 用戶 ID
  username: user.username,       // 用戶名
  roles: user.roles,             // 用戶角色
  departmentId: user.departmentId,
  exp: Math.floor(Date.now() / 1000) + 3600, // 1小時過期
  iat: Math.floor(Date.now() / 1000)
};
```

### 3. OPA 策略更新

**修正 `gateway_policy.rego`**：

```rego
# 從 Kong JWT 插件提取的用戶信息
user_id := input.headers["x-consumer-custom-id"]
user_claims := json.unmarshal(input.headers["x-consumer-claims"])
user_roles := user_claims.roles

# 或者從原始 JWT token 解析
jwt_token := trim_prefix(input.headers.authorization, "Bearer ")
jwt_payload := io.jwt.decode_verify(jwt_token, {"secret": "aiot-jwt-secret-key-2024", "alg": "HS256"})[1]
user_id := jwt_payload.sub
user_roles := jwt_payload.roles
```

### 4. 完整認證流程

#### 📋 步驟 1：用戶登入
```
POST /api/auth/login
{
  "username": "admin",
  "password": "admin"
}
```

#### 📋 步驟 2：RBAC Service 驗證並生成 JWT
```javascript
// AuthCommandsSvc.ts
const jwt = require('jsonwebtoken');

const token = jwt.sign({
  iss: "aiot-jwt-issuer",
  sub: user.id,
  username: user.username,
  roles: user.roles,
  departmentId: user.departmentId,
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000)
}, "aiot-jwt-secret-key-2024");
```

#### 📋 步驟 3：前端儲存並使用 JWT
```javascript
// 前端發送 API 請求
fetch('/api/rbac/users', {
  headers: {
    'Authorization': `Bearer ${jwt_token}`
  }
});
```

#### 📋 步驟 4：Kong 驗證 JWT
```
Kong JWT Plugin → 驗證 JWT signature → 提取用戶信息 → 設置 headers
```

#### 📋 步驟 5：OPA 檢查權限
```rego
# gateway_policy.rego
user_id := input.headers["x-consumer-custom-id"]
user_roles := input.jwt.roles  # 從 JWT payload 提取

allow if {
    service_name == "rbac-service"
    user_roles[_] in ["admin", "superadmin"]
    request_method == "GET"
}
```

## 🏗️ 實施步驟

### 立即需要做的：

1. **部署 JWT 插件配置**
```bash
curl -X POST http://localhost:8001/config \
  -F config=@infrastructure/kong/jwt-plugins.yaml
```

2. **修改 RBAC Service JWT 生成邏輯**
   - 使用正確的 JWT payload 格式
   - 確保 `iss` 匹配 Kong consumer key

3. **更新 OPA 策略**
   - 修正用戶信息提取邏輯
   - 添加 JWT 驗證機制

4. **測試整個流程**
   - 登入 → 取得 JWT
   - 使用 JWT 訪問 API
   - 確認 OPA 正確檢查權限

## 🧪 測試驗證

### 測試 1：JWT 驗證
```bash
# 1. 登入取得 JWT
JWT=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.data.token')

# 2. 使用 JWT 訪問受保護 API
curl -X GET http://localhost:8000/api/rbac/users \
  -H "Authorization: Bearer $JWT"
```

### 測試 2：OPA 權限檢查
```bash
# 直接測試 OPA 決策
curl -X POST http://localhost:8181/v1/data/aiot/gateway/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "service": {"name": "rbac-service"},
      "request": {"path": "/api/rbac/users", "method": "GET"},
      "headers": {"x-consumer-custom-id": "2"},
      "jwt": {"roles": ["admin"]}
    }
  }'
```

## 📊 預期結果

完成後的認證流程：
1. ✅ 用戶成功登入並獲得有效 JWT
2. ✅ Kong JWT 插件驗證 JWT signature
3. ✅ Kong 提取用戶信息並設置 headers
4. ✅ OPA 根據用戶角色檢查權限
5. ✅ 授權通過，API 請求到達後端服務

這樣您的 OPA 系統就真正具有完整的登入和權限檢查功能了！
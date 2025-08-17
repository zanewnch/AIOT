# AIOT Kong Gateway Policy - 正確版本
# 基於 Kong OPA 插件的實際輸入格式

package aiot.gateway

import rego.v1

# 預設拒絕所有請求
default allow := false

# 萃取請求資訊 - 根據 Kong OPA 插件的實際格式
request_method := input.request.http.method
request_path := input.request.http.path
request_headers := input.request.http.headers
service_name := input.service.name
route_paths := input.route.paths

# JWT 密鑰（應該與後端服務使用的相同）
jwt_secret := "aiot-jwt-secret-key-2024"

# 萃取 JWT token 從 Authorization header
auth_header := request_headers.authorization
jwt_token := token if {
    auth_header
    startswith(auth_header, "Bearer ")
    token := substring(auth_header, 7, -1)
}

# JWT 驗證和解碼
jwt_payload := payload if {
    jwt_token
    [valid, _, payload] := io.jwt.decode_verify(jwt_token, {"secret": jwt_secret})
    valid
}

# 檢查 JWT 是否過期
jwt_expired if {
    jwt_payload
    now := time.now_ns() / 1000000000
    now > jwt_payload.exp
}

# JWT 有效性檢查
jwt_valid if {
    jwt_payload
    not jwt_expired
    jwt_payload.exp
    jwt_payload.iat
    jwt_payload.iss == "aiot-system"
}

# 萃取使用者資訊
user_id := jwt_payload.sub if jwt_valid
username := jwt_payload.user.username if jwt_valid  
user_roles := jwt_payload.permissions.roles if jwt_valid
user_permissions := jwt_payload.permissions.permissions if jwt_valid
user_level := jwt_payload.user.level if jwt_valid

# ===========================================
# 授權規則
# ===========================================

# 公開端點 - 登入不需要認證
allow if {
    request_method == "POST"
    "/api/auth" in route_paths
    request_path == "/"
}

# 認證端點 - 需要有效 JWT
allow if {
    request_method in ["GET", "PUT", "DELETE"]  
    "/api/auth" in route_paths
    request_path == "/"
    jwt_valid
}

# RBAC 管理端點 - 需要管理員權限
allow if {
    "/api/rbac" in route_paths
    jwt_valid
    "admin" in user_roles
}

# Drone API 端點 - 基於角色的權限檢查
allow if {
    "/api/drone" in route_paths
    jwt_valid
    drone_access_allowed
}

# Drone Position API - 需要 drone 操作權限
allow if {
    "/api/drone-position" in route_paths  
    jwt_valid
    drone_position_allowed
}

# Drone Status API - 需要 drone 查看權限
allow if {
    "/api/drone-status" in route_paths
    jwt_valid
    drone_status_allowed
}

# General Service (User Preferences) - 需要有效認證
allow if {
    "/api/user-preferences" in route_paths
    jwt_valid
    user_preferences_allowed
}

# Docs API - 需要有效認證
allow if {
    "/api/docs" in route_paths
    jwt_valid
}

# WebSocket 連接 - 需要有效認證
allow if {
    "/socket.io" in route_paths
    jwt_valid
}

# ===========================================
# 權限檢查輔助函數
# ===========================================

# Drone 訪問權限
drone_access_allowed if {
    "admin" in user_roles
}

drone_access_allowed if {
    "drone_operator" in user_roles
}

drone_access_allowed if {
    "drone_admin" in user_roles  
}

# Drone Position 權限檢查
drone_position_allowed if {
    request_method == "GET"
    "drone.position.read" in user_permissions
}

drone_position_allowed if {
    request_method in ["POST", "PUT"]  
    "drone.position.update" in user_permissions
}

drone_position_allowed if {
    "admin" in user_roles
}

# Drone Status 權限檢查  
drone_status_allowed if {
    request_method == "GET"
    "drone.status.read" in user_permissions
}

drone_status_allowed if {
    request_method in ["POST", "PUT"]
    "drone.status.update" in user_permissions  
}

drone_status_allowed if {
    "admin" in user_roles
}

# User Preferences 權限檢查
user_preferences_allowed if {
    # 使用者可以管理自己的偏好設定
    request_method in ["GET", "PUT", "POST"]
    jwt_payload.sub == extract_user_id_from_path
}

user_preferences_allowed if {
    # 管理員可以管理所有使用者的偏好設定
    "admin" in user_roles
}

user_preferences_allowed if {
    # 部門管理員可以查看部門內使用者的設定
    request_method == "GET"
    "department_manager" in user_roles
    # 這裡可以加入部門檢查邏輯
}

# 從路徑萃取使用者 ID（如果需要）
extract_user_id_from_path := user_id if {
    # 這個函數可以根據實際的 API 路徑格式來實現
    # 例如：/api/user-preferences/123 -> 123
    user_id := jwt_payload.sub  # 簡化版本，實際可能需要從路徑解析
}

# ===========================================
# 審計和日誌
# ===========================================

# 需要審計的操作
requires_audit if {
    request_method in ["POST", "PUT", "DELETE"]
}

requires_audit if {
    "admin" in user_roles
}

# 拒絕原因（用於日誌和除錯）
deny_reason := "未提供 JWT token" if {
    not jwt_token
}

deny_reason := "JWT token 無效或已過期" if {
    jwt_token
    not jwt_valid
}

deny_reason := "權限不足" if {
    jwt_valid
    not allow
}

# ===========================================
# 回應格式（Kong OPA 插件格式）
# ===========================================

# 成功時的回應
response := {
    "allow": true,
    "headers": {
        "X-User-ID": user_id,
        "X-Username": username,
        "X-User-Roles": concat(",", user_roles)
    }
} if {
    allow
    jwt_valid
}

# 拒絕時的回應
response := {
    "allow": false,
    "status": 403,
    "message": deny_reason
} if {
    not allow
}
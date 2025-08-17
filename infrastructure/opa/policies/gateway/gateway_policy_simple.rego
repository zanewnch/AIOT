# AIOT Kong Gateway Policy - Clean Version
# 乾淨的授權策略，避免規則衝突

package aiot.gateway

import rego.v1

# 預設拒絕所有請求
default allow := false

# 萃取請求資訊
service_name := input.service.name
route_path := input.request.path
request_method := input.request.method
request_headers := input.request.headers

# 萃取 JWT token
jwt_token := request_headers["x-jwt-token"] if {
    request_headers["x-jwt-token"] != ""
}

jwt_token := token if {
    not request_headers["x-jwt-token"]
    authorization := request_headers.authorization
    startswith(authorization, "Bearer ")
    token := substring(authorization, 7, -1)
}

# 檢查 Kong 是否已驗證 JWT
kong_jwt_verified if {
    request_headers["x-consumer-username"] != ""
}

# JWT 驗證
jwt_valid if {
    kong_jwt_verified
    jwt_token
}

jwt_valid if {
    not kong_jwt_verified
    jwt_token
    io.jwt.verify_hs256(jwt_token, "aiot-jwt-secret-key-2024")
}

# 萃取 JWT payload
jwt_payload := payload if {
    jwt_valid
    [_, payload, _] := io.jwt.decode(jwt_token)
}

user_id := jwt_payload.sub if jwt_valid
username := jwt_payload.user.username if jwt_valid
user_roles := jwt_payload.permissions.roles if jwt_valid

# 檢查 JWT 是否過期
jwt_expired if {
    jwt_valid
    time.now_ns() > (jwt_payload.exp * 1000000000)
}

# 公開端點 - 不需要認證
# POST /api/auth - 登入端點
allow if {
    service_name == "rbac-service"
    route_path == "/"
    request_method == "POST"
}

# 認證端點 - 需要有效的 JWT
# GET/PUT/DELETE /api/auth - 取得/更新使用者資訊
allow if {
    service_name == "rbac-service"
    route_path == "/"
    request_method in ["GET", "PUT", "DELETE"]
    jwt_valid
    not jwt_expired
}

# RBAC 管理端點 - 需要管理員權限
allow if {
    service_name == "rbac-service"
    startswith(route_path, "/")
    jwt_valid
    not jwt_expired
    "admin" in user_roles
}

# Drone API 端點 - 需要有效認證
allow if {
    service_name == "drone-http-service"
    jwt_valid
    not jwt_expired
}

# General 服務端點 - 需要有效認證
allow if {
    service_name == "general-service"
    jwt_valid
    not jwt_expired
}

# Drone WebSocket - 需要有效認證
allow if {
    service_name == "drone-websocket-service"
    jwt_valid
    not jwt_expired
}

# Docs 服務 - 需要有效認證
allow if {
    service_name == "docs-http-service"
    jwt_valid
    not jwt_expired
}
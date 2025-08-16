# AIOT Gateway Policy - JWT Authentication & Authorization
# This policy handles complete JWT verification and permission-based authorization
# Integrates with Kong JWT plugin to verify tokens and check permissions directly

package aiot.gateway

import future.keywords.in
import future.keywords.contains
import rego.v1

# JWT Secret Key for signature verification
jwt_secret := "aiot-jwt-secret-key-2024"

# Default deny all requests
default allow := false

# Extract request information from Kong OPA plugin input
service_name := input.service.name
route_path := input.request.path
request_method := input.request.method
request_headers := input.request.headers

# Extract JWT token from Kong JWT plugin headers
# Kong JWT plugin sets x-jwt-token header after successful verification
jwt_token := request_headers["x-jwt-token"] if {
    request_headers["x-jwt-token"]
}

# Fallback: Extract JWT token from Authorization header
jwt_token := token if {
    not request_headers["x-jwt-token"]
    authorization := request_headers.authorization
    startswith(authorization, "Bearer ")
    token := substring(authorization, 7, -1)
}

# Check if Kong has already verified the JWT
kong_jwt_verified := request_headers["x-consumer-username"] != "" if {
    request_headers["x-consumer-username"]
}

# JWT verification - prefer Kong's verification, fallback to manual verification
jwt_valid := true if {
    kong_jwt_verified
    jwt_token
}

jwt_valid := io.jwt.verify_hs256(jwt_token, jwt_secret) if {
    not kong_jwt_verified
    jwt_token
}

jwt_payload := payload if {
    jwt_valid
    [_, payload, _] := io.jwt.decode(jwt_token)
}

# Extract user information from verified JWT
user_id := jwt_payload.sub if jwt_valid
username := jwt_payload.user.username if jwt_valid
user_roles := jwt_payload.permissions.roles if jwt_valid
user_permissions := jwt_payload.permissions.permissions if jwt_valid
user_department_id := 1 if jwt_valid  # Default department for now
user_level := 8 if jwt_valid  # Default level for admin

# Check if JWT is expired
jwt_expired := time.now_ns() > (jwt_payload.exp * 1000000000) if jwt_valid

# =============================================================================
# PUBLIC ENDPOINTS (No Authentication Required)
# =============================================================================

# Authentication endpoints - no JWT required (login)
# POST /api/auth - login (public access)
allow if {
    service_name == "rbac-service"
    route_path == "/"
    request_method in ["POST", "OPTIONS"]
}

# Health check endpoints - no authentication required
allow if {
    endswith(route_path, "/health")
    request_method == "GET"
}

# API documentation endpoints - public access
allow if {
    service_name in ["docs-service", "swagger-service"]
    request_method == "GET"
}

# CORS preflight requests - always allow
allow if {
    request_method == "OPTIONS"
}

# =============================================================================
# AUTHENTICATED ENDPOINTS (JWT Required & Valid)
# =============================================================================

# Helper function to check if user has specific permission
has_permission(permission) if {
    jwt_valid
    not jwt_expired
    user_permissions[_] == "*"  # Super admin has all permissions
}

has_permission(permission) if {
    jwt_valid
    not jwt_expired
    user_permissions[_] == permission
}

# Helper function to check if user has any of the specified permissions
has_any_permission(permissions) if {
    jwt_valid
    not jwt_expired
    permission := permissions[_]
    has_permission(permission)
}

# Helper function to check if user has specific role
has_role(role) if {
    jwt_valid
    not jwt_expired
    user_roles[_] == role
}

# =============================================================================
# RBAC SERVICE AUTHORIZATION
# =============================================================================

# Authentication endpoints using RESTful design
# GET /api/auth - get current user info (any authenticated user)
allow if {
    service_name == "rbac-service"
    route_path == "/"
    request_method == "GET"
    jwt_valid
    not jwt_expired
}

# DELETE /api/auth - logout (any authenticated user)
allow if {
    service_name == "rbac-service"
    route_path == "/"
    request_method == "DELETE"
    jwt_valid
    not jwt_expired
}

# PUT /api/auth - update auth info (any authenticated user)
allow if {
    service_name == "rbac-service"
    route_path == "/"
    request_method == "PUT"
    jwt_valid
    not jwt_expired
}

# User management endpoints - require specific permissions
allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/users")
    request_method == "GET"
    has_any_permission(["user.read", "user.read.department"])
}

allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/users")
    request_method == "POST"
    has_permission("user.create")
}

allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/users")
    request_method in ["PUT", "PATCH"]
    has_any_permission(["user.update", "user.update.department"])
}

allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/users")
    request_method == "DELETE"
    has_permission("user.delete")
}

# Role management endpoints
allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/roles")
    request_method == "GET"
    has_permission("role.read")
}

allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/roles")
    request_method == "POST"
    has_permission("role.create")
}

allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/roles")
    request_method in ["PUT", "PATCH"]
    has_permission("role.update")
}

allow if {
    service_name == "rbac-service"
    startswith(route_path, "/api/rbac/roles")
    request_method == "DELETE"
    has_permission("role.delete")
}

# =============================================================================
# DRONE SERVICE AUTHORIZATION  
# =============================================================================

# Drone service health check
allow if {
    service_name == "drone-http-service"
    route_path == "/health"
    request_method == "GET"
}

# Drone status endpoints - require drone.read permission
allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/statuses")
    request_method == "GET"
    has_any_permission(["drone.read", "drone.status.read", "*"])
}

allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/statuses")
    request_method in ["POST", "PUT", "PATCH"]
    has_any_permission(["drone.update", "drone.status.update", "*"])
}

# Drone position endpoints
allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/positions")
    request_method == "GET"
    has_any_permission(["drone.read", "drone.position.read", "*"])
}

allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/positions")
    request_method in ["POST", "PUT", "PATCH"]
    has_any_permission(["drone.update", "drone.position.update", "*"])
}

# Drone command endpoints
allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/commands")
    request_method == "GET"
    has_any_permission(["drone.read", "drone.command.read", "*"])
}

allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/commands")
    request_method == "POST"
    has_any_permission(["drone.command.create", "drone.command.all", "drone.command.emergency"])
}

allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/commands")
    request_method in ["PUT", "PATCH"]
    has_any_permission(["drone.update", "drone.command.update", "*"])
}

# Drone archive endpoints
allow if {
    service_name == "drone-http-service"
    startswith(route_path, "/archive-tasks")
    request_method == "GET"
    has_any_permission(["drone.read", "archive.read", "*"])
}

# Real-time WebSocket connections
allow if {
    service_name == "drone-websocket-service"
    startswith(route_path, "/socket.io")
    has_any_permission(["drone.read", "drone.realtime", "*"])
}

# =============================================================================
# GENERAL SERVICE AUTHORIZATION (User Preferences, etc.)
# =============================================================================

# General service health check
allow if {
    service_name == "general-service"
    route_path == "/health"
    request_method == "GET"
}

# User preferences endpoints - require preference permissions
allow if {
    service_name == "general-service"
    startswith(route_path, "/user-preferences")
    request_method == "GET"
    has_any_permission(["preference.read", "user.preference.read", "*"])
}

allow if {
    service_name == "general-service"
    startswith(route_path, "/user-preferences")
    request_method in ["POST", "PUT", "PATCH"]
    has_any_permission(["preference.create", "preference.update", "user.preference.update", "*"])
}

allow if {
    service_name == "general-service"
    startswith(route_path, "/user-preferences")
    request_method == "DELETE"
    has_any_permission(["preference.delete", "user.preference.delete", "*"])
}

# =============================================================================
# DOCS SERVICE AUTHORIZATION
# =============================================================================

# Documentation access - any authenticated user can read docs
allow if {
    service_name == "docs-http-service"
    request_method == "GET"
    jwt_valid
    not jwt_expired
}

# =============================================================================
# DECISION LOGGING AND DEBUGGING
# =============================================================================

# Generate decision reason for debugging
decision_reason := reason if {
    allow
    reason := sprintf("Access granted: service=%s, path=%s, method=%s, user=%s", [service_name, route_path, request_method, username])
}

decision_reason := reason if {
    not allow
    jwt_valid
    reason := sprintf("Access denied: service=%s, path=%s, method=%s, user=%s, permissions=%v", [service_name, route_path, request_method, username, user_permissions])
}

decision_reason := reason if {
    not allow
    not jwt_valid
    reason := sprintf("Access denied: service=%s, path=%s, method=%s, reason=invalid_or_missing_jwt", [service_name, route_path, request_method])
}

# Debug information for troubleshooting
debug_info := {
    "service": service_name,
    "path": route_path,
    "method": request_method,
    "jwt_token_present": jwt_token != "",
    "jwt_valid": jwt_valid,
    "kong_verified": kong_jwt_verified,
    "user_id": user_id,
    "username": username,
    "user_roles": user_roles,
    "user_permissions": user_permissions,
    "decision": allow,
    "reason": decision_reason
}

# =============================================================================
# LLM SERVICE AUTHORIZATION
# =============================================================================

# LLM service access - authenticated users with proper permissions
allow if {
    service_name == "llm-service"
    request_method in ["GET", "POST"]
    jwt_valid
    not jwt_expired
    user_level >= 1  # Basic access level required
}

# =============================================================================
# EMERGENCY & SPECIAL PERMISSIONS
# =============================================================================

# Emergency override permissions
allow if {
    has_permission("emergency.override")
    service_name in ["drone-service", "rbac-service"]
    request_method in ["GET", "POST", "PUT"]
}

# System administration - superadmin access
allow if {
    has_role("superadmin")
    service_name in ["rbac-service", "general-service", "docs-service"]
}

# =============================================================================
# UTILITY FUNCTIONS & METADATA
# =============================================================================

# Rate limiting exemption for admins
rate_limit_exempt if {
    has_any_permission(["*", "system.admin"])
}

# Headers to add for downstream services (if JWT is valid)
headers_to_add := {
    "X-User-ID": user_id,
    "X-Username": username,
    "X-User-Roles": concat(",", user_roles),
    "X-User-Permissions": concat(",", array.slice(user_permissions, 0, 20)),  # Limit header size
    "X-User-Department": sprintf("%v", [user_department_id]),
    "X-User-Level": sprintf("%v", [user_level]),
    "X-Auth-Method": "opa-jwt",
    "X-JWT-Valid": "true"
} if {
    jwt_valid
    not jwt_expired
}

# Audit logging requirements
requires_audit if {
    jwt_valid
    not jwt_expired
    request_method in ["POST", "PUT", "DELETE"]
    has_any_permission(["*", "audit.create"])
}

requires_audit if {
    service_name == "rbac-service"
    request_method in ["POST", "PUT", "DELETE", "PATCH"]
    jwt_valid
}

# =============================================================================
# ERROR HANDLING & DEBUGGING
# =============================================================================

# Detailed denial reasons for debugging
deny_reason := "JWT token not provided" if {
    not allow
    not jwt_token
}

deny_reason := "JWT token invalid or verification failed" if {
    not allow
    jwt_token
    not jwt_valid
}

deny_reason := "JWT token has expired" if {
    not allow
    jwt_valid
    jwt_expired
}

deny_reason := reason if {
    not allow
    jwt_valid
    not jwt_expired
    reason := sprintf("Access denied: User %v (roles: %v, permissions: %v) attempted %v %v on service %v", 
        [username, user_roles, array.slice(user_permissions, 0, 5), request_method, route_path, service_name])
}

deny_reason := "Insufficient permissions for requested operation" if {
    not allow
    jwt_valid
    not jwt_expired
}
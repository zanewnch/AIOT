# Gateway Policy for Kong Integration  
# This policy handles authentication and authorization at the API Gateway level
# Compatible with Kong's official OPA plugin input format

package aiot.gateway

import future.keywords.in
import data.aiot.common

# Default deny
default allow = false

# Extract information from Kong's official OPA plugin input format
service_name := input.service.name
route_path := input.request.path  
request_method := input.request.method
request_headers := input.request.headers

# Extract user info from JWT headers set by Kong JWT plugin
user_id := request_headers["x-consumer-custom-id"]
user_roles_str := request_headers["x-consumer-username"] 

# Authentication endpoints - no JWT required
allow {
    service_name == "rbac-service"
    startswith(route_path, "/api/auth")
    request_method in ["POST", "OPTIONS"]
}

# Health check endpoints - no authentication required
allow {
    endswith(route_path, "/health")
    request_method == "GET"
}

# Get user roles from data based on user_id
user_data := data.users[user_id]
user_roles := user_data.roles

# RBAC Service Authorization  
allow {
    service_name == "rbac-service"
    not startswith(route_path, "/api/auth")  # Exclude auth endpoints
    user_roles[_] in ["admin", "superadmin", "department_manager"]
    request_method in ["GET", "POST", "PUT", "DELETE", "PATCH"]
}

# Regular users can access their own data in RBAC service
allow {
    service_name == "rbac-service"
    route_path == "/api/rbac/me"
    user_roles[_] == "user"
    request_method == "GET"
}

# Drone Service Authorization
allow {
    service_name == "drone-service"
    user_roles[_] in ["drone_operator", "flight_controller", "drone_admin"]
    request_method in ["GET", "POST", "PUT", "DELETE"]
}

# WebSocket connections for real-time data
allow {
    service_name == "drone-service"
    startswith(route_path, "/socket.io")
    user_roles[_] in ["drone_operator", "flight_controller", "monitor_operator"]
}

# Frontend Settings Service Authorization
allow {
    service_name == "fesetting-service"
    user_roles[_] in ["user", "admin", "superadmin"]
    request_method in ["GET", "POST", "PUT", "DELETE"]
}

# LLM Service Authorization (if applicable)
allow {
    service_name == "llm-service"
    user_roles[_] in ["user", "admin", "researcher"]
    request_method in ["GET", "POST"]
}

# Kong Admin API - restricted access
allow {
    startswith(route_path, "/kong-admin")
    user_roles[_] in ["superadmin", "system_admin"]
    request_method in ["GET", "POST", "PUT", "DELETE"]
}

# Monitoring and metrics endpoints
allow {
    route_path in ["/metrics", "/prometheus", "/health", "/status"]
    user_roles[_] in ["admin", "monitor_operator", "system_admin"]
    request_method == "GET"
}

# CORS preflight requests
allow {
    request_method == "OPTIONS"
}

# Rate limiting bypass for admins
rate_limit_exempt {
    user_roles[_] in ["superadmin", "admin"]
}

# Additional context for downstream services
headers_to_add := {
    "X-User-ID": input.jwt.user.id,
    "X-User-Roles": concat(",", input.jwt.user.roles),
    "X-User-Department": input.jwt.user.departmentId,
    "X-Auth-Method": "gateway-jwt"
}

# Audit logging requirements
requires_audit {
    request_method in ["POST", "PUT", "DELETE"]
    user_roles[_] in ["admin", "superadmin"]
}

requires_audit {
    service_name == "rbac-service"
    request_method in ["POST", "PUT", "DELETE"]
}

# Reason for denial (debugging)
deny_reason := reason {
    not allow
    user_roles
    reason := sprintf("Access denied for user %v with roles %v to %v %v on service %v", [user_id, user_roles, request_method, route_path, service_name])
}

deny_reason := "User not found or no roles assigned" {
    not allow
    not user_data
}

deny_reason := "Authentication required" {
    not allow
    not user_id
}
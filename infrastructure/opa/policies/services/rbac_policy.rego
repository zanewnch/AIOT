# RBAC Service Policy
# Detailed authorization rules for RBAC service operations

package aiot.rbac

import future.keywords.in
import data.aiot.common

# Default deny
default allow = false

# RBAC Management - Superadmin only
allow {
    input.user.roles[_] == "superadmin"
}

# Admin permissions for user and role management
allow {
    input.user.roles[_] == "admin"
    input.resource in ["users", "roles", "permissions"]
    input.action in ["create", "read", "update", "delete"]
}

# Department managers can manage users in their department
allow {
    input.user.roles[_] == "department_manager"
    input.resource == "users"
    input.action in ["read", "update"]
    input.context.targetUserDepartment == input.user.departmentId
}

# Users can read their own information
allow {
    input.user.roles[_] == "user"
    input.resource == "users"
    input.action == "read"
    input.context.targetUserId == input.user.id
}

# Users can update their own profile
allow {
    input.user.roles[_] == "user"
    input.resource == "users"
    input.action == "update"
    input.context.targetUserId == input.user.id
    input.context.fields[_] in ["profile", "preferences", "password"]
}

# Auditor can read all data
allow {
    input.user.roles[_] == "auditor"
    input.action == "read"
}

# Business hours restriction for sensitive operations
allow {
    input.user.roles[_] in ["admin", "department_manager"]
    input.resource in ["roles", "permissions"]
    input.action in ["create", "update", "delete"]
    common.is_business_hours(input.context.currentTime)
}

# Emergency operations override
allow {
    input.context.emergency == true
    input.user.roles[_] == "emergency_admin"
}

# System maintenance restrictions
deny {
    common.maintenance_mode_active
    not input.user.roles[_] in ["superadmin", "system_maintainer"]
}

# Audit requirements
requires_audit {
    input.action in ["create", "delete"]
    input.resource in ["users", "roles", "permissions"]
}

requires_audit {
    input.user.roles[_] == "superadmin"
    input.action in ["delete", "update"]
}
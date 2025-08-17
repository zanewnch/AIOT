# Base Policy for AIOT System
# This file contains common policy rules and utilities used across all services

package aiot.common

import future.keywords.in

# Default deny all access unless explicitly allowed
# Note: Only gateway policy should define default allow
default requires_audit = false

# System roles hierarchy
role_hierarchy := {
    "superadmin": 10,
    "admin": 8,
    "department_manager": 6,
    "operator": 4,
    "user": 2,
    "guest": 1
}

# Common utility functions

# Check if user has minimum role level
has_minimum_role_level(user_roles, required_level) if {
    some role in user_roles
    role_hierarchy[role] >= required_level
}

# Check if user has any of the required roles
has_any_role(user_roles, required_roles) if {
    some role in user_roles
    role in required_roles
}

# Check if user has all required roles
has_all_roles(user_roles, required_roles) if {
    count(required_roles) > 0
    count(required_roles - user_roles) == 0
}

# Check if current time is within business hours
is_business_hours(current_time) if {
    timestamp := time.parse_rfc3339_ns(current_time)
    hour := (timestamp / 1000000000) % 86400 / 3600
    hour >= 8
    hour <= 18
}

# Check if current day is a weekday
is_weekday(current_time) if {
    timestamp := time.parse_rfc3339_ns(current_time)
    weekday := time.weekday(timestamp)
    weekday >= 1
    weekday <= 5
}

# Check if user is in allowed zone
is_allowed_zone(user_zone, allowed_zones) if {
    user_zone in allowed_zones
}

# Check if operation requires emergency override
is_emergency_operation(context) if {
    context.emergency == true
}

# Check if user has emergency privileges
has_emergency_privileges(user_roles) if {
    some role in user_roles
    role in ["superadmin", "emergency_responder", "admin"]
}

# Universal admin override
admin_override if {
    input.user.roles[_] in ["superadmin", "admin"]
}

# System maintenance mode check
maintenance_mode_active if {
    input.context.maintenanceMode == true
}

# During maintenance, only system administrators allowed
allow if {
    maintenance_mode_active
    input.user.roles[_] in ["superadmin", "system_maintainer"]
}

# Emergency override rule
allow if {
    is_emergency_operation(input.context)
    has_emergency_privileges(input.user.roles)
    requires_audit
}

# Audit requirements for sensitive operations
requires_audit if {
    input.user.roles[_] == "superadmin"
    input.action in ["delete", "create", "update"]
}

requires_audit if {
    is_emergency_operation(input.context)
}

requires_audit if {
    input.action == "delete"
    input.resource != "session"
}
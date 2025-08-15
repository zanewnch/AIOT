# Frontend Settings Service Policy
# Authorization rules for user preferences and settings management

package aiot.fesetting

import future.keywords.in
import data.aiot.common

# Default deny
default allow = false

# Superadmin has all permissions  
allow {
    input.user.roles[_] == "superadmin"
}

# Admin can manage all user preferences
allow {
    input.user.roles[_] == "admin" 
    input.resource == "user_preferences"
    input.action in ["create", "read", "update", "delete"]
}

# Users can manage their own preferences
allow {
    input.user.roles[_] == "user"
    input.resource == "user_preferences"
    input.action in ["read", "create", "update"]
    input.context.resourceOwnerId == input.user.id
}

# Users can create their initial preferences
allow {
    input.user.roles[_] == "user"
    input.resource == "user_preferences" 
    input.action == "create"
    input.context.userId == input.user.id
}

# Department managers can view preferences of their department users
allow {
    input.user.roles[_] == "department_manager"
    input.resource == "user_preferences"
    input.action == "read"
    input.context.targetUserDepartment == input.user.departmentId
}

# Operators can view user preferences during business hours
allow {
    input.user.roles[_] == "operator"
    input.resource == "user_preferences"
    input.action == "read"
    common.is_business_hours(input.context.currentTime)
}

# System settings management - admin only
allow {
    input.user.roles[_] in ["admin", "system_admin"]
    input.resource == "system_settings"
    input.action in ["read", "update"]
}

# Theme and UI preferences - any authenticated user
allow {
    input.user.roles[_] in ["user", "operator", "admin"]
    input.resource == "ui_preferences"
    input.action in ["read", "update"]
    input.context.resourceOwnerId == input.user.id
}

# Emergency access for emergency responders
allow {
    input.context.emergency == true
    input.user.roles[_] == "emergency_responder"
    input.resource == "user_preferences"
    input.action in ["read", "update"]
}

# Time-based restrictions for bulk operations
allow {
    input.user.roles[_] == "admin"
    input.action in ["bulk_create", "bulk_delete", "bulk_update"]
    common.is_business_hours(input.context.currentTime)
    common.is_weekday(input.context.currentTime)
}

# Location-based restrictions for sensitive operations
allow {
    input.action in ["export_data", "bulk_delete"]
    input.context.userZone in ["secure_office", "admin_zone"]
    input.user.roles[_] == "admin"
}

# System maintenance restrictions
deny {
    common.maintenance_mode_active
    not input.user.roles[_] in ["admin", "system_admin"]
}

# Night-time restrictions for non-emergency operations
deny {
    input.action in ["bulk_create", "bulk_delete", "export_data"]
    not common.is_business_hours(input.context.currentTime) 
    not input.context.emergency
    not input.user.roles[_] == "superadmin"
}

# Zone-based restrictions
deny {
    input.context.userZone in data.restricted_zones
    input.action in ["create", "update", "delete"]
    not input.user.roles[_] in ["admin", "superadmin"]
}

# Resource ownership validation
deny {
    input.resource == "user_preferences"
    input.context.resourceOwnerId != input.user.id
    not input.user.roles[_] in ["admin", "department_manager", "superadmin"]
    input.action in ["update", "delete"]
}

# Audit requirements
requires_audit {
    input.action in ["delete", "bulk_create", "bulk_delete", "export_data"]
}

requires_audit {
    input.context.emergency == true
}

requires_audit {
    input.user.roles[_] == "guest" 
}

# Required permission levels for different actions
required_level_for_action(action) := 1 {
    action in ["read", "create"]
}

required_level_for_action(action) := 2 {
    action in ["update"]
}

required_level_for_action(action) := 3 {
    action in ["delete"]  
}

required_level_for_action(action) := 5 {
    action in ["bulk_create", "bulk_delete", "export_data"]
}

# Deny if user level is insufficient
deny {
    input.user.level < required_level_for_action(input.action)
    not input.user.roles[_] in ["admin", "superadmin"]
}

# Denial reasons
denial_reason := "Insufficient role" {
    not input.user.roles
}

denial_reason := "Outside working hours" {
    input.user.roles[_] == "operator"
    not common.is_business_hours(input.context.currentTime)
}

denial_reason := "Unauthorized zone" {
    input.context.userZone in data.restricted_zones
}

denial_reason := "Resource ownership required" {
    input.context.resourceOwnerId != input.user.id
    not input.user.roles[_] in ["admin", "department_manager"]
}

denial_reason := "System maintenance mode" {
    common.maintenance_mode_active
    not input.user.roles[_] in ["admin", "system_admin"]
}
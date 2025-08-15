# Drone Service Policy  
# Authorization rules for drone operations and management

package aiot.drone

import future.keywords.in
import data.aiot.common

# Default deny
default allow = false

# Superadmin has all permissions
allow if {
    input.user.roles[_] == "superadmin"
}

# Drone admin permissions
allow if {
    input.user.roles[_] == "drone_admin"
    input.resource in ["drone_commands", "drone_positions", "drone_status", "drone_command_queue", "archive_tasks"]
    input.action in ["create", "read", "update", "delete"]
}

# Drone operator permissions
allow if {
    input.user.roles[_] == "drone_operator"
    input.resource in ["drone_commands", "drone_positions", "drone_status"]
    input.action in ["create", "read", "update"]
    
    # Operator can only control assigned drones
    assigned_operator_check
}

# Flight controller permissions
allow if {
    input.user.roles[_] == "flight_controller" 
    input.resource in ["drone_commands", "drone_real_time_status", "drone_command_queue"]
    input.action in ["create", "read", "update"]
    
    # Must have valid pilot certification
    pilot_certification_check
}

# Mission commander permissions
allow if {
    input.user.roles[_] == "mission_commander"
    input.resource in ["archive_tasks", "drone_commands_archive", "drone_command_queue"]
    input.action in ["create", "read", "update", "delete"]
    
    # Can manage tasks in their department
    input.context.taskDepartment == input.user.departmentId
}

# Maintenance technician permissions
allow if {
    input.user.roles[_] == "maintenance_technician"
    input.resource in ["drone_status", "drone_positions_archive", "drone_status_archive"]
    input.action in ["read", "update"]
    
    # Only during maintenance mode
    input.context.maintenanceMode == true
}

# Monitor operator - read only
allow if {
    input.user.roles[_] == "monitor_operator"
    input.resource in ["drone_positions", "drone_status", "drone_real_time_status"]
    input.action == "read"
}

# Emergency operations
allow if {
    input.context.emergency == true
    input.user.roles[_] in ["emergency_responder", "flight_controller"]
    input.resource in ["drone_commands", "drone_command_queue"]
    input.action in ["create", "update"]
}

# Helper rules
assigned_operator_check if {
    data.drones[input.context.droneId].assignedOperator == input.user.id
}

assigned_operator_check if {
    input.context.assignedOperator == input.user.id
}

pilot_certification_check if {
    pilot := data.pilots[input.user.id]
    pilot.certified == true
    pilot.license_expiry > input.context.currentTime
}

# Safety restrictions - Weather conditions
deny if {
    input.resource == "drone_commands"
    input.action == "create"
    input.context.weatherCondition in ["storm", "heavy_rain", "strong_wind"]
    not input.context.emergency
}

# Safety restrictions - Battery level
deny if {
    input.resource == "drone_commands" 
    input.action == "create"
    input.context.batteryLevel < 20
    not input.context.emergency
}

# Safety restrictions - Maintenance mode
deny if {
    input.resource in ["drone_commands", "drone_command_queue"]
    input.action in ["create", "update"]
    input.context.droneMaintenanceMode == true
    count([role | role := input.user.roles[_]; role in ["maintenance_technician", "superadmin"]]) == 0
}

# Geo-fencing restrictions
deny if {
    input.resource == "drone_commands"
    input.action == "create"
    target_zone := input.context.targetZone
    target_zone in data.restricted_flight_zones
    not input.context.emergency
}

# Time restrictions - Night flight requires special certification
deny if {
    input.resource == "drone_commands"
    input.action == "create"
    night_flight_check
    not pilot_has_night_certification
    not input.context.emergency
}

night_flight_check if {
    timestamp := time.parse_rfc3339_ns(input.context.currentTime)
    hour := (timestamp / 1000000000) % 86400 / 3600
    hour < 6
}

night_flight_check if {
    timestamp := time.parse_rfc3339_ns(input.context.currentTime)
    hour := (timestamp / 1000000000) % 86400 / 3600
    hour > 20
}

pilot_has_night_certification if {
    pilot := data.pilots[input.user.id]
    "night_flight" in pilot.certifications
}

# Audit requirements
requires_audit if {
    input.resource in ["drone_commands", "archive_tasks"]
    input.action in ["create", "delete"]
}

requires_audit if {
    input.context.emergency == true
}

requires_audit if {
    input.resource == "drone_commands"
    input.context.targetZone in data.sensitive_zones
}

# Denial reasons for better debugging
denial_reason := reason if {
    input.context.weatherCondition in ["storm", "heavy_rain", "strong_wind"]
    not input.context.emergency
    reason := "Flight not allowed due to weather conditions"
} else := reason if {
    input.context.batteryLevel < 20
    not input.context.emergency
    reason := "Insufficient battery level for flight operations"
} else := reason if {
    input.context.droneMaintenanceMode == true
    count([role | role := input.user.roles[_]; role in ["maintenance_technician", "superadmin"]]) == 0
    reason := "Drone is in maintenance mode"
} else := "Access denied by drone policy"
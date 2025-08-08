# Gateway Policy Tests
# Unit tests for the gateway authorization policies

package aiot.gateway

# Test data
test_admin_user := {
    "user": {
        "id": 1,
        "username": "admin",
        "roles": ["admin"]
    },
    "route": {
        "service": {
            "name": "rbac-service"
        },
        "path": "/api/rbac/users"
    },
    "request": {
        "method": "GET"
    },
    "jwt": {
        "user": {
            "id": 1,
            "roles": ["admin"]
        }
    }
}

test_drone_operator_user := {
    "user": {
        "id": 4,
        "username": "pilot_001",
        "roles": ["drone_operator"]
    },
    "route": {
        "service": {
            "name": "drone-service"
        },
        "path": "/api/drone/commands"
    },
    "request": {
        "method": "GET"
    },
    "jwt": {
        "user": {
            "id": 4,
            "roles": ["drone_operator"]
        }
    }
}

test_regular_user := {
    "user": {
        "id": 9,
        "username": "regular_user",
        "roles": ["user"]
    },
    "route": {
        "service": {
            "name": "fesetting-service"
        },
        "path": "/api/user-preferences"
    },
    "request": {
        "method": "GET"
    },
    "jwt": {
        "user": {
            "id": 9,
            "roles": ["user"]
        }
    }
}

# Test Cases

# Test admin access to RBAC service
test_admin_rbac_access {
    allow with input as test_admin_user
}

# Test drone operator access to drone service  
test_drone_operator_access {
    allow with input as test_drone_operator_user
}

# Test user access to frontend settings
test_user_fesetting_access {
    allow with input as test_regular_user
}

# Test authentication endpoint access (should allow without JWT)
test_auth_endpoint_access {
    allow with input as {
        "route": {
            "service": {
                "name": "rbac-service"
            },
            "path": "/api/auth/login"
        },
        "request": {
            "method": "POST"
        }
    }
}

# Test health check endpoint access
test_health_check_access {
    allow with input as {
        "route": {
            "service": {
                "name": "rbac-service"
            },
            "path": "/api/health"
        },
        "request": {
            "method": "GET"
        }
    }
}

# Test CORS preflight requests
test_cors_preflight {
    allow with input as {
        "request": {
            "method": "OPTIONS"
        }
    }
}

# Test unauthorized access denial
test_unauthorized_access_denied {
    not allow with input as {
        "user": {
            "id": 9,
            "username": "regular_user", 
            "roles": ["user"]
        },
        "route": {
            "service": {
                "name": "rbac-service"
            },
            "path": "/api/rbac/users"
        },
        "request": {
            "method": "DELETE"
        },
        "jwt": {
            "user": {
                "id": 9,
                "roles": ["user"]
            }
        }
    }
}

# Test WebSocket connection access
test_websocket_access {
    allow with input as {
        "route": {
            "service": {
                "name": "drone-service"  
            },
            "path": "/socket.io/connect"
        },
        "request": {
            "method": "GET"
        },
        "jwt": {
            "user": {
                "id": 4,
                "roles": ["drone_operator"]
            }
        }
    }
}

# Test rate limit exemption for admins
test_admin_rate_limit_exempt {
    rate_limit_exempt with input as {
        "jwt": {
            "user": {
                "roles": ["admin"]
            }
        }
    }
}

# Test audit requirement for sensitive operations  
test_audit_required_for_delete {
    requires_audit with input as {
        "request": {
            "method": "DELETE"
        },
        "jwt": {
            "user": {
                "roles": ["admin"]
            }
        }
    }
}
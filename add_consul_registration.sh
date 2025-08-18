#!/bin/bash

# 為所有微服務添加 Consul 註冊功能

services=(
    "rbac-service:3051:rbac,authorization,roles,permissions"
    "drone-service:3052:drone,iot,telemetry,positions"
    "general-service:3053:general,utilities,preferences"
    "docs-service:3054:docs,documentation,api"
    "drone-websocket-service:3004:websocket,realtime,drone"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r service_name port tags <<< "$service_info"
    
    echo "Processing $service_name..."
    
    # 複製 ConsulService.ts 如果不存在
    if [ ! -f "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts" ]; then
        cp "/home/user/GitHub/AIOT/microServices/auth-service/src/services/ConsulService.ts" \
           "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    fi
    
    # 更新 ConsulService.ts 中的配置
    sed -i "s/id: 'auth-service'/id: '$service_name'/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    sed -i "s/name: 'auth-service'/name: '$service_name'/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    sed -i "s/aiot-auth-service/aiot-$service_name/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    sed -i "s/3055/$port/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    sed -i "s/'auth', 'authentication', 'login'/'$tags'/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    
    echo "✅ Updated $service_name ConsulService.ts"
done

echo "🎉 All services updated with Consul registration!"
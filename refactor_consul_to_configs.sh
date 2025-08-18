#!/bin/bash

services=(
    "auth-service"
    "rbac-service" 
    "drone-service"
    "general-service"
    "docs-service"
    "drone-websocket-service"
    "gateway-service"
)

echo "🔄 重構 ConsulService 到 configs 資料夾..."

for service in "${services[@]}"; do
    service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "Processing $service..."
    
    # 1. 移動和重命名檔案
    if [ -f "$service_path/services/ConsulService.ts" ]; then
        # 確保 configs 目錄存在
        mkdir -p "$service_path/configs"
        
        # 移動並重命名檔案
        mv "$service_path/services/ConsulService.ts" "$service_path/configs/consulConfig.ts"
        echo "  ✅ Moved ConsulService.ts to configs/consulConfig.ts"
        
        # 2. 更新檔案內容中的類名和註釋
        sed -i 's/export class ConsulService/export class ConsulConfig/g' "$service_path/configs/consulConfig.ts"
        sed -i 's/ConsulService/ConsulConfig/g' "$service_path/configs/consulConfig.ts"
        sed -i 's/@fileoverview Consul 服務註冊和發現/@fileoverview Consul 配置和服務註冊/g' "$service_path/configs/consulConfig.ts"
        echo "  ✅ Updated class name to ConsulConfig"
        
        # 3. 更新 app.ts 中的 import 路徑和使用
        if [ -f "$service_path/app.ts" ]; then
            sed -i "s/import { ConsulService } from '.\/services\/ConsulService.js'/import { ConsulConfig } from '.\/configs\/consulConfig.js'/g" "$service_path/app.ts"
            sed -i 's/private consulService: ConsulService/private consulConfig: ConsulConfig/g' "$service_path/app.ts"
            sed -i 's/this.consulService = new ConsulService()/this.consulConfig = new ConsulConfig()/g' "$service_path/app.ts"
            sed -i 's/this.consulService.registerService()/this.consulConfig.registerService()/g' "$service_path/app.ts"
            sed -i 's/if (this.consulService)/if (this.consulConfig)/g' "$service_path/app.ts"
            sed -i 's/this.consulService.deregisterService()/this.consulConfig.deregisterService()/g' "$service_path/app.ts"
            echo "  ✅ Updated app.ts imports and usage"
        fi
        
    else
        echo "  ⚠️  ConsulService.ts not found in $service"
    fi
done

echo "🎉 重構完成！所有 ConsulService 已改為 ConsulConfig 並移至 configs 資料夾"
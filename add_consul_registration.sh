#!/bin/bash

# ========================================
# AIOT 微服務 Consul 註冊功能批量配置腳本
# ========================================
#
# 功能說明：
# 1. 為所有微服務自動添加 Consul 服務發現和註冊功能
# 2. 基於 auth-service 的 ConsulService.ts 模板進行批量複製和配置
# 3. 自動化配置每個服務的專屬 ID、端口和標籤
#
# 使用場景：
# - 在微服務架構中實現服務自動發現
# - 統一配置所有服務的 Consul 註冊資訊
# - 避免手動逐一配置每個微服務的重複工作
#
# 執行條件：
# - 需要 auth-service 中已存在 ConsulService.ts 模板文件
# - 各微服務的 src/services 目錄必須已存在
# ========================================

# 定義所有需要配置 Consul 註冊的微服務
# 格式: "服務名稱:端口號:標籤列表"
# 標籤用於 Consul 服務發現時的分類和過濾
services=(
    "rbac-service:3051:rbac,authorization,roles,permissions"        # RBAC 權限管理服務
    "drone-service:3052:drone,iot,telemetry,positions"             # 無人機數據服務
    "general-service:3053:general,utilities,preferences"           # 通用功能服務
    "drone-websocket-service:3004:websocket,realtime,drone"        # 無人機 WebSocket 服務
)

# 遍歷每個服務進行 Consul 配置
for service_info in "${services[@]}"; do
    # 使用冒號分隔符解析服務資訊
    # IFS 設定分隔符，read 將字串分割為三個變數
    IFS=':' read -r service_name port tags <<< "$service_info"
    
    echo "Processing $service_name..."
    
    # ====================================
    # 步驟 1: 複製 ConsulService.ts 模板文件
    # ====================================
    # 檢查目標服務是否已有 ConsulService.ts
    # 如果不存在，則從 auth-service 複製模板
    if [ ! -f "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts" ]; then
        echo "  📋 Copying ConsulService.ts template from auth-service..."
        cp "/home/user/GitHub/AIOT/microServices/auth-service/src/services/ConsulService.ts" \
           "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
        echo "  ✅ ConsulService.ts template copied successfully"
    else
        echo "  ℹ️  ConsulService.ts already exists, updating configuration..."
    fi
    
    # ====================================
    # 步驟 2: 客製化 Consul 服務註冊配置
    # ====================================
    echo "  🔧 Customizing Consul configuration for $service_name..."
    
    # 2.1 更新服務 ID (用於 Consul 中唯一識別此服務實例)
    sed -i "s/id: 'auth-service'/id: '$service_name'/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    
    # 2.2 更新服務名稱 (用於服務發現時的邏輯名稱)
    sed -i "s/name: 'auth-service'/name: '$service_name'/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    
    # 2.3 更新 Docker 容器名稱模式 (用於 Docker 環境中的服務發現)
    sed -i "s/aiot-auth-service/aiot-$service_name/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    
    # 2.4 更新服務端口號 (替換預設的 3055 為實際服務端口)
    sed -i "s/3055/$port/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    
    # 2.5 更新服務標籤 (用於 Consul 服務分類和查詢過濾)
    # 將 auth 服務的標籤替換為當前服務的專屬標籤
    sed -i "s/'auth', 'authentication', 'login'/'$tags'/g" \
        "/home/user/GitHub/AIOT/microServices/$service_name/src/services/ConsulService.ts"
    
    echo "  ✅ Updated $service_name ConsulService.ts with:"
    echo "     - Service ID: $service_name"
    echo "     - Port: $port"
    echo "     - Tags: $tags"
done

echo ""
echo "🎉 All services updated with Consul registration!"
echo ""
echo "📋 配置完成摘要："
echo "   ✅ ${#services[@]} 個微服務已完成 Consul 註冊配置"
echo "   ✅ 每個服務都有專屬的 ID、端口和標籤"
echo "   ✅ 服務可透過 Consul 進行自動發現和健康檢查"
echo ""
echo "🚀 下一步："
echo "   1. 確保 Consul 服務已啟動"
echo "   2. 啟動各微服務以測試 Consul 註冊功能"
echo "   3. 通過 Consul UI (通常在 http://localhost:8500) 檢查服務註冊狀態"
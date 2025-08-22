#!/bin/bash

# ========================================
# AIOT 微服務架構重構腳本 - Consul 服務配置模組化
# ========================================
#
# 重構目標：
# 1. 將 ConsulService 從 services 目錄重構到 configs 目錄
# 2. 重新命名類別從 ConsulService 到 ConsulConfig
# 3. 更新所有相關的 import 路徑和變數引用
# 4. 實現更清晰的程式碼架構分離：服務邏輯 vs 配置管理
#
# 架構優化理念：
# - configs/: 存放配置相關的類別和常數
# - services/: 存放業務邏輯服務類別
# - 提高程式碼的可維護性和可讀性
#
# 影響範圍：
# - 所有微服務的 ConsulService.ts 檔案位置和命名
# - app.ts 中的 import 語句和變數引用
# - 統一程式碼架構規範
# ========================================

# 定義需要重構的所有微服務
# 包含所有已實作 Consul 註冊功能的服務
services=(
    "auth-service"              # 身份認證服務
    "rbac-service"              # 角色權限管理服務
    "drone-service"             # 無人機數據服務
    "general-service"           # 通用功能服務
    "drone-websocket-service"   # 無人機 WebSocket 實時服務
    "gateway-service"           # API 閘道服務
)

echo "🔄 開始重構 ConsulService 到 configs 資料夾..."
echo "📋 將重構 ${#services[@]} 個微服務的 Consul 配置模組"
echo ""

# 遍歷每個微服務進行重構
for service in "${services[@]}"; do
    # 設定當前服務的源碼路徑
    service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 Processing $service..."
    
    # ====================================
    # 步驟 1: 檔案移動和重命名操作
    # ====================================
    # 檢查原始 ConsulService.ts 是否存在於 services 目錄
    if [ -f "$service_path/services/ConsulService.ts" ]; then
        echo "  📁 Found ConsulService.ts in services directory"
        
        # 1.1 確保目標 configs 目錄存在
        # 如果不存在則創建，避免移動檔案時出錯
        echo "  📂 Ensuring configs directory exists..."
        mkdir -p "$service_path/configs"
        
        # 1.2 執行檔案移動和重命名
        # ConsulService.ts -> consulConfig.ts (遵循 camelCase 命名規範)
        echo "  📦 Moving and renaming file..."
        mv "$service_path/services/ConsulService.ts" "$service_path/configs/consulConfig.ts"
        echo "  ✅ Moved ConsulService.ts to configs/consulConfig.ts"
        
        # ====================================
        # 步驟 2: 檔案內容重構 - 類別和註釋更新
        # ====================================
        echo "  🔄 Refactoring file content..."
        
        # 2.1 更新類別名稱：ConsulService -> ConsulConfig
        # 更符合配置管理的語義角色
        sed -i 's/export class ConsulService/export class ConsulConfig/g' "$service_path/configs/consulConfig.ts"
        
        # 2.2 更新檔案內所有 ConsulService 引用為 ConsulConfig
        # 包含變數名稱、註釋中的引用等
        sed -i 's/ConsulService/ConsulConfig/g' "$service_path/configs/consulConfig.ts"
        
        # 2.3 更新檔案頂部的 @fileoverview 註釋
        # 調整註釋以反映新的角色定位
        sed -i 's/@fileoverview Consul 服務註冊和發現/@fileoverview Consul 配置和服務註冊/g' "$service_path/configs/consulConfig.ts"
        
        echo "  ✅ Updated class name to ConsulConfig and related references"
        
        # ====================================
        # 步驟 3: 更新 app.ts 中的相依性注入和使用
        # ====================================
        # 檢查 app.ts 是否存在，並更新其中的 import 和使用方式
        if [ -f "$service_path/app.ts" ]; then
            echo "  🔗 Updating app.ts dependencies..."
            
            # 3.1 更新 import 語句路徑和類別名稱
            # 從 ./services/ConsulService.js -> ./configs/consulConfig.js
            sed -i "s/import { ConsulService } from '.\/services\/ConsulService.js'/import { ConsulConfig } from '.\/configs\/consulConfig.js'/g" "$service_path/app.ts"
            
            # 3.2 更新類別屬性宣告
            # private consulService: ConsulService -> private consulConfig: ConsulConfig
            sed -i 's/private consulService: ConsulService/private consulConfig: ConsulConfig/g' "$service_path/app.ts"
            
            # 3.3 更新建構子中的實例化
            # this.consulService = new ConsulService() -> this.consulConfig = new ConsulConfig()
            sed -i 's/this.consulService = new ConsulService()/this.consulConfig = new ConsulConfig()/g' "$service_path/app.ts"
            
            # 3.4 更新服務註冊方法呼叫
            # this.consulService.registerService() -> this.consulConfig.registerService()
            sed -i 's/this.consulService.registerService()/this.consulConfig.registerService()/g' "$service_path/app.ts"
            
            # 3.5 更新條件判斷中的引用
            # if (this.consulService) -> if (this.consulConfig)
            sed -i 's/if (this.consulService)/if (this.consulConfig)/g' "$service_path/app.ts"
            
            # 3.6 更新服務註銷方法呼叫
            # this.consulService.deregisterService() -> this.consulConfig.deregisterService()
            sed -i 's/this.consulService.deregisterService()/this.consulConfig.deregisterService()/g' "$service_path/app.ts"
            
            echo "  ✅ Updated app.ts imports and all usage references"
        else
            echo "  ⚠️  app.ts not found in $service - skipping app.ts updates"
        fi
        
        echo "  🎉 Successfully refactored $service"
        
    else
        echo "  ⚠️  ConsulService.ts not found in $service/src/services"
        echo "  ℹ️  This service may not have Consul integration yet"
    fi
    
    echo ""
done

echo "🎉 重構完成！所有 ConsulService 已改為 ConsulConfig 並移至 configs 資料夾"
echo ""
echo "📋 重構結果摘要："
echo "   ✅ 檔案位置: services/ConsulService.ts -> configs/consulConfig.ts"
echo "   ✅ 類別名稱: ConsulService -> ConsulConfig"
echo "   ✅ 更新所有 app.ts 中的 import 路徑和變數引用"
echo "   ✅ 實現清晰的架構分離：配置管理 vs 業務邏輯"
echo ""
echo "🚀 重構後的架構優勢："
echo "   📂 configs/ - 專門存放配置相關的類別和常數"
echo "   📂 services/ - 專注於業務邏輯服務的實作"
echo "   🔧 提高程式碼的可維護性和可讀性"
echo "   📝 更清晰的職責分離和模組化設計"
echo ""
echo "⚠️  注意事項："
echo "   🔍 請檢查是否有其他檔案引用了舊的 ConsulService"
echo "   🧪 建議執行測試確保所有服務正常啟動和註冊"
echo "   📖 更新相關文檔以反映新的檔案結構"
#!/bin/bash

# 重構 API 架構為統一的 controllers-services-repos 命名規範
# 作者：AIOT Team
# 日期：$(date +%Y-%m-%d)

echo "🚀 開始重構 API 架構為 controllers-services-repos 模式..."

# 定義微服務列表
SERVICES=(
    "auth-service"
    "rbac-service" 
    "drone-service"
    "drone-websocket-service"
    "general-service"
    "gateway-service"
    "scheduler-service"
    "archive-consumer-service"
)

# 重構函數：重命名 Services
rename_services() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 重構 $service 的 Services..."
    
    # 批量重命名 Service 文件
    find "$service_path" -name "*Svc.ts" -type f | while read file; do
        local dir=$(dirname "$file")
        local filename=$(basename "$file")
        
        # 將 *Svc.ts 重命名為 *Service.ts
        local new_filename=$(echo "$filename" | sed 's/Svc\.ts$/Service.ts/')
        
        if [[ "$filename" != "$new_filename" ]]; then
            echo "  📝 $filename -> $new_filename"
            mv "$file" "$dir/$new_filename"
            
            # 更新文件內的 class 名稱
            sed -i "s/export class \([A-Za-z]*\)Svc/export class \1Service/g" "$dir/$new_filename"
        fi
    done
}

# 重構函數：重命名 Repositories  
rename_repositories() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 重構 $service 的 Repositories..."
    
    # 檢查是否有 repositories 目錄，如果沒有則創建
    if [[ ! -d "$service_path/repositories" ]]; then
        mkdir -p "$service_path/repositories/queries"
        mkdir -p "$service_path/repositories/commands"
        echo "  📁 創建 repositories 目錄"
    fi
    
    # 批量重命名 Repository 文件
    find "$service_path" -name "*Repo.ts" -type f | while read file; do
        local dir=$(dirname "$file")
        local filename=$(basename "$file")
        
        # 將 *Repo.ts 重命名為 *Repository.ts
        local new_filename=$(echo "$filename" | sed 's/Repo\.ts$/Repository.ts/')
        
        if [[ "$filename" != "$new_filename" ]]; then
            echo "  📝 $filename -> $new_filename"
            mv "$file" "$dir/$new_filename"
            
            # 更新文件內的 class 名稱
            sed -i "s/export class \([A-Za-z]*\)Repo/export class \1Repository/g" "$dir/$new_filename"
        fi
    done
}

# 重構函數：重命名 Controllers
rename_controllers() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 重構 $service 的 Controllers..."
    
    # 批量重命名 Controller 文件
    find "$service_path" -name "*Ctrl.ts" -type f | while read file; do
        local dir=$(dirname "$file")
        local filename=$(basename "$file")
        
        # 將 *Ctrl.ts 重命名為 *Controller.ts
        local new_filename=$(echo "$filename" | sed 's/Ctrl\.ts$/Controller.ts/')
        
        if [[ "$filename" != "$new_filename" ]]; then
            echo "  📝 $filename -> $new_filename"
            mv "$file" "$dir/$new_filename"
            
            # 更新文件內的 class 名稱
            sed -i "s/export class \([A-Za-z]*\)Ctrl/export class \1Controller/g" "$dir/$new_filename"
        fi
    done
}

# 更新導入引用
update_imports() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的導入引用..."
    
    # 更新所有 TypeScript 文件中的導入引用
    find "$service_path" -name "*.ts" -type f -exec sed -i \
        -e 's/from.*\([A-Za-z]*\)Svc/from.*\1Service/g' \
        -e 's/from.*\([A-Za-z]*\)Repo/from.*\1Repository/g' \
        -e 's/from.*\([A-Za-z]*\)Ctrl/from.*\1Controller/g' \
        -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
        -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
        -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' {} \;
}

# 更新測試文件
update_test_files() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service"
    
    echo "🔧 更新 $service 的測試文件..."
    
    # 重命名測試文件
    find "$service_path" -name "*.test.ts" -type f | while read file; do
        local dir=$(dirname "$file")
        local filename=$(basename "$file")
        
        local new_filename=$(echo "$filename" | \
            sed 's/Svc\.test\.ts$/Service.test.ts/' | \
            sed 's/Repo\.test\.ts$/Repository.test.ts/' | \
            sed 's/Ctrl\.test\.ts$/Controller.test.ts/')
        
        if [[ "$filename" != "$new_filename" ]]; then
            echo "  📝 測試文件: $filename -> $new_filename"
            mv "$file" "$dir/$new_filename"
        fi
    done
    
    # 更新測試文件內容
    find "$service_path" -name "*.test.ts" -type f -exec sed -i \
        -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
        -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
        -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' {} \;
}

# 更新類型定義文件
update_type_definitions() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的類型定義..."
    
    # 更新類型文件中的接口命名
    find "$service_path/types" -name "*.ts" -type f 2>/dev/null | while read file; do
        sed -i \
            -e 's/I\([A-Za-z]*\)Svc/I\1Service/g' \
            -e 's/I\([A-Za-z]*\)Repo/I\1Repository/g' \
            -e 's/I\([A-Za-z]*\)Ctrl/I\1Controller/g' "$file"
    done
}

# 更新 index.ts 導出文件
update_index_files() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的 index.ts 文件..."
    
    find "$service_path" -name "index.ts" -type f -exec sed -i \
        -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
        -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
        -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
        -e "s/from '\.\\/\([A-Za-z]*\)Svc'/from '.\/\1Service'/g" \
        -e "s/from '\.\\/\([A-Za-z]*\)Repo'/from '.\/\1Repository'/g" \
        -e "s/from '\.\\/\([A-Za-z]*\)Ctrl'/from '.\/\1Controller'/g" {} \;
}

# 主要執行流程
main() {
    echo "📋 將要重構的服務: ${SERVICES[@]}"
    echo ""
    
    for service in "${SERVICES[@]}"; do
        local service_path="/home/user/GitHub/AIOT/microServices/$service"
        
        if [[ -d "$service_path" ]]; then
            echo "🎯 開始重構 $service..."
            
            # 執行重構步驟
            rename_services "$service"
            rename_repositories "$service" 
            rename_controllers "$service"
            update_imports "$service"
            update_test_files "$service"
            update_type_definitions "$service"
            update_index_files "$service"
            
            echo "✅ $service 重構完成"
            echo ""
        else
            echo "⚠️  服務目錄不存在: $service_path"
        fi
    done
    
    echo "🎉 所有服務重構完成！"
    echo ""
    echo "📝 建議接下來的步驟："
    echo "1. 運行 TypeScript 編譯檢查: npm run build"
    echo "2. 運行單元測試: npm test" 
    echo "3. 檢查服務是否正常啟動"
}

# 執行腳本
main "$@"
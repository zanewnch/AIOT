#!/bin/bash

# 更新重構後的導入和類型定義
# 確保所有引用都正確更新為新的命名約定

echo "🔄 開始更新導入和類型定義..."

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

# 更新容器類型定義
update_container_types() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service"
    
    echo "🔧 更新 $service 的容器類型定義..."
    
    # 更新 types.ts 文件中的符號定義
    local types_file="$service_path/src/container/types.ts"
    if [[ -f "$types_file" ]]; then
        echo "  📝 更新 $service/src/container/types.ts"
        
        # 更新 Service 類型符號
        sed -i \
            -e 's/\([A-Za-z]*\)Svc:/\1Service:/g' \
            -e 's/\([A-Za-z]*\)Repo:/\1Repository:/g' \
            -e 's/\([A-Za-z]*\)Ctrl:/\1Controller:/g' \
            "$types_file"
    fi
    
    # 更新 inversify.config.ts 文件
    local config_file="$service_path/src/container/inversify.config.ts"
    if [[ -f "$config_file" ]]; then
        echo "  📝 更新 $service/src/container/inversify.config.ts"
        
        sed -i \
            -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
            -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
            -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
            "$config_file"
    fi
}

# 更新路由文件
update_route_files() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的路由文件..."
    
    find "$service_path/routes" -name "*.ts" -type f 2>/dev/null | while read file; do
        echo "  📝 更新路由文件: $(basename "$file")"
        
        sed -i \
            -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
            -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
            -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
            -e "s/from '\.\/.*.Svc'/from '.\/.*Service'/g" \
            -e "s/from '\.\/.*.Repo'/from '.\/.*Repository'/g" \
            -e "s/from '\.\/.*.Ctrl'/from '.\/.*Controller'/g" \
            "$file"
    done
}

# 更新 gRPC 服務文件
update_grpc_services() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的 gRPC 服務文件..."
    
    # 更新 gRPC 服務實現文件
    find "$service_path" -name "*Service.ts" -path "*/grpc/*" -type f 2>/dev/null | while read file; do
        echo "  📝 更新 gRPC 服務: $(basename "$file")"
        
        sed -i \
            -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
            -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
            -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
            "$file"
    done
}

# 更新 server.ts 主文件
update_server_files() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的服務器文件..."
    
    local server_files=("$service_path/server.ts" "$service_path/server-grpc.ts")
    
    for server_file in "${server_files[@]}"; do
        if [[ -f "$server_file" ]]; then
            echo "  📝 更新 $(basename "$server_file")"
            
            sed -i \
                -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
                -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
                -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
                "$server_file"
        fi
    done
}

# 更新介面定義文件
update_interface_files() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 更新 $service 的介面定義..."
    
    # 更新 interfaces 目錄
    find "$service_path/interfaces" -name "*.ts" -type f 2>/dev/null | while read file; do
        echo "  📝 更新介面文件: $(basename "$file")"
        
        sed -i \
            -e 's/export interface I\([A-Za-z]*\)Svc/export interface I\1Service/g' \
            -e 's/export interface I\([A-Za-z]*\)Repo/export interface I\1Repository/g' \
            -e 's/export interface I\([A-Za-z]*\)Ctrl/export interface I\1Controller/g' \
            -e 's/I\([A-Za-z]*\)Svc/I\1Service/g' \
            -e 's/I\([A-Za-z]*\)Repo/I\1Repository/g' \
            -e 's/I\([A-Za-z]*\)Ctrl/I\1Controller/g' \
            "$file"
    done
}

# 更新 package.json 腳本（如果需要）
update_package_scripts() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service"
    
    local package_file="$service_path/package.json"
    if [[ -f "$package_file" ]]; then
        echo "🔧 檢查 $service 的 package.json..."
        
        # 檢查是否有需要更新的腳本引用
        if grep -q "Svc\|Repo\|Ctrl" "$package_file"; then
            echo "  📝 更新 package.json 中的引用"
            sed -i \
                -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
                -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
                -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
                "$package_file"
        fi
    fi
}

# 檢查並修復任何遺漏的引用
fix_remaining_references() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 中遺漏的引用..."
    
    # 使用 grep 查找所有遺漏的舊命名引用
    local old_refs=$(find "$service_path" -name "*.ts" -type f -exec grep -l "Svc\|Repo\|Ctrl" {} \; 2>/dev/null)
    
    if [[ -n "$old_refs" ]]; then
        echo "  ⚠️  發現遺漏的引用，正在修復..."
        
        while IFS= read -r file; do
            echo "    📝 修復文件: $(basename "$file")"
            sed -i \
                -e 's/\([A-Za-z]*\)Svc/\1Service/g' \
                -e 's/\([A-Za-z]*\)Repo/\1Repository/g' \
                -e 's/\([A-Za-z]*\)Ctrl/\1Controller/g' \
                "$file"
        done <<< "$old_refs"
    else
        echo "    ✅ 沒有發現遺漏的引用"
    fi
}

# 主執行流程
main() {
    echo "📋 將要更新的服務: ${SERVICES[@]}"
    echo ""
    
    for service in "${SERVICES[@]}"; do
        local service_path="/home/user/GitHub/AIOT/microServices/$service"
        
        if [[ -d "$service_path" ]]; then
            echo "🎯 開始更新 $service..."
            
            update_container_types "$service"
            update_route_files "$service"
            update_grpc_services "$service"  
            update_server_files "$service"
            update_interface_files "$service"
            update_package_scripts "$service"
            fix_remaining_references "$service"
            
            echo "✅ $service 更新完成"
            echo ""
        else
            echo "⚠️  服務目錄不存在: $service_path"
        fi
    done
    
    echo "🎉 所有服務導入和類型定義更新完成！"
    echo ""
    echo "📝 接下來建議執行："
    echo "1. 檢查 TypeScript 編譯: npm run build"
    echo "2. 運行 linting: npm run lint"
    echo "3. 執行測試: npm test"
}

# 執行腳本
main "$@"
#!/bin/bash

# 修復重構過程中產生的語法錯誤
echo "🔧 開始修復重構錯誤..."

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

# 修復導入語句中的錯誤
fix_import_statements() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 的導入語句..."
    
    find "$service_path" -name "*.ts" -type f | while read file; do
        # 修復錯誤的導入語句格式
        sed -i \
            -e "s/from '\([^']*\)Service'/from '\1Service'/g" \
            -e "s/from '\([^']*\)Repository'/from '\1Repository'/g" \
            -e "s/from '\([^']*\)Controller'/from '\1Controller'/g" \
            -e '/from.*Service.*Service/s/Service.*Service/Service/g' \
            -e '/from.*Repository.*Repository/s/Repository.*Repository/Repository/g' \
            -e '/from.*Controller.*Controller/s/Controller.*Controller/Controller/g' \
            "$file"
    done
}

# 修復重複的導入和錯誤的字符串
fix_broken_strings() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 的字符串錯誤..."
    
    find "$service_path" -name "*.ts" -type f | while read file; do
        # 修復被破壞的字符串和標識符
        sed -i \
            -e 's/ServiceService/Service/g' \
            -e 's/RepositoryRepository/Repository/g' \
            -e 's/ControllerController/Controller/g' \
            -e 's/ServiceRepository/Service/g' \
            -e 's/RepositoryService/Repository/g' \
            -e 's/ControllerService/Controller/g' \
            -e 's/ServiceController/Service/g' \
            -e 's/RepositoryController/Repository/g' \
            -e 's/ControllerRepository/Controller/g' \
            "$file"
    done
}

# 修復容器類型定義中的重複項
fix_container_types() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 的容器類型定義..."
    
    local types_file="$service_path/container/types.ts"
    if [[ -f "$types_file" ]]; then
        # 移除重複的符號定義
        awk '!seen[$0]++' "$types_file" > "$types_file.tmp" && mv "$types_file.tmp" "$types_file"
        
        # 修復對象字面量中的重複屬性
        sed -i '/^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*:[[:space:]]*Symbol/N;s/\n[[:space:]]*[A-Za-z_][A-Za-z0-9_]*:[[:space:]]*Symbol[^,]*,//g' "$types_file"
    fi
}

# 修復注入裝飾器語法
fix_inject_decorators() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 的注入裝飾器..."
    
    find "$service_path" -name "*.ts" -type f | while read file; do
        # 修復被破壞的 @inject 裝飾器
        sed -i \
            -e 's/@inject(TYPES\.\([A-Za-z]*\)Service.*Service)/@inject(TYPES.\1Service)/g' \
            -e 's/@inject(TYPES\.\([A-Za-z]*\)Repository.*Repository)/@inject(TYPES.\1Repository)/g' \
            -e 's/@inject(TYPES\.\([A-Za-z]*\)Controller.*Controller)/@inject(TYPES.\1Controller)/g' \
            "$file"
    done
}

# 修復導出語句
fix_export_statements() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 的導出語句..."
    
    find "$service_path" -name "index.ts" -type f | while read file; do
        # 修復導出語句中的重複命名
        sed -i \
            -e 's/ServiceService/Service/g' \
            -e 's/RepositoryRepository/Repository/g' \
            -e 's/ControllerController/Controller/g' \
            -e "s/export { \([A-Za-z]*\)Service.*Service }/export { \1Service }/g" \
            -e "s/export { \([A-Za-z]*\)Repository.*Repository }/export { \1Repository }/g" \
            -e "s/export { \([A-Za-z]*\)Controller.*Controller }/export { \1Controller }/g" \
            "$file"
    done
}

# 修復類定義
fix_class_definitions() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service/src"
    
    echo "🔧 修復 $service 的類定義..."
    
    find "$service_path" -name "*.ts" -type f | while read file; do
        # 修復類名中的重複後綴
        sed -i \
            -e 's/export class \([A-Za-z]*\)ServiceService/export class \1Service/g' \
            -e 's/export class \([A-Za-z]*\)RepositoryRepository/export class \1Repository/g' \
            -e 's/export class \([A-Za-z]*\)ControllerController/export class \1Controller/g' \
            -e 's/class \([A-Za-z]*\)ServiceService/class \1Service/g' \
            -e 's/class \([A-Za-z]*\)RepositoryRepository/class \1Repository/g' \
            -e 's/class \([A-Za-z]*\)ControllerController/class \1Controller/g' \
            "$file"
    done
}

# 修復測試文件中的引用
fix_test_files() {
    local service=$1
    local service_path="/home/user/GitHub/AIOT/microServices/$service"
    
    echo "🔧 修復 $service 的測試文件..."
    
    find "$service_path" -name "*.test.ts" -type f | while read file; do
        sed -i \
            -e 's/ServiceService/Service/g' \
            -e 's/RepositoryRepository/Repository/g' \
            -e 's/ControllerController/Controller/g' \
            -e 's/createMockRepositorysitorysitorysitory/createMockRepository/g' \
            -e 's/createMockRepositorysitorysitory/createMockRepository/g' \
            -e 's/createMockRepositorysitory/createMockRepository/g' \
            "$file"
    done
}

# 主執行流程
main() {
    echo "📋 將要修復的服務: ${SERVICES[@]}"
    echo ""
    
    for service in "${SERVICES[@]}"; do
        local service_path="/home/user/GitHub/AIOT/microServices/$service"
        
        if [[ -d "$service_path" ]]; then
            echo "🎯 開始修復 $service..."
            
            fix_import_statements "$service"
            fix_broken_strings "$service"
            fix_container_types "$service"
            fix_inject_decorators "$service"
            fix_export_statements "$service"
            fix_class_definitions "$service"
            fix_test_files "$service"
            
            echo "✅ $service 修復完成"
            echo ""
        else
            echo "⚠️  服務目錄不存在: $service_path"
        fi
    done
    
    echo "🎉 所有服務錯誤修復完成！"
    echo ""
    echo "📝 建議再次執行："
    echo "1. npm run build"
    echo "2. npm run lint"
    echo "3. npm test"
}

# 執行腳本
main "$@"
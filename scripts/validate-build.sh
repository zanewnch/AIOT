#!/bin/bash

# AIOT 項目語法驗證腳本
# 對所有微服務和前端項目執行 npm run build 來檢查語法錯誤

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 項目根目錄
PROJECT_ROOT="/home/user/GitHub/AIOT"

# 要檢查的項目列表
declare -a PROJECTS=(
    "microServices/rbac"
    "microServices/drone" 
    "microServices/feSetting"
    "frontend"
)

# 記錄結果
declare -a SUCCESS_PROJECTS=()
declare -a FAILED_PROJECTS=()

# 打印帶顏色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 打印分隔線
print_separator() {
    echo -e "${CYAN}============================================================${NC}"
}

# 檢查項目是否存在 package.json
check_project_exists() {
    local project_path=$1
    
    if [ ! -f "$project_path/package.json" ]; then
        print_message $RED "❌ $project_path/package.json 不存在"
        return 1
    fi
    
    return 0
}

# 檢查是否有 build 腳本
check_build_script() {
    local project_path=$1
    
    if ! grep -q '"build"' "$project_path/package.json" 2>/dev/null; then
        print_message $YELLOW "⚠️ $project_path 沒有 build 腳本，跳過..."
        return 1
    fi
    
    return 0
}

# 構建單個項目
build_project() {
    local project_name=$1
    local project_path="$PROJECT_ROOT/$project_name"
    
    print_separator
    print_message $BLUE "🔨 開始構建: $project_name"
    
    # 檢查項目是否存在
    if ! check_project_exists "$project_path"; then
        FAILED_PROJECTS+=("$project_name (項目不存在)")
        return 1
    fi
    
    # 檢查是否有 build 腳本
    if ! check_build_script "$project_path"; then
        SUCCESS_PROJECTS+=("$project_name (無 build 腳本)")
        return 0
    fi
    
    # 切換到項目目錄
    cd "$project_path"
    
    print_message $CYAN "📂 當前目錄: $project_path"
    
    # 檢查 node_modules 是否存在
    if [ ! -d "node_modules" ]; then
        print_message $YELLOW "⚠️ node_modules 不存在，正在安裝依賴..."
        if npm install; then
            print_message $GREEN "✅ 依賴安裝成功"
        else
            print_message $RED "❌ 依賴安裝失敗"
            FAILED_PROJECTS+=("$project_name (依賴安裝失敗)")
            return 1
        fi
    fi
    
    # 執行構建
    print_message $CYAN "🚀 執行 npm run build..."
    
    # 使用 timeout 避免構建卡住
    if timeout 300 npm run build; then
        print_message $GREEN "✅ $project_name 構建成功"
        SUCCESS_PROJECTS+=("$project_name")
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            print_message $RED "❌ $project_name 構建超時 (5分鐘)"
            FAILED_PROJECTS+=("$project_name (構建超時)")
        else
            print_message $RED "❌ $project_name 構建失敗"
            FAILED_PROJECTS+=("$project_name (構建失敗)")
        fi
        return 1
    fi
}

# 顯示最終報告
show_final_report() {
    print_separator
    print_message $BLUE "📊 構建報告"
    print_separator
    
    if [ ${#SUCCESS_PROJECTS[@]} -gt 0 ]; then
        print_message $GREEN "✅ 成功項目 (${#SUCCESS_PROJECTS[@]}):"
        for project in "${SUCCESS_PROJECTS[@]}"; do
            echo -e "  ${GREEN}✓${NC} $project"
        done
    fi
    
    if [ ${#FAILED_PROJECTS[@]} -gt 0 ]; then
        print_message $RED "❌ 失敗項目 (${#FAILED_PROJECTS[@]}):"
        for project in "${FAILED_PROJECTS[@]}"; do
            echo -e "  ${RED}✗${NC} $project"
        done
    fi
    
    print_separator
    
    local total_projects=${#PROJECTS[@]}
    local success_count=${#SUCCESS_PROJECTS[@]}
    local failed_count=${#FAILED_PROJECTS[@]}
    
    print_message $CYAN "📈 統計信息:"
    echo -e "  總項目數: $total_projects"
    echo -e "  成功: ${GREEN}$success_count${NC}"
    echo -e "  失敗: ${RED}$failed_count${NC}"
    echo -e "  成功率: $(( success_count * 100 / total_projects ))%"
    
    if [ $failed_count -eq 0 ]; then
        print_message $GREEN "🎉 所有項目構建成功！語法檢查通過！"
        return 0
    else
        print_message $RED "💥 有 $failed_count 個項目構建失敗，請檢查錯誤信息"
        return 1
    fi
}

# 顯示幫助信息
show_help() {
    echo "AIOT 語法驗證腳本"
    echo ""
    echo "使用方法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help     顯示此幫助信息"
    echo "  -v, --verbose  詳細輸出模式"
    echo "  -s, --single PROJECT  只構建指定項目"
    echo ""
    echo "支援的項目:"
    for project in "${PROJECTS[@]}"; do
        echo "  - $project"
    done
    echo ""
    echo "示例:"
    echo "  $0                    # 構建所有項目"
    echo "  $0 -s rbac           # 只構建 RBAC 微服務"
    echo "  $0 -s frontend       # 只構建前端項目"
}

# 構建指定項目
build_single_project() {
    local target_project=$1
    local found=false
    
    for project in "${PROJECTS[@]}"; do
        if [[ "$project" == *"$target_project"* ]]; then
            build_project "$project"
            found=true
            break
        fi
    done
    
    if [ "$found" = false ]; then
        print_message $RED "❌ 找不到項目: $target_project"
        echo "可用項目:"
        for project in "${PROJECTS[@]}"; do
            echo "  - $project"
        done
        exit 1
    fi
}

# 主函數
main() {
    local single_project=""
    local verbose=false
    
    # 解析命令行參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -s|--single)
                single_project="$2"
                shift
                shift
                ;;
            *)
                print_message $RED "未知選項: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 開始時間
    start_time=$(date +%s)
    
    print_separator
    print_message $BLUE "🚀 AIOT 語法驗證腳本開始執行"
    print_message $CYAN "📅 開始時間: $(date)"
    print_separator
    
    if [ -n "$single_project" ]; then
        print_message $YELLOW "🎯 單項目模式: $single_project"
        build_single_project "$single_project"
    else
        print_message $YELLOW "🎯 全項目驗證模式"
        
        # 構建所有項目
        for project in "${PROJECTS[@]}"; do
            build_project "$project"
            echo "" # 空行分隔
        done
    fi
    
    # 結束時間
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    print_message $CYAN "⏱️ 執行時間: ${duration}秒"
    
    # 顯示最終報告
    if [ -z "$single_project" ]; then
        show_final_report
    else
        if [ ${#FAILED_PROJECTS[@]} -eq 0 ]; then
            print_message $GREEN "✅ 項目 $single_project 構建成功！"
        else
            print_message $RED "❌ 項目 $single_project 構建失敗！"
            exit 1
        fi
    fi
}

# 執行主函數
main "$@"
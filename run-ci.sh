#!/bin/bash
# AIOT CI/CD 自動化執行腳本
# 使用 act 在本地執行 GitHub Actions workflows

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 函數：顯示彩色訊息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# 函數：檢查依賴
check_dependencies() {
    print_info "檢查必要依賴..."
    
    if ! command -v act &> /dev/null; then
        print_error "act 未安裝，請先安裝 act"
        echo "安裝指令: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | bash"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon 未運行，請啟動 Docker"
        exit 1
    fi
    
    print_success "依賴檢查通過"
}

# 函數：清理舊報告
cleanup_reports() {
    print_info "清理舊的測試報告..."
    
    if [ -d "ci-reports" ]; then
        # 保留最近5個報告，刪除其他的
        find ci-reports -name "html-report-*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
    fi
    
    # 確保報告目錄存在
    mkdir -p ci-reports
    
    print_success "報告目錄準備完成"
}

# 函數：顯示可用的執行模式
show_usage() {
    echo ""
    echo "🎯 AIOT CI/CD 自動化執行腳本"
    echo ""
    echo "使用方式:"
    echo "  $0 [模式] [選項]"
    echo ""
    echo "執行模式:"
    echo "  quick      快速模式 - 只執行靜態檢查 (2-3分鐘)"
    echo "  standard   標準模式 - 靜態檢查 + 微服務 + 前端測試 (10-15分鐘)"
    echo "  full       完整模式 - 包含所有測試和 Python 服務 (20-30分鐘)"
    echo "  list       列出所有可用的 workflows"
    echo ""
    echo "特定測試:"
    echo "  microservices   只執行微服務測試"
    echo "  frontend        只執行前端測試"  
    echo "  python          只執行 Python 服務測試"
    echo "  report          只生成測試報告"
    echo ""
    echo "選項:"
    echo "  --dry-run      預覽執行計劃，不實際執行"
    echo "  --verbose      顯示詳細執行過程"
    echo "  --help         顯示此幫助訊息"
    echo ""
    echo "範例:"
    echo "  $0 quick           # 快速靜態檢查"
    echo "  $0 standard        # 標準測試流程"
    echo "  $0 full --verbose  # 完整測試 + 詳細輸出"
    echo "  $0 microservices   # 只測試微服務"
    echo ""
}

# 函數：執行 act
run_act() {
    local mode=$1
    local options=${2:-""}
    
    print_header "執行 CI/CD Pipeline - 模式: $mode"
    
    case $mode in
        "quick")
            print_info "執行快速模式 - 靜態檢查..."
            act --job static-checks $options
            ;;
        "standard")
            print_info "執行標準模式 - 微服務 + 前端測試..."
            act --input test_mode=standard $options
            ;;
        "full") 
            print_info "執行完整模式 - 所有測試..."
            act --input test_mode=full $options
            ;;
        "microservices")
            print_info "執行微服務測試..."
            act --workflows .github/workflows/microservices-test.yml $options
            ;;
        "frontend")
            print_info "執行前端測試..."
            act --workflows .github/workflows/frontend-test.yml $options
            ;;
        "python")
            print_info "執行 Python 服務測試..."
            act --workflows .github/workflows/python-services-test.yml $options
            ;;
        "report")
            print_info "生成測試報告..."
            act --workflows .github/workflows/test-report.yml $options
            ;;
        "list")
            print_info "可用的 workflows:"
            act --list
            return 0
            ;;
        *)
            print_error "未知的執行模式: $mode"
            show_usage
            exit 1
            ;;
    esac
}

# 函數：顯示執行結果
show_results() {
    print_header "執行結果摘要"
    
    # 檢查是否有生成報告
    if [ -f "ci-reports/final-report.html" ]; then
        print_success "HTML 測試報告已生成"
        print_info "報告位置: ci-reports/final-report.html"
        print_info "查看報告: python -m http.server 8080 --directory ci-reports"
        print_info "然後開啟瀏覽器: http://localhost:8080/final-report.html"
    elif [ -f "ci-reports/latest-report.html" ]; then
        print_success "測試報告已生成"
        print_info "報告位置: ci-reports/latest-report.html"
    else
        print_warning "未找到測試報告，可能執行未完成或發生錯誤"
    fi
    
    # 檢查測試結果
    if [ -f "ci-reports/final/summary.json" ]; then
        local total=$(grep -o '"total_tests": [0-9]*' ci-reports/final/summary.json | cut -d':' -f2 | tr -d ' ')
        local passed=$(grep -o '"passed_tests": [0-9]*' ci-reports/final/summary.json | cut -d':' -f2 | tr -d ' ')
        local failed=$(grep -o '"failed_tests": [0-9]*' ci-reports/final/summary.json | cut -d':' -f2 | tr -d ' ')
        
        echo ""
        print_info "測試統計:"
        echo -e "  📊 總測試數: ${BLUE}$total${NC}"
        echo -e "  ✅ 通過: ${GREEN}$passed${NC}"
        echo -e "  ❌ 失敗: ${RED}$failed${NC}"
        
        if [ "$failed" -gt 0 ]; then
            print_error "有測試失敗，請檢查詳細報告"
            exit 1
        else
            print_success "所有測試都通過了！🎉"
        fi
    fi
}

# 函數：開啟報告服務器
serve_report() {
    if [ -f "ci-reports/final-report.html" ] || [ -f "ci-reports/latest-report.html" ]; then
        print_info "啟動報告服務器..."
        print_success "報告服務器運行在: http://localhost:8080"
        print_info "按 Ctrl+C 停止服務器"
        python -m http.server 8080 --directory ci-reports
    else
        print_error "未找到測試報告文件"
        exit 1
    fi
}

# 主執行邏輯
main() {
    # 解析參數
    MODE=${1:-"standard"}
    DRY_RUN=false
    VERBOSE=false
    
    # 處理選項
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            --serve)
                serve_report
                exit 0
                ;;
            *)
                print_error "未知選項: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 特殊指令處理
    if [[ "$MODE" == "help" ]]; then
        show_usage
        exit 0
    fi
    
    if [[ "$MODE" == "serve" ]]; then
        serve_report
        exit 0
    fi
    
    # 構建 act 選項
    ACT_OPTIONS=""
    if [[ "$DRY_RUN" == true ]]; then
        ACT_OPTIONS="$ACT_OPTIONS --dryrun"
    fi
    if [[ "$VERBOSE" == true ]]; then
        ACT_OPTIONS="$ACT_OPTIONS --verbose"
    fi
    
    print_header "AIOT CI/CD Pipeline 執行器"
    
    # 執行前檢查
    check_dependencies
    cleanup_reports
    
    # 顯示執行信息
    print_info "執行模式: $MODE"
    print_info "工作目錄: $(pwd)"
    print_info "開始時間: $(date)"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_warning "預覽模式 - 不會實際執行測試"
    fi
    
    echo ""
    
    # 執行測試
    if run_act "$MODE" "$ACT_OPTIONS"; then
        print_success "CI/CD Pipeline 執行完成"
        
        # 只在非預覽模式下顯示結果
        if [[ "$DRY_RUN" != true ]]; then
            show_results
        fi
    else
        print_error "CI/CD Pipeline 執行失敗"
        exit 1
    fi
}

# 腳本入口點
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
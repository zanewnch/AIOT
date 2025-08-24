#!/bin/bash

# =============================================================================
# Frontend 測試運行腳本
# 
# 此腳本提供完整的測試執行流程，包括單元測試、整合測試和 E2E 測試
# 支援不同的運行模式和環境配置
# 
# 使用方法:
#   ./test-runner.sh [選項]
#
# 選項:
#   --unit          只運行單元測試
#   --integration   只運行整合測試
#   --e2e          只運行 E2E 測試
#   --coverage     生成覆蓋率報告
#   --watch        監視模式
#   --headed       E2E 測試使用有頭瀏覽器
#   --help         顯示此幫助信息
# =============================================================================

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 預設設定
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_E2E=false
RUN_ALL=true
COVERAGE=false
WATCH=false
HEADED=false
VERBOSE=false

# 專案根目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# 環境變數
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
export BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

# 函數：顯示幫助信息
show_help() {
    cat << EOF
Frontend 測試運行腳本

用法: $0 [選項]

選項:
    --unit          只運行單元測試
    --integration   只運行整合測試  
    --e2e           只運行 E2E 測試
    --coverage      生成覆蓋率報告
    --watch         監視模式（僅適用於單元測試）
    --headed        E2E 測試使用有頭瀏覽器
    --verbose       詳細輸出
    --help          顯示此幫助信息

範例:
    $0                    # 運行所有測試
    $0 --unit --coverage  # 運行單元測試並生成覆蓋率
    $0 --e2e --headed     # 運行 E2E 測試並顯示瀏覽器

環境變數:
    FRONTEND_URL    前端服務 URL (預設: http://localhost:3000)
    BACKEND_URL     後端服務 URL (預設: http://localhost:8000)

EOF
}

# 函數：日誌輸出
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 函數：檢查依賴
check_dependencies() {
    log "檢查依賴項..."
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js 未安裝"
        exit 1
    fi
    
    # 檢查 npm
    if ! command -v npm &> /dev/null; then
        error "npm 未安裝"
        exit 1
    fi
    
    # 檢查 package.json
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        error "package.json 文件不存在"
        exit 1
    fi
    
    # 檢查 node_modules
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        warning "node_modules 不存在，正在安裝依賴..."
        npm install
    fi
    
    success "依賴檢查完成"
}

# 函數：檢查服務可用性
check_services() {
    log "檢查服務可用性..."
    
    # 檢查前端服務
    if curl -s --max-time 5 "$FRONTEND_URL" > /dev/null 2>&1; then
        success "前端服務可用: $FRONTEND_URL"
    else
        warning "前端服務不可用: $FRONTEND_URL"
    fi
    
    # 檢查後端服務
    if curl -s --max-time 5 "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        success "後端服務可用: $BACKEND_URL"
    else
        warning "後端服務不可用: $BACKEND_URL"
    fi
}

# 函數：運行單元測試
run_unit_tests() {
    log "開始運行單元測試..."
    
    local cmd="npm run test:unit"
    
    if [[ "$COVERAGE" == "true" ]]; then
        cmd="npm run test:coverage"
    fi
    
    if [[ "$WATCH" == "true" ]]; then
        cmd="npm run test:watch"
    fi
    
    if eval "$cmd"; then
        success "單元測試完成"
    else
        error "單元測試失敗"
        return 1
    fi
}

# 函數：運行整合測試
run_integration_tests() {
    log "開始運行整合測試..."
    
    # 檢查後端服務（整合測試需要後端）
    if ! curl -s --max-time 5 "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        warning "後端服務不可用，跳過整合測試"
        return 0
    fi
    
    if npm run test:integration; then
        success "整合測試完成"
    else
        error "整合測試失敗"
        return 1
    fi
}

# 函數：運行 E2E 測試
run_e2e_tests() {
    log "開始運行 E2E 測試..."
    
    # 檢查瀏覽器
    if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null; then
        error "未找到 Chrome 或 Chromium 瀏覽器"
        return 1
    fi
    
    local cmd="npm run test:e2e"
    
    if [[ "$HEADED" == "true" ]]; then
        cmd="npm run test:e2e:headed"
        export HEADLESS=false
    else
        export HEADLESS=true
    fi
    
    if eval "$cmd"; then
        success "E2E 測試完成"
    else
        error "E2E 測試失敗"
        return 1
    fi
}

# 函數：生成測試報告
generate_report() {
    log "生成測試報告..."
    
    local report_dir="$PROJECT_ROOT/test-reports"
    mkdir -p "$report_dir"
    
    if [[ -d "$PROJECT_ROOT/coverage" ]]; then
        log "覆蓋率報告位於: coverage/index.html"
    fi
    
    success "測試報告生成完成"
}

# 函數：清理
cleanup() {
    log "清理測試環境..."
    
    # 清理臨時文件
    rm -f /tmp/frontend-test-*.pid
    
    # 停止可能的背景服務
    pkill -f "vite preview" || true
    pkill -f "npm start" || true
    
    success "清理完成"
}

# 函數：主執行流程
main() {
    log "Frontend 測試運行器啟動"
    log "專案目錄: $PROJECT_ROOT"
    log "環境配置:"
    log "  - FRONTEND_URL: $FRONTEND_URL"
    log "  - BACKEND_URL: $BACKEND_URL"
    
    # 檢查依賴
    check_dependencies
    
    # 進入專案目錄
    cd "$PROJECT_ROOT"
    
    # 檢查服務
    check_services
    
    local failed=0
    
    # 運行測試
    if [[ "$RUN_ALL" == "true" || "$RUN_UNIT" == "true" ]]; then
        if ! run_unit_tests; then
            failed=$((failed + 1))
        fi
    fi
    
    if [[ "$RUN_ALL" == "true" || "$RUN_INTEGRATION" == "true" ]]; then
        if ! run_integration_tests; then
            failed=$((failed + 1))
        fi
    fi
    
    if [[ "$RUN_ALL" == "true" || "$RUN_E2E" == "true" ]]; then
        if ! run_e2e_tests; then
            failed=$((failed + 1))
        fi
    fi
    
    # 生成報告
    if [[ "$COVERAGE" == "true" ]]; then
        generate_report
    fi
    
    # 結果摘要
    echo
    log "測試執行完成"
    
    if [[ $failed -eq 0 ]]; then
        success "所有測試都通過了！ 🎉"
    else
        error "$failed 項測試失敗"
        exit 1
    fi
}

# 解析命令行參數
while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            RUN_UNIT=true
            RUN_ALL=false
            shift
            ;;
        --integration)
            RUN_INTEGRATION=true
            RUN_ALL=false
            shift
            ;;
        --e2e)
            RUN_E2E=true
            RUN_ALL=false
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "未知選項: $1"
            show_help
            exit 1
            ;;
    esac
done

# 設置清理陷阱
trap cleanup EXIT

# 運行主流程
main
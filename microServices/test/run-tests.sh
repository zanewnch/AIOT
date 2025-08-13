#!/bin/bash

# AIOT 微服務測試執行腳本
# 
# 此腳本用於執行所有測試，包含：
# - 單元測試
# - 整合測試  
# - 代碼覆蓋率檢查
# - 測試報告生成
#
# 作者: AIOT Team
# 版本: 1.0.0

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查必要的依賴
check_dependencies() {
    log_info "檢查測試依賴..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安裝"
        exit 1
    fi
    
    # 檢查 Jest
    if [ ! -f "node_modules/.bin/jest" ]; then
        log_warning "Jest 未安裝，嘗試安裝依賴..."
        npm install
    fi
    
    log_success "依賴檢查完成"
}

# 設置測試環境
setup_test_env() {
    log_info "設置測試環境..."
    
    # 創建測試環境變數文件
    cat > .env.test << EOF
NODE_ENV=test
LOG_LEVEL=error

# 測試資料庫設定
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=aiot_test

# 測試服務端口
RBAC_SERVICE_PORT=3001
DRONE_SERVICE_PORT=3002
GENERAL_SERVICE_PORT=3003
API_GATEWAY_PORT=30000

# JWT 設定
JWT_SECRET=test_jwt_secret_key
JWT_EXPIRES_IN=24h

# Redis 設定
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1

# MongoDB 設定
MONGODB_URL=mongodb://localhost:27017/aiot_test

# RabbitMQ 設定
RABBITMQ_URL=amqp://localhost:5672
EOF
    
    log_success "測試環境設置完成"
}

# 清理測試環境
cleanup_test_env() {
    log_info "清理測試環境..."
    
    # 清理測試資料庫（如果存在）
    if command -v mysql &> /dev/null; then
        mysql -h localhost -u root -ppassword -e "DROP DATABASE IF EXISTS aiot_test;" 2>/dev/null || true
        mysql -h localhost -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS aiot_test;" 2>/dev/null || true
    fi
    
    # 清理 Redis 測試資料庫
    if command -v redis-cli &> /dev/null; then
        redis-cli -n 1 FLUSHDB 2>/dev/null || true
    fi
    
    # 清理 MongoDB 測試資料庫
    if command -v mongo &> /dev/null; then
        mongo aiot_test --eval "db.dropDatabase()" 2>/dev/null || true
    fi
    
    log_success "測試環境清理完成"
}

# 執行單元測試
run_unit_tests() {
    log_info "執行單元測試..."
    
    cd "$(dirname "$0")/.."
    
    # 執行各個服務的單元測試
    local services=("drone-service" "rbac-service" "general-service")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            log_info "測試 $service..."
            cd "$service"
            
            if npm run test:unit 2>&1; then
                log_success "$service 單元測試通過"
            else
                log_error "$service 單元測試失敗"
                failed_services+=("$service")
            fi
            
            cd ..
        else
            log_warning "$service 目錄不存在，跳過"
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "所有單元測試通過"
        return 0
    else
        log_error "以下服務的單元測試失敗: ${failed_services[*]}"
        return 1
    fi
}

# 啟動測試服務
start_test_services() {
    log_info "啟動測試服務..."
    
    # 檢查 Docker 是否可用
    if command -v docker &> /dev/null; then
        log_info "啟動 Docker 測試服務..."
        
        # 啟動資料庫服務
        docker run -d --name test-mysql \
            -e MYSQL_ROOT_PASSWORD=password \
            -e MYSQL_DATABASE=aiot_test \
            -p 3306:3306 \
            mysql:8.0 || true
            
        docker run -d --name test-redis \
            -p 6379:6379 \
            redis:alpine || true
            
        docker run -d --name test-mongodb \
            -p 27017:27017 \
            mongo:latest || true
        
        # 等待服務啟動
        log_info "等待資料庫服務啟動..."
        sleep 10
    fi
    
    log_success "測試服務啟動完成"
}

# 停止測試服務
stop_test_services() {
    log_info "停止測試服務..."
    
    if command -v docker &> /dev/null; then
        docker stop test-mysql test-redis test-mongodb 2>/dev/null || true
        docker rm test-mysql test-redis test-mongodb 2>/dev/null || true
    fi
    
    log_success "測試服務停止完成"
}

# 執行整合測試
run_integration_tests() {
    log_info "執行整合測試..."
    
    cd "$(dirname "$0")"
    
    # 使用 Jest 執行整合測試
    if npx jest --config jest.config.js --testPathPattern="integration" --runInBand; then
        log_success "整合測試通過"
        return 0
    else
        log_error "整合測試失敗"
        return 1
    fi
}

# 生成測試報告
generate_test_report() {
    log_info "生成測試報告..."
    
    local report_dir="test-results"
    mkdir -p "$report_dir"
    
    # 合併覆蓋率報告
    if [ -d "coverage" ]; then
        cp -r coverage/* "$report_dir/" 2>/dev/null || true
    fi
    
    # 生成總結報告
    cat > "$report_dir/test-summary.md" << EOF
# AIOT 微服務測試報告

## 測試執行時間
- 開始時間: $(date -Iseconds)
- 測試環境: $(node --version)

## 測試結果總結

### 單元測試
- Drone Service: $([ -f "drone-service/coverage/coverage-summary.json" ] && echo "✅ 通過" || echo "❌ 失敗")
- RBAC Service: $([ -f "rbac-service/coverage/coverage-summary.json" ] && echo "✅ 通過" || echo "❌ 失敗")  
- General Service: $([ -f "general-service/coverage/coverage-summary.json" ] && echo "✅ 通過" || echo "❌ 失敗")

### 整合測試
- API 整合測試: $([ -f "test-results/junit.xml" ] && echo "✅ 通過" || echo "❌ 失敗")

## 覆蓋率統計
$([ -f "coverage/lcov-report/index.html" ] && echo "詳細覆蓋率報告: coverage/lcov-report/index.html" || echo "覆蓋率報告生成失敗")

## 測試檔案位置
- 單元測試: test/unit/
- 整合測試: test/integration/
- 測試設置: test/setup/
EOF
    
    log_success "測試報告已生成: $report_dir/test-summary.md"
}

# 主函數
main() {
    local test_type="${1:-all}"
    local start_time=$(date +%s)
    
    log_info "開始執行 AIOT 微服務測試..."
    log_info "測試類型: $test_type"
    
    # 檢查依賴
    check_dependencies
    
    # 設置測試環境
    setup_test_env
    
    case "$test_type" in
        "unit")
            log_info "僅執行單元測試..."
            if run_unit_tests; then
                log_success "單元測試完成"
            else
                log_error "單元測試失敗"
                exit 1
            fi
            ;;
        "integration")
            log_info "僅執行整合測試..."
            start_test_services
            trap stop_test_services EXIT
            
            cleanup_test_env
            
            if run_integration_tests; then
                log_success "整合測試完成"
            else
                log_error "整合測試失敗"
                exit 1
            fi
            ;;
        "all"|*)
            log_info "執行所有測試..."
            
            # 執行單元測試
            if ! run_unit_tests; then
                log_error "單元測試失敗，終止執行"
                exit 1
            fi
            
            # 啟動測試服務並執行整合測試
            start_test_services
            trap stop_test_services EXIT
            
            cleanup_test_env
            
            if ! run_integration_tests; then
                log_error "整合測試失敗"
                exit 1
            fi
            ;;
    esac
    
    # 生成測試報告
    generate_test_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "所有測試完成！總耗時: ${duration}s"
}

# 處理命令行參數
case "${1:-}" in
    "-h"|"--help")
        echo "AIOT 微服務測試執行腳本"
        echo ""
        echo "用法:"
        echo "  $0 [test_type]"
        echo ""
        echo "測試類型:"
        echo "  unit        僅執行單元測試"
        echo "  integration 僅執行整合測試"
        echo "  all         執行所有測試 (預設)"
        echo ""
        echo "範例:"
        echo "  $0 unit"
        echo "  $0 integration" 
        echo "  $0"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
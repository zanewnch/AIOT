#!/bin/bash

# ==================================================
# AIOT Batch Migration Script  
# ==================================================
# 用途：執行所有微服務的資料庫遷移
# 使用：./migrate-all.sh <action> [options]
#
# 參數：
#   action: up, down, status, undo, undo:all
#   options: --verbose, --dry-run, --parallel
# ==================================================

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查參數
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <action> [options]"
    log_info "Actions: up, down, status, undo, undo:all"
    log_info "Options: --verbose, --dry-run, --parallel"
    exit 1
fi

ACTION=$1
VERBOSE=""
DRY_RUN=""
PARALLEL=false

# 解析額外參數
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE="--verbose"
            shift
            ;;
        --dry-run|-d)
            DRY_RUN="--dry-run"
            shift
            ;;
        --parallel|-p)
            PARALLEL=true
            shift
            ;;
        *)
            log_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# 獲取腳本目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 服務列表（按依賴順序）
if [ "$ACTION" = "down" ] || [ "$ACTION" = "undo" ] || [ "$ACTION" = "undo:all" ]; then
    # 回滾時反向順序
    SERVICES=("general-service" "drone-service" "rbac-service")
else
    # 正常遷移順序
    SERVICES=("rbac-service" "drone-service" "general-service")
fi

# 記錄操作
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BATCH_LOG="$SCRIPT_DIR/../logs/batch-migration-${TIMESTAMP}.log"
mkdir -p "$(dirname "$BATCH_LOG")"

log_info "Starting batch migration with action: $ACTION"
log_info "Services order: ${SERVICES[*]}"
log_info "Parallel execution: $PARALLEL"
log_info "Batch log: $BATCH_LOG"

echo "Batch Migration Started: $(date)" > "$BATCH_LOG"
echo "Action: $ACTION" >> "$BATCH_LOG"
echo "Services: ${SERVICES[*]}" >> "$BATCH_LOG"
echo "Parallel: $PARALLEL" >> "$BATCH_LOG"
echo "===========================================" >> "$BATCH_LOG"

# 並行執行函數
execute_parallel() {
    local pids=()
    local results=()
    local service_count=${#SERVICES[@]}
    
    log_info "Executing migrations in parallel..."
    
    for service in "${SERVICES[@]}"; do
        {
            echo "[$(date)] Starting $service..." >> "$BATCH_LOG"
            if "$SCRIPT_DIR/migrate.sh" "$service" "$ACTION" $VERBOSE $DRY_RUN; then
                echo "[$(date)] SUCCESS: $service" >> "$BATCH_LOG"
                echo "SUCCESS:$service"
            else
                echo "[$(date)] FAILED: $service" >> "$BATCH_LOG"
                echo "FAILED:$service"
            fi
        } &
        pids+=($!)
    done
    
    # 等待所有任務完成
    local success_count=0
    local failed_count=0
    
    for pid in "${pids[@]}"; do
        if wait "$pid"; then
            ((success_count++))
        else
            ((failed_count++))
        fi
    done
    
    log_info "Parallel execution completed"
    log_success "Successful: $success_count/$service_count"
    if [ $failed_count -gt 0 ]; then
        log_error "Failed: $failed_count/$service_count"
        return 1
    fi
    
    return 0
}

# 順序執行函數
execute_sequential() {
    local success_count=0
    local failed_count=0
    
    log_info "Executing migrations sequentially..."
    
    for service in "${SERVICES[@]}"; do
        log_info "Processing $service..."
        echo "[$(date)] Starting $service..." >> "$BATCH_LOG"
        
        if "$SCRIPT_DIR/migrate.sh" "$service" "$ACTION" $VERBOSE $DRY_RUN; then
            log_success "$service completed successfully"
            echo "[$(date)] SUCCESS: $service" >> "$BATCH_LOG"
            ((success_count++))
        else
            log_error "$service failed"
            echo "[$(date)] FAILED: $service" >> "$BATCH_LOG"
            ((failed_count++))
            
            # 詢問是否繼續
            if [ "$ACTION" != "status" ]; then
                read -p "Migration failed for $service. Continue with remaining services? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    log_warning "Batch migration stopped by user"
                    break
                fi
            fi
        fi
    done
    
    log_info "Sequential execution completed"
    log_success "Successful: $success_count/${#SERVICES[@]}"
    if [ $failed_count -gt 0 ]; then
        log_error "Failed: $failed_count/${#SERVICES[@]}"
        return 1
    fi
    
    return 0
}

# 預檢查
log_info "Performing pre-flight checks..."

# 檢查所有服務目錄是否存在
for service in "${SERVICES[@]}"; do
    service_dir="$SCRIPT_DIR/../$service"
    if [ ! -d "$service_dir" ]; then
        log_error "Service directory not found: $service_dir"
        exit 1
    fi
done

log_success "Pre-flight checks passed"

# 執行遷移
if [ "$PARALLEL" = true ] && [ "$ACTION" = "up" ] || [ "$ACTION" = "status" ]; then
    if execute_parallel; then
        exit_code=0
    else
        exit_code=1
    fi
else
    if [ "$PARALLEL" = true ]; then
        log_warning "Parallel execution not recommended for action: $ACTION. Using sequential execution."
    fi
    
    if execute_sequential; then
        exit_code=0
    else
        exit_code=1
    fi
fi

# 生成摘要報告
echo "===========================================" >> "$BATCH_LOG"
echo "Batch Migration Completed: $(date)" >> "$BATCH_LOG"

log_info "Generating migration summary..."
echo
log_info "=== MIGRATION SUMMARY ==="

for service in "${SERVICES[@]}"; do
    log_info "Checking final status for $service..."
    "$SCRIPT_DIR/migrate.sh" "$service" "status" 2>/dev/null | grep -E "(up|down)" | tail -5
done

echo "===========================================" >> "$BATCH_LOG"

if [ $exit_code -eq 0 ]; then
    log_success "All migrations completed successfully"
    echo "SUCCESS: Batch migration completed" >> "$BATCH_LOG"
else
    log_error "Some migrations failed. Check the logs for details."
    echo "FAILED: Some migrations failed" >> "$BATCH_LOG"
fi

log_info "Batch log saved to: $BATCH_LOG"
exit $exit_code
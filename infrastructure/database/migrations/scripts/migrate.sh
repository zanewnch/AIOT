#!/bin/bash

# ==================================================
# AIOT Database Migration Script
# ==================================================
# 用途：執行單一微服務的資料庫遷移
# 使用：./migrate.sh <service> <action> [options]
# 
# 參數：
#   service: rbac-service, drone-service, general-service
#   action:  up, down, status, undo, undo:all
#   options: --verbose, --dry-run
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
if [ $# -lt 2 ]; then
    log_error "Usage: $0 <service> <action> [options]"
    log_info "Services: rbac-service, drone-service, general-service"
    log_info "Actions: up, down, status, undo, undo:all"
    log_info "Options: --verbose, --dry-run"
    exit 1
fi

SERVICE=$1
ACTION=$2
VERBOSE=""
DRY_RUN=""

# 解析額外參數
shift 2
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
        *)
            log_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# 獲取腳本目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_DIR="$MIGRATIONS_DIR/$SERVICE"

# 驗證服務名稱
case $SERVICE in
    rbac-service|drone-service|general-service)
        ;;
    *)
        log_error "Invalid service: $SERVICE"
        log_info "Valid services: rbac-service, drone-service, general-service"
        exit 1
        ;;
esac

# 檢查服務目錄是否存在
if [ ! -d "$SERVICE_DIR" ]; then
    log_error "Service directory not found: $SERVICE_DIR"
    exit 1
fi

# 檢查 package.json 是否存在
if [ ! -f "$SERVICE_DIR/package.json" ]; then
    log_error "package.json not found in $SERVICE_DIR"
    log_info "Installing dependencies for $SERVICE..."
    cd "$SERVICE_DIR"
    npm install
fi

# 設置環境變數
export NODE_ENV="${NODE_ENV:-development}"

# 獲取數據庫配置
case $SERVICE in
    rbac-service)
        export DB_PORT="${DB_PORT:-5432}"
        export DB_NAME="${DB_NAME:-main_db}"
        ;;
    drone-service)
        export DB_PORT="${DB_PORT:-5433}"
        export DB_NAME="${DB_NAME:-drone_db}"
        ;;
    general-service)
        export DB_PORT="${DB_PORT:-5435}"
        export DB_NAME="${DB_NAME:-user_preference_db}"
        ;;
esac

export DB_HOST="${DB_HOST:-localhost}"
export DB_USER="${DB_USER:-admin}"
export DB_PASSWORD="${DB_PASSWORD:-admin}"

# 記錄操作
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_DIR="$MIGRATIONS_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${SERVICE}-${ACTION}-${TIMESTAMP}.log"

log_info "Starting migration for $SERVICE with action: $ACTION"
log_info "Environment: $NODE_ENV"
log_info "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
log_info "Log file: $LOG_FILE"

# 檢查資料庫連接
log_info "Checking database connection..."
cd "$SERVICE_DIR"

# 測試連接
if ! timeout 10 npx sequelize-cli db:migrate:status > /dev/null 2>&1; then
    log_error "Cannot connect to database. Please check your database configuration."
    log_info "Host: $DB_HOST"
    log_info "Port: $DB_PORT"
    log_info "Database: $DB_NAME"
    log_info "User: $DB_USER"
    exit 1
fi

log_success "Database connection successful"

# 執行遷移操作
cd "$SERVICE_DIR"

case $ACTION in
    up)
        log_info "Running migrations up for $SERVICE..."
        if [ -n "$DRY_RUN" ]; then
            log_warning "DRY RUN: Would execute migrations"
            npx sequelize-cli db:migrate:status
        else
            npx sequelize-cli db:migrate $VERBOSE 2>&1 | tee "$LOG_FILE"
            log_success "Migrations completed for $SERVICE"
        fi
        ;;
    down|undo)
        log_warning "Rolling back last migration for $SERVICE..."
        if [ -n "$DRY_RUN" ]; then
            log_warning "DRY RUN: Would rollback last migration"
            npx sequelize-cli db:migrate:status
        else
            npx sequelize-cli db:migrate:undo $VERBOSE 2>&1 | tee "$LOG_FILE"
            log_success "Rollback completed for $SERVICE"
        fi
        ;;
    undo:all)
        log_warning "Rolling back ALL migrations for $SERVICE..."
        read -p "Are you sure you want to rollback ALL migrations? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -n "$DRY_RUN" ]; then
                log_warning "DRY RUN: Would rollback all migrations"
                npx sequelize-cli db:migrate:status
            else
                npx sequelize-cli db:migrate:undo:all $VERBOSE 2>&1 | tee "$LOG_FILE"
                log_success "All migrations rolled back for $SERVICE"
            fi
        else
            log_info "Operation cancelled"
            exit 0
        fi
        ;;
    status)
        log_info "Checking migration status for $SERVICE..."
        npx sequelize-cli db:migrate:status 2>&1 | tee "$LOG_FILE"
        ;;
    *)
        log_error "Invalid action: $ACTION"
        log_info "Valid actions: up, down, status, undo, undo:all"
        exit 1
        ;;
esac

# 顯示最終狀態
log_info "Final migration status for $SERVICE:"
npx sequelize-cli db:migrate:status

log_success "Migration operation completed for $SERVICE"
log_info "Log saved to: $LOG_FILE"
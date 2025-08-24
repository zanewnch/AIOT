#!/bin/bash

# ==================================================
# AIOT Migration Status Checker
# ==================================================
# 用途：檢查所有微服務的資料庫遷移狀態
# 使用：./status-all.sh [options]
#
# 參數：
#   options: --detailed, --json, --export
# ==================================================

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# 解析參數
DETAILED=false
JSON_OUTPUT=false
EXPORT_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed|-d)
            DETAILED=true
            shift
            ;;
        --json|-j)
            JSON_OUTPUT=true
            shift
            ;;
        --export|-e)
            EXPORT_FILE="migration-status-$(date '+%Y%m%d_%H%M%S').json"
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

# 服務列表
SERVICES=("rbac-service" "drone-service" "general-service")

# 服務信息
declare -A SERVICE_INFO
SERVICE_INFO["rbac-service"]="RBAC權限管理 (main_db:5432)"
SERVICE_INFO["drone-service"]="無人機數據管理 (drone_db:5433)" 
SERVICE_INFO["general-service"]="用戶偏好設定 (user_preference_db:5435)"

# JSON輸出開始
if [ "$JSON_OUTPUT" = true ]; then
    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"services\": {"
fi

# 檢查每個服務的狀態
service_count=0
total_services=${#SERVICES[@]}

for service in "${SERVICES[@]}"; do
    ((service_count++))
    service_dir="$MIGRATIONS_DIR/$service"
    
    if [ "$JSON_OUTPUT" = true ]; then
        if [ $service_count -gt 1 ]; then
            echo ","
        fi
        echo "    \"$service\": {"
    else
        echo
        echo -e "${CYAN}=============================================${NC}"
        echo -e "${CYAN}📊 $service${NC}"
        echo -e "${CYAN}${SERVICE_INFO[$service]}${NC}"
        echo -e "${CYAN}=============================================${NC}"
    fi
    
    # 檢查服務目錄是否存在
    if [ ! -d "$service_dir" ]; then
        if [ "$JSON_OUTPUT" = true ]; then
            echo "      \"status\": \"error\","
            echo "      \"message\": \"Service directory not found\","
            echo "      \"migrations\": []"
        else
            log_error "Service directory not found: $service_dir"
        fi
        continue
    fi
    
    # 進入服務目錄並檢查狀態
    cd "$service_dir"
    
    # 檢查數據庫連接
    if ! timeout 5 npx sequelize-cli db:migrate:status > /dev/null 2>&1; then
        if [ "$JSON_OUTPUT" = true ]; then
            echo "      \"status\": \"error\","
            echo "      \"message\": \"Database connection failed\","
            echo "      \"migrations\": []"
        else
            log_error "❌ Cannot connect to database"
        fi
        continue
    fi
    
    # 獲取遷移狀態
    migration_output=$(npx sequelize-cli db:migrate:status 2>/dev/null)
    
    # 解析遷移狀態
    up_count=$(echo "$migration_output" | grep -c "up" || echo "0")
    down_count=$(echo "$migration_output" | grep -c "down" || echo "0")
    total_migrations=$((up_count + down_count))
    
    if [ "$JSON_OUTPUT" = true ]; then
        echo "      \"status\": \"connected\","
        echo "      \"database_connection\": true,"
        echo "      \"migration_stats\": {"
        echo "        \"total\": $total_migrations,"
        echo "        \"up\": $up_count,"
        echo "        \"down\": $down_count"
        echo "      },"
        echo "      \"migrations\": ["
        
        # 解析具體的遷移文件
        migration_count=0
        while IFS= read -r line; do
            if [[ $line =~ ^(up|down)[[:space:]]+([0-9]{14})-(.+)\.js$ ]]; then
                status="${BASH_REMATCH[1]}"
                filename="${BASH_REMATCH[2]}-${BASH_REMATCH[3]}.js"
                name="${BASH_REMATCH[3]}"
                
                if [ $migration_count -gt 0 ]; then
                    echo ","
                fi
                echo "        {"
                echo "          \"filename\": \"$filename\","
                echo "          \"name\": \"$name\","
                echo "          \"status\": \"$status\""
                echo -n "        }"
                ((migration_count++))
            fi
        done <<< "$migration_output"
        
        echo ""
        echo "      ]"
    else
        # 文字輸出
        if [ $total_migrations -eq 0 ]; then
            log_warning "📝 No migrations found"
        else
            log_success "📊 Migration Statistics:"
            echo "   📈 Total migrations: $total_migrations"
            echo "   ✅ Applied (up): $up_count"
            echo "   ⏳ Pending (down): $down_count"
            
            if [ $down_count -gt 0 ]; then
                echo -e "   ${YELLOW}⚠️  $down_count migrations pending execution${NC}"
            else
                echo -e "   ${GREEN}✅ All migrations are up to date${NC}"
            fi
        fi
        
        # 詳細模式
        if [ "$DETAILED" = true ]; then
            echo
            log_info "📋 Detailed Migration List:"
            echo "$migration_output" | while IFS= read -r line; do
                if [[ $line =~ ^up ]]; then
                    echo -e "   ${GREEN}✅${NC} $line"
                elif [[ $line =~ ^down ]]; then
                    echo -e "   ${YELLOW}⏳${NC} $line"
                else
                    echo "   $line"
                fi
            done
        fi
    fi
    
    if [ "$JSON_OUTPUT" = true ]; then
        echo -n "    }"
    fi
done

# JSON輸出結束
if [ "$JSON_OUTPUT" = true ]; then
    echo ""
    echo "  },"
    echo "  \"summary\": {"
    echo "    \"total_services\": $total_services,"
    echo "    \"timestamp\": \"$(date -Iseconds)\""
    echo "  }"
    echo "}"
else
    # 生成摘要
    echo
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}📋 OVERALL SUMMARY${NC}"
    echo -e "${CYAN}=============================================${NC}"
    
    all_up_to_date=true
    for service in "${SERVICES[@]}"; do
        service_dir="$MIGRATIONS_DIR/$service"
        if [ -d "$service_dir" ]; then
            cd "$service_dir"
            if timeout 5 npx sequelize-cli db:migrate:status > /dev/null 2>&1; then
                down_count=$(npx sequelize-cli db:migrate:status 2>/dev/null | grep -c "down" || echo "0")
                if [ $down_count -gt 0 ]; then
                    all_up_to_date=false
                    echo -e "   ${YELLOW}⚠️  $service: $down_count pending migrations${NC}"
                else
                    echo -e "   ${GREEN}✅ $service: All migrations applied${NC}"
                fi
            else
                all_up_to_date=false
                echo -e "   ${RED}❌ $service: Database connection failed${NC}"
            fi
        else
            all_up_to_date=false
            echo -e "   ${RED}❌ $service: Service directory not found${NC}"
        fi
    done
    
    echo
    if [ "$all_up_to_date" = true ]; then
        log_success "🎉 All services are up to date!"
    else
        log_warning "⚠️  Some services have pending migrations or issues"
        log_info "💡 Run './migrate-all.sh up' to apply pending migrations"
    fi
    
    echo
    log_info "🕐 Status check completed at $(date)"
fi

# 導出到文件
if [ -n "$EXPORT_FILE" ]; then
    if [ "$JSON_OUTPUT" = false ]; then
        # 重新運行以獲取JSON輸出
        "$0" --json > "$EXPORT_FILE"
        log_success "📄 Status exported to: $EXPORT_FILE"
    fi
fi
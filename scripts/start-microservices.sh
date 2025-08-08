#!/bin/bash

# AIOT 微服務啟動腳本
# 簡化版本 - 直接啟動所有微服務

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="/home/user/GitHub/AIOT"
COMPOSE_FILE="$PROJECT_ROOT/infrastructure/docker/docker-compose.yml"
PROJECT_NAME="aiot-microservices"

# 打印帶顏色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 檢查 Docker 環境
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker 未安裝"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_message $RED "❌ Docker Compose 未安裝"
        exit 1
    fi
    
    print_message $GREEN "✅ Docker 環境檢查通過"
}

# 檢查配置文件
check_config() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_message $RED "❌ Docker Compose 文件不存在: $COMPOSE_FILE"
        exit 1
    fi
    
    print_message $GREEN "✅ 配置文件檢查通過"
}

# 啟動所有服務
start_services() {
    print_message $BLUE "🚀 啟動 AIOT 微服務架構..."
    
    # 切換到正確的目錄
    cd "$PROJECT_ROOT/infrastructure/docker"
    
    # 啟動所有服務
    if docker-compose -f docker-compose.yml -p $PROJECT_NAME up -d; then
        print_message $GREEN "✅ 所有服務啟動成功！"
    else
        print_message $RED "❌ 服務啟動失敗"
        exit 1
    fi
}

# 等待服務就緒
wait_for_services() {
    print_message $YELLOW "⏳ 等待服務完全啟動..."
    sleep 15
    
    # 檢查關鍵服務
    local services_ready=0
    local total_services=3
    
    # 檢查 Consul
    if curl -f http://localhost:8500/v1/status/leader > /dev/null 2>&1; then
        print_message $GREEN "✅ Consul 服務就緒"
        ((services_ready++))
    else
        print_message $YELLOW "⚠️ Consul 服務未就緒"
    fi
    
    # 檢查 Kong
    if curl -f http://localhost:8001/ > /dev/null 2>&1; then
        print_message $GREEN "✅ Kong Gateway 就緒"
        ((services_ready++))
    else
        print_message $YELLOW "⚠️ Kong Gateway 未就緒"
    fi
    
    # 檢查 RabbitMQ
    if curl -f http://localhost:15672/ > /dev/null 2>&1; then
        print_message $GREEN "✅ RabbitMQ 管理界面就緒"
        ((services_ready++))
    else
        print_message $YELLOW "⚠️ RabbitMQ 管理界面未就緒"
    fi
    
    print_message $CYAN "📊 服務狀態: $services_ready/$total_services 個關鍵服務已就緒"
}

# 顯示服務端點
show_endpoints() {
    print_message $BLUE "🌐 服務端點列表："
    echo ""
    echo "  🌐 Kong Gateway (API 入口): http://localhost:8000"
    echo "  🔧 Kong Admin API: http://localhost:8001"
    echo "  🏛️  Consul UI: http://localhost:8500"
    echo "  🐰 RabbitMQ Management: http://localhost:15672 (admin/admin)"
    echo "  🔐 RBAC Service: http://localhost:3001"
    echo "  🚁 Drone Service: http://localhost:3002"
    echo "  ⚙️  FeSetting Service: http://localhost:3003"
    echo ""
    print_message $CYAN "💡 提示: 服務可能需要 1-2 分鐘完全啟動"
}

# 顯示狀態
show_status() {
    print_message $BLUE "📋 容器狀態："
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME ps
}

# 停止所有服務
stop_services() {
    print_message $YELLOW "🛑 停止所有微服務..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME down
    print_message $GREEN "✅ 所有服務已停止"
}

# 重啟所有服務
restart_services() {
    print_message $YELLOW "🔄 重啟所有微服務..."
    stop_services
    sleep 3
    start_services
    wait_for_services
    show_endpoints
}

# 顯示日誌
show_logs() {
    local service=$1
    cd "$PROJECT_ROOT/infrastructure/docker"
    
    if [ -z "$service" ]; then
        print_message $BLUE "📝 顯示所有服務日誌："
        docker-compose -f docker-compose.yml -p $PROJECT_NAME logs --tail=50
    else
        print_message $BLUE "📝 顯示 $service 服務日誌："
        docker-compose -f docker-compose.yml -p $PROJECT_NAME logs -f "$service"
    fi
}

# 清理資源
clean_all() {
    print_message $YELLOW "🧹 清理所有資源（包括數據卷）..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME down -v --remove-orphans
    print_message $GREEN "✅ 清理完成"
}

# 顯示幫助
show_help() {
    echo "AIOT 微服務啟動腳本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令："
    echo "  start (默認)    啟動所有微服務"
    echo "  stop           停止所有微服務"
    echo "  restart        重啟所有微服務"
    echo "  status         顯示服務狀態"
    echo "  logs [service] 顯示日誌"
    echo "  clean          清理所有資源"
    echo "  endpoints      顯示服務端點"
    echo "  help           顯示此幫助"
    echo ""
    echo "示例："
    echo "  $0              # 啟動所有服務"
    echo "  $0 start        # 啟動所有服務"
    echo "  $0 status       # 查看狀態"
    echo "  $0 logs         # 查看所有日誌"
    echo "  $0 logs kong    # 查看 Kong 日誌"
    echo "  $0 stop         # 停止服務"
    echo "  $0 clean        # 清理資源"
}

# 主函數
main() {
    local command="${1:-start}"
    
    case "$command" in
        "start"|"")
            check_docker
            check_config
            start_services
            wait_for_services
            show_endpoints
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            check_docker
            check_config
            restart_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs $2
            ;;
        "clean")
            clean_all
            ;;
        "endpoints")
            show_endpoints
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_message $RED "❌ 未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@"
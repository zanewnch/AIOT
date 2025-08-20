#!/bin/bash

# AIOT 微服務管理腳本
# Usage: ./manage-microservices.sh [command] [options]

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 檢查 Docker 和 Docker Compose
check_requirements() {
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker 未安裝或未在 PATH 中"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_message $RED "❌ Docker Compose 未安裝或未在 PATH 中"
        exit 1
    fi
    
    print_message $GREEN "✅ Docker 和 Docker Compose 已就緒"
}

# 啟動基礎設施服務
start_infrastructure() {
    print_message $BLUE "🚀 啟動基礎設施服務..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME up -d \
        consul \
        aiot-mysqldb \
        aiot-mongodb \
        aiot-redis \
        aiot-rabbitmq
    
    print_message $GREEN "✅ 基礎設施服務已啟動"
    
    # 等待服務健康檢查
    print_message $YELLOW "⏳ 等待服務健康檢查..."
    sleep 10
    
    # 檢查 Consul 狀態
    if curl -f http://localhost:8500/v1/status/leader > /dev/null 2>&1; then
        print_message $GREEN "✅ Consul 服務正常"
    else
        print_message $YELLOW "⚠️ Consul 服務可能尚未完全就緒"
    fi
}

# 啟動 API Gateway
start_gateway() {
    print_message $BLUE "🌐 啟動 API Gateway..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME up -d kong
    
    print_message $GREEN "✅ API Gateway 已啟動"
    
    # 等待 API Gateway 服務就緒
    sleep 5
    if curl -f http://localhost:8001/ > /dev/null 2>&1; then
        print_message $GREEN "✅ API Gateway Admin API 可用: http://localhost:8001"
        print_message $GREEN "✅ API Gateway Proxy 可用: http://localhost:8000"
    else
        print_message $YELLOW "⚠️ API Gateway 服務可能尚未完全就緒"
    fi
}

# 啟動微服務
start_microservices() {
    print_message $BLUE "🎯 啟動微服務..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME up -d \
        rbac-service \
        drone-service \
        fesetting-service
    
    print_message $GREEN "✅ 微服務已啟動"
    
    # 等待微服務註冊到 Consul
    print_message $YELLOW "⏳ 等待微服務註冊到 Consul..."
    sleep 15
    
    # 檢查服務註冊狀態
    check_service_registration
}

# 檢查服務註冊狀態
check_service_registration() {
    print_message $BLUE "🔍 檢查服務註冊狀態..."
    
    local services=("rbac-service" "drone-service" "fesetting-service")
    for service in "${services[@]}"; do
        if curl -s "http://localhost:8500/v1/health/service/$service" | grep -q '"Status":"passing"'; then
            print_message $GREEN "✅ $service 已註冊且健康"
        else
            print_message $YELLOW "⚠️ $service 註冊狀態待確認"
        fi
    done
}

# 啟動監控服務
start_monitoring() {
    print_message $BLUE "📊 啟動監控服務..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME --profile monitoring up -d \
        prometheus \
        grafana
    
    print_message $GREEN "✅ 監控服務已啟動"
    print_message $GREEN "📊 Prometheus: http://localhost:9090"
    print_message $GREEN "📈 Grafana: http://localhost:3000 (admin/admin)"
}

# 完整啟動
start_all() {
    print_message $BLUE "🚀 啟動完整 AIOT 微服務架構..."
    
    start_infrastructure
    start_gateway
    start_microservices
    
    print_message $GREEN "🎉 AIOT 微服務架構啟動完成!"
    print_message $BLUE "📋 服務端點:"
    echo "  🌐 API Gateway (API 入口): http://localhost:8000"
    echo "  🔧 API Gateway Admin API: http://localhost:8001"
    echo "  🏛️  Consul UI: http://localhost:8500"
    echo "  🐰 RabbitMQ Management: http://localhost:15672 (admin/admin)"
    echo "  🔐 RBAC Service: http://localhost:3001"
    echo "  🚁 Drone Service: http://localhost:3002"
    echo "  ⚙️  FeSetting Service: http://localhost:3003"
}

# 停止所有服務
stop_all() {
    print_message $YELLOW "🛑 停止所有服務..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME down
    print_message $GREEN "✅ 所有服務已停止"
}

# 重啟所有服務
restart_all() {
    print_message $YELLOW "🔄 重啟所有服務..."
    stop_all
    sleep 3
    start_all
}

# 查看服務狀態
status() {
    print_message $BLUE "📋 服務狀態:"
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME ps
    
    print_message $BLUE "🔍 Consul 註冊的服務:"
    curl -s http://localhost:8500/v1/catalog/services | jq '.' 2>/dev/null || echo "無法獲取 Consul 服務列表"
}

# 查看日誌
logs() {
    local service=$1
    cd "$PROJECT_ROOT/infrastructure/docker"
    if [ -z "$service" ]; then
        print_message $BLUE "📝 顯示所有服務日誌 (最近 50 行):"
        docker-compose -f docker-compose.yml -p $PROJECT_NAME logs --tail=50
    else
        print_message $BLUE "📝 顯示 $service 服務日誌:"
        docker-compose -f docker-compose.yml -p $PROJECT_NAME logs -f "$service"
    fi
}

# 清理所有資源
clean() {
    print_message $YELLOW "🧹 清理所有資源..."
    cd "$PROJECT_ROOT/infrastructure/docker"
    docker-compose -f docker-compose.yml -p $PROJECT_NAME down -v --remove-orphans
    docker system prune -f
    print_message $GREEN "✅ 清理完成"
}

# 顯示幫助信息
show_help() {
    echo "AIOT 微服務管理腳本"
    echo ""
    echo "使用方法: $0 [command]"
    echo ""
    echo "命令:"
    echo "  start-infra         啟動基礎設施服務 (Consul, 數據庫等)"
    echo "  start-gateway       啟動 API Gateway"
    echo "  start-services      啟動微服務"
    echo "  start-monitoring    啟動監控服務"
    echo "  start-all           啟動所有服務"
    echo "  stop                停止所有服務"
    echo "  restart             重啟所有服務"
    echo "  status              查看服務狀態"
    echo "  logs [service]      查看日誌 (可選指定服務名)"
    echo "  clean               清理所有資源"
    echo "  help                顯示此幫助信息"
    echo ""
    echo "示例:"
    echo "  $0 start-all        # 啟動完整架構"
    echo "  $0 logs drone-service # 查看 drone 服務日誌"
    echo "  $0 status           # 查看所有服務狀態"
}

# 主函數
main() {
    check_requirements
    
    case "${1:-help}" in
        "start-infra")
            start_infrastructure
            ;;
        "start-gateway")
            start_gateway
            ;;
        "start-services")
            start_microservices
            ;;
        "start-monitoring")
            start_monitoring
            ;;
        "start-all")
            start_all
            ;;
        "stop")
            stop_all
            ;;
        "restart")
            restart_all
            ;;
        "status")
            status
            ;;
        "logs")
            logs $2
            ;;
        "clean")
            clean
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 執行主函數
main "$@"
#!/bin/bash

# AIOT Kubernetes 部署腳本
# 單節點 Kubernetes 集群部署指南

set -e

echo "🚀 開始部署 AIOT 微服務到 Kubernetes..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查 kubectl 是否可用
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl 未安裝或不在 PATH 中${NC}"
    exit 1
fi

# 檢查 Kubernetes 集群連接
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ 無法連接到 Kubernetes 集群${NC}"
    echo "請確保："
    echo "1. Kubernetes 集群正在運行 (minikube start / kind create cluster)"
    echo "2. kubectl 配置正確"
    exit 1
fi

echo -e "${GREEN}✅ Kubernetes 集群連接正常${NC}"

# 創建存儲目錄
echo -e "${BLUE}📁 創建存儲目錄...${NC}"
mkdir -p /home/user/k8s-storage/aiot/{mysql,mongodb,redis,rabbitmq,consul,prometheus,grafana}
chmod -R 755 /home/user/k8s-storage/aiot/

# 階段 1: 部署命名空間
echo -e "${BLUE}🏗️  階段 1: 創建命名空間...${NC}"
kubectl apply -f namespaces/

# 階段 2: 部署存儲
echo -e "${BLUE}💾 階段 2: 部署持久化存儲...${NC}"
kubectl apply -f storage/

# 等待 PV 和 PVC 就緒
echo -e "${YELLOW}⏳ 等待存儲就緒...${NC}"
kubectl wait --for=condition=Bound pvc --all -n aiot --timeout=60s

# 階段 3: 部署配置和密鑰
echo -e "${BLUE}⚙️  階段 3: 部署配置和密鑰...${NC}"
kubectl apply -f configmaps/
kubectl apply -f secrets/

# 階段 4: 部署資料庫服務
echo -e "${BLUE}🗄️  階段 4: 部署資料庫服務...${NC}"
kubectl apply -f databases/

# 等待資料庫服務就緒
echo -e "${YELLOW}⏳ 等待資料庫服務就緒...${NC}"
kubectl wait --for=condition=Ready pod -l app=mysql -n aiot --timeout=300s
kubectl wait --for=condition=Ready pod -l app=mongodb -n aiot --timeout=300s
kubectl wait --for=condition=Ready pod -l app=redis -n aiot --timeout=180s
kubectl wait --for=condition=Ready pod -l app=rabbitmq -n aiot --timeout=300s

# 階段 5: 部署基礎設施服務
echo -e "${BLUE}🏗️  階段 5: 部署基礎設施服務...${NC}"
kubectl apply -f infrastructure/

# 等待基礎設施服務就緒
echo -e "${YELLOW}⏳ 等待基礎設施服務就緒...${NC}"
kubectl wait --for=condition=Ready pod -l app=consul -n aiot --timeout=180s
kubectl wait --for=condition=Ready pod -l app=opa -n aiot --timeout=180s
kubectl wait --for=condition=Ready pod -l app=kong -n aiot --timeout=300s

# 階段 6: 構建微服務 Docker 鏡像
echo -e "${BLUE}🔨 階段 6: 構建微服務 Docker 鏡像...${NC}"

# 檢查是否在 minikube 環境
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo -e "${YELLOW}📦 檢測到 minikube，設置 Docker 環境...${NC}"
    eval $(minikube docker-env)
fi

# 構建微服務鏡像
MICROSERVICES_DIR="/home/user/GitHub/AIOT/microServices"
SERVICES=("rbac-service" "drone-service" "drone-websocket-service" "general-service" "docs-service" "llm-service")

for service in "${SERVICES[@]}"; do
    echo -e "${BLUE}🔨 構建 $service 鏡像...${NC}"
    if [ -f "$MICROSERVICES_DIR/$service/Dockerfile" ]; then
        docker build -t "aiot-$service:latest" "$MICROSERVICES_DIR/$service/"
    else
        echo -e "${YELLOW}⚠️  警告: $service/Dockerfile 不存在，跳過構建${NC}"
    fi
done

# 階段 7: 部署微服務
echo -e "${BLUE}🚀 階段 7: 部署微服務...${NC}"
kubectl apply -f microservices/

# 等待微服務就緒
echo -e "${YELLOW}⏳ 等待微服務就緒...${NC}"
for service in "${SERVICES[@]}"; do
    echo -e "${BLUE}⏳ 等待 $service 就緒...${NC}"
    kubectl wait --for=condition=Ready pod -l app=$service -n aiot --timeout=300s
done

# 顯示部署狀態
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${BLUE}📊 部署狀態：${NC}"
kubectl get pods -n aiot
echo ""
kubectl get services -n aiot

echo ""
echo -e "${GREEN}🌐 訪問信息：${NC}"
echo "API Gateway (Kong): http://localhost:30000"
echo "Kong Admin: http://localhost:30001"
echo "Consul UI: kubectl port-forward -n aiot svc/consul-service 8500:8500"
echo "RabbitMQ Management: kubectl port-forward -n aiot svc/rabbitmq-service 15672:15672"

echo ""
echo -e "${YELLOW}📝 有用的命令：${NC}"
echo "查看 Pod 狀態: kubectl get pods -n aiot"
echo "查看 Pod 日誌: kubectl logs -n aiot <pod-name>"
echo "進入 Pod: kubectl exec -it -n aiot <pod-name> -- /bin/bash"
echo "端口轉發: kubectl port-forward -n aiot svc/<service-name> <local-port>:<service-port>"

echo ""
echo -e "${GREEN}✅ AIOT 微服務成功部署到 Kubernetes！${NC}"
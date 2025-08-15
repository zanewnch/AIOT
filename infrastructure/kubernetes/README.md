# AIOT Kubernetes 部署指南

## 🎯 概述

這個目錄包含了將 AIOT 微服務架構從 Docker Compose 轉換到 Kubernetes 的完整配置。架構採用 **one cluster, one node** 模式，每個 Docker 容器對應一個 Kubernetes Pod。

## 📁 目錄結構

```
kubernetes/
├── namespaces/           # 命名空間配置
│   └── aiot-namespace.yaml
├── storage/              # 持久化存儲
│   └── persistent-volumes.yaml
├── configmaps/           # 配置管理
│   └── common-config.yaml
├── secrets/              # 敏感資訊
│   └── aiot-secrets.yaml
├── databases/            # 資料庫服務
│   ├── mysql.yaml
│   ├── mongodb.yaml
│   ├── redis.yaml
│   └── rabbitmq.yaml
├── infrastructure/       # 基礎設施服務
│   ├── consul.yaml
│   ├── opa.yaml
│   └── kong.yaml
├── microservices/        # 微服務
│   ├── rbac-service.yaml
│   ├── drone-service.yaml
│   ├── drone-websocket-service.yaml
│   ├── general-service.yaml
│   └── docs-service.yaml
├── deploy.sh            # 自動部署腳本
└── README.md            # 本文件
```

## 🚀 快速開始

### 前置需求

1. **Kubernetes 集群**：
   ```bash
   # 使用 minikube (推薦)
   minikube start --cpus=4 --memory=8192

   # 或使用 kind
   kind create cluster --name aiot-cluster
   ```

2. **kubectl 配置**：
   ```bash
   kubectl cluster-info
   ```

3. **Docker 環境** (用於構建鏡像)：
   ```bash
   docker --version
   ```

### 🔧 部署步驟

#### 方法一：自動部署 (推薦)

```bash
# 進入 kubernetes 目錄
cd /home/user/GitHub/AIOT/infrastructure/kubernetes

# 執行自動部署腳本
./deploy.sh
```

#### 方法二：手動部署

```bash
# 1. 創建存儲目錄
sudo mkdir -p /mnt/k8s-storage/aiot/{mysql,mongodb,redis,rabbitmq,consul}
sudo chmod -R 755 /mnt/k8s-storage/aiot/

# 2. 部署命名空間
kubectl apply -f namespaces/

# 3. 部署存儲
kubectl apply -f storage/
kubectl wait --for=condition=Bound pvc --all -n aiot --timeout=60s

# 4. 部署配置和密鑰
kubectl apply -f configmaps/
kubectl apply -f secrets/

# 5. 部署資料庫服務
kubectl apply -f databases/
kubectl wait --for=condition=Ready pod -l app=mysql -n aiot --timeout=300s

# 6. 部署基礎設施服務
kubectl apply -f infrastructure/
kubectl wait --for=condition=Ready pod -l app=kong -n aiot --timeout=300s

# 7. 構建並部署微服務
# (如果使用 minikube)
eval $(minikube docker-env)

# 構建鏡像
docker build -t aiot-rbac-service:latest /home/user/GitHub/AIOT/microServices/rbac-service/
docker build -t aiot-drone-service:latest /home/user/GitHub/AIOT/microServices/drone-service/
docker build -t aiot-drone-websocket-service:latest /home/user/GitHub/AIOT/microServices/drone-websocket-service/
docker build -t aiot-general-service:latest /home/user/GitHub/AIOT/microServices/general-service/
docker build -t aiot-docs-service:latest /home/user/GitHub/AIOT/microServices/docs-service/

# 部署微服務
kubectl apply -f microservices/
```

## 🏗️ 架構映射

### Docker Compose → Kubernetes 對照表

| Docker Compose 服務 | Kubernetes Pod | Service Name | 端口 |
|---------------------|----------------|--------------|------|
| aiot-consul | consul-deployment | consul-service | 8500, 8600 |
| aiot-kong | kong-deployment | kong-service | 8000, 8001 |
| aiot-opa | opa-deployment | opa-service | 8181, 9191 |
| aiot-mysqldb | mysql-deployment | mysql-service | 3306 |
| aiot-mongodb | mongodb-deployment | mongodb-service | 27017 |
| aiot-redis | redis-deployment | redis-service | 6379 |
| aiot-rabbitmq | rabbitmq-deployment | rabbitmq-service | 5672, 15672 |
| rbac-service | rbac-service-deployment | rbac-service | 50051 |
| drone-service | drone-service-deployment | drone-service | 50052 |
| drone-websocket-service | drone-websocket-service-deployment | drone-websocket-service | 3004 |
| general-service | general-service-deployment | general-service | 50053 |
| docs-service | docs-service-deployment | docs-service | 3005 |

### 存儲策略

- **單節點存儲**：使用 `hostPath` PersistentVolumes
- **存儲路徑**：`/mnt/k8s-storage/aiot/`
- **回收策略**：`Retain` (數據保留)

### 網路配置

- **內部通訊**：通過 Kubernetes 內建 DNS (`<service-name>.aiot.svc.cluster.local`)
- **外部訪問**：通過 NodePort (Kong Gateway: 30000, Kong Admin: 30001)

## 🌐 訪問服務

### 外部訪問

```bash
# API Gateway (主要入口)
curl http://localhost:30000

# Kong Admin API
curl http://localhost:30001
```

### 內部服務訪問 (需要端口轉發)

```bash
# Consul UI
kubectl port-forward -n aiot svc/consul-service 8500:8500
# 訪問: http://localhost:8500

# RabbitMQ Management
kubectl port-forward -n aiot svc/rabbitmq-service 15672:15672
# 訪問: http://localhost:15672 (admin/admin)

# Docs Service
kubectl port-forward -n aiot svc/docs-service 3005:3005
# 訪問: http://localhost:3005
```

## 🔍 監控和除錯

### 查看狀態

```bash
# 查看所有 Pod
kubectl get pods -n aiot

# 查看所有服務
kubectl get services -n aiot

# 查看持久化存儲
kubectl get pv,pvc -n aiot

# 查看配置
kubectl get configmaps,secrets -n aiot
```

### 查看日誌

```bash
# 查看特定 Pod 日誌
kubectl logs -n aiot <pod-name>

# 實時查看日誌
kubectl logs -f -n aiot <pod-name>

# 查看多個容器的日誌
kubectl logs -n aiot <pod-name> -c <container-name>
```

### 進入容器除錯

```bash
# 進入 Pod
kubectl exec -it -n aiot <pod-name> -- /bin/bash

# 執行單次命令
kubectl exec -n aiot <pod-name> -- <command>
```

## 🚨 故障排除

### 常見問題

1. **Pod 一直在 Pending 狀態**
   ```bash
   kubectl describe pod -n aiot <pod-name>
   # 檢查存儲和資源分配
   ```

2. **服務無法連接**
   ```bash
   kubectl get endpoints -n aiot
   # 檢查服務端點
   ```

3. **鏡像拉取失敗**
   ```bash
   # 確保在 minikube 環境中構建鏡像
   eval $(minikube docker-env)
   ```

4. **存儲權限問題**
   ```bash
   sudo chmod -R 755 /mnt/k8s-storage/aiot/
   sudo chown -R $(id -u):$(id -g) /mnt/k8s-storage/aiot/
   ```

### 重置和清理

```bash
# 刪除所有 AIOT 資源
kubectl delete namespace aiot

# 清理存儲 (可選)
sudo rm -rf /mnt/k8s-storage/aiot/

# 重新部署
./deploy.sh
```

## 🔄 與 Docker Compose 的差異

### 優勢

✅ **更好的健康檢查和自動恢復**  
✅ **聲明式配置管理**  
✅ **內建負載均衡**  
✅ **更豐富的資源管理**  
✅ **為生產環境做準備**  

### 注意事項

⚠️ **開發模式**: 當前配置支持 hot-reload，通過掛載源代碼目錄  
⚠️ **單節點限制**: hostPath 存儲僅適用於單節點集群  
⚠️ **鏡像管理**: 需要手動構建 Docker 鏡像  

## 📚 相關文檔

- [Kubernetes 官方文檔](https://kubernetes.io/docs/)
- [Docker Compose vs Kubernetes](https://kubernetes.io/docs/concepts/workloads/)
- [Kong Gateway on Kubernetes](https://docs.konghq.com/kubernetes-ingress-controller/)
- [OPA on Kubernetes](https://www.openpolicyagent.org/docs/latest/kubernetes-introduction/)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改進這個 Kubernetes 配置！
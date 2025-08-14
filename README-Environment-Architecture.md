# AIOT 環境架構指南

## 🏗️ 雙環境分離架構

AIOT 項目採用完全分離的雙環境架構：

- **🐳 Docker Compose** = **開發環境專用**
- **☸️ Kubernetes** = **生產環境專用**

### 重要原則
**兩套環境各司其職，不混用！**

---

## 🐳 開發環境 (Development)

### 特性
- **容器編排**：Docker Compose
- **Hot-Reload**：所有服務支援即時重載
- **除錯支援**：開放除錯端口，IDE 遠程除錯
- **資源管理**：無限制，最大化開發效率
- **資料庫**：容器化，支援快速重置

### 服務配置

| 服務 | 容器名稱 | HTTP端口 | gRPC端口 | Debug端口 | 技術棧 |
|------|----------|----------|----------|-----------|--------|
| Kong Gateway | `aiot-kong-dev` | 8000, 8001 | - | - | Kong 3.4 |
| RBAC Service | `aiot-rbac-dev` | 3001 | 50051 | 9229 | Express.js + nodemon |
| Drone Service | `aiot-drone-dev` | 3002 | 50052 | 9230 | Express.js + gRPC + nodemon |
| Drone WebSocket | `aiot-drone-websocket-dev` | 3004 | - | 9231 | Socket.IO + nodemon |
| General Service | `aiot-general-dev` | 3003 | 50053 | 9232 | Express.js + gRPC + nodemon |
| Docs Service | `aiot-docs-dev` | 3005 | - | 9233 | Express.js + nodemon |
| LLM Service | `aiot-llm-dev` | 8020 | - | 5678 | Django + runserver |

### 啟動命令

```bash
# 啟動開發環境
docker-compose -f docker-compose.dev.yml up -d

# 啟動含監控的開發環境
docker-compose -f docker-compose.dev.yml --profile monitoring up -d

# 查看服務狀態
docker-compose -f docker-compose.dev.yml ps

# 查看服務日誌
docker-compose -f docker-compose.dev.yml logs -f [service-name]

# 停止開發環境
docker-compose -f docker-compose.dev.yml down
```

### 開發環境 Kong 配置
- **配置文件**：`infrastructure/kong/kong.yaml` (開發專用)
- **服務發現**：Docker Compose 服務名稱
- **網路**：`aiot-dev-network`

---

## ☸️ 生產環境 (Production)

### 特性
- **容器編排**：Kubernetes
- **高可用性**：多副本部署，自動容錯
- **資源管理**：精確的 CPU/Memory 限制
- **監控告警**：完整的 metrics 和 logging
- **安全隔離**：網路政策，資源配額

### 命名空間設計
- **Namespace**：`aiot-prod`
- **資源配額**：CPU 8核, Memory 16GB, Storage 50GB
- **網路政策**：安全隔離，僅允許必要通訊

### 服務配置

| 服務 | Deployment名稱 | Service名稱 | Replicas | 資源限制 |
|------|----------------|-------------|----------|----------|
| Kong Gateway | `kong-deployment` | `kong-service` | 2 | CPU: 400m, Mem: 512Mi |
| RBAC Service | `rbac-service-deployment` | `rbac-service` | 3 | CPU: 500m, Mem: 512Mi |
| Drone Service | `drone-service-deployment` | `drone-service` | 3 | CPU: 600m, Mem: 1Gi |
| Drone WebSocket | `drone-websocket-deployment` | `drone-websocket-service` | 2 | CPU: 300m, Mem: 256Mi |
| General Service | `general-service-deployment` | `general-service` | 2 | CPU: 400m, Mem: 512Mi |
| Docs Service | `docs-service-deployment` | `docs-service` | 2 | CPU: 200m, Mem: 256Mi |
| LLM Service | `llm-service-deployment` | `llm-service` | 2 | CPU: 800m, Mem: 2Gi |

### 部署命令

```bash
# 創建生產環境命名空間和配額
kubectl apply -f infrastructure/kubernetes/namespaces/aiot-prod-namespace.yaml

# 部署生產環境 ConfigMaps
kubectl apply -f infrastructure/kubernetes/configmaps/

# 部署基礎設施 (Kong, 資料庫等)
kubectl apply -f infrastructure/kubernetes/infrastructure/
kubectl apply -f infrastructure/kubernetes/databases/

# 部署微服務
kubectl apply -f infrastructure/kubernetes/microservices/

# 檢查部署狀態
kubectl get all -n aiot-prod

# 查看服務日誌
kubectl logs -f deployment/[deployment-name] -n aiot-prod
```

### 生產環境 Kong 配置
- **配置文件**：`infrastructure/kong/kong-prod.yaml` (生產專用)
- **服務發現**：Kubernetes 服務名稱 (FQDN)
- **負載平衡**：Upstream 配置，健康檢查
- **安全插件**：速率限制、CORS、監控

---

## 🔧 配置差異對比

| 項目 | 開發環境 | 生產環境 |
|------|----------|----------|
| **容器編排** | Docker Compose | Kubernetes |
| **服務發現** | Docker服務名稱 | K8s服務FQDN |
| **Kong配置** | `kong.yaml` | `kong-prod.yaml` |
| **複本數量** | 1個 | 2-3個 |
| **資源限制** | 無限制 | 嚴格限制 |
| **監控** | 可選 | 內建 |
| **日誌等級** | debug | info |
| **安全政策** | 寬鬆 | 嚴格 |
| **網路隔離** | Bridge網路 | 網路政策 |

---

## 📋 環境切換清單

### 從開發轉生產
- [ ] 構建生產級 Docker 映像檔
- [ ] 更新 Kubernetes 配置中的映像檔標籤
- [ ] 使用 `kong-prod.yaml` 配置
- [ ] 設定生產級資料庫連線
- [ ] 配置 Ingress 和 TLS 憑證
- [ ] 啟用監控和日誌收集
- [ ] 執行安全性掃描

### 配置文件對應

| 用途 | 開發環境文件 | 生產環境文件 |
|------|--------------|--------------|
| 容器編排 | `docker-compose.dev.yml` | `infrastructure/kubernetes/` |
| Kong配置 | `kong.yaml` | `kong-prod.yaml` |
| 環境變數 | Docker Compose環境變數 | `02-prod-environment.yaml` |
| 網路配置 | `aiot-dev-network` | `aiot-prod` namespace |

---

## 🚀 快速開始

### 開發環境
```bash
# 1. 啟動開發環境
docker-compose -f docker-compose.dev.yml up -d

# 2. 檢查服務狀態
curl http://localhost:8000/docs

# 3. 除錯特定服務
docker-compose -f docker-compose.dev.yml logs -f rbac-service-dev
```

### 生產環境
```bash
# 1. 部署生產環境
kubectl apply -f infrastructure/kubernetes/namespaces/aiot-prod-namespace.yaml
./infrastructure/kubernetes/deploy.sh

# 2. 檢查服務狀態  
kubectl get pods -n aiot-prod
kubectl port-forward -n aiot-prod svc/kong-external-service 30000:8000

# 3. 訪問生產服務
curl http://localhost:30000/docs
```

---

## 📚 相關文檔

- [CLAUDE.md](./CLAUDE.md) - 完整開發配置指南
- [Kong Gateway文檔](./infrastructure/kong/README.md)
- [Kubernetes部署指南](./infrastructure/kubernetes/README.md)
- [微服務API文檔](http://localhost:8000/docs) (開發環境)
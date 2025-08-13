# AIOT Docker 配置說明

## 📁 檔案說明

### 🚀 主要配置
- **`docker-compose.yml`** - 微服務架構配置（推薦使用）
  - 包含 Kong Gateway + Consul 服務發現
  - 支援 RBAC、Drone、FeSetting 三個微服務
  - 包含完整的基礎設施服務（MySQL、MongoDB、Redis、RabbitMQ）
  - 支援監控服務（Prometheus、Grafana）

### 📋 管理工具
- **`manage-microservices.sh`** - 微服務管理腳本
  - 提供一鍵啟動/停止/重啟功能
  - 分階段服務啟動（基礎設施 → Gateway → 微服務）
  - 健康檢查和狀態監控

### 🗂️ 舊版本備份
- **`AIOT/docker-compose.yml.backup`** - 舊版本單體架構備份
  - 包含前端、後端、LLM 的單體架構
  - 僅供參考，不建議在微服務環境中使用

## 🚀 快速開始

### 啟動完整微服務架構

```bash
# 方法一：使用管理腳本（推薦）
cd infrastructure/docker
./manage-microservices.sh start-all

# 方法二：直接使用 docker-compose
docker-compose up -d
```

### 分步驟啟動

```bash
# 1. 啟動基礎設施
./manage-microservices.sh start-infra

# 2. 啟動 Kong Gateway
./manage-microservices.sh start-gateway

# 3. 啟動微服務
./manage-microservices.sh start-services

# 4. 啟動監控（可選）
./manage-microservices.sh start-monitoring
```

### 管理命令

```bash
# 查看服務狀態
./manage-microservices.sh status

# 查看所有服務日誌
./manage-microservices.sh logs

# 查看特定服務日誌
./manage-microservices.sh logs drone-service

# 停止所有服務
./manage-microservices.sh stop

# 重啟所有服務
./manage-microservices.sh restart

# 清理所有資源
./manage-microservices.sh clean
```

## 🌐 服務端點

啟動後可通過以下端點訪問服務：

| 服務 | 端點 | 說明 |
|------|------|------|
| Kong Gateway | http://localhost:8000 | API 統一入口 |
| Kong Admin | http://localhost:8001 | Kong 管理界面 |
| Consul UI | http://localhost:8500 | 服務發現界面 |
| RBAC Service | http://localhost:3001 | 認證授權服務 |
| Drone Service | http://localhost:3002 | 無人機管理服務 |
| FeSetting Service | http://localhost:3003 | 用戶偏好服務 |
| RabbitMQ Management | http://localhost:15672 | 消息隊列管理 (admin/admin) |
| Prometheus | http://localhost:9090 | 監控系統 (可選) |
| Grafana | http://localhost:3000 | 監控儀表板 (admin/admin, 可選) |

## ⚠️ 注意事項

1. **首次啟動**：服務間有依賴關係，建議使用 `start-all` 命令或分步驟啟動
2. **健康檢查**：等待服務完全啟動需要 1-2 分鐘
3. **端口衝突**：確保相關端口未被佔用
4. **資源需求**：完整架構需要足夠的 CPU 和內存資源

## 🔧 故障排除

### 服務啟動失敗
```bash
# 檢查服務狀態
./manage-microservices.sh status

# 查看特定服務日誌
./manage-microservices.sh logs [service-name]
```

### Kong 配置問題
```bash
# 檢查 Kong 配置
curl http://localhost:8001/

# 重新加載配置
docker-compose restart kong
```

### Consul 服務發現問題
```bash
# 檢查 Consul 狀態
curl http://localhost:8500/v1/status/leader

# 查看註冊的服務
curl http://localhost:8500/v1/catalog/services
```
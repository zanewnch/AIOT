# AIOT 文檔服務

統一管理所有 AIOT 微服務的 TypeDoc 文檔。

## 功能特色

- 🎯 **統一入口**: 所有微服務文檔的統一訪問入口
- 📚 **TypeDoc 支援**: 自動生成和展示 TypeDoc 文檔 
- 🔄 **實時更新**: 支援文檔的即時更新和重載
- 🎨 **美觀界面**: 現代化的文檔瀏覽界面
- 🚀 **高效能**: 靜態文件服務，快速載入

## 服務端點

- `http://localhost:3005/` - 根路徑，重定向到文檔首頁
- `http://localhost:3005/docs` - 文檔首頁
- `http://localhost:3005/docs/rbac/` - RBAC 服務文檔
- `http://localhost:3005/docs/drone/` - Drone 服務文檔
- `http://localhost:3005/docs/drone-websocket/` - Drone WebSocket 服務文檔
- `http://localhost:3005/docs/general/` - General 服務文檔
- `http://localhost:3005/docs/frontend/` - 前端應用文檔
- `http://localhost:3005/health` - 健康檢查
- `http://localhost:3005/info` - 服務資訊
- `http://localhost:3005/api/services` - 可用服務列表 API

## 部署方式

### 本地開發
```bash
npm install
npm run dev
```

### Docker 部署
```bash
docker-compose up docs-service
```

### 通過 Kong Gateway 訪問
- `http://localhost:8000/docs` - 通過 Kong 訪問文檔服務
- `http://localhost:8000/` - 根路徑通過 Kong 訪問

## 架構說明

此服務使用 Express.js 提供靜態文件服務，通過 Docker volume 掛載各微服務的文檔目錄，實現統一的文檔管理和訪問。

## 依賴關係

- Node.js 20+
- Express.js
- serve-static
- CORS 支援

## 監控和健康檢查

服務提供完整的健康檢查端點，支援：
- Consul 服務註冊和健康檢查
- Docker Compose 健康檢查
- 服務狀態監控

## 更新文檔

當微服務的 TypeDoc 文檔更新時，文檔服務會自動反映最新內容（在開發模式下禁用快取）。
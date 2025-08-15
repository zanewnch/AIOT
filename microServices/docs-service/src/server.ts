/**
 * @fileoverview AIOT 文檔服務 - HTTP 服務器啟動文件
 * 
 * ==============================================
 * 🎯 核心設計意圖 (Core Design Intent)
 * ==============================================
 * 
 * 這個文檔服務解決了微服務架構中的核心問題：
 * 1. 📚 **統一文檔入口**：將分散在各個微服務中的 TypeDoc 文檔集中管理
 * 2. 🔗 **跨服務瀏覽**：提供單一網址訪問所有服務的技術文檔
 * 3. 🚀 **開發者體驗**：簡化文檔查閱流程，提高開發效率
 * 4. 📋 **文檔標準化**：確保所有微服務文檔格式和訪問方式一致
 * 
 * ==============================================
 * 🏗️ 架構角色 (Architecture Role)  
 * ==============================================
 * 
 * 在 AIOT 微服務架構中，這個服務扮演以下角色：
 * 
 * ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
 * │   Kong Gateway  │    │  docs-service   │    │   TypeDoc 文檔   │
 * │    (HTTP 層)    │───▶│   (聚合層)      │───▶│    (文件層)     │
 * └─────────────────┘    └─────────────────┘    └─────────────────┘
 *      外部訪問              統一服務              靜態文檔文件
 * 
 * • Kong Gateway: 統一入口和路由 (/docs -> docs-service)
 * • docs-service: 文檔聚合和展示服務 (本文件)
 * • TypeDoc 文檔: 各微服務生成的靜態 HTML 文檔
 * 
 * ==============================================
 * 📂 文檔來源映射 (Document Source Mapping)
 * ==============================================
 * 
 * Docker Volume 掛載機制：
 * 宿主機路徑                                →  容器內路徑                    →  HTTP 路徑
 * /microServices/rbac-service/docs         →  /app/docs/rbac                →  /docs/rbac/
 * /microServices/drone-service/docs        →  /app/docs/drone               →  /docs/drone/
 * /microServices/drone-websocket-service/docs → /app/docs/drone-websocket    →  /docs/drone-websocket/
 * /microServices/general-service/docs      →  /app/docs/general             →  /docs/general/
 * 
 * ==============================================
 * 🌐 實際功能說明 (Actual Functionality)
 * ==============================================
 * 
 * 這個 Express.js 服務器實際執行的任務：
 * 
 * 1. **靜態文件伺服器**：
 *    - 使用 serve-static 中間件提供 TypeDoc 生成的 HTML 文檔
 *    - 支援 HTML、CSS、JavaScript 文件的正確 MIME 類型
 *    - 開發環境下禁用緩存，確保文檔更新即時生效
 * 
 * 2. **智能路由系統**：
 *    - `/docs/rbac/` → RBAC 服務的 TypeDoc 文檔
 *    - `/docs/drone/` → 無人機控制服務的 TypeDoc 文檔  
 *    - `/docs/drone-websocket/` → 無人機即時通訊服務的 TypeDoc 文檔
 *    - `/docs/general/` → 通用服務的 TypeDoc 文檔
 * 
 * 3. **用戶友好界面**：
 *    - `/` 提供美觀的文檔導航首頁 (EJS 模板渲染)
 *    - 響應式設計，支援桌面和移動設備
 *    - 卡片式佈局，清楚展示各服務文檔入口
 * 
 * 4. **服務監控**：
 *    - `/health` 健康檢查端點 (供 Docker/K8s 使用)
 *    - `/info` 服務詳細資訊和可用端點列表
 *    - `/api/services` RESTful API 獲取服務列表
 * 
 * 5. **開發友好特性**：
 *    - 詳細的請求日誌記錄
 *    - 404 錯誤處理與有用的錯誤訊息
 *    - 優雅的進程關閉處理 (SIGTERM/SIGINT)
 * 
 * ==============================================
 * 🔄 工作流程 (Workflow)
 * ==============================================
 * 
 * 1. 開發者修改微服務代碼
 * 2. 運行 `npm run docs:generate` 生成 TypeDoc 文檔
 * 3. 文檔文件更新到各服務的 `/docs` 目錄
 * 4. Docker volume 即時同步到文檔服務容器
 * 5. 開發者通過 Kong Gateway 訪問統一文檔入口
 * 6. 文檔服務提供即時更新的技術文檔
 * 
 * ==============================================
 * 🏛️ 架構設計模式 (Architecture Patterns)
 * ==============================================
 * 
 * 職責分離：
 * • app.ts: Express 應用程式配置 (中間件、路由、錯誤處理)
 * • server.ts: HTTP 服務器生命週期管理 (啟動、關閉、訊號處理)
 * 
 * 這種分離的好處：
 * • 測試友好：可以單獨測試 app 而不啟動 server
 * • 配置清晰：應用邏輯與服務器管理分離
 * • 部署靈活：可以在不同環境使用不同的啟動策略
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-01-13
 * @architecture Microservices + API Gateway + Static Documentation
 * @deployment Docker + Kong Gateway + Volume Mounts
 */

import { createApp } from './app.js';
import { config } from './config/index.js';

// ==============================================
// 🚀 服務器啟動
// ==============================================
const app = createApp();

app.listen(config.server.port, () => {
  console.log(`📚 AIOT 文檔服務已啟動`);
  console.log(`🌐 服務地址: http://localhost:${config.server.port}`);
  console.log(`📖 文檔首頁: http://localhost:${config.server.port}/docs`);
  console.log(`💊 健康檢查: http://localhost:${config.server.port}/health`);
  console.log(`ℹ️ 服務資訊: http://localhost:${config.server.port}/info`);
  console.log(`⚙️ 環境: ${config.server.environment}`);
  console.log(`🎨 模板引擎: EJS`);
  console.log(`==================================================`);
});

// ==============================================
// 🔚 優雅關閉處理
// ==============================================
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在優雅關閉文檔服務...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在優雅關閉文檔服務...');
  process.exit(0);
});

export default app;
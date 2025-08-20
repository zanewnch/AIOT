# AIOT - AI-Integrated Operations Platform

> 一個集成人工智慧與現代 Web 技術的全棧作業平台

## 🚀 項目特色

### 🎨 現代化前端架構
- **React 18 + TypeScript** - 採用最新 React 技術，提供完整的類型安全
- **Tailwind CSS + SCSS** - 現代化 CSS 解決方案，支援主題切換與響應式設計
- **Vite 構建工具** - 極速開發體驗，優化的打包策略與長期緩存
- **Redux Toolkit** - 可預測的狀態管理，搭配 React Query 實現高效數據同步
- **Browser Cache** - 使用 browser cache 應用在static resource and css file，提升頁面載入速度

### 🛠 企業級後端服務
- **Node.js + Express + TypeScript** - 高性能 RESTful API 服務
- **物件導向程式設計 (OOP)** - 採用完整的 OOP 封裝，讓程式碼更整潔易維護
- **嚴格類型安全** - 撰寫完整的 Interface 定義，絕不使用 any 類型
- **SOLID 設計原則** - 遵循完整的 SOLID 五大原則：
  - **S (單一職責原則)** - 拆分method logic 以達到SRP and SOC(Separation of Concerns)，並採用 CSR (Controller-Service-Repository) 明確 API 架構
  - **O (開放封閉原則)** - 透過更高層級的interface設計，實現擴展而不修改現有程式碼
  - **L (里氏替換原則)** - 使用Typescript 的 type 來達成"組合優於繼承"的核心概念，避免子類修改父類實作的問題
  - **I (介面隔離原則)** - 設計High granularity interface，避免 class implement uneccessary interface
  - **D (依賴反轉原則)** - 使用interface來實現 Dependency Injection，提升script 的 maintainability and testability
- **多資料庫架構** - MySQL、MongoDB、Redis 混合使用，各司其職
- **完整 RBAC 權限系統** - 角色型存取控制，支援細粒度權限管理
- **JWT 認證機制** - 安全的無狀態身份驗證
- **RabbitMQ 消息隊列** - 可靠的異步處理與服務解耦

### 🤖 AI 服務集成
- **Python Django 框架** - 專門的 AI 服務後端
- **Ollama 本地 LLM** - 集成大語言模型，支持本地化 AI 推理
- **向量數據庫** - Chroma DB 提供智能文檔檢索與語意搜索

### 📊 豐富的功能模組
- **實時活動追蹤** - 用戶行為監控與數據分析
- **進度管理系統** - 可視化進度追蹤，支援 SSE 實時更新
- **動態權限管理** - 用戶、角色、權限的動態分配與管理
- **數據表格視圖** - 支援多種數據模型的可視化與操作
- **主題系統** - 深色/淺色模式切換，個人化體驗

### 🔧 開發者體驗
- **完整 TypeScript 支援** - 前後端全面類型安全
- **自動生成文檔** - TypeDoc 生成的完整 API 文檔
- **Swagger API 規範** - 標準化的 API 文檔與測試介面
- **Jest 測試框架** - 單元測試與集成測試覆蓋
- **Docker 容器化** - 一鍵部署，環境一致性保證

### 🏗 技術架構亮點
- **微服務架構** - 前端、後端、AI 服務獨立部署
- **RESTful API 設計** - 標準化的 API 接口設計
- **組件化開發** - 可重用的 React 組件庫
- **模組化後端** - 清晰的 MVC 架構與依賴注入
- **效能優化** - 包含 CSS 長期緩存、代碼分割等優化策略

## 🌟 核心優勢

- **🎯 完整解決方案** - 從前端 UI 到後端服務，再到 AI 能力的完整技術棧
- **🔒 企業級安全** - JWT + RBAC 的雙重安全保障
- **⚡ 高效能設計** - 現代化構建工具與優化策略
- **📈 可擴展架構** - 微服務設計，支援水平擴展
- **🛡️ 類型安全** - 全棧 TypeScript，減少執行時錯誤
- **🔄 實時互動** - SSE 與 WebSocket 支援即時數據更新

## 🌐 服務端點

當啟動微服務架構後，可以通過以下端點訪問各個服務：

- 🌐 **API Gateway (API 入口)**: http://localhost:8000
- 🏛️ **Consul UI (服務發現)**: http://localhost:8500
- 🔐 **RBAC Service (認證授權)**: http://localhost:3001
- 🚁 **Drone Service (無人機管理)**: http://localhost:3002
- ⚙️ **FeSetting Service (用戶偏好)**: http://localhost:3003

### 其他服務
- 🐰 **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- 📊 **Prometheus (監控)**: http://localhost:9090 (可選)
- 📈 **Grafana (儀表板)**: http://localhost:3000 (admin/admin, 可選)

---


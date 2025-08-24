# 🔑 Auth Service

身份驗證與授權服務，負責用戶認證、JWT 管理和密碼安全。

## 📋 服務概述

Auth Service 是 AIOT 系統的核心認證服務，提供安全的用戶身份驗證和授權功能。

### 🎯 主要功能

- **JWT 驗證**: 安全的 Token 生成和驗證
- **用戶登入/登出**: 完整的身份驗證流程
- **Token 管理**: 自動 Token 刷新和過期處理
- **密碼安全**: 加密存儲和驗證
- **會話管理**: 用戶會話狀態追蹤

### 🏗️ 技術架構

- **框架**: Node.js + TypeScript + Express
- **通訊協議**: gRPC (內部) + HTTP (Gateway)
- **資料庫**: PostgreSQL (生產) / SQLite (開發)
- **加密**: bcrypt + JWT
- **快取**: Redis (會話存儲)

## 🚀 服務端點

### gRPC 服務
- **端口**: 50054
- **健康檢查**: `grpc_health_probe -addr=localhost:50054`

### HTTP API (透過 Gateway)
```
POST /api/auth/login      # 用戶登入
POST /api/auth/logout     # 用戶登出  
GET  /api/auth/me         # 獲取當前用戶資訊
POST /api/auth/refresh    # 刷新 Token
POST /api/auth/verify     # 驗證 Token
```

## 📁 專案結構

```
auth-service/
├── src/
│   ├── controllers/           # 控制器層
│   ├── services/             # 業務邏輯層
│   ├── repositories/         # 資料存取層
│   ├── routes/               # 路由定義
│   ├── middleware/           # 中間件
│   ├── configs/              # 配置文件
│   └── types/                # TypeScript 類型
├── protos/                   # gRPC 原型定義
└── tests/                    # 測試文件
```

## 🔧 開發指南

### 本地開發
```bash
# 安裝依賴
npm install

# 開發模式 (Hot Reload)
npm run dev

# 建置服務
npm run build

# 類型檢查
npm run type-check

# 代碼檢查
npm run lint
```

### 測試
```bash
# 單元測試
npm run test:unit

# 整合測試
npm run test:integration

# 測試覆蓋率
npm run test:coverage
```

## 🔍 健康檢查

```bash
# gRPC 健康檢查
grpc_health_probe -addr=localhost:50054

# HTTP 健康檢查 (透過 Gateway)
curl -f http://localhost:8000/api/auth/health
```

## 🛠️ 配置說明

### 環境變數
```bash
NODE_ENV=development           # 環境模式
GRPC_PORT=50054               # gRPC 端口
JWT_SECRET=your_secret_key    # JWT 密鑰
JWT_EXPIRES_IN=1d             # JWT 過期時間
BCRYPT_ROUNDS=12              # bcrypt 加密輪數
```

### 資料庫配置
- **開發環境**: SQLite (./dev.db)
- **生產環境**: PostgreSQL
- **Redis**: 會話和快取存儲

## 📝 API 使用範例

### 用戶登入
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### 獲取用戶資訊
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Cookie: auth_token=your_jwt_token"
```

## 🔐 安全特性

- **密碼加密**: bcrypt 哈希加密
- **JWT 安全**: 簽名驗證和過期檢查
- **CSRF 防護**: SameSite Cookie 設定
- **Rate Limiting**: API 請求頻率限制
- **輸入驗證**: 嚴格的參數驗證

## 📊 監控指標

- 認證成功/失敗率
- JWT Token 發放數量
- 用戶會話持續時間
- API 回應時間
- 錯誤日誌追蹤

---

**🏗️ AIOT Development Team**  
**版本**: 1.0.0  
**最後更新**: 2025-08-24
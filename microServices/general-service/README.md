# ⚙️ General Service

通用功能與系統管理服務，提供系統設定、資料處理和共用工具函數。

## 📋 服務概述

General Service 是 AIOT 系統的通用服務層，負責處理跨服務的共用功能、系統配置管理和輔助工具函數。

### 🎯 主要功能

- **系統設定**: 全域配置管理和參數調整
- **資料處理**: 通用資料轉換和處理工具
- **工具函數**: 共用的業務邏輯和輔助函數
- **檔案管理**: 檔案上傳、下載和管理
- **用戶偏好**: 個人化設定和偏好管理

### 🏗️ 技術架構

- **框架**: Node.js + TypeScript + Express
- **通訊協議**: gRPC (內部) + HTTP (Gateway)
- **資料庫**: PostgreSQL (生產) / SQLite (開發)
- **檔案儲存**: 本地檔案系統 / 雲端儲存
- **快取**: Redis (設定快取)

## 🚀 服務端點

### gRPC 服務
- **端口**: 50053
- **健康檢查**: `grpc_health_probe -addr=localhost:50053`

### HTTP API (透過 Gateway)
```
# 系統設定
GET    /api/general/settings        # 獲取系統設定
POST   /api/general/settings        # 更新系統設定
GET    /api/general/settings/:key   # 獲取特定設定
PUT    /api/general/settings/:key   # 更新特定設定

# 用戶偏好
GET    /api/general/preferences      # 獲取用戶偏好
POST   /api/general/preferences      # 更新用戶偏好
DELETE /api/general/preferences/:key # 刪除偏好設定

# 檔案管理
POST   /api/general/files/upload     # 檔案上傳
GET    /api/general/files/:id        # 檔案下載
DELETE /api/general/files/:id        # 刪除檔案
GET    /api/general/files            # 檔案列表

# 資料處理
POST   /api/general/data/transform   # 資料轉換
POST   /api/general/data/validate    # 資料驗證
POST   /api/general/data/export      # 資料匯出
POST   /api/general/data/import      # 資料匯入

# 工具函數
GET    /api/general/utils/timestamp  # 獲取伺服器時間
POST   /api/general/utils/hash       # 生成雜湊值
POST   /api/general/utils/uuid       # 生成 UUID
GET    /api/general/utils/info       # 系統資訊

# 健康檢查
GET    /api/general/health           # 服務健康檢查
```

## 📁 專案結構

```
general-service/
├── src/
│   ├── controllers/           # 控制器層
│   │   ├── commands/         # 命令處理器
│   │   └── queries/          # 查詢處理器
│   ├── services/             # 業務邏輯層
│   │   ├── settings/         # 設定管理服務
│   │   ├── files/            # 檔案管理服務
│   │   ├── data/             # 資料處理服務
│   │   └── utils/            # 工具函數服務
│   ├── repositories/         # 資料存取層
│   ├── entities/             # 資料實體
│   ├── routes/               # 路由定義
│   ├── middleware/           # 中間件
│   ├── configs/              # 配置文件
│   └── types/                # TypeScript 類型
├── uploads/                  # 檔案上傳目錄
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
grpc_health_probe -addr=localhost:50053

# HTTP 健康檢查 (透過 Gateway)
curl -f http://localhost:8000/api/general/health
```

## 🛠️ 配置說明

### 環境變數
```bash
NODE_ENV=development           # 環境模式
GRPC_PORT=50053               # gRPC 端口
DB_TYPE=sqlite                # 資料庫類型
UPLOAD_DIR=./uploads          # 檔案上傳目錄
MAX_FILE_SIZE=10485760        # 最大檔案大小 (10MB)
ALLOWED_FILE_TYPES=jpg,png,pdf # 允許的檔案類型
CACHE_TTL=3600                # 快取存活時間 (秒)
```

## 📊 資料模型

### 系統設定 (Setting)
```typescript
interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  description: string;
  category: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### 用戶偏好 (UserPreference)
```typescript
interface UserPreference {
  id: string;
  user_id: string;
  key: string;
  value: string;
  type: PreferenceType;
  created_at: Date;
  updated_at: Date;
}
```

### 檔案資訊 (FileInfo)
```typescript
interface FileInfo {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  uploaded_by: string;
  upload_date: Date;
  is_public: boolean;
}
```

## 📝 API 使用範例

### 獲取系統設定
```bash
curl -X GET http://localhost:8000/api/general/settings \
  -H "Cookie: auth_token=your_jwt_token"
```

### 更新用戶偏好
```bash
curl -X POST http://localhost:8000/api/general/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_jwt_token" \
  -d '{
    "theme": "dark",
    "language": "zh-TW",
    "notifications": true
  }'
```

### 檔案上傳
```bash
curl -X POST http://localhost:8000/api/general/files/upload \
  -H "Cookie: auth_token=your_jwt_token" \
  -F "file=@document.pdf" \
  -F "description=重要文件"
```

### 資料轉換
```bash
curl -X POST http://localhost:8000/api/general/data/transform \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_jwt_token" \
  -d '{
    "data": [1, 2, 3, 4, 5],
    "transform_type": "normalize",
    "parameters": {"min": 0, "max": 1}
  }'
```

## 🔧 通用工具函數

### 資料處理
- **資料驗證**: 輸入資料格式驗證
- **資料轉換**: JSON/XML/CSV 格式轉換
- **資料清理**: 去除無效資料和重複項
- **資料統計**: 基本統計資訊計算

### 檔案處理
- **檔案上傳**: 多種格式檔案上傳支援
- **檔案壓縮**: 自動檔案壓縮和解壓縮
- **檔案預覽**: 圖片和文件預覽生成
- **檔案轉換**: 格式轉換工具

### 系統工具
- **UUID 生成**: 唯一識別碼生成
- **雜湊計算**: MD5/SHA256 雜湊值計算
- **時間處理**: 時區轉換和格式化
- **加密解密**: 對稱加密工具

## 📋 系統設定分類

### 基本設定
- **系統名稱**: AIOT 無人機管理系統
- **版本資訊**: 系統版本和更新資訊
- **維護模式**: 系統維護狀態控制
- **日誌等級**: 系統日誌記錄等級

### 安全設定
- **密碼政策**: 密碼複雜度要求
- **會話超時**: 用戶會話過期時間
- **登入限制**: 失敗次數和鎖定時間
- **API 限制**: API 呼叫頻率限制

### 功能設定
- **檔案上傳限制**: 檔案大小和類型限制
- **快取配置**: Redis 快取相關設定
- **通知設定**: 系統通知開關和配置
- **備份設定**: 自動備份週期和保留期

## 📊 監控指標

- API 呼叫次數
- 檔案上傳統計
- 資料處理量
- 快取命中率
- 設定變更記錄
- 錯誤發生率
- 回應時間統計

---

**🏗️ AIOT Development Team**  
**版本**: 1.0.0  
**最後更新**: 2025-08-24
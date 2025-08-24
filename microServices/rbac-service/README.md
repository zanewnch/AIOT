# 🔐 RBAC Service

角色權限管理服務，提供完整的用戶、角色和權限管理功能。

## 📋 服務概述

RBAC (Role-Based Access Control) Service 負責管理系統的用戶權限、角色分配和存取控制，確保系統安全性。

### 🎯 主要功能

- **用戶管理**: 用戶帳號的創建、更新、刪除和查詢
- **角色管理**: 角色的定義、分配和權限綁定
- **權限控制**: 細粒度的權限定義和驗證
- **存取控制**: 基於角色的資源存取管理
- **審計日誌**: 權限變更和操作記錄

### 🏗️ 技術架構

- **框架**: Node.js + TypeScript + Express
- **通訊協議**: gRPC (內部) + HTTP (Gateway)
- **資料庫**: PostgreSQL (生產) / SQLite (開發)
- **ORM**: TypeORM
- **快取**: Redis (權限快取)

## 🚀 服務端點

### gRPC 服務
- **端口**: 50051
- **健康檢查**: `grpc_health_probe -addr=localhost:50051`

### HTTP API (透過 Gateway)
```
# 用戶管理
GET    /api/rbac/users        # 獲取用戶列表
POST   /api/rbac/users        # 創建用戶
GET    /api/rbac/users/:id    # 獲取特定用戶
PUT    /api/rbac/users/:id    # 更新用戶
DELETE /api/rbac/users/:id    # 刪除用戶

# 角色管理
GET    /api/rbac/roles        # 獲取角色列表
POST   /api/rbac/roles        # 創建角色
GET    /api/rbac/roles/:id    # 獲取特定角色
PUT    /api/rbac/roles/:id    # 更新角色
DELETE /api/rbac/roles/:id    # 刪除角色

# 權限管理
GET    /api/rbac/permissions  # 獲取權限列表
POST   /api/rbac/permissions  # 創建權限
GET    /api/rbac/permissions/:id    # 獲取特定權限
PUT    /api/rbac/permissions/:id    # 更新權限
DELETE /api/rbac/permissions/:id    # 刪除權限

# 角色權限分配
POST   /api/rbac/roles/:id/permissions    # 為角色分配權限
DELETE /api/rbac/roles/:id/permissions/:permissionId    # 移除角色權限

# 用戶角色分配
POST   /api/rbac/users/:id/roles    # 為用戶分配角色
DELETE /api/rbac/users/:id/roles/:roleId    # 移除用戶角色
```

## 📁 專案結構

```
rbac-service/
├── src/
│   ├── controllers/           # 控制器層
│   │   ├── commands/         # 命令處理器
│   │   └── queries/          # 查詢處理器
│   ├── services/             # 業務邏輯層
│   ├── repositories/         # 資料存取層
│   ├── entities/             # 資料實體
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

### 資料庫管理
```bash
# 運行遷移
npm run migration:run

# 創建遷移
npm run migration:create

# 種子資料
npm run seed
```

## 🔍 健康檢查

```bash
# gRPC 健康檢查
grpc_health_probe -addr=localhost:50051

# HTTP 健康檢查 (透過 Gateway)
curl -f http://localhost:8000/api/rbac/health
```

## 🛠️ 配置說明

### 環境變數
```bash
NODE_ENV=development           # 環境模式
GRPC_PORT=50051               # gRPC 端口
DB_TYPE=sqlite                # 資料庫類型
DB_HOST=localhost             # 資料庫主機
DB_PORT=5432                  # 資料庫端口
DB_NAME=aiot_rbac             # 資料庫名稱
DB_USERNAME=postgres          # 資料庫用戶名
DB_PASSWORD=password          # 資料庫密碼
```

## 📊 資料模型

### 用戶 (User)
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: Role[];
  created_at: Date;
  updated_at: Date;
}
```

### 角色 (Role)
```typescript
interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: Permission[];
  users: User[];
  created_at: Date;
  updated_at: Date;
}
```

### 權限 (Permission)
```typescript
interface Permission {
  id: string;
  name: string;
  display_name: string;
  resource: string;
  action: string;
  roles: Role[];
  created_at: Date;
  updated_at: Date;
}
```

## 📝 API 使用範例

### 獲取用戶列表
```bash
curl -X GET "http://localhost:8000/api/rbac/users?page=1&limit=10" \
  -H "Cookie: auth_token=your_jwt_token"
```

### 創建新用戶
```bash
curl -X POST http://localhost:8000/api/rbac/users \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_jwt_token" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "New",
    "last_name": "User",
    "password": "securePassword123"
  }'
```

### 為用戶分配角色
```bash
curl -X POST http://localhost:8000/api/rbac/users/user-id/roles \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_jwt_token" \
  -d '{"roleIds": ["admin-role-id", "user-role-id"]}'
```

## 🔐 預設角色和權限

### 預設角色
- **Admin**: 系統管理員，擁有所有權限
- **Manager**: 管理員，可管理用戶和基本設定
- **User**: 一般用戶，基本讀取權限
- **Guest**: 訪客，限制存取權限

### 權限分類
- **用戶管理**: `users:create`, `users:read`, `users:update`, `users:delete`
- **角色管理**: `roles:create`, `roles:read`, `roles:update`, `roles:delete`
- **權限管理**: `permissions:create`, `permissions:read`, `permissions:update`, `permissions:delete`
- **無人機控制**: `drones:control`, `drones:monitor`, `drones:configure`

## 📊 監控指標

- 用戶帳號數量
- 活躍用戶統計
- 權限檢查次數
- API 呼叫頻率
- 資料庫查詢效能
- 快取命中率

---

**🏗️ AIOT Development Team**  
**版本**: 1.0.0  
**最後更新**: 2025-08-24
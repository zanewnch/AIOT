# RoleController 測試說明文件

## 概述

此文件包含 `RoleController` 的完整測試套件，包括單元測試和整合測試。測試覆蓋了所有 CRUD 操作以及錯誤處理情境。

## 測試檔案結構

```
test/
├── RoleController.test.ts              # 單元測試
├── RoleController.integration.test.ts  # 整合測試
└── RoleController.test.md              # 測試說明文件 (本檔案)
```

## 測試框架與工具

- **Jest**: 測試框架
- **ts-jest**: TypeScript 支援
- **Supertest**: HTTP 請求測試
- **Express**: 路由整合測試

## 單元測試 (RoleController.test.ts)

### 測試目標
- 驗證 RoleController 各方法的業務邏輯
- 隔離所有外部依賴（RoleModel）
- 專注測試控制器的核心邏輯

### 測試覆蓋範圍

#### 1. `getRoles()` 方法
- ✅ 成功返回所有角色
- ✅ 資料庫錯誤處理

#### 2. `getRoleById()` 方法
- ✅ 成功返回指定 ID 的角色
- ✅ 角色不存在時返回 404
- ✅ 資料庫錯誤處理

#### 3. `createRole()` 方法
- ✅ 成功創建新角色
- ✅ 僅提供必要欄位時的處理
- ✅ 資料庫錯誤處理

#### 4. `updateRole()` 方法
- ✅ 成功更新角色
- ✅ 部分更新處理
- ✅ 角色不存在時返回 404
- ✅ 資料庫錯誤處理

#### 5. `deleteRole()` 方法
- ✅ 成功刪除角色
- ✅ 角色不存在時返回 404
- ✅ 資料庫錯誤處理

#### 6. Router 初始化
- ✅ 路由器正確初始化

## 整合測試 (RoleController.integration.test.ts)

### 測試目標
- 驗證 RoleController 與 Express 路由的整合
- 測試 HTTP 請求/回應流程
- 驗證狀態碼、回應格式、錯誤處理

### 測試覆蓋範圍

#### 1. GET `/roles`
- ✅ 返回所有角色 (200)
- ✅ 資料庫錯誤處理 (500)
- ✅ 空結果處理

#### 2. GET `/roles/:roleId`
- ✅ 返回指定角色 (200)
- ✅ 角色不存在 (404)
- ✅ 資料庫錯誤處理 (500)
- ✅ 各種 ID 格式處理

#### 3. POST `/roles`
- ✅ 成功創建角色 (201)
- ✅ 僅必要欄位創建
- ✅ 資料庫錯誤處理 (500)
- ✅ JSON 格式處理

#### 4. PUT `/roles/:roleId`
- ✅ 成功更新角色 (200)
- ✅ 部分更新處理
- ✅ 角色不存在 (404)
- ✅ 資料庫錯誤處理 (500)

#### 5. DELETE `/roles/:roleId`
- ✅ 成功刪除角色 (204)
- ✅ 角色不存在 (404)
- ✅ 資料庫錯誤處理 (500)

#### 6. 路由整合
- ✅ 不存在路由處理
- ✅ Content-Type 設定
- ✅ 中介軟體堆疊

## 執行測試

### 執行所有 RoleController 測試
```bash
npm test -- --testPathPattern="RoleController"
```

### 僅執行單元測試
```bash
npm test -- test/RoleController.test.ts
```

### 僅執行整合測試
```bash
npm test -- test/RoleController.integration.test.ts
```

### 執行測試並產生覆蓋率報告
```bash
npm test -- --coverage --testPathPattern="RoleController"
```

## 模擬策略

### 單元測試模擬
- **RoleModel**: 完全模擬，隔離資料庫操作
- **Express Request/Response**: 模擬 HTTP 介面

### 整合測試模擬
- **RoleModel**: 模擬資料庫操作，保留業務邏輯
- **Express App**: 真實的路由和中介軟體
- **JWT Middleware**: 模擬認證（如需要）

## 測試資料範例

### 角色測試資料
```javascript
const mockRole = {
    id: 1,
    name: 'admin',
    displayName: '系統管理員',
    createdAt: '2025-06-26T09:12:38.106Z',
    updatedAt: '2025-06-26T09:12:38.106Z'
};
```

### 創建角色請求資料
```javascript
const newRoleData = {
    name: 'moderator',
    displayName: '版主'
};
```

## 注意事項

1. **日期格式**: 整合測試使用字符串格式的日期，因為 JSON 序列化會將 Date 對象轉換為字符串。

2. **模擬函數**: 確保在每個測試前清除模擬函數的呼叫記錄，避免測試間的污染。

3. **錯誤處理**: 所有測試都包含適當的錯誤處理驗證，確保系統的穩定性。

4. **HTTP 狀態碼**: 嚴格驗證正確的 HTTP 狀態碼回應。

## 測試維護

- 當 RoleController 新增方法時，需要同步更新測試
- 當 RoleModel 介面變更時，需要更新模擬設定
- 定期檢查測試覆蓋率，確保新增程式碼都有適當的測試

## 相關檔案

- `src/controller/rbac/RoleController.ts` - 被測試的控制器
- `src/models/rbac/RoleModel.ts` - 資料模型
- `src/types/controllers/IRoleController.ts` - 控制器介面
- `jest.config.ts` - Jest 配置檔案
# RoleToPermissionController 測試說明文件

## 概述

此文件包含 `RoleToPermissionController` 的完整測試套件，包括單元測試和整合測試。測試覆蓋了角色權限關聯的所有操作以及錯誤處理情境。

## 測試檔案結構

```
test/
├── RoleToPermissionController.test.ts              # 單元測試
├── RoleToPermissionController.integration.test.ts  # 整合測試
└── RoleToPermissionController.test.md              # 測試說明文件 (本檔案)
```

## 測試框架與工具

- **Jest**: 測試框架
- **ts-jest**: TypeScript 支援
- **Supertest**: HTTP 請求測試
- **Express**: 路由整合測試

## 單元測試 (RoleToPermissionController.test.ts)

### 測試目標
- 驗證 RoleToPermissionController 角色權限關聯操作的業務邏輯
- 隔離所有外部依賴（RoleModel, PermissionModel）
- 專注測試控制器的核心邏輯
- 測試 Sequelize 關聯操作模擬

### 測試覆蓋範圍

#### 1. `getRolePermissions()` 方法
- ✅ 成功返回角色的權限列表
- ✅ 角色不存在時返回 404
- ✅ 資料庫錯誤處理
- ✅ 空權限列表處理

#### 2. `assignPermissionsToRole()` 方法
- ✅ 成功分配權限給角色
- ✅ 角色不存在時返回 404
- ✅ 空權限ID陣列處理
- ✅ 部分權限不存在的情況
- ✅ 資料庫錯誤處理

#### 3. `removePermissionFromRole()` 方法
- ✅ 成功從角色移除權限
- ✅ 角色不存在時返回 404
- ✅ 數字格式權限ID處理
- ✅ 資料庫錯誤處理
- ✅ 不存在權限移除操作處理

#### 4. Router 初始化
- ✅ 路由器正確初始化

## 整合測試 (RoleToPermissionController.integration.test.ts)

### 測試目標
- 驗證 RoleToPermissionController 與 Express 路由的整合
- 測試 HTTP 請求/回應流程
- 驗證狀態碼、回應格式、錯誤處理
- 測試角色權限關聯操作的路由參數處理

### 測試覆蓋範圍

#### 1. GET `/roles/:roleId/permissions`
- ✅ 返回角色權限列表 (200)
- ✅ 角色不存在 (404)
- ✅ 資料庫錯誤處理 (500)
- ✅ 空權限列表處理
- ✅ 各種角色ID格式處理

#### 2. POST `/roles/:roleId/permissions`
- ✅ 成功分配權限給角色 (200)
- ✅ 角色不存在 (404)
- ✅ 空權限ID陣列處理
- ✅ 資料庫錯誤處理 (500)
- ✅ JSON 格式請求處理
- ✅ 部分權限不存在情況

#### 3. DELETE `/roles/:roleId/permissions/:permissionId`
- ✅ 成功移除角色權限 (200)
- ✅ 角色不存在 (404)
- ✅ 資料庫錯誤處理 (500)
- ✅ 各種ID格式處理
- ✅ 不存在權限移除操作

#### 4. 路由整合
- ✅ 不存在路由處理
- ✅ Content-Type 設定
- ✅ 中介軟體堆疊
- ✅ 路由參數解析

## 執行測試

### 執行所有 RoleToPermissionController 測試
```bash
npm test -- --testPathPattern="RoleToPermissionController"
```

### 僅執行單元測試
```bash
npm test -- test/RoleToPermissionController.test.ts
```

### 僅執行整合測試
```bash
npm test -- test/RoleToPermissionController.integration.test.ts
```

### 執行測試並產生覆蓋率報告
```bash
npm test -- --coverage --testPathPattern="RoleToPermissionController"
```

## 模擬策略

### 單元測試模擬
- **RoleModel**: 完全模擬，隔離資料庫操作
- **PermissionModel**: 完全模擬，隔離資料庫操作
- **Express Request/Response**: 模擬 HTTP 介面
- **Sequelize 關聯方法**: 模擬 `$add`, `$remove` 方法

### 整合測試模擬
- **RoleModel**: 模擬資料庫操作，保留業務邏輯
- **PermissionModel**: 模擬資料庫操作，保留業務邏輯
- **Express App**: 真實的路由和中介軟體
- **JWT Middleware**: 模擬認證（如需要）

## 測試資料範例

### 角色測試資料
```javascript
const mockRole = {
    id: 1,
    name: 'admin',
    displayName: '系統管理員',
    permissions: mockPermissions,
    $add: jest.fn().mockResolvedValue(undefined),
    $remove: jest.fn().mockResolvedValue(1)
};
```

### 權限測試資料
```javascript
const mockPermissions = [
    { id: 1, name: 'read_users', description: '讀取使用者' },
    { id: 2, name: 'write_users', description: '寫入使用者' },
    { id: 3, name: 'delete_users', description: '刪除使用者' }
];
```

### 權限分配請求資料
```javascript
const assignRequest = {
    permissionIds: [1, 2, 3]
};
```

## 路由結構

### API 端點
- `GET /roles/:roleId/permissions` - 取得角色權限
- `POST /roles/:roleId/permissions` - 分配權限給角色
- `DELETE /roles/:roleId/permissions/:permissionId` - 移除角色權限

### 路由參數
- `:roleId` - 角色ID (數字)
- `:permissionId` - 權限ID (數字)

### 請求格式
```javascript
// POST /roles/:roleId/permissions
{
    "permissionIds": [1, 2, 3]
}
```

## Sequelize 關聯操作

### 測試的關聯方法
- `RoleModel.findByPk(roleId, { include: [PermissionModel] })` - 查詢角色及其權限
- `PermissionModel.findAll({ where: { id: permissionIds } })` - 查詢指定權限
- `role.$add('permissions', permissions)` - 新增權限關聯
- `role.$remove('permissions', permissionId)` - 移除權限關聯

### 關聯模型
- `RoleModel` ↔ `PermissionModel` (Many-to-Many) through `RolePermissionModel`

## 注意事項

1. **關聯操作**: 測試涵蓋了 Sequelize 的多對多關聯操作，包括 `$add` 和 `$remove` 方法。

2. **權限ID轉換**: `removePermissionFromRole` 方法會將字符串格式的 permissionId 轉換為數字。

3. **部分權限處理**: 當請求分配的權限中有些不存在時，系統會分配存在的權限。

4. **空陣列處理**: 系統能正確處理空的權限ID陣列。

5. **錯誤處理**: 所有測試都包含適當的錯誤處理驗證。

## 業務邏輯測試重點

### 權限查詢
- 使用 `include` 關聯查詢角色的權限
- 正確處理角色不存在的情況
- 返回完整的權限資訊

### 權限分配
- 驗證角色存在性
- 查詢並驗證權限存在性
- 使用 Sequelize 關聯方法新增權限
- 處理部分權限不存在的邊界情況

### 權限移除
- 驗證角色存在性
- 使用 Sequelize 關聯方法移除權限
- 正確處理 permissionId 的數字轉換
- 不驗證權限是否存在（允許冪等操作）

## 測試維護

- 當 RoleToPermissionController 新增方法時，需要同步更新測試
- 當關聯模型介面變更時，需要更新模擬設定
- 當路由結構變更時，需要更新整合測試
- 定期檢查測試覆蓋率，確保新增程式碼都有適當的測試

## 相關檔案

- `src/controller/rbac/RoleToPermissionController.ts` - 被測試的控制器
- `src/models/rbac/RoleModel.ts` - 角色資料模型
- `src/models/rbac/PermissionModel.ts` - 權限資料模型
- `src/models/rbac/RoleToPermissionModel.ts` - 角色權限關聯模型
- `src/types/controllers/IRoleToPermissionController.ts` - 控制器介面
- `jest.config.ts` - Jest 配置檔案
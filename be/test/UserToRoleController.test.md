# UserToRoleController 測試文件

## 概述

本文件提供對 `UserToRoleController` 單元測試和整合測試的完整說明，涵蓋所有使用者角色關聯管理功能的測試場景。

## 測試結構

### 檔案組織
```
test/
├── UserToRoleController.test.ts                 # 單元測試
├── UserToRoleController.integration.test.ts     # 整合測試
└── UserToRoleController.test.md                 # 測試說明文件
```

### 測試層級
- **單元測試**: 專注於 UserToRoleController 類別的業務邏輯，完全隔離外部依賴
- **整合測試**: 測試 UserToRoleController 與 Express 路由框架的整合行為

## 測試覆蓋範圍

### 1. 單元測試 (UserToRoleController.test.ts)

#### 1.1 getUserRoles 方法
- ✅ **成功場景**: 正確返回使用者的角色列表
- ✅ **空角色**: 處理使用者沒有角色的情況
- ✅ **404 錯誤**: 使用者不存在時的處理
- ✅ **500 錯誤**: 資料庫錯誤的處理
- ✅ **參數處理**: 各種使用者 ID 格式的解析

#### 1.2 assignRolesToUser 方法
- ✅ **批量分配**: 成功分配多個角色給使用者
- ✅ **單一分配**: 處理單一角色分配
- ✅ **空列表**: 處理空角色列表的分配
- ✅ **部分存在**: 處理部分角色不存在的情況
- ✅ **404 錯誤**: 使用者不存在時的處理
- ✅ **查詢失敗**: 角色查詢失敗的錯誤處理
- ✅ **分配失敗**: 角色分配操作失敗的錯誤處理
- ✅ **500 錯誤**: 其他資料庫錯誤

#### 1.3 removeRoleFromUser 方法
- ✅ **成功移除**: 成功從使用者移除角色
- ✅ **ID 轉換**: 字串角色 ID 轉數字的處理
- ✅ **冪等操作**: 移除不存在角色的處理
- ✅ **404 錯誤**: 使用者不存在時的處理
- ✅ **移除失敗**: 角色移除操作失敗的錯誤處理
- ✅ **無效 ID**: 無效角色 ID 的處理
- ✅ **500 錯誤**: 資料庫連接錯誤

#### 1.4 Router 初始化
- ✅ **Router 設定**: 驗證路由器正確初始化

### 2. 整合測試 (UserToRoleController.integration.test.ts)

#### 2.1 HTTP 路由測試

##### GET /users/:userId/roles
- ✅ **200 成功**: 返回使用者角色列表
- ✅ **空角色**: 處理使用者沒有角色的情況
- ✅ **404 錯誤**: 使用者不存在
- ✅ **500 錯誤**: 資料庫查詢失敗
- ✅ **參數解析**: 不同使用者 ID 格式的處理

##### POST /users/:userId/roles
- ✅ **200 成功**: 成功分配角色給使用者
- ✅ **單一角色**: 處理單一角色分配
- ✅ **空列表**: 處理空角色列表
- ✅ **部分存在**: 部分角色不存在的情況
- ✅ **404 錯誤**: 使用者不存在
- ✅ **500 錯誤**: 資料庫錯誤
- ✅ **JSON 格式**: Content-Type 處理
- ✅ **查詢失敗**: 角色查詢失敗處理
- ✅ **分配失敗**: 角色分配操作失敗處理

##### DELETE /users/:userId/roles/:roleId
- ✅ **200 成功**: 成功移除角色
- ✅ **ID 轉換**: 字串角色 ID 轉數字
- ✅ **冪等操作**: 移除不存在的角色
- ✅ **404 錯誤**: 使用者不存在
- ✅ **500 錯誤**: 資料庫錯誤
- ✅ **移除失敗**: 角色移除操作失敗
- ✅ **無效 ID**: 無效角色 ID 處理

#### 2.2 路由整合測試
- ✅ **404 路由**: 不存在路由的處理
- ✅ **Content-Type**: 回應格式驗證
- ✅ **中介軟體**: Express.json() 整合
- ✅ **參數解析**: 路由參數正確性
- ✅ **複合參數**: 複合路由參數處理

## 測試技術特點

### 模擬策略
```typescript
// 模擬 UserModel 和 RoleModel
jest.mock('../src/models/rbac/UserModel.js');
jest.mock('../src/models/rbac/RoleModel.js');

// 模擬認證中介軟體（如果存在）
jest.mock('../src/middleware/jwtAuthMiddleware.js', () => ({
    JwtAuthMiddleware: jest.fn().mockImplementation(() => ({
        authenticate: jest.fn((req, res, next) => {
            req.user = { id: 1, username: 'testuser' };
            next();
        })
    }))
}));
```

### Sequelize 關聯操作測試
```typescript
// 測試 $add 操作
const mockUser = {
    id: 1,
    username: 'john_doe',
    $add: jest.fn().mockResolvedValue(undefined)
};

expect(mockUser.$add).toHaveBeenCalledWith('roles', mockRoles);

// 測試 $remove 操作
const mockUser = {
    id: 1,
    username: 'john_doe',
    $remove: jest.fn().mockResolvedValue(undefined)
};

expect(mockUser.$remove).toHaveBeenCalledWith('roles', 2);
```

### 測試工具
- **Jest**: 測試框架和模擬工具
- **Supertest**: HTTP 請求測試
- **TypeScript**: 類型安全測試

### 錯誤處理測試
```typescript
// 模擬資料庫錯誤
(UserModel.findByPk as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

// 驗證錯誤回應
expect(response.body).toEqual({
    message: 'Failed to fetch user roles',
    error: 'Database connection failed'
});
```

## 測試資料範例

### 使用者測試資料
```typescript
const mockUser = {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    roles: mockRoles,
    $add: jest.fn().mockResolvedValue(undefined),
    $remove: jest.fn().mockResolvedValue(undefined)
};
```

### 角色測試資料
```typescript
const mockRoles = [
    {
        id: 1,
        name: 'admin',
        displayName: '管理員',
        createdAt: '2025-06-26T09:12:38.106Z',
        updatedAt: '2025-06-26T09:12:38.106Z'
    },
    {
        id: 2,
        name: 'user',
        displayName: '一般使用者',
        createdAt: '2025-06-26T09:12:38.106Z',
        updatedAt: '2025-06-26T09:12:38.106Z'
    }
];
```

### 角色分配資料
```typescript
const roleAssignmentData = {
    roleIds: [1, 2, 3]
};
```

## 執行測試

### 單獨執行測試
```bash
# 僅執行 UserToRoleController 單元測試
npm test UserToRoleController.test.ts

# 僅執行 UserToRoleController 整合測試
npm test UserToRoleController.integration.test.ts

# 執行所有 UserToRoleController 測試
npm test UserToRoleController
```

### 測試覆蓋率
```bash
# 產生覆蓋率報告
npm test -- --coverage --testPathPattern=UserToRoleController
```

## 測試統計

| 測試類型 | 測試案例數量 | 方法覆蓋 | 錯誤場景 |
|---------|------------|---------|---------|
| 單元測試 | 21 | 3/3 | 10 |
| 整合測試 | 26 | 3/3 | 14 |
| **總計** | **47** | **100%** | **24** |

## 特殊測試場景

### 1. 多對多關聯操作
- 測試 Sequelize 的 `$add` 和 `$remove` 方法
- 驗證批量角色分配和單一角色移除
- 確保關聯操作的正確性

### 2. 部分角色存在處理
- 當請求分配的角色中部分不存在時的處理
- 只分配存在的角色，忽略不存在的角色
- 不會因為部分角色不存在而失敗

### 3. 冪等操作
- 移除不存在的角色不會產生錯誤
- 重複分配相同角色的處理
- 確保操作的冪等性

### 4. ID 轉換處理
- 字串格式的角色 ID 正確轉換為數字
- 無效 ID 格式的處理（返回 NaN）
- 路由參數的自動類型轉換

### 5. 複合路由參數
- 同時處理 userId 和 roleId 參數
- 參數順序和格式的驗證
- 路由匹配的正確性

## 維護注意事項

### 1. 測試資料一致性
- 確保測試資料與實際 UserModel 和 RoleModel 結構一致
- 定期更新模擬資料格式
- 保持角色關聯結構的一致性

### 2. Sequelize 關聯方法更新
- 當 Sequelize 關聯方法變更時，同步更新測試
- 確保 `$add` 和 `$remove` 方法的正確性
- 驗證 `include` 查詢的正確性

### 3. 錯誤訊息更新
- 當 UserToRoleController 錯誤訊息變更時，同步更新測試
- 保持錯誤訊息的一致性
- 定期檢查錯誤處理邏輯

### 4. 新功能測試
- 新增使用者角色相關功能時，同時添加對應測試
- 維持測試覆蓋率在 100%
- 考慮邊界情況和異常場景

### 5. 性能考量
- 大量角色分配的處理測試
- 批量操作的性能驗證
- 關聯查詢的效率測試

## 總結

UserToRoleController 測試套件提供了全面的測試覆蓋，確保：
- 所有使用者角色關聯操作正常運作
- 多對多關聯的正確處理
- 錯誤處理機制正確
- HTTP 路由整合無誤
- Sequelize 關聯操作正確執行

這些測試為 RBAC 系統中使用者角色管理功能的穩定性和可靠性提供了強有力的保障。
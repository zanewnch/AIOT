# UserController 測試文件

## 概述

本文件提供對 `UserController` 單元測試和整合測試的完整說明，涵蓋所有使用者管理功能的測試場景。

## 測試結構

### 檔案組織
```
test/
├── UserController.test.ts                 # 單元測試
├── UserController.integration.test.ts     # 整合測試
└── UserController.test.md                 # 測試說明文件
```

### 測試層級
- **單元測試**: 專注於 UserController 類別的業務邏輯，完全隔離外部依賴
- **整合測試**: 測試 UserController 與 Express 路由框架的整合行為

## 測試覆蓋範圍

### 1. 單元測試 (UserController.test.ts)

#### 1.1 getUsers 方法
- ✅ **成功場景**: 正確返回所有使用者
- ✅ **錯誤處理**: 資料庫錯誤時返回 500 狀態碼
- ✅ **邊界條件**: 空使用者列表的處理

#### 1.2 getUserById 方法
- ✅ **成功場景**: 根據 ID 返回特定使用者
- ✅ **404 錯誤**: 使用者不存在時的處理
- ✅ **500 錯誤**: 資料庫錯誤的處理
- ✅ **參數處理**: 各種 ID 格式的解析

#### 1.3 createUser 方法
- ✅ **成功場景**: 創建新使用者並返回 201 狀態碼
- ✅ **必要欄位**: 處理完整的使用者資料創建
- ✅ **錯誤處理**: 約束違反（重複使用者名稱等）
- ✅ **最小資料**: 僅包含必要欄位的創建

#### 1.4 updateUser 方法
- ✅ **完整更新**: 更新使用者的所有欄位
- ✅ **部分更新**: 僅更新指定欄位
- ✅ **404 錯誤**: 使用者不存在的處理
- ✅ **500 錯誤**: 資料庫更新錯誤
- ✅ **密碼更新**: 特別處理密碼雜湊值更新

#### 1.5 deleteUser 方法
- ✅ **成功刪除**: 返回 204 狀態碼
- ✅ **404 錯誤**: 使用者不存在的處理
- ✅ **級聯刪除**: 外鍵約束錯誤處理
- ✅ **500 錯誤**: 其他資料庫錯誤

#### 1.6 Router 初始化
- ✅ **Router 設定**: 驗證路由器正確初始化

### 2. 整合測試 (UserController.integration.test.ts)

#### 2.1 HTTP 路由測試

##### GET /users
- ✅ **200 成功**: 返回使用者列表
- ✅ **500 錯誤**: 資料庫連接失敗
- ✅ **空列表**: 無使用者時的處理

##### GET /users/:userId
- ✅ **200 成功**: 返回指定使用者
- ✅ **404 錯誤**: 使用者不存在
- ✅ **500 錯誤**: 資料庫查詢失敗
- ✅ **參數解析**: 不同 ID 格式的處理

##### POST /users
- ✅ **201 成功**: 創建新使用者
- ✅ **完整資料**: 處理所有使用者欄位
- ✅ **500 錯誤**: 資料庫約束違反
- ✅ **JSON 格式**: Content-Type 處理
- ✅ **重複檢查**: 使用者名稱和電子郵件重複

##### PUT /users/:userId
- ✅ **200 成功**: 更新使用者資訊
- ✅ **部分更新**: 僅更新指定欄位
- ✅ **404 錯誤**: 使用者不存在
- ✅ **500 錯誤**: 資料庫更新失敗
- ✅ **密碼更新**: 密碼雜湊值更新
- ✅ **重複檢查**: 使用者名稱重複處理

##### DELETE /users/:userId
- ✅ **204 成功**: 刪除使用者
- ✅ **404 錯誤**: 使用者不存在
- ✅ **500 錯誤**: 外鍵約束錯誤
- ✅ **級聯刪除**: 活躍角色相關錯誤

#### 2.2 路由整合測試
- ✅ **404 路由**: 不存在路由的處理
- ✅ **Content-Type**: 回應格式驗證
- ✅ **中介軟體**: Express.json() 整合
- ✅ **參數解析**: 路由參數正確性

## 測試技術特點

### 模擬策略
```typescript
// 模擬 UserModel
jest.mock('../src/models/rbac/UserModel.js');

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

### 測試工具
- **Jest**: 測試框架和模擬工具
- **Supertest**: HTTP 請求測試
- **TypeScript**: 類型安全測試

### 錯誤處理測試
```typescript
// 模擬資料庫錯誤
(UserModel.findAll as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

// 驗證錯誤回應
expect(response.body).toEqual({
    message: 'Failed to fetch users',
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
    passwordHash: '$2b$10$hashedpassword',
    createdAt: '2025-06-26T09:12:38.106Z',
    updatedAt: '2025-06-26T09:12:38.106Z'
};
```

### 創建使用者資料
```typescript
const newUserData = {
    username: 'new_user',
    email: 'new_user@example.com',
    passwordHash: '$2b$10$newhashedpassword'
};
```

## 執行測試

### 單獨執行測試
```bash
# 僅執行 UserController 單元測試
npm test UserController.test.ts

# 僅執行 UserController 整合測試
npm test UserController.integration.test.ts

# 執行所有 UserController 測試
npm test UserController
```

### 測試覆蓋率
```bash
# 產生覆蓋率報告
npm test -- --coverage --testPathPattern=UserController
```

## 測試統計

| 測試類型 | 測試案例數量 | 方法覆蓋 | 錯誤場景 |
|---------|------------|---------|---------|
| 單元測試 | 21 | 5/5 | 10 |
| 整合測試 | 27 | 5/5 | 13 |
| **總計** | **48** | **100%** | **23** |

## 特殊測試場景

### 1. 密碼處理
- 測試密碼雜湊值的儲存和更新
- 確保密碼不會以明文形式處理

### 2. 重複資料檢查
- 使用者名稱重複
- 電子郵件重複
- 適當的錯誤訊息返回

### 3. 部分更新邏輯
- 僅更新提供的欄位
- 保持其他欄位不變
- Undefined 值的正確處理

### 4. 級聯刪除
- 有角色關聯的使用者刪除
- 外鍵約束錯誤處理
- 適當的錯誤訊息

## 維護注意事項

### 1. 測試資料一致性
- 確保測試資料與實際 UserModel 結構一致
- 定期更新模擬資料格式

### 2. 錯誤訊息更新
- 當 UserController 錯誤訊息變更時，同步更新測試
- 保持錯誤訊息的一致性

### 3. 新功能測試
- 新增使用者相關功能時，同時添加對應測試
- 維持測試覆蓋率在 100%

### 4. 性能考量
- 大型使用者列表的處理測試
- 分頁功能（如果實現）的測試

## 總結

UserController 測試套件提供了全面的測試覆蓋，確保：
- 所有 CRUD 操作正常運作
- 錯誤處理機制正確
- HTTP 路由整合無誤
- 資料驗證和約束正確執行

這些測試為使用者管理功能的穩定性和可靠性提供了強有力的保障。
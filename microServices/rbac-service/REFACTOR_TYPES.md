# RBAC Service Types 重構文檔

## 重構目標

將分散在各個服務文件中的 interface 和 type 定義重構到統一的 `types` 目錄中，並添加完整的 TypeDoc 文檔。

## 重構原則

1. **按功能分類**：根據業務功能將類型分組到不同文件
2. **完整的 TypeDoc**：為所有類型添加詳細的文檔註解
3. **統一導出**：通過 `types/index.ts` 提供統一的導入入口
4. **避免重複**：消除在多個文件中重複定義的類型
5. **向後兼容**：確保重構不破壞現有功能

## 類型分類結構

```
src/types/
├── index.ts                    # 統一導出文件
├── RoleTypes.ts               # 角色相關類型
├── UserTypes.ts               # 用戶相關類型
├── PermissionTypes.ts         # 權限相關類型
├── SessionTypes.ts            # 會話相關類型
├── PaginationTypes.ts         # 分頁相關類型
└── ServiceTypes.ts            # 通用服務類型
```

## 重構進度

### ✅ 已完成
- [x] `RoleTypes.ts` - 角色相關類型定義（✅ 完整的 TypeDoc）
- [x] `UserTypes.ts` - 用戶相關類型定義（✅ 完整的 TypeDoc）  
- [x] `PermissionTypes.ts` - 權限相關類型定義（✅ 完整的 TypeDoc）
- [x] `SessionTypes.ts` - 會話相關類型定義（✅ 完整的 TypeDoc）
- [x] `CommandTypes.ts` - 命令操作相關類型定義（✅ 完整的 TypeDoc）
- [x] `RelationshipTypes.ts` - 關聯關係相關類型定義（✅ 完整的 TypeDoc）
- [x] `types/index.ts` - 統一導出文件（✅ 按功能模塊組織）
- [x] `RoleQueriesSvc.ts` - 移除類型定義，使用統一導入
- [x] `UserQueriesSvc.ts` - 移除類型定義，使用統一導入
- [x] `RoleToPermissionQueriesSvc.ts` - 移除類型定義，使用統一導入

### 🚧 進行中
- [ ] `UserToRoleQueriesSvc.ts` - 需要移除類型定義並更新導入
- [ ] `SessionQueriesSvc.ts` - 需要移除類型定義並更新導入

### ⏳ 待完成
- [ ] 所有 Commands 服務文件的重構
  - [ ] `UserCommandsSvc.ts`
  - [ ] `RoleCommandsSvc.ts`
  - [ ] `RoleToPermissionCommandsSvc.ts`
  - [ ] `UserToRoleCommandsSvc.ts`
- [ ] 測試文件的更新
- [ ] 確保所有導入正確無編譯錯誤

## 重構後的使用方式

### 舊方式（不推薦）
```typescript
// 在服務文件中定義類型
export interface UserDTO {
  id: number;
  username: string;
}

// 在其他地方導入
import { UserDTO } from '../services/queries/UserQueriesSvc';
```

### 新方式（推薦）
```typescript
// 從統一的 types 目錄導入
import { UserDTO, RoleDTO, PermissionDTO } from '../../types';

// 或者按需導入
import type { UserDTO } from '../../types/UserTypes';
```

## 注意事項

1. **類型 vs 值**：區分 `export type` 和 `export`，類別使用 `export`，介面使用 `export type`
2. **循環依賴**：避免類型定義之間的循環依賴
3. **命名一致性**：保持與原有代碼的命名一致性
4. **文檔完整性**：確保每個類型都有完整的 TypeDoc 註解

## 後續工作

1. 繼續重構其他服務文件
2. 更新所有導入語句
3. 檢查並修復編譯錯誤
4. 更新單元測試
5. 完善文檔
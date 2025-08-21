#!/bin/bash

# RBAC 服務類型重構批量處理腳本
# 自動化處理服務文件中的類型定義重構

echo "🚀 開始批量重構 RBAC 服務類型定義..."

# 定義需要重構的文件列表
FILES_TO_REFACTOR=(
    "src/services/queries/UserToRoleQueriesSvc.ts"
    "src/services/queries/SessionQueriesSvc.ts"
    "src/services/commands/UserCommandsSvc.ts"
    "src/services/commands/RoleCommandsSvc.ts"
    "src/services/commands/RoleToPermissionCommandsSvc.ts"
    "src/services/commands/UserToRoleCommandsSvc.ts"
)

# 為每個文件添加統一的類型導入
for file in "${FILES_TO_REFACTOR[@]}"; do
    if [[ -f "$file" ]]; then
        echo "📝 處理文件: $file"
        
        # 檢查是否已經有統一類型導入
        if ! grep -q "from '../../types/index.js'" "$file"; then
            # 在適當位置添加統一類型導入
            sed -i "/import { createLogger }/a import { /* 根據需要添加類型 */ } from '../../types/index.js';" "$file"
            echo "  ✅ 已添加統一類型導入"
        else
            echo "  ⚠️  統一類型導入已存在，跳過"
        fi
        
        # 移除 export interface 定義（需要手動檢查）
        echo "  📋 需要手動檢查並移除重複的類型定義"
        
    else
        echo "  ❌ 文件不存在: $file"
    fi
done

echo ""
echo "🎯 重構進度總結："
echo "✅ 已完成："
echo "   - RoleTypes.ts (角色相關類型)"
echo "   - UserTypes.ts (用戶相關類型)"
echo "   - PermissionTypes.ts (權限相關類型)"
echo "   - SessionTypes.ts (會話相關類型)"
echo "   - CommandTypes.ts (命令操作相關類型)"
echo "   - RelationshipTypes.ts (關聯關係相關類型)"
echo "   - types/index.ts (統一導出文件)"
echo "   - RoleQueriesSvc.ts (已重構完成)"
echo "   - UserQueriesSvc.ts (已重構完成)"
echo "   - RoleToPermissionQueriesSvc.ts (已重構完成)"

echo ""
echo "🔄 待手動完成："
echo "   - UserToRoleQueriesSvc.ts"
echo "   - SessionQueriesSvc.ts"
echo "   - 所有 Commands 服務文件"

echo ""
echo "📚 重構指南："
echo "1. 為每個服務文件添加: import { TypeName } from '../../types/index.js'"
echo "2. 移除 export interface 和 export type 定義"
echo "3. 更新方法參數類型引用"
echo "4. 測試編譯確認無錯誤"

echo ""
echo "✨ 重構完成後的效果："
echo "- 類型定義集中管理在 types/ 目錄"
echo "- 完整的 TypeDoc 文檔註解"
echo "- 統一的導入入口"
echo "- 避免重複定義"
echo "- 更好的代碼組織和維護性"

echo ""
echo "🎉 批量重構腳本執行完成！"
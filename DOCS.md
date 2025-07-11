# 📚 AIOT 專案文檔系統

本專案使用 TypeDoc 自動生成內部 GUI 文檔，提供完整的程式碼文檔瀏覽體驗。

## 🎯 文檔結構

### 後端文檔 (Backend)
- **控制器 (Controllers)**: API 端點和路由處理
- **服務 (Services)**: 業務邏輯和資料處理
- **模型 (Models)**: 資料庫模型和型別定義
- **倉庫 (Repositories)**: 資料存取層
- **中介軟體 (Middleware)**: 請求處理中介軟體
- **工具 (Utils)**: 通用工具函數

### 前端文檔 (Frontend)
- **頁面 (Pages)**: 主要的應用頁面元件
- **元件 (Components)**: 可重複使用的 UI 元件
- **服務 (Services)**: API 調用和資料服務
- **狀態管理 (Store)**: Redux/狀態管理相關
- **Hooks**: 自定義 React Hooks
- **工具 (Utils)**: 通用工具函數
- **型別 (Types)**: TypeScript 型別定義

## 🚀 快速開始

### 生成所有文檔
```bash
# 根目錄執行，同時生成前後端文檔
npm run docs:all
```

### 分別生成文檔
```bash
# 只生成後端文檔
npm run docs:backend

# 只生成前端文檔  
npm run docs:frontend
```

### 查看文檔
```bash
# 啟動後端文檔服務器 (http://localhost:3001)
npm run docs:serve:backend

# 啟動前端文檔服務器 (http://localhost:3002)
npm run docs:serve:frontend

# 同時啟動兩個文檔服務器
npm run docs:serve:all
```

### 開發模式 (即時更新)
```bash
# 監控後端檔案變化，自動重新生成文檔
npm run docs:watch:backend

# 監控前端檔案變化，自動重新生成文檔
npm run docs:watch:frontend

# 同時監控前後端
npm run docs:watch:all
```

### 清理文檔
```bash
# 清理所有生成的文檔
npm run docs:clean

# 分別清理
npm run docs:clean:backend
npm run docs:clean:frontend
```

## 📂 文檔存放位置

- **後端文檔**: `/be/docs/` 
- **前端文檔**: `/fe/docs/`

## 🔧 設定檔案

- **後端設定**: `/be/typedoc.json`
- **前端設定**: `/fe/typedoc.json`

## 📝 撰寫文檔註釋

使用 TSDoc 標準撰寫程式碼註釋：

```typescript
/**
 * 範例函數說明
 * 
 * 詳細描述函數的功能和用途
 * 
 * @param param1 - 參數1的說明
 * @param param2 - 參數2的說明
 * @returns 返回值的說明
 * 
 * @example
 * ```typescript
 * const result = exampleFunction('hello', 123);
 * console.log(result);
 * ```
 * 
 * @group Controllers
 */
function exampleFunction(param1: string, param2: number): string {
  return \`\${param1}: \${param2}\`;
}
```

### 常用標籤

- `@param` - 參數說明
- `@returns` - 返回值說明  
- `@example` - 使用範例
- `@group` - 分組（Controllers, Services, Models 等）
- `@deprecated` - 標記已棄用
- `@internal` - 內部使用，不會出現在文檔中
- `@throws` - 可能拋出的異常

## 🌐 訪問方式

### 本地開發
- 後端文檔: http://localhost:3001
- 前端文檔: http://localhost:3002

### 線上部署
文檔可以部署到靜態檔案服務器或 GitHub Pages 上供團隊存取。

## 🔄 自動化工作流程

建議在 CI/CD 中添加文檔生成步驟：

```yaml
# .github/workflows/docs.yml
- name: Generate Documentation
  run: |
    npm install
    npm run docs:all
    
- name: Deploy to GitHub Pages
  # 部署文檔到 GitHub Pages
```

## 💡 最佳實踐

1. **定期更新**: 每次功能開發完成後更新文檔註釋
2. **範例驅動**: 為複雜的 API 提供使用範例
3. **分組清晰**: 使用 `@group` 標籤進行邏輯分組
4. **型別完整**: 確保所有參數和返回值都有型別說明
5. **版本控制**: 文檔與程式碼一起進行版本控制

---

🔗 **相關連結**
- [TypeDoc 官方文檔](https://typedoc.org/)
- [TSDoc 標準](https://tsdoc.org/)
- [專案 GitHub](https://github.com/zanewnch/AIOT)
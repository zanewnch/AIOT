# TypeDoc 自定義樣式使用指南

## 概述

本項目使用 SCSS 來自定義 TypeDoc 文檔的外觀，提供現代化、美觀的文檔體驗。

## 文件結構

```
be/
├── src/styles/
│   └── typedoc-custom.scss    # SCSS 源文件
├── public/
│   └── typedoc-custom.css     # 編譯後的 CSS 文件
├── docs/                      # 生成的文檔
└── typedoc.json              # TypeDoc 配置文件
```

## 樣式特色

### 🎨 現代化設計
- 使用 CSS 變量系統，便於主題切換
- 採用現代化的色彩搭配（藍色主題）
- 支持淺色和深色模式自動切換

### 🎯 用戶體驗優化
- 響應式設計，適配各種設備
- 平滑的動畫效果和過渡
- 改進的導航體驗，包含懸停效果
- 美化的滾動條

### 📝 內容呈現
- 優化的代碼塊顯示，使用 Fira Code 字體
- 改進的表格樣式
- 現代化的按鈕和標籤設計
- 清晰的層次結構

## 使用方法

### 1. 編譯 SCSS
```bash
# 一次性編譯
npm run docs:compile-scss

# 監聽模式（自動重新編譯）
npm run docs:watch-scss
```

### 2. 生成文檔
```bash
# 生成文檔（會自動編譯 SCSS）
npm run docs:generate

# 監聽模式
npm run docs:watch
```

### 3. 預覽文檔
```bash
# 啟動本地服務器
npm run docs:serve
```

## 自定義樣式

### 修改色彩主題
在 `src/styles/typedoc-custom.scss` 中修改 CSS 變量：

```scss
:root {
  --primary-color: #2563eb;      // 主色調
  --primary-hover: #1d4ed8;      // 懸停色
  --primary-light: #dbeafe;      // 淺色版本
  // ... 其他變量
}
```

### 添加自定義樣式
直接在 SCSS 文件中添加新的樣式規則：

```scss
// 自定義類別樣式
.my-custom-class {
  background: var(--bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
}
```

### 響應式設計
使用媒體查詢來適配不同設備：

```scss
@media (max-width: 768px) {
  .my-element {
    // 移動設備樣式
  }
}
```

## 色彩系統

### 主要色彩
- **Primary**: `#2563eb` (藍色)
- **Success**: `#10b981` (綠色)
- **Warning**: `#f59e0b` (橙色)
- **Error**: `#ef4444` (紅色)

### 背景色彩
- **Primary**: `#ffffff` (白色)
- **Secondary**: `#f8fafc` (淺灰)
- **Tertiary**: `#f1f5f9` (更淺的灰)

### 文字色彩
- **Primary**: `#1e293b` (深灰)
- **Secondary**: `#64748b` (中灰)
- **Tertiary**: `#94a3b8` (淺灰)

## 最佳實踐

1. **使用 CSS 變量**: 始終使用預定義的 CSS 變量來保持一致性
2. **響應式優先**: 考慮不同設備的顯示效果
3. **性能優化**: 避免過度使用動畫和陰影
4. **可訪問性**: 確保足夠的對比度和可讀性

## 故障排除

### 樣式未生效
1. 確保 SCSS 已正確編譯
2. 檢查 `typedoc.json` 中的 `customCss` 路徑
3. 清除瀏覽器緩存

### 編譯錯誤
1. 檢查 SCSS 語法是否正確
2. 確保已安裝 `sass` 依賴
3. 檢查文件路徑是否正確

## 開發工作流

1. 修改 `src/styles/typedoc-custom.scss`
2. 運行 `npm run docs:compile-scss` 編譯
3. 運行 `npm run docs:generate` 生成文檔
4. 運行 `npm run docs:serve` 預覽效果
5. 重複步驟 1-4 直到滿意

## 版本控制

- 將 `src/styles/typedoc-custom.scss` 加入版本控制
- 將 `public/typedoc-custom.css` 加入版本控制（可選）
- 不要將 `docs/` 目錄加入版本控制 
# Sidebar Routes Selenium 自動化測試

這個測試工具會自動遍歷你的前端應用中所有 Sidebar 路由，檢查每個頁面是否有 console 錯誤，並生成詳細的測試報告。

## 🎯 功能特點

- ✅ **自動登入**：使用預設帳號 (admin/admin) 自動登入系統
- 🗺️ **路由遍歷**：自動測試所有 Sidebar 中的 9 個路由頁面
- 🐛 **錯誤檢測**：捕獲並分析每個頁面的 console 錯誤和警告
- 📸 **螢幕截圖**：為每個頁面自動截圖，方便除錯
- 📊 **詳細報告**：生成 HTML 和 JSON 格式的測試報告
- ⚡ **效能監控**：記錄每個頁面的載入時間

## 🚀 快速開始

### 前置要求

1. **Chrome 瀏覽器**：必須安裝 Google Chrome
2. **前端應用**：確保前端應用在 `http://localhost:3000` 運行
3. **依賴項**：已安裝 selenium-webdriver 等依賴

### 安裝依賴

```bash
# 在 frontend 目錄下執行
npm install
```

### 啟動前端應用

```bash
# 在一個終端執行
npm run dev
```

### 執行測試

```bash
# 在另一個終端執行 Selenium 測試
npm run test:selenium

# 或者直接使用別名
npm run test:sidebar-routes

# 無頭模式執行（較快但無法看到瀏覽器）
npm run test:selenium:headless
```

## 📋 測試的路由清單

測試會自動訪問以下所有路由：

| 路由 | 頁面名稱 | 圖示 | 說明 |
|------|----------|------|------|
| `/` | 首頁 | 🏠 | 應用程式首頁 |
| `/tableviewer` | Table Viewer | 📊 | 資料表檢視器 |
| `/chat` | AI 聊天 | 🤖 | AI 聊天介面 |
| `/mappage` | 地圖頁面 | 🗺️ | 地圖顯示功能 |
| `/flyingpage` | 飛行頁面 | ✈️ | 無人機飛行控制 |
| `/command-history` | 指令歷史 | 📋 | 指令歷史記錄 |
| `/drone-fleet` | 機隊管理 | 🚁 | 無人機機隊管理 |
| `/command-queue` | 指令佇列 | ⚡ | 智能指令佇列 |
| `/data-analytics` | 資料分析 | 📈 | 資料分析圖表 |

## 📊 測試報告

測試完成後會在以下位置生成報告：

```
frontend/src/test/
├── test-reports/           # 測試報告目錄
│   ├── sidebar-routes-test-TIMESTAMP.html  # HTML 格式報告（推薦）
│   └── sidebar-routes-test-TIMESTAMP.json  # JSON 格式報告
└── screenshots/           # 螢幕截圖目錄
    ├── route-home-TIMESTAMP.png
    ├── route-tableviewer-TIMESTAMP.png
    └── ...
```

### HTML 報告內容

- 📈 **測試摘要**：成功/失敗路由數、總錯誤數、平均載入時間
- 🗂️ **詳細結果**：每個路由的測試結果、截圖、錯誤詳情
- 🔍 **常見錯誤**：統計出現頻率最高的錯誤類型
- 📸 **截圖瀏覽**：點擊截圖可以放大檢視

## 🛠️ 進階設定

### 環境變數

```bash
# 設定為無頭模式（不顯示瀏覽器視窗）
HEADLESS=true npm run test:selenium

# 設定不同的基礎 URL
BASE_URL=http://localhost:5173 npm run test:selenium
```

### 自訂測試參數

你可以編輯 `sidebar-routes.selenium.test.ts` 來修改：

- **等待時間**：調整頁面載入等待時間
- **螢幕尺寸**：修改瀏覽器視窗大小
- **截圖設定**：啟用/停用自動截圖
- **錯誤過濾**：自訂要忽略的錯誤類型

## 🐛 故障排除

### 常見問題

1. **Chrome 未找到**
   ```
   ❌ 未找到 Chrome 瀏覽器，請安裝 Chrome
   ```
   **解決方案**：下載並安裝 [Google Chrome](https://www.google.com/chrome/)

2. **前端應用未運行**
   ```
   ⚠️ 前端應用未在 localhost:3000 運行
   ```
   **解決方案**：在另一個終端執行 `npm run dev`

3. **登入失敗**
   ```
   ❌ 登入失敗，無法繼續測試
   ```
   **解決方案**：
   - 檢查 admin/admin 帳號是否正確
   - 確保認證 API 正常運行
   - 檢查網路連線

4. **TypeScript 編譯錯誤**
   ```
   ❌ TypeScript 編譯失敗
   ```
   **解決方案**：
   ```bash
   npm install
   npm run type-check  # 檢查型別錯誤
   ```

### 除錯模式

如果測試失敗，你可以：

1. **檢視詳細日誌**：測試過程中會有即時的控制台輸出
2. **查看截圖**：每個頁面都會自動截圖，方便檢視頁面狀態
3. **分析 HTML 報告**：詳細的錯誤資訊和統計數據
4. **手動測試**：根據報告中的錯誤，手動訪問有問題的頁面

## 📝 測試結果解讀

### 成功標準

- ✅ **頁面載入成功**：能正常訪問頁面
- ✅ **無嚴重錯誤**：console 中沒有 ERROR 級別的日誌
- ✅ **載入時間合理**：頁面載入時間在預期範圍內

### 常見錯誤類型

- 🚨 **JavaScript 錯誤**：程式碼執行錯誤
- 🔗 **API 請求失敗**：後端 API 無回應或回傳錯誤
- 🎨 **資源載入失敗**：圖片、CSS 或其他靜態資源載入失敗
- ⚠️ **React 警告**：React 開發模式的警告訊息

## 🔧 客製化測試

### 新增測試路由

如果 Sidebar 新增了路由，請更新 `SIDEBAR_ROUTES` 陣列：

```typescript
const SIDEBAR_ROUTES: TestRoute[] = [
  // ... 現有路由
  { 
    path: '/new-page', 
    label: '新頁面', 
    icon: '🆕',
    selector: '[data-testid="new-page"]'
  }
];
```

### 自訂等待條件

為特定頁面設定專門的等待條件：

```typescript
// 等待特定元素載入
selector: '.specific-component, [data-testid="component"]'

// 等待動態內容
selector: '.loaded-content:not(.loading)'
```

## 📞 支援

如果遇到問題或需要協助，請：

1. 查看本 README 的故障排除章節
2. 檢視測試生成的 HTML 報告
3. 檢查 console 輸出的詳細日誌
4. 聯繫開發團隊

---

**開發團隊**: AIOT Frontend Team  
**最後更新**: 2025-08-25  
**版本**: 1.0.0
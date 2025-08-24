# ChatPage 測試指南

## 功能概覽

ChatPage 已成功整合到 AIOT 項目中，提供了一個完整的 AI 聊天介面。

## 主要功能

### ✅ 已實現功能

1. **UI 組件**
   - 聊天訊息顯示區域
   - 用戶輸入框和發送按鈕
   - 設定面板（RAG 和對話記憶模式）
   - 健康狀態指示器
   - 清除聊天記錄功能

2. **React Query 整合**
   - `useLLMHealthStatus`: LLM 服務健康檢查
   - `useGenerateText`: 文字生成 API 調用
   - `useTestConnection`: 服務連接測試
   - 錯誤處理和重試機制

3. **類型安全**
   - 完整的 TypeScript 類型定義
   - MessageType 枚舉支援
   - 錯誤、系統、用戶、助手消息類型

4. **樣式設計**
   - 響應式設計
   - 深色主題支援
   - 聊天氣泡動畫
   - 載入指示器
   - 錯誤消息樣式

## 訪問方式

### 前端路由
- 直接訪問：`http://localhost:3000/content/chat`
- 通過側邊欄導航：首頁 → 側邊欄 → "AI 聊天" (🤖)

### API 端點配置
```typescript
// 預設 LLM 服務 URL
LLM_SERVICE_URL: 'http://localhost:8022'

// 主要端點
- 健康檢查: /api/transformers/health/
- 文字生成: /api/transformers/generate/
- 對話模式: /api/transformers/conversation/
```

## 測試步驟

### 1. 基本 UI 測試
1. 訪問 `/content/chat` 路由
2. 確認頁面載入正常
3. 檢查側邊欄導航是否有 "AI 聊天" 選項
4. 驗證聊天介面元素是否完整

### 2. 設定功能測試
1. 切換 "使用 RAG 檢索增強" 選項
2. 切換 "對話記憶模式" 選項
3. 確認設定狀態在底部狀態列正確顯示

### 3. 錯誤處理測試
在 LLM 服務未啟動的情況下：
1. 輸入測試訊息並發送
2. 應該顯示連接錯誤訊息
3. 狀態指示器應顯示 "連接中斷"

### 4. LLM 服務整合測試 (需要啟動 LLM 服務)

#### 啟動 LLM 服務
```bash
# 啟動 AI Engine (FastAPI)
cd microServices/llm-service
source venv/bin/activate
python main.py  # 運行在 localhost:8021

# 啟動 LLM Service (Django)
cd microServices/llm-service  
source venv/bin/activate
python manage.py runserver 0.0.0.0:8022
```

#### 完整功能測試
1. 確認健康狀態指示器顯示 "已連接"
2. 發送測試消息："你好，請介紹一下自己"
3. 驗證 AI 回應是否正常顯示
4. 測試 RAG 功能（如已配置文檔）
5. 測試對話記憶功能

## 當前狀態

### ✅ 完成項目
- [x] ChatPage 組件開發
- [x] React Query hooks 整合
- [x] 類型安全實現
- [x] 錯誤處理機制
- [x] UI/UX 設計
- [x] 路由配置
- [x] 側邊欄導航整合

### 📋 注意事項
1. LLM 服務需要單獨啟動才能完整測試
2. 前端編譯有 socket.io-client 相關警告（不影響 ChatPage 功能）
3. TypeScript 編譯無錯誤
4. 所有 React Query hooks 按照項目現有模式實現

### 🚀 可選增強功能
- 串流回應支援
- 文檔上傳功能
- 聊天記錄持久化
- 快捷指令
- 語音輸入支援

## 技術實現詳情

### 檔案結構
```
frontend/src/
├── pages/ChatPage.tsx          # 主要聊天組件
├── hooks/useChatQuery.ts       # React Query hooks
├── types/chat.ts               # TypeScript 類型定義
├── styles/ChatPage.module.scss # 聊天頁面樣式
└── components/Sidebar.tsx      # 導航整合
```

### 依賴項目
- React Query (@tanstack/react-query)
- React Router (react-router-dom)
- SCSS Modules
- TypeScript

該實現遵循 AIOT 項目的現有架構模式，使用 React Query 而非 services 模式，確保代碼一致性和可維護性。
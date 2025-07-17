# InitController.ts 進度實現筆記

## 概述
`InitController` 類別負責處理系統初始化任務，包括壓力測試資料生成的背景任務。進度追蹤的實現結合了以下技術：
1. **任務管理**：每個背景任務分配唯一的 `taskId`，並透過 `progressService` 追蹤。
2. **伺服器推送事件 (SSE)**：使用 SSE 即時串流進度更新給客戶端。
3. **進度回調**：背景任務透過回調函數報告進度。

## 關鍵組件

### 1. `progressService`
- **用途**：管理任務狀態（如 `STARTED`、`RUNNING`、`COMPLETED`、`FAILED`）。
- **方法**：
  - `createTask(taskId, totalWork, message)`：初始化新任務。
  - `updateProgress(taskId, data)`：更新任務進度（如百分比、階段）。
  - `completeTask(taskId, result, message)`：標記任務完成。
  - `failTask(taskId, error)`：標記任務失敗。
  - `createSSEConnection(taskId, res)`：建立 SSE 連線以推送即時更新。

### 2. 背景任務執行
- **範例**：`createStressTestData` 方法：
  - 使用 `uuidv4` 生成 `taskId`。
  - 透過 `progressService.createTask` 初始化任務。
  - 啟動背景任務（`executeStressTestDataCreation`）。
  - 立即回傳 `taskId` 和進度 URL。

### 3. SSE 實現
- **端點**：`GET /api/progress/:taskId/stream`
- **行為**：
  - 驗證 `taskId`。
  - 使用 `progressService.createSSEConnection` 建立 SSE 連線。
  - 串流事件（如 `progress`、`completed`）給客戶端。

### 4. 進度回調
- **用途**：背景任務（如 `seedRTKDemoWithProgress`）透過回調報告進度。
- **範例**：
  ```typescript
  const progressCallback = progressService.createProgressCallback(taskId);
  await this.rtkInitService.seedRTKDemoWithProgress(progressCallback);
  ```

## 流程圖解
1. 客戶端請求背景任務（如 `POST /api/init/stress-test-data`）。
2. 伺服器建立任務並回傳 `taskId`。
3. 客戶端透過 SSE 訂閱進度更新（`GET /api/progress/:taskId/stream`）。
4. 背景任務透過回調報告進度。
5. 伺服器串流更新給客戶端，直到任務完成或失敗。

## 注意事項
- **冪等性**：任務具有冪等性，重複請求不會產生重複資料。
- **錯誤處理**：失敗的任務會記錄並透過 SSE 回報給客戶端。
- **可擴展性**：設計用於長時間執行的任務，並提供即時反饋。

# TypeDoc 使用指南 - backgroundTask.ts 範例

## 概述

這個文件展示了如何在 AIOT 專案中撰寫高品質的 TypeDoc 文檔註解。以 `backgroundTask.ts` 為範例，說明了完整的文檔結構和最佳實踐。

## TypeDoc 註解結構解析

### 1. 文件級別文檔 (@fileoverview)

```typescript
/**
 * @fileoverview 背景任務處理工具模組
 *
 * 此模組提供了一套完整的背景任務處理解決方案，包括：
 * - 自動任務 ID 生成
 * - 進度追蹤整合
 * - 錯誤處理
 * - 統一的回應格式
 *
 * @module Utils/BackgroundTask
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */
```

**關鍵要素：**
- `@fileoverview`: 文件概述
- `@module`: 模組路徑
- `@version`: 版本號
- `@author`: 作者資訊
- `@since`: 創建日期

### 2. 介面文檔 (@interface)

```typescript
/**
 * 背景任務配置選項介面
 *
 * 定義背景任務的基本配置參數，用於初始化進度追蹤和回應格式。
 *
 * @interface BackgroundTaskOptions
 * @category Utils
 * @group Background Task
 */
export interface BackgroundTaskOptions {
  /**
   * 任務的總工作量（用於進度計算）
   *
   * 這個值用於計算任務執行的百分比進度，應該反映任務的總體規模。
   * 例如：要處理 1000 筆資料，則設定為 1000。
   *
   * @example
   * ```typescript
   * {
   *   totalWork: 5000, // 處理 5000 筆資料
   * }
   * ```
   */
  totalWork: number;
}
```

**關鍵要素：**
- `@interface`: 標記為介面
- `@category`: 分類（對應 typedoc.json 的 categoryOrder）
- `@group`: 群組分類
- 每個屬性都有詳細說明和範例

### 3. 函數文檔

```typescript
/**
 * 創建背景任務處理器的高階函數
 *
 * 這是核心的背景任務處理工具，封裝了所有背景任務的通用邏輯。
 * 它提供了一個簡單而強大的 API，讓您可以專注於業務邏輯，
 * 而不用擔心進度追蹤、錯誤處理等繁瑣的工作。
 *
 * ### 功能特色
 * - ✅ **自動任務 ID 管理**: 自動生成 UUID 作為任務標識
 * - ✅ **進度追蹤整合**: 自動初始化進度服務
 * - ✅ **即時回應**: 立即返回任務 ID，不阻塞請求
 * - ✅ **錯誤處理**: 自動捕獲並記錄任務失敗
 * - ✅ **類型安全**: 完整的 TypeScript 類型支援
 *
 * @param options - 背景任務配置選項，定義任務的基本資訊
 * @param executor - 實際執行任務的函數，接收 taskId 參數
 * @returns Express 路由處理函數，可直接用於路由定義
 *
 * @example
 * ### 基本使用
 * ```typescript
 * export class MyController {
 *   public processData = createBackgroundTaskHandler(
 *     {
 *       totalWork: 1000,
 *       initialMessage: '正在處理資料...',
 *       taskName: 'DataProcessing'
 *     },
 *     async (taskId) => {
 *       await this.executeDataProcessing(taskId);
 *     }
 *   );
 * }
 * ```
 *
 * @category Utils
 * @group Background Task
 * @since 1.0.0
 * @public
 */
```

**關鍵要素：**
- 詳細的功能描述
- `### 功能特色` 使用 Markdown 格式
- `@param` 詳細的參數說明
- `@returns` 返回值說明
- `@example` 多個實用範例
- `@category`, `@group` 分類標籤
- `@since`, `@public` 版本和可見性標記

### 4. 泛型函數文檔

```typescript
/**
 * 創建支援自定義參數的背景任務處理器
 *
 * @template T - 參數物件的類型，預設為any
 * @param options - 背景任務配置選項，可以是靜態物件或動態函數
 * @param executor - 實際執行任務的函數，接收 taskId 和請求參數
 * @returns Express 路由處理函數
 */
```

**關鍵要素：**
- `@template` 泛型參數說明
- 支援複雜的參數類型

### 5. 命名空間文檔 (@namespace)

```typescript
/**
 * @namespace BackgroundTask
 * @description
 * 背景任務處理工具模組提供了完整的背景任務解決方案。
 *
 * ### 設計理念
 *
 * 本模組遵循以下設計原則：
 *
 * 1. **關注點分離**: 將業務邏輯與任務管理邏輯分離
 * 2. **統一介面**: 所有背景任務使用相同的處理模式
 *
 * ### 選擇指南
 *
 * | 使用場景 | 推薦方案 | 特點 |
 * |---------|----------|------|
 * | 簡單任務，無參數 | `createBackgroundTaskHandler` | 輕量、易用 |
 * | 需要動態參數 | `backgroundTaskHandler` | 彈性、強大 |
 *
 * @see {@link https://docs.example.com/background-tasks} 完整文檔
 * @version 1.0.0
 * @since 2024-01-01
 */
```

## TypeDoc 標籤完整清單

### 基本標籤

| 標籤 | 用途 | 範例 |
|------|------|------|
| `@param` | 參數說明 | `@param taskId - 任務ID` |
| `@returns` | 返回值說明 | `@returns Promise<void>` |
| `@example` | 使用範例 | `@example \`\`\`typescript` |
| `@throws` | 異常說明 | `@throws {Error} 當參數無效時` |
| `@see` | 相關連結 | `@see {@link OtherClass}` |

### 分類標籤

| 標籤 | 用途 | 範例 |
|------|------|------|
| `@category` | 主要分類 | `@category Utils` |
| `@group` | 子群組 | `@group Background Task` |
| `@module` | 模組路徑 | `@module Utils/BackgroundTask` |
| `@namespace` | 命名空間 | `@namespace BackgroundTask` |

### 版本標籤

| 標籤 | 用途 | 範例 |
|------|------|------|
| `@version` | 版本號 | `@version 1.0.0` |
| `@since` | 起始版本 | `@since 2024-01-01` |
| `@deprecated` | 棄用標記 | `@deprecated 請使用 newMethod` |

### 可見性標籤

| 標籤 | 用途 | 範例 |
|------|------|------|
| `@public` | 公開API | `@public` |
| `@private` | 私有方法 | `@private` |
| `@internal` | 內部使用 | `@internal` |
| `@experimental` | 實驗性功能 | `@experimental` |

### 類型標籤

| 標籤 | 用途 | 範例 |
|------|------|------|
| `@template` | 泛型參數 | `@template T - 類型參數` |
| `@interface` | 介面標記 | `@interface MyInterface` |
| `@enum` | 枚舉標記 | `@enum {string}` |

## 最佳實踐

### 1. 結構化文檔

```typescript
/**
 * [簡短描述 - 一句話說明功能]
 *
 * [詳細描述 - 2-3 句話解釋用途和價值]
 *
 * ### 功能特色
 * - ✅ 特色1
 * - ✅ 特色2
 *
 * ### 使用場景
 * - 場景1
 * - 場景2
 *
 * @param param1 - 參數1說明
 * @param param2 - 參數2說明
 * @returns 返回值說明
 *
 * @example
 * ### 基本使用
 * ```typescript
 * // 程式碼範例
 * ```
 *
 * @category 分類
 * @group 群組
 * @since 版本
 * @public
 */
```

### 2. Markdown 支援

TypeDoc 完整支援 Markdown 語法：

- **粗體文字**
- *斜體文字*
- `程式碼`
- [連結](url)
- 清單
- 表格
- 程式碼區塊

### 3. 交叉引用

```typescript
/**
 * 相關功能請參考：
 * - {@link ProgressService} - 進度追蹤服務
 * - {@link BackgroundTaskOptions} - 配置選項
 * - {@link createBackgroundTaskHandler} - 基本處理器
 */
```

### 4. 範例品質

好的範例應該：
- 完整可執行
- 包含導入語句
- 展示常見用法
- 包含錯誤處理

## 生成文檔

```bash
# 生成文檔
npm run docs:generate

# 本地預覽
npm run docs:serve

# 監聽模式
npm run docs:watch
```

## 配置文件

重要的配置項目（`typedoc.json`）：

```json
{
  "categorizeByGroup": true,
  "categoryOrder": [
    "Controllers",
    "Services",
    "Utils",
    "*"
  ],
  "groupOrder": [
    "Background Task",
    "*"
  ]
}
```

這確保了我們的 `@category` 和 `@group` 標籤能正確分類顯示。
/**
 * @fileoverview Redux Slice 活動追蹤示例模組
 * 這個模組展示了如何使用現代 Redux Toolkit 的 createSlice 方法進行活動追蹤
 * 相比傳統 Redux，使用 Redux Toolkit 可以大幅簡化代碼結構和提升開發效率
 * 適合現代 React 應用的狀態管理需求
 * 
 * @author AIOT Team
 * @version 1.0.0
 */

// 引入 React 核心庫
import React from 'react';
// 引入 Redux 的 Provider 組件用於提供全域狀態管理
import { Provider } from 'react-redux';
// 引入應用程式的主要 Redux store 實例
import { store } from '../store/store';
// 引入基於 Redux Slice 的活動儀表板組件
import { ActivityDashboard, SimpleActivityDashboard } from '../components/ActivityDashboard';
// 引入使用 Redux Slice 的自定義 Hook
import { useActivitySlice } from '../hooks/useActivitySlice';

/**
 * Redux Slice 活動追蹤示例的主要內容組件
 * 這個組件展示了如何使用 Redux Toolkit 的 createSlice 進行狀態管理
 * 
 * @description 組件特點：
 * - 使用 Redux Toolkit 的現代化狀態管理方式
 * - 自動生成 action creators 和 reducers
 * - 內建 Immer 支援不可變更新
 * - 簡化的程式碼結構和更好的 TypeScript 支援
 * - 提供直觀的使用者介面來演示功能
 * 
 * @example
 * ```tsx
 * // 在應用中使用 Redux Slice 方式
 * function App() {
 *   return (
 *     <Provider store={store}>
 *       <SliceActivityContent />
 *     </Provider>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 返回 Redux Slice 活動追蹤示例組件
 */
const SliceActivityContent: React.FC = () => {
  // 從 useActivitySlice hook 取得 Redux Slice 管理的狀態和方法
  const { 
    stats,              // 活動統計數據
    loading,            // 載入狀態標識
    error,              // 錯誤訊息
    autoTrackingEnabled, // 自動追蹤啟用狀態
    toggleTracking,     // 切換追蹤狀態的方法
    syncData            // 同步數據的方法
  } = useActivitySlice();

  return (
    <div className="slice-activity-example">
      {/* 頁面標題區域：說明使用的技術和目的 */}
      <div className="example-header">
        <h1>Redux Slice 活動追蹤</h1>
        <p>使用現代 Redux Toolkit 的 createSlice 方式</p>
      </div>

      {/* 控制區域：提供使用者操作按鈕 */}
      <div className="controls">
        {/* 追蹤切換按鈕：根據當前狀態動態調整樣式和文字 */}
        <button 
          onClick={toggleTracking}
          className={`control-btn ${autoTrackingEnabled ? 'active' : ''}`}
        >
          {autoTrackingEnabled ? '停用' : '啟用'}追蹤
        </button>
        {/* 數據同步按鈕：手動觸發數據同步 */}
        <button onClick={syncData} className="control-btn">
          同步數據
        </button>
      </div>

      {/* 主要儀表板：展示活動追蹤的詳細資訊 */}
      <ActivityDashboard />

      {/* 狀態信息區域：顯示當前系統狀態 */}
      <div className="status-info">
        <h3>狀態信息</h3>
        <div className="status-items">
          {/* 載入狀態顯示 */}
          <div className="status-item">
            <span>載入狀態：</span>
            <span className={loading ? 'loading' : 'idle'}>
              {loading ? '載入中' : '閒置'}
            </span>
          </div>
          {/* 錯誤狀態顯示 */}
          <div className="status-item">
            <span>錯誤狀態：</span>
            <span className={error ? 'error' : 'ok'}>
              {error || '正常'}
            </span>
          </div>
          {/* 統計數據載入狀態 */}
          <div className="status-item">
            <span>統計數據：</span>
            <span>{stats ? '已載入' : '未載入'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 完整的 Redux Slice 示例應用組件
 * 這是主要的匯出組件，展示 Redux Toolkit 的完整功能
 * 
 * @description 特色功能：
 * - 使用 Redux Toolkit 的現代化狀態管理
 * - 自動包含 Redux Provider 設置
 * - 展示 createSlice 的實際應用
 * - 提供完整的使用者介面和狀態管理
 * - 適合作為學習 Redux Toolkit 的範例
 * 
 * @example
 * ```tsx
 * // 在應用中使用 Redux Slice 方式
 * import { SliceActivityExample } from './examples/SliceActivityExample';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <SliceActivityExample />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 包含 Redux Provider 的完整 Slice 示例組件
 */
export const SliceActivityExample: React.FC = () => {
  return (
    // 使用 Redux Provider 包裝整個應用，提供全域狀態管理
    <Provider store={store}>
      <SliceActivityContent />
    </Provider>
  );
};

/**
 * 簡化版的 Redux Slice 示例組件
 * 提供最基本的 Redux Slice 功能演示
 * 
 * @description 適用場景：
 * - 需要快速理解 Redux Slice 基本概念
 * - 簡潔的介面設計，專注於核心功能
 * - 適合嵌入到現有應用中進行測試
 * - 展示 Redux Toolkit 的簡化特性
 * 
 * @example
 * ```tsx
 * // 在現有應用中嵌入簡化版示例
 * import { SimpleSliceExample } from './examples/SliceActivityExample';
 * 
 * function Dashboard() {
 *   return (
 *     <div>
 *       <h1>我的儀表板</h1>
 *       <SimpleSliceExample />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 簡化版 Redux Slice 活動追蹤組件
 */
export const SimpleSliceExample: React.FC = () => {
  return (
    // 使用 Redux Provider 提供狀態管理
    <Provider store={store}>
      <div className="simple-slice-example">
        {/* 簡潔的標題 */}
        <h1>簡化版活動追蹤</h1>
        {/* 直接嵌入簡化版活動儀表板組件 */}
        <SimpleActivityDashboard />
      </div>
    </Provider>
  );
};

/**
 * Redux Slice 使用指南組件
 * 提供完整的 Redux Toolkit 使用教學和程式碼範例
 * 
 * @description 教學內容：
 * - Redux Toolkit 的基本設置方法
 * - createSlice 的使用方式和優勢
 * - 現代化 Redux 開發的最佳實踐
 * - 與傳統 Redux 的比較和遷移指南
 * - 實際應用場景的程式碼範例
 * 
 * @example
 * ```tsx
 * // 作為文檔頁面或教學頁面使用
 * import { SliceUsageGuide } from './examples/SliceActivityExample';
 * 
 * function TutorialPage() {
 *   return (
 *     <div>
 *       <SliceUsageGuide />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 使用指南和教學組件
 */
export const SliceUsageGuide: React.FC = () => {
  return (
    <div className="slice-usage-guide">
      {/* 主標題 */}
      <h1>Redux Slice 使用指南</h1>
      
      {/* 基本設置章節 */}
      <div className="guide-section">
        <h2>1. 基本設置</h2>
        {/* 程式碼範例：展示如何設置 Redux Store 和 Provider */}
        <pre className="code-block">
{`// 1. 創建 store
import { store } from './store/store';

// 2. 包裹應用
<Provider store={store}>
  <App />
</Provider>`}
        </pre>
      </div>

      {/* Hook 使用章節 */}
      <div className="guide-section">
        <h2>2. 使用 Hook</h2>
        {/* 程式碼範例：展示如何使用自定義 Hook 簡化狀態管理 */}
        <pre className="code-block">
{`import { useActivitySlice } from './hooks/useActivitySlice';

function MyComponent() {
  const { 
    stats, 
    loading, 
    recordPageVisit, 
    toggleTracking 
  } = useActivitySlice();

  const handleClick = () => {
    recordPageVisit('/special-page');
  };

  return (
    <div>
      {loading ? '載入中...' : \`登入次數: \${stats?.loginCount}\`}
      <button onClick={handleClick}>記錄訪問</button>
    </div>
  );
}`}
        </pre>
      </div>

      {/* 直接使用 Redux 章節 */}
      <div className="guide-section">
        <h2>3. 直接使用 Redux</h2>
        {/* 程式碼範例：展示如何直接使用 Redux Toolkit 的 dispatch 和 selector */}
        <pre className="code-block">
{`import { useAppSelector, useAppDispatch } from './store/store';
import { fetchActivityStats, recordPageVisit } from './store/slices/activitySlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector(state => state.activity);

  const handleFetch = () => {
    dispatch(fetchActivityStats());
  };

  const handleRecord = () => {
    dispatch(recordPageVisit({ page: '/test' }));
  };

  return (
    <div>
      <button onClick={handleFetch}>獲取統計</button>
      <button onClick={handleRecord}>記錄訪問</button>
    </div>
  );
}`}
        </pre>
      </div>

      {/* Redux Toolkit 優勢章節 */}
      <div className="guide-section">
        <h2>4. 優勢</h2>
        {/* 列出使用 Redux Toolkit 的主要優勢 */}
        <ul>
          <li>✅ 更簡潔的代碼結構</li>
          <li>✅ 內建 createAsyncThunk 支援</li>
          <li>✅ 自動生成 action creators</li>
          <li>✅ 更好的 TypeScript 支援</li>
          <li>✅ 內建 Immer 支援不可變更新</li>
          <li>✅ 減少 boilerplate 代碼</li>
        </ul>
      </div>
    </div>
  );
};
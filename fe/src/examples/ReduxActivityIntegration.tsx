/**
 * @fileoverview Redux 活動追蹤整合示例模組
 * 這個模組展示了如何使用 Redux 進行使用者活動追蹤的完整實作
 * 包含狀態管理、頁面追蹤、會話管理和錯誤處理等功能
 * 適用於需要集中管理使用者行為數據的應用程式
 * 
 * @author AIOT Team
 * @version 1.0.0
 */

// 引入 React 核心庫和 useEffect Hook 用於組件生命週期管理
import React, { useEffect } from 'react';
// 引入 Redux 的 Provider 組件用於提供全域狀態管理
import { Provider } from 'react-redux';
// 引入應用程式的主要 Redux store 實例
import { store } from '../store/store';
// 引入基於 Redux 的活動儀表板組件
import { ActivityDashboard } from '../components/ActivityDashboard';
// 引入自定義的 Redux hooks 用於活動追蹤、會話管理和頁面追蹤
import { useActivityRedux, useSessionRedux, usePageTrackingRedux } from '../hooks/useActivityRedux';
// 引入活動儀表板的 CSS 樣式文件
import '../styles/ActivityDashboard.css';

/**
 * Redux 活動追蹤整合示例的主要內容組件
 * 這個組件展示了如何在實際應用中整合 Redux 狀態管理與活動追蹤功能
 * 
 * @description 組件特點：
 * - 使用 Redux hooks 管理活動追蹤狀態
 * - 提供手動控制介面來管理追蹤功能
 * - 即時顯示當前追蹤狀態和會話資訊
 * - 包含完整的錯誤處理和開發者調試資訊
 * - 支援頁面訪問模擬和數據同步功能
 * 
 * @example
 * ```tsx
 * // 在應用中使用
 * function App() {
 *   return (
 *     <Provider store={store}>
 *       <ActivityIntegrationContent />
 *     </Provider>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 返回活動追蹤整合示例組件
 */
const ActivityIntegrationContent: React.FC = () => {
  // 從 useActivityRedux hook 取得活動追蹤相關的狀態和方法
  const { 
    activity,           // 當前活動數據
    stats,              // 統計資訊
    isLoading,          // 載入狀態標識
    hasError,           // 錯誤狀態標識
    errorMessage,       // 錯誤訊息內容
    syncData,           // 同步數據的方法
    toggleTracking,     // 切換追蹤狀態的方法
    autoTrackingEnabled // 自動追蹤是否啟用的狀態
  } = useActivityRedux();

  // 從 useSessionRedux hook 取得會話相關資訊
  const { sessionInfo } = useSessionRedux();
  
  // 從 usePageTrackingRedux hook 取得頁面追蹤方法
  const { trackCurrentPage } = usePageTrackingRedux();

  /**
   * 組件初始化效果
   * 在組件掛載時執行一次，用於初始化活動追蹤系統
   */
  useEffect(() => {
    // 在控制台輸出初始化確認訊息
    console.log('Activity tracking initialized');
  }, []); // 空依賴陣列確保只執行一次

  /**
   * 處理頁面變更的函數
   * 模擬頁面導航並觸發頁面追蹤
   * 
   * @param {string} newPage - 新頁面的路徑
   */
  const handlePageChange = (newPage: string) => {
    // 使用 History API 更新瀏覽器網址列，但不重新載入頁面
    window.history.pushState({}, '', newPage);
    // 觸發頁面追蹤記錄
    trackCurrentPage();
  };

  /**
   * 處理數據同步的函數
   * 手動觸發與服務器的數據同步
   */
  const handleSync = () => {
    // 調用同步數據方法
    syncData();
  };

  return (
    <div className="activity-integration-redux">
      {/* 頁面標題區域：顯示應用程式名稱和說明 */}
      <div className="integration-header">
        <h1>使用者活動追蹤 (Redux)</h1>
        <p>使用 Redux 進行狀態管理的活動追蹤系統</p>
      </div>

      {/* 控制面板：提供使用者互動控制項 */}
      <div className="control-panel">
        {/* 追蹤控制區域：管理追蹤狀態和數據同步 */}
        <div className="control-section">
          <h3>追蹤控制</h3>
          <div className="control-buttons">
            {/* 自動追蹤切換按鈕：根據當前狀態顯示不同文字和樣式 */}
            <button 
              onClick={toggleTracking}
              className={`control-button ${autoTrackingEnabled ? 'active' : ''}`}
            >
              {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
            </button>
            {/* 手動同步按鈕：觸發數據與服務器同步 */}
            <button onClick={handleSync} className="control-button">
              同步資料
            </button>
          </div>
        </div>

        {/* 頁面控制區域：模擬不同頁面的導航行為 */}
        <div className="control-section">
          <h3>頁面控制</h3>
          <div className="control-buttons">
            {/* 模擬 Dashboard 頁面訪問 */}
            <button onClick={() => handlePageChange('/dashboard')} className="control-button">
              模擬訪問 Dashboard
            </button>
            {/* 模擬 Profile 頁面訪問 */}
            <button onClick={() => handlePageChange('/profile')} className="control-button">
              模擬訪問 Profile
            </button>
            {/* 模擬 Settings 頁面訪問 */}
            <button onClick={() => handlePageChange('/settings')} className="control-button">
              模擬訪問 Settings
            </button>
          </div>
        </div>
      </div>

      {/* 當前狀態顯示區域：即時顯示系統狀態資訊 */}
      <div className="current-status">
        <h3>當前狀態</h3>
        <div className="status-grid">
          {/* 自動追蹤狀態顯示 */}
          <div className="status-item">
            <span className="status-label">自動追蹤：</span>
            <span className={`status-value ${autoTrackingEnabled ? 'active' : 'inactive'}`}>
              {autoTrackingEnabled ? '啟用' : '停用'}
            </span>
          </div>
          {/* 當前頁面顯示 */}
          <div className="status-item">
            <span className="status-label">當前頁面：</span>
            <span className="status-value">{sessionInfo.currentPage}</span>
          </div>
          {/* 會話時長顯示：將毫秒轉換為分鐘顯示 */}
          <div className="status-item">
            <span className="status-label">會話時長：</span>
            <span className="status-value">
              {Math.round(sessionInfo.sessionDuration / 1000 / 60)}分鐘
            </span>
          </div>
          {/* 載入狀態顯示 */}
          <div className="status-item">
            <span className="status-label">載入狀態：</span>
            <span className="status-value">{isLoading ? '載入中' : '已載入'}</span>
          </div>
        </div>
      </div>

      {/* 錯誤處理區域：僅在有錯誤時顯示 */}
      {hasError && (
        <div className="error-section">
          <div className="error-alert">
            <h3>⚠️ 發生錯誤</h3>
            {/* 顯示具體的錯誤訊息 */}
            <p>{errorMessage}</p>
            {/* 提供重試按鈕讓使用者重新同步 */}
            <button onClick={handleSync} className="retry-button">
              重新同步
            </button>
          </div>
        </div>
      )}

      {/* 主要儀表板組件：顯示活動追蹤的詳細資訊 */}
      <ActivityDashboard />

      {/* 開發者資訊區域：僅在開發環境中顯示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="developer-info">
          <h3>開發者資訊</h3>
          <div className="dev-info-grid">
            {/* Redux Store 狀態顯示 */}
            <div className="dev-info-section">
              <h4>Redux Store 狀態</h4>
              <pre className="dev-info-code">
                {/* 格式化並顯示當前 Redux 狀態的簡要資訊 */}
                {JSON.stringify({
                  hasActivity: !!activity,                    // 是否有活動數據
                  hasStats: !!stats,                          // 是否有統計數據
                  isLoading,                                  // 載入狀態
                  hasError,                                   // 錯誤狀態
                  autoTrackingEnabled,                        // 自動追蹤狀態
                  currentPage: sessionInfo.currentPage,       // 當前頁面
                  sessionDuration: sessionInfo.sessionDuration // 會話時長
                }, null, 2)}
              </pre>
            </div>
            {/* 會話資訊顯示 */}
            <div className="dev-info-section">
              <h4>會話資訊</h4>
              <pre className="dev-info-code">
                {/* 格式化並顯示完整的會話資訊 */}
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 帶有 Redux Provider 的完整活動追蹤整合組件
 * 這是主要的匯出組件，包含完整的 Redux 狀態管理功能
 * 
 * @description 特色功能：
 * - 自動包含 Redux Provider 設置
 * - 提供完整的活動追蹤功能示例
 * - 包含錯誤處理和狀態管理
 * - 適合作為獨立的活動追蹤應用使用
 * 
 * @example
 * ```tsx
 * // 在主應用中使用
 * import { ReduxActivityIntegration } from './examples/ReduxActivityIntegration';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <ReduxActivityIntegration />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 包含 Redux Provider 的完整活動追蹤組件
 */
export const ReduxActivityIntegration: React.FC = () => {
  return (
    // 使用 Redux Provider 包裝整個應用，提供全域狀態管理
    <Provider store={store}>
      <ActivityIntegrationContent />
    </Provider>
  );
};

/**
 * 簡化版的 Redux 活動追蹤組件
 * 提供最基本的活動追蹤功能，適合快速集成和測試
 * 
 * @description 適用場景：
 * - 需要快速集成活動追蹤功能
 * - 不需要複雜的控制介面
 * - 適合嵌入到現有應用中
 * - 最小化的介面設計
 * 
 * @example
 * ```tsx
 * // 在現有應用中嵌入
 * import { SimpleReduxActivityApp } from './examples/ReduxActivityIntegration';
 * 
 * function Dashboard() {
 *   return (
 *     <div>
 *       <h1>我的儀表板</h1>
 *       <SimpleReduxActivityApp />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 簡化版活動追蹤組件
 */
export const SimpleReduxActivityApp: React.FC = () => {
  return (
    // 使用 Redux Provider 提供狀態管理
    <Provider store={store}>
      <div className="simple-redux-activity-app">
        {/* 簡潔的標題 */}
        <h1>簡化版活動追蹤</h1>
        {/* 直接嵌入活動儀表板組件 */}
        <ActivityDashboard />
      </div>
    </Provider>
  );
};

/**
 * 活動追蹤使用示例和教學組件
 * 提供完整的使用指南和程式碼示例
 * 
 * @description 教學內容：
 * - 基本的 Redux 設置和使用方法
 * - Hook 的使用示例和最佳實踐
 * - 常見使用場景的程式碼範例
 * - 適合開發者學習和參考
 * 
 * @example
 * ```tsx
 * // 作為文檔頁面使用
 * import { ActivityUsageExample } from './examples/ReduxActivityIntegration';
 * 
 * function DocumentationPage() {
 *   return (
 *     <div>
 *       <ActivityUsageExample />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {React.FC} 使用示例和教學組件
 */
export const ActivityUsageExample: React.FC = () => {
  return (
    // 使用 Redux Provider 包裝示例組件，提供狀態管理
    <Provider store={store}>
      <div className="activity-usage-example">
        {/* 主標題 */}
        <h1>活動追蹤使用示例</h1>
        
        {/* 基本使用示例區域 */}
        <div className="example-section">
          <h2>基本使用</h2>
          <p>只需要用 Provider 包裹你的應用，然後使用組件：</p>
          {/* 程式碼範例：展示最基本的 Redux 設置 */}
          <pre className="example-code">
{`import { Provider } from 'react-redux';
import { store } from './store/store';
import { ActivityDashboard } from './components/ActivityDashboard';

function App() {
  return (
    <Provider store={store}>
      <ActivityDashboard />
    </Provider>
  );
}`}
          </pre>
        </div>

        {/* Hook 使用示例區域 */}
        <div className="example-section">
          <h2>使用 Hook</h2>
          <p>在組件中使用 Redux hooks：</p>
          {/* 程式碼範例：展示如何在組件中使用自定義 Hook */}
          <pre className="example-code">
{`import { useActivityRedux } from './hooks/useActivityRedux';

function MyComponent() {
  const { 
    stats, 
    isLoading, 
    recordPageVisit, 
    toggleTracking 
  } = useActivityRedux();

  const handleButtonClick = () => {
    recordPageVisit('/special-page');
  };

  return (
    <div>
      {isLoading ? '載入中...' : \`登入次數: \${stats?.loginCount}\`}
      <button onClick={handleButtonClick}>記錄頁面訪問</button>
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </Provider>
  );
};
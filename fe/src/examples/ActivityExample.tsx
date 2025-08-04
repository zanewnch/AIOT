/**
 * @fileoverview Zustand + React Query 活動追蹤示例模組
 * 
 * 展示現代化狀態管理的完整實作，使用 Zustand 和 React Query 
 * 替代傳統的 Redux 方案，提供更簡潔和高效的狀態管理。
 * 
 * @author AIOT Team
 * @version 2.0.0
 */

import React from 'react';
import { QueryProvider } from '../configs/queryConfig';

/**
 * 活動追蹤示例的主要內容組件
 * 
 * 展示如何使用 Zustand + React Query 進行狀態管理
 */
const ActivityExampleContent: React.FC = () => {
  // const activityQuery = new ActivityQuery(); // Removed
  const {
    autoTrackingEnabled,
    toggleAutoTracking,
    trackPageVisit,
    syncData,
    loading,
    error,
    sessionInfo,
  } = { autoTrackingEnabled: false, toggleAutoTracking: () => {}, trackPageVisit: () => {}, syncData: () => {}, loading: false, error: null, sessionInfo: null }; // Removed activityQuery

  const handlePageNavigation = (page: string) => {
    trackPageVisit(page);
  };

  return (
    <div className="activity-example">
      <div className="example-header">
        <h1>🚀 活動追蹤示例 (Zustand + React Query)</h1>
        <p>現代化狀態管理方案，輕量級且高效</p>
      </div>

      {/* 控制面板 */}
      <div className="control-panel">
        <div className="control-section">
          <h3>📊 系統狀態</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">狀態管理：</span>
              <span className="value">Zustand + React Query</span>
            </div>
            <div className="status-item">
              <span className="label">自動追蹤：</span>
              <span className={`value ${autoTrackingEnabled ? 'active' : 'inactive'}`}>
                {autoTrackingEnabled ? '✅ 啟用' : '❌ 停用'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">載入狀態：</span>
              <span className="value">{loading ? '🔄 載入中' : '✅ 已完成'}</span>
            </div>
            <div className="status-item">
              <span className="label">當前頁面：</span>
              <span className="value">{sessionInfo.currentPage}</span>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h3>🎛️ 控制選項</h3>
          <div className="control-buttons">
            <button 
              onClick={toggleAutoTracking}
              className={`control-button ${autoTrackingEnabled ? 'active' : ''}`}
            >
              {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
            </button>
            <button onClick={() => syncData()} className="control-button">
              同步數據
            </button>
          </div>
        </div>

        <div className="control-section">
          <h3>🧪 頁面導航測試</h3>
          <div className="control-buttons">
            <button 
              onClick={() => handlePageNavigation('/home')} 
              className="control-button"
            >
              🏠 首頁
            </button>
            <button 
              onClick={() => handlePageNavigation('/products')} 
              className="control-button"
            >
              🛍️ 產品頁
            </button>
            <button 
              onClick={() => handlePageNavigation('/contact')} 
              className="control-button"
            >
              📞 聯繫我們
            </button>
          </div>
        </div>
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>錯誤: {error}</span>
        </div>
      )}

      {/* 主要儀表板 */}
      {/* ActivityDashboard 組件已移除 */}
    </div>
  );
};

/**
 * 完整的活動追蹤示例組件
 * 包含 QueryProvider 包裝器
 */
export const ActivityExample: React.FC = () => {
  return (
    <QueryProvider>
      <ActivityExampleContent />
    </QueryProvider>
  );
};

/**
 * 簡化版活動追蹤示例
 * 只展示核心統計數據
 */
export const SimpleActivityExample: React.FC = () => {
  return (
    <QueryProvider>
      <div className="simple-activity-example">
        <h1>📈 簡化版活動統計</h1>
        {/* SimpleActivityDashboard 組件已移除 */}
        
        {/* 技術說明 */}
        <div className="tech-info">
          <h3>🛠️ 技術特色</h3>
          <div className="tech-features">
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <div className="feature-content">
                <h4>Zustand</h4>
                <p>輕量級狀態管理，無需 boilerplate 代碼</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🔄</span>
              <div className="feature-content">
                <h4>React Query</h4>
                <p>強大的數據獲取、緩存和同步功能</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🚀</span>
              <div className="feature-content">
                <h4>樂觀更新</h4>
                <p>即時 UI 更新，提升用戶體驗</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🛡️</span>
              <div className="feature-content">
                <h4>錯誤處理</h4>
                <p>自動重試和錯誤恢復機制</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
};

/**
 * 活動追蹤使用指南和示例
 */
export const ActivityUsageGuide: React.FC = () => {
  return (
    <div className="activity-usage-guide">
      <h1>📚 Zustand + React Query 使用指南</h1>
      
      {/* 基本設置 */}
      <div className="guide-section">
        <h2>1. 基本設置</h2>
        <p>使用 QueryProvider 包裝你的應用：</p>
        <pre className="code-block">
{`import { QueryProvider } from './configs/queryConfig';
// import { ActivityDashboard } from './components/ActivityDashboard'; // 已移除

function App() {
  return (
    <QueryProvider>
      {/* ActivityDashboard 組件已移除 */}
    </QueryProvider>
  );
}`}
        </pre>
      </div>

      {/* Hook 使用 */}
      <div className="guide-section">
        <h2>2. 使用綜合 Hook</h2>
        <p>使用 useActivityTracking Hook 獲取所有必要的狀態和方法：</p>
        <pre className="code-block">
{`import { useActivityTracking } from './hooks/useActivityQuery';

function MyComponent() {
  const {
    stats,              // 統計數據
    loading,            // 載入狀態
    error,              // 錯誤信息
    trackPageVisit,     // 追蹤頁面訪問
    toggleAutoTracking, // 切換自動追蹤
    syncData,           // 同步數據
  } = useActivityTracking();

  const handlePageVisit = (page: string) => {
    trackPageVisit(page);
  };

  return (
    <div>
      {loading && <div>載入中...</div>}
      {error && <div>錯誤: {error}</div>}
      {stats && <div>登入次數: {stats.loginCount}</div>}
      <button onClick={() => handlePageVisit('/special')}>
        訪問特殊頁面
      </button>
    </div>
  );
}`}
        </pre>
      </div>

      {/* Zustand Store 使用 */}
      <div className="guide-section">
        <h2>3. 直接使用 Zustand Store</h2>
        <p>也可以直接使用 Zustand store：</p>
        <pre className="code-block">
{`import { useActivityStore } from './stores/activityStore';

function MyComponent() {
  const {
    autoTrackingEnabled,
    toggleAutoTracking,
    setCurrentPage,
    sessionInfo,
  } = useActivityStore();

  return (
    <div>
      <p>自動追蹤: {autoTrackingEnabled ? '啟用' : '停用'}</p>
      <p>當前頁面: {sessionInfo.currentPage}</p>
      <button onClick={toggleAutoTracking}>
        切換自動追蹤
      </button>
    </div>
  );
}`}
        </pre>
      </div>

      {/* 優勢說明 */}
      <div className="guide-section">
        <h2>4. 相比 Redux 的優勢</h2>
        <div className="advantages">
          <div className="advantage">
            <span className="advantage-icon">✨</span>
            <div>
              <h4>更少的 Boilerplate</h4>
              <p>不需要 actions、reducers、selectors 的複雜設置</p>
            </div>
          </div>
          <div className="advantage">
            <span className="advantage-icon">🎯</span>
            <div>
              <h4>更好的 TypeScript 支持</h4>
              <p>自動類型推斷，無需手動類型定義</p>
            </div>
          </div>
          <div className="advantage">
            <span className="advantage-icon">⚡</span>
            <div>
              <h4>更好的性能</h4>
              <p>細粒度訂閱，只在需要時重新渲染</p>
            </div>
          </div>
          <div className="advantage">
            <span className="advantage-icon">🔄</span>
            <div>
              <h4>強大的數據同步</h4>
              <p>React Query 提供緩存、重試、背景更新等功能</p>
            </div>
          </div>
        </div>
      </div>

      {/* 實際示例 */}
      <div className="guide-section">
        <h2>5. 實際示例</h2>
        <QueryProvider>
          {/* SimpleActivityDashboard 組件已移除 */}
        </QueryProvider>
      </div>
    </div>
  );
};
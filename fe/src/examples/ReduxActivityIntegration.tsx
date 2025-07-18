import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { ActivityDashboardRedux } from '../components/ActivityDashboardRedux';
import { useActivityRedux, useSessionRedux, usePageTrackingRedux } from '../hooks/useActivityRedux';
import '../styles/ActivityDashboard.css';

/**
 * Redux 活動追蹤整合示例
 */
const ActivityIntegrationContent: React.FC = () => {
  const { 
    activity, 
    stats, 
    isLoading, 
    hasError, 
    errorMessage,
    syncData,
    toggleTracking,
    autoTrackingEnabled 
  } = useActivityRedux();

  const { sessionInfo } = useSessionRedux();
  const { trackCurrentPage } = usePageTrackingRedux();

  // 應用啟動時的初始化
  useEffect(() => {
    console.log('Activity tracking initialized');
  }, []);

  // 手動觸發頁面追蹤
  const handlePageChange = (newPage: string) => {
    window.history.pushState({}, '', newPage);
    trackCurrentPage();
  };

  // 手動觸發資料同步
  const handleSync = () => {
    syncData();
  };

  return (
    <div className="activity-integration-redux">
      <div className="integration-header">
        <h1>使用者活動追蹤 (Redux)</h1>
        <p>使用 Redux 進行狀態管理的活動追蹤系統</p>
      </div>

      {/* 控制面板 */}
      <div className="control-panel">
        <div className="control-section">
          <h3>追蹤控制</h3>
          <div className="control-buttons">
            <button 
              onClick={toggleTracking}
              className={`control-button ${autoTrackingEnabled ? 'active' : ''}`}
            >
              {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
            </button>
            <button onClick={handleSync} className="control-button">
              同步資料
            </button>
          </div>
        </div>

        <div className="control-section">
          <h3>頁面控制</h3>
          <div className="control-buttons">
            <button onClick={() => handlePageChange('/dashboard')} className="control-button">
              模擬訪問 Dashboard
            </button>
            <button onClick={() => handlePageChange('/profile')} className="control-button">
              模擬訪問 Profile
            </button>
            <button onClick={() => handlePageChange('/settings')} className="control-button">
              模擬訪問 Settings
            </button>
          </div>
        </div>
      </div>

      {/* 當前狀態顯示 */}
      <div className="current-status">
        <h3>當前狀態</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">自動追蹤：</span>
            <span className={`status-value ${autoTrackingEnabled ? 'active' : 'inactive'}`}>
              {autoTrackingEnabled ? '啟用' : '停用'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">當前頁面：</span>
            <span className="status-value">{sessionInfo.currentPage}</span>
          </div>
          <div className="status-item">
            <span className="status-label">會話時長：</span>
            <span className="status-value">
              {Math.round(sessionInfo.sessionDuration / 1000 / 60)}分鐘
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">載入狀態：</span>
            <span className="status-value">{isLoading ? '載入中' : '已載入'}</span>
          </div>
        </div>
      </div>

      {/* 錯誤處理 */}
      {hasError && (
        <div className="error-section">
          <div className="error-alert">
            <h3>⚠️ 發生錯誤</h3>
            <p>{errorMessage}</p>
            <button onClick={handleSync} className="retry-button">
              重新同步
            </button>
          </div>
        </div>
      )}

      {/* 主要儀表板 */}
      <ActivityDashboardRedux />

      {/* 開發者資訊 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="developer-info">
          <h3>開發者資訊</h3>
          <div className="dev-info-grid">
            <div className="dev-info-section">
              <h4>Redux Store 狀態</h4>
              <pre className="dev-info-code">
                {JSON.stringify({
                  hasActivity: !!activity,
                  hasStats: !!stats,
                  isLoading,
                  hasError,
                  autoTrackingEnabled,
                  currentPage: sessionInfo.currentPage,
                  sessionDuration: sessionInfo.sessionDuration
                }, null, 2)}
              </pre>
            </div>
            <div className="dev-info-section">
              <h4>會話資訊</h4>
              <pre className="dev-info-code">
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
 * 帶有 Redux Provider 的完整組件
 */
export const ReduxActivityIntegration: React.FC = () => {
  return (
    <Provider store={store}>
      <ActivityIntegrationContent />
    </Provider>
  );
};

/**
 * 簡化的 Redux 活動追蹤組件
 */
export const SimpleReduxActivityApp: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="simple-redux-activity-app">
        <h1>簡化版活動追蹤</h1>
        <ActivityDashboardRedux />
      </div>
    </Provider>
  );
};

/**
 * 使用示例
 */
export const ActivityUsageExample: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="activity-usage-example">
        <h1>活動追蹤使用示例</h1>
        
        <div className="example-section">
          <h2>基本使用</h2>
          <p>只需要用 Provider 包裹你的應用，然後使用組件：</p>
          <pre className="example-code">
{`import { Provider } from 'react-redux';
import { store } from './store/store';
import { ActivityDashboardRedux } from './components/ActivityDashboardRedux';

function App() {
  return (
    <Provider store={store}>
      <ActivityDashboardRedux />
    </Provider>
  );
}`}
          </pre>
        </div>

        <div className="example-section">
          <h2>使用 Hook</h2>
          <p>在組件中使用 Redux hooks：</p>
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
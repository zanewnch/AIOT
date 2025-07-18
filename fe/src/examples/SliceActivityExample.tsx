import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { ActivityDashboardSlice, SimpleActivityDashboard } from '../components/ActivityDashboardSlice';
import { useActivitySlice } from '../hooks/useActivitySlice';

/**
 * Redux Slice 活動追蹤示例
 */
const SliceActivityContent: React.FC = () => {
  const { 
    stats, 
    loading, 
    error, 
    autoTrackingEnabled, 
    toggleTracking,
    syncData 
  } = useActivitySlice();

  return (
    <div className="slice-activity-example">
      <div className="example-header">
        <h1>Redux Slice 活動追蹤</h1>
        <p>使用現代 Redux Toolkit 的 createSlice 方式</p>
      </div>

      {/* 控制區域 */}
      <div className="controls">
        <button 
          onClick={toggleTracking}
          className={`control-btn ${autoTrackingEnabled ? 'active' : ''}`}
        >
          {autoTrackingEnabled ? '停用' : '啟用'}追蹤
        </button>
        <button onClick={syncData} className="control-btn">
          同步數據
        </button>
      </div>

      {/* 主要儀表板 */}
      <ActivityDashboardSlice />

      {/* 狀態信息 */}
      <div className="status-info">
        <h3>狀態信息</h3>
        <div className="status-items">
          <div className="status-item">
            <span>載入狀態：</span>
            <span className={loading ? 'loading' : 'idle'}>
              {loading ? '載入中' : '閒置'}
            </span>
          </div>
          <div className="status-item">
            <span>錯誤狀態：</span>
            <span className={error ? 'error' : 'ok'}>
              {error || '正常'}
            </span>
          </div>
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
 * 完整的 Redux Slice 示例應用
 */
export const SliceActivityExample: React.FC = () => {
  return (
    <Provider store={store}>
      <SliceActivityContent />
    </Provider>
  );
};

/**
 * 簡化版示例
 */
export const SimpleSliceExample: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="simple-slice-example">
        <h1>簡化版活動追蹤</h1>
        <SimpleActivityDashboard />
      </div>
    </Provider>
  );
};

/**
 * 使用指南組件
 */
export const SliceUsageGuide: React.FC = () => {
  return (
    <div className="slice-usage-guide">
      <h1>Redux Slice 使用指南</h1>
      
      <div className="guide-section">
        <h2>1. 基本設置</h2>
        <pre className="code-block">
{`// 1. 創建 store
import { store } from './store/store';

// 2. 包裹應用
<Provider store={store}>
  <App />
</Provider>`}
        </pre>
      </div>

      <div className="guide-section">
        <h2>2. 使用 Hook</h2>
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

      <div className="guide-section">
        <h2>3. 直接使用 Redux</h2>
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

      <div className="guide-section">
        <h2>4. 優勢</h2>
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
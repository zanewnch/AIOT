/**
 * @fileoverview 基於 Redux 的活動統計儀表板組件
 * 
 * 此組件使用 Redux 狀態管理來處理活動統計數據，包括：
 * - Redux Toolkit 的 actions 和 selectors
 * - 自動追蹤功能的開關控制
 * - 實時會話分析顯示
 * - 頁面訪問記錄功能
 * - 錯誤狀態和載入狀態管理
 * - 開發者模式下的除錯信息
 * 
 * 組件展示了如何在 React 中正確使用 Redux 進行狀態管理，
 * 包括使用 typed hooks 確保類型安全。
 * 
 * @author AI-IOT Development Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react'; // React 核心庫和 useEffect Hook
import { useAppDispatch, useAppSelector } from '../store/store'; // 類型化的 Redux hooks
import { 
  fetchActivityStats,    // 獲取活動統計數據的 action
  syncActivityData,      // 同步活動數據的 action
  recordPageVisit        // 記錄頁面訪問的 action
} from '../store/actions/activityActions';
import { 
  selectDashboardData,   // 選擇儀表板數據的 selector
  selectQuickStats,      // 選擇快速統計數據的 selector
  selectPageAnalytics,   // 選擇頁面分析數據的 selector
  selectSessionAnalytics, // 選擇會話分析數據的 selector
  selectIsLoading,       // 選擇載入狀態的 selector
  selectHasError,        // 選擇錯誤狀態的 selector
  selectErrorMessage     // 選擇錯誤消息的 selector
} from '../store/selectors/activitySelectors';
import { toggleAutoTracking } from '../store/reducers/activityReducer'; // 切換自動追蹤的 action

/**
 * 使用 Redux 的活動統計儀表板組件
 * 
 * 此組件展示了如何在 React 中使用 Redux 進行複雜的狀態管理。
 * 包括多個 selectors 的使用、異步 actions 的派發和錯誤處理。
 * 
 * @component
 * @returns {JSX.Element} Redux 活動統計儀表板組件
 * 
 * @example
 * ```tsx
 * import { ActivityDashboardRedux } from './ActivityDashboardRedux';
 * 
 * function App() {
 *   return (
 *     <Provider store={store}>
 *       <ActivityDashboardRedux />
 *     </Provider>
 *   );
 * }
 * ```
 */
export const ActivityDashboardRedux: React.FC = () => {
  // 獲取 Redux dispatch 函數
  const dispatch = useAppDispatch();
  
  // 使用 Redux selectors 獲取各種數據
  const { stats, isReady } = useAppSelector(selectDashboardData);         // 儀表板基本數據
  const quickStats = useAppSelector(selectQuickStats);                    // 快速統計數據
  const pageAnalytics = useAppSelector(selectPageAnalytics);              // 頁面分析數據
  const sessionAnalytics = useAppSelector(selectSessionAnalytics);        // 會話分析數據
  const isLoading = useAppSelector(selectIsLoading);                      // 載入狀態
  const hasError = useAppSelector(selectHasError);                        // 錯誤狀態
  const errorMessage = useAppSelector(selectErrorMessage);                // 錯誤消息
  const autoTrackingEnabled = useAppSelector(state => state.activity.autoTrackingEnabled); // 自動追蹤開關狀態

  // 組件初始化時獲取數據
  useEffect(() => {
    dispatch(fetchActivityStats()); // 派發獲取活動統計數據的 action
    dispatch(syncActivityData());   // 派發同步活動數據的 action
  }, [dispatch]); // 依賴項包含 dispatch

  /**
   * 處理刷新功能
   * 
   * 重新同步活動數據，更新所有統計信息
   */
  const handleRefresh = () => {
    dispatch(syncActivityData()); // 派發同步活動數據的 action
  };

  /**
   * 處理手動記錄頁面訪問
   * 
   * @param page - 要記錄的頁面路徑
   */
  const handleRecordPageVisit = (page: string) => {
    dispatch(recordPageVisit({ 
      page,                    // 頁面路徑
      timestamp: Date.now()    // 當前時間戳
    }));
  };

  /**
   * 處理自動追蹤功能的開關
   * 
   * 切換自動追蹤模式的啟用/停用狀態
   */
  const handleToggleAutoTracking = () => {
    dispatch(toggleAutoTracking(!autoTrackingEnabled)); // 切換自動追蹤狀態
  };

  // 載入狀態處理
  if (isLoading && !isReady) {
    return (
      <div className="activity-dashboard loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  // 錯誤狀態處理
  if (hasError) {
    return (
      <div className="activity-dashboard error">
        <div className="error-message">
          <p>載入活動統計時發生錯誤：{errorMessage}</p>
          <button onClick={handleRefresh} className="retry-button">
            重新載入
          </button>
        </div>
      </div>
    );
  }

  // 空數據狀態處理
  if (!stats && !quickStats) {
    return (
      <div className="activity-dashboard empty">
        <p>暫無活動統計資料</p>
        <button onClick={handleRefresh} className="retry-button">
          載入資料
        </button>
      </div>
    );
  }

  // 主要的 JSX 渲染邏輯
  return (
    <div className="activity-dashboard">
      {/* 儀表板標題和控制按鈕區域 */}
      <div className="dashboard-header">
        <h2>活動統計 (Redux)</h2>
        <div className="header-actions">
          {/* 自動追蹤開關按鈕 */}
          <button 
            onClick={handleToggleAutoTracking}
            className={`toggle-button ${autoTrackingEnabled ? 'active' : ''}`}
          >
            {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
          </button>
          {/* 重新整理按鈕 */}
          <button onClick={handleRefresh} className="refresh-button">
            重新整理
          </button>
        </div>
      </div>

      {/* 快速統計 */}
      {quickStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔑</div>
            <div className="stat-content">
              <div className="stat-label">登入次數</div>
              <div className="stat-value">{quickStats.loginCount}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-label">總頁面瀏覽</div>
              <div className="stat-value">{quickStats.totalPageVisits}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div className="stat-content">
              <div className="stat-label">不重複頁面</div>
              <div className="stat-value">{quickStats.uniquePagesVisited}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-label">平均會話時間</div>
              <div className="stat-value">{quickStats.sessionDuration}分鐘</div>
            </div>
          </div>
        </div>
      )}

      {/* 當前會話信息 */}
      {sessionAnalytics && (
        <div className="session-info-section">
          <h3>當前會話</h3>
          <div className="session-stats">
            <div className="session-stat">
              <span className="label">當前頁面：</span>
              <span className="value">{sessionAnalytics.currentPage}</span>
            </div>
            <div className="session-stat">
              <span className="label">會話時長：</span>
              <span className="value">
                {Math.round(sessionAnalytics.currentSessionDuration / 1000 / 60)}分鐘
              </span>
            </div>
            <div className="session-stat">
              <span className="label">當前頁面停留：</span>
              <span className="value">
                {Math.round(sessionAnalytics.currentPageDuration / 1000)}秒
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 最常訪問頁面 */}
      {pageAnalytics && pageAnalytics.mostVisitedPage && (
        <div className="most-visited-section">
          <h3>最常訪問頁面</h3>
          <div className="most-visited-page">
            <div className="page-icon">⭐</div>
            <div className="page-info">
              <div className="page-path">{pageAnalytics.mostVisitedPage}</div>
              <div className="page-description">
                共 {pageAnalytics.pageVisitCounts[pageAnalytics.mostVisitedPage]} 次訪問
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 熱門頁面排行 */}
      {pageAnalytics && pageAnalytics.topPages.length > 0 && (
        <div className="top-pages-section">
          <h3>熱門頁面排行</h3>
          <div className="top-pages-list">
            {pageAnalytics.topPages.map((page, index) => (
              <div key={page.page} className="top-page-item">
                <div className="page-rank">#{index + 1}</div>
                <div className="page-info">
                  <div className="page-path">{page.page}</div>
                  <div className="page-count">{page.count} 次訪問</div>
                </div>
                <div className="page-bar">
                  <div 
                    className="page-bar-fill"
                    style={{ 
                      width: `${(page.count / pageAnalytics.topPages[0].count) * 100}%` 
                    }}
                  />
                </div>
                <button 
                  onClick={() => handleRecordPageVisit(page.page)}
                  className="record-button"
                >
                  記錄訪問
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 活動時間 */}
      {stats && (
        <div className="activity-time-section">
          <h3>活動時間</h3>
          <div className="time-info">
            <div className="time-item">
              <span className="time-label">最後登入：</span>
              <span className="time-value">
                {new Date(stats.lastLoginAt).toLocaleString('zh-TW')}
              </span>
            </div>
            <div className="time-item">
              <span className="time-label">最後活動：</span>
              <span className="time-value">
                {new Date(stats.lastActiveAt).toLocaleString('zh-TW')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 除錯信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-section">
          <h3>除錯信息</h3>
          <div className="debug-info">
            <div className="debug-item">
              <span className="debug-label">自動追蹤：</span>
              <span className="debug-value">
                {autoTrackingEnabled ? '啟用' : '停用'}
              </span>
            </div>
            <div className="debug-item">
              <span className="debug-label">載入狀態：</span>
              <span className="debug-value">{isLoading ? '載入中' : '已載入'}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">資料狀態：</span>
              <span className="debug-value">{isReady ? '就緒' : '未就緒'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 簡化版 Redux 活動追蹤組件
 * 
 * 這是一個輕量級的活動統計組件，只顯示最基本的統計信息。
 * 適合用於需要簡潔展示的場景，如側邊欄或小型儀表板。
 * 
 * @component
 * @returns {JSX.Element} 簡化版活動追蹤組件
 * 
 * @example
 * ```tsx
 * import { SimpleActivityTrackerRedux } from './ActivityDashboardRedux';
 * 
 * function Sidebar() {
 *   return (
 *     <div className="sidebar">
 *       <SimpleActivityTrackerRedux />
 *     </div>
 *   );
 * }
 * ```
 */
export const SimpleActivityTrackerRedux: React.FC = () => {
  // 獲取 Redux dispatch 函數
  const dispatch = useAppDispatch();
  
  // 使用 selectors 獲取必要的狀態
  const quickStats = useAppSelector(selectQuickStats);  // 快速統計數據
  const isLoading = useAppSelector(selectIsLoading);    // 載入狀態
  const hasError = useAppSelector(selectHasError);      // 錯誤狀態

  // 組件初始化時獲取統計數據
  useEffect(() => {
    dispatch(fetchActivityStats()); // 派發獲取活動統計的 action
  }, [dispatch]); // 依賴項包含 dispatch

  // 早期返回處理各種狀態
  if (isLoading) return <div>載入中...</div>;    // 載入狀態
  if (hasError) return <div>載入失敗</div>;      // 錯誤狀態
  if (!quickStats) return <div>暫無資料</div>;   // 空數據狀態

  // 主要渲染邏輯
  return (
    <div className="simple-activity-tracker">
      <div className="simple-stats">
        {/* 登入次數統計 */}
        <div className="simple-stat">
          <span className="stat-number">{quickStats.loginCount}</span>
          <span className="stat-label">登入次數</span>
        </div>
        {/* 頁面瀏覽統計 */}
        <div className="simple-stat">
          <span className="stat-number">{quickStats.totalPageVisits}</span>
          <span className="stat-label">頁面瀏覽</span>
        </div>
        {/* 不重複頁面統計 */}
        <div className="simple-stat">
          <span className="stat-number">{quickStats.uniquePagesVisited}</span>
          <span className="stat-label">不重複頁面</span>
        </div>
      </div>
    </div>
  );
};
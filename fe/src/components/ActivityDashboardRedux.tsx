import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { 
  fetchActivityStats, 
  syncActivityData,
  recordPageVisit
} from '../store/actions/activityActions';
import { 
  selectDashboardData, 
  selectQuickStats, 
  selectPageAnalytics,
  selectSessionAnalytics,
  selectIsLoading,
  selectHasError,
  selectErrorMessage
} from '../store/selectors/activitySelectors';
import { toggleAutoTracking } from '../store/reducers/activityReducer';

/**
 * 使用 Redux 的活動統計儀表板組件
 */
export const ActivityDashboardRedux: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // 使用 Redux selectors 獲取數據
  const { stats, isReady } = useAppSelector(selectDashboardData);
  const quickStats = useAppSelector(selectQuickStats);
  const pageAnalytics = useAppSelector(selectPageAnalytics);
  const sessionAnalytics = useAppSelector(selectSessionAnalytics);
  const isLoading = useAppSelector(selectIsLoading);
  const hasError = useAppSelector(selectHasError);
  const errorMessage = useAppSelector(selectErrorMessage);
  const autoTrackingEnabled = useAppSelector(state => state.activity.autoTrackingEnabled);

  // 組件初始化時獲取數據
  useEffect(() => {
    dispatch(fetchActivityStats());
    dispatch(syncActivityData());
  }, [dispatch]);

  // 處理刷新
  const handleRefresh = () => {
    dispatch(syncActivityData());
  };

  // 處理手動記錄頁面訪問
  const handleRecordPageVisit = (page: string) => {
    dispatch(recordPageVisit({ page, timestamp: Date.now() }));
  };

  // 處理自動追蹤切換
  const handleToggleAutoTracking = () => {
    dispatch(toggleAutoTracking(!autoTrackingEnabled));
  };

  // 載入狀態
  if (isLoading && !isReady) {
    return (
      <div className="activity-dashboard loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  // 錯誤狀態
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

  // 無數據狀態
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

  return (
    <div className="activity-dashboard">
      <div className="dashboard-header">
        <h2>活動統計 (Redux)</h2>
        <div className="header-actions">
          <button 
            onClick={handleToggleAutoTracking}
            className={`toggle-button ${autoTrackingEnabled ? 'active' : ''}`}
          >
            {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
          </button>
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
 */
export const SimpleActivityTrackerRedux: React.FC = () => {
  const dispatch = useAppDispatch();
  const quickStats = useAppSelector(selectQuickStats);
  const isLoading = useAppSelector(selectIsLoading);
  const hasError = useAppSelector(selectHasError);

  useEffect(() => {
    dispatch(fetchActivityStats());
  }, [dispatch]);

  if (isLoading) return <div>載入中...</div>;
  if (hasError) return <div>載入失敗</div>;
  if (!quickStats) return <div>暫無資料</div>;

  return (
    <div className="simple-activity-tracker">
      <div className="simple-stats">
        <div className="simple-stat">
          <span className="stat-number">{quickStats.loginCount}</span>
          <span className="stat-label">登入次數</span>
        </div>
        <div className="simple-stat">
          <span className="stat-number">{quickStats.totalPageVisits}</span>
          <span className="stat-label">頁面瀏覽</span>
        </div>
        <div className="simple-stat">
          <span className="stat-number">{quickStats.uniquePagesVisited}</span>
          <span className="stat-label">不重複頁面</span>
        </div>
      </div>
    </div>
  );
};
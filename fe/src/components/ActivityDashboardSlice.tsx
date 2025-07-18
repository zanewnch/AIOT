import React, { useEffect } from 'react';
import { useActivitySlice, useActivityStats, usePageTracking } from '../hooks/useActivitySlice';

/**
 * 使用 Redux Slice 的活動儀表板
 */
export const ActivityDashboardSlice: React.FC = () => {
  const { 
    activity, 
    stats, 
    sessionInfo, 
    loading, 
    error, 
    autoTrackingEnabled, 
    syncData, 
    toggleTracking,
    clearError 
  } = useActivitySlice();

  const { trackCurrentPage } = usePageTracking();

  // 處理刷新
  const handleRefresh = () => {
    syncData();
  };

  // 處理錯誤清除
  const handleClearError = () => {
    clearError();
  };

  // 處理自動追蹤切換
  const handleToggleTracking = () => {
    toggleTracking();
  };

  // 模擬頁面切換
  const handlePageChange = (page: string) => {
    window.history.pushState({}, '', page);
    trackCurrentPage();
  };

  // 載入狀態
  if (loading && !stats && !activity) {
    return (
      <div className="activity-dashboard loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="activity-dashboard error">
        <div className="error-message">
          <p>發生錯誤：{error}</p>
          <div className="error-actions">
            <button onClick={handleClearError} className="clear-button">
              清除錯誤
            </button>
            <button onClick={handleRefresh} className="retry-button">
              重試
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-dashboard">
      <div className="dashboard-header">
        <h2>活動統計 (Redux Slice)</h2>
        <div className="header-actions">
          <button 
            onClick={handleToggleTracking}
            className={`toggle-button ${autoTrackingEnabled ? 'active' : ''}`}
          >
            {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
          </button>
          <button onClick={handleRefresh} className="refresh-button">
            刷新
          </button>
        </div>
      </div>

      {/* 當前會話信息 */}
      <div className="session-info-card">
        <h3>當前會話</h3>
        <div className="session-grid">
          <div className="session-item">
            <span className="session-label">當前頁面：</span>
            <span className="session-value">{sessionInfo.currentPage}</span>
          </div>
          <div className="session-item">
            <span className="session-label">會話時長：</span>
            <span className="session-value">
              {Math.round(sessionInfo.sessionDuration / 1000 / 60)}分鐘
            </span>
          </div>
          <div className="session-item">
            <span className="session-label">當前頁面停留：</span>
            <span className="session-value">
              {Math.round(sessionInfo.currentPageDuration / 1000)}秒
            </span>
          </div>
        </div>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔑</div>
            <div className="stat-content">
              <div className="stat-label">登入次數</div>
              <div className="stat-value">{stats.loginCount}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-label">總頁面瀏覽</div>
              <div className="stat-value">{stats.totalPageVisits}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div className="stat-content">
              <div className="stat-label">不重複頁面</div>
              <div className="stat-value">{stats.uniquePagesVisited}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-label">平均會話時間</div>
              <div className="stat-value">
                {Math.round(stats.averageSessionDuration / 1000 / 60)}分鐘
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 熱門頁面 */}
      {stats && stats.topPages.length > 0 && (
        <div className="top-pages-section">
          <h3>熱門頁面</h3>
          <div className="top-pages-list">
            {stats.topPages.map((page, index) => (
              <div key={page.page} className="top-page-item">
                <div className="page-rank">#{index + 1}</div>
                <div className="page-info">
                  <div className="page-path">{page.page}</div>
                  <div className="page-count">{page.count} 次</div>
                </div>
                <div className="page-progress">
                  <div 
                    className="page-progress-bar"
                    style={{ width: `${(page.count / stats.topPages[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 測試按鈕 */}
      <div className="test-actions">
        <h3>測試功能</h3>
        <div className="test-buttons">
          <button onClick={() => handlePageChange('/dashboard')} className="test-button">
            訪問 Dashboard
          </button>
          <button onClick={() => handlePageChange('/profile')} className="test-button">
            訪問 Profile
          </button>
          <button onClick={() => handlePageChange('/settings')} className="test-button">
            訪問 Settings
          </button>
        </div>
      </div>

      {/* 開發者信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-info">
          <h3>開發者信息</h3>
          <div className="dev-data">
            <div className="dev-item">
              <strong>自動追蹤：</strong> {autoTrackingEnabled ? '啟用' : '停用'}
            </div>
            <div className="dev-item">
              <strong>載入狀態：</strong> {loading ? '載入中' : '已完成'}
            </div>
            <div className="dev-item">
              <strong>有活動數據：</strong> {activity ? '是' : '否'}
            </div>
            <div className="dev-item">
              <strong>有統計數據：</strong> {stats ? '是' : '否'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 簡化版儀表板
 */
export const SimpleActivityDashboard: React.FC = () => {
  const { stats, loading, error } = useActivityStats();

  if (loading) return <div className="simple-loading">載入中...</div>;
  if (error) return <div className="simple-error">錯誤: {error}</div>;
  if (!stats) return <div className="simple-empty">暫無數據</div>;

  return (
    <div className="simple-activity-dashboard">
      <h2>活動概覽</h2>
      <div className="simple-stats-grid">
        <div className="simple-stat">
          <div className="simple-stat-number">{stats.loginCount}</div>
          <div className="simple-stat-label">登入次數</div>
        </div>
        <div className="simple-stat">
          <div className="simple-stat-number">{stats.totalPageVisits}</div>
          <div className="simple-stat-label">頁面瀏覽</div>
        </div>
        <div className="simple-stat">
          <div className="simple-stat-number">{stats.uniquePagesVisited}</div>
          <div className="simple-stat-label">不重複頁面</div>
        </div>
        <div className="simple-stat">
          <div className="simple-stat-number">
            {Math.round(stats.averageSessionDuration / 1000 / 60)}
          </div>
          <div className="simple-stat-label">平均會話(分鐘)</div>
        </div>
      </div>
    </div>
  );
};
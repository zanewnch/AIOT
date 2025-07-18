import React from 'react';
import { useActivityStats } from '../hooks/useActivity';

/**
 * 活動統計儀表板組件
 */
export const ActivityDashboard: React.FC = () => {
  const { stats, loading, error, refetch } = useActivityStats();

  if (loading) {
    return (
      <div className="activity-dashboard loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-dashboard error">
        <div className="error-message">
          <p>載入活動統計時發生錯誤：{error}</p>
          <button onClick={refetch} className="retry-button">
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="activity-dashboard empty">
        <p>暫無活動統計資料</p>
      </div>
    );
  }

  return (
    <div className="activity-dashboard">
      <div className="dashboard-header">
        <h2>活動統計</h2>
        <button onClick={refetch} className="refresh-button">
          重新整理
        </button>
      </div>

      <div className="stats-grid">
        {/* 基本統計 */}
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

      {/* 最常訪問頁面 */}
      <div className="most-visited-section">
        <h3>最常訪問頁面</h3>
        <div className="most-visited-page">
          <div className="page-icon">⭐</div>
          <div className="page-info">
            <div className="page-path">{stats.mostVisitedPage || '/'}</div>
            <div className="page-description">您最常訪問的頁面</div>
          </div>
        </div>
      </div>

      {/* 熱門頁面排行 */}
      <div className="top-pages-section">
        <h3>熱門頁面排行</h3>
        <div className="top-pages-list">
          {stats.topPages.map((page, index) => (
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
                    width: `${(page.count / stats.topPages[0].count) * 100}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 活動時間 */}
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
    </div>
  );
};
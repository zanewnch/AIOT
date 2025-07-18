/**
 * @fileoverview 活動統計儀表板組件
 * 
 * 此組件負責顯示用戶活動統計信息，包括：
 * - 登入次數統計
 * - 頁面瀏覽統計
 * - 會話時間分析
 * - 最常訪問頁面分析
 * - 熱門頁面排行榜
 * - 活動時間記錄
 * 
 * 組件使用自定義 Hook useActivityStats 來獲取活動數據，
 * 並提供載入狀態、錯誤處理和數據刷新功能。
 * 
 * @author AI-IOT Development Team
 * @version 1.0.0
 */

import React from 'react'; // React 核心庫
import { useActivityStats } from '../hooks/useActivity'; // 活動統計自定義 Hook

/**
 * 活動統計儀表板組件
 * 
 * 此組件提供了一個全面的用戶活動統計視圖，包含多個統計指標和分析圖表。
 * 支持實時數據更新和錯誤處理。
 * 
 * @component
 * @returns {JSX.Element} 活動統計儀表板組件
 * 
 * @example
 * ```tsx
 * import { ActivityDashboard } from './ActivityDashboard';
 * 
 * function App() {
 *   return (
 *     <div className="app">
 *       <ActivityDashboard />
 *     </div>
 *   );
 * }
 * ```
 */
export const ActivityDashboard: React.FC = () => {
  // 使用自定義 Hook 獲取活動統計數據
  const { stats, loading, error, refetch } = useActivityStats();

  // 載入狀態處理
  if (loading) {
    return (
      <div className="activity-dashboard loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  // 錯誤狀態處理
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

  // 空數據狀態處理
  if (!stats) {
    return (
      <div className="activity-dashboard empty">
        <p>暫無活動統計資料</p>
      </div>
    );
  }

  // 主要的 JSX 渲染邏輯
  return (
    <div className="activity-dashboard">
      {/* 儀表板標題區域 */}
      <div className="dashboard-header">
        <h2>活動統計</h2>
        <button onClick={refetch} className="refresh-button">
          重新整理
        </button>
      </div>

      {/* 統計卡片網格 */}
      <div className="stats-grid">
        {/* 基本統計卡片 */}
        
        {/* 登入次數統計卡片 */}
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <div className="stat-label">登入次數</div>
            <div className="stat-value">{stats.loginCount}</div>
          </div>
        </div>

        {/* 總頁面瀏覽統計卡片 */}
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-label">總頁面瀏覽</div>
            <div className="stat-value">{stats.totalPageVisits}</div>
          </div>
        </div>

        {/* 不重複頁面統計卡片 */}
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-label">不重複頁面</div>
            <div className="stat-value">{stats.uniquePagesVisited}</div>
          </div>
        </div>

        {/* 平均會話時間統計卡片 */}
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

      {/* 最常訪問頁面區域 */}
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

      {/* 熱門頁面排行榜區域 */}
      <div className="top-pages-section">
        <h3>熱門頁面排行</h3>
        <div className="top-pages-list">
          {/* 使用 map 方法遍歷熱門頁面數據 */}
          {stats.topPages.map((page, index) => (
            <div key={page.page} className="top-page-item">
              {/* 頁面排名 */}
              <div className="page-rank">#{index + 1}</div>
              {/* 頁面信息 */}
              <div className="page-info">
                <div className="page-path">{page.page}</div>
                <div className="page-count">{page.count} 次訪問</div>
              </div>
              {/* 頁面訪問量進度條 */}
              <div className="page-bar">
                <div 
                  className="page-bar-fill"
                  style={{ 
                    // 計算相對於最高訪問量的百分比
                    width: `${(page.count / stats.topPages[0].count) * 100}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 活動時間記錄區域 */}
      <div className="activity-time-section">
        <h3>活動時間</h3>
        <div className="time-info">
          {/* 最後登入時間 */}
          <div className="time-item">
            <span className="time-label">最後登入：</span>
            <span className="time-value">
              {/* 使用 toLocaleString 格式化時間為繁體中文格式 */}
              {new Date(stats.lastLoginAt).toLocaleString('zh-TW')}
            </span>
          </div>
          {/* 最後活動時間 */}
          <div className="time-item">
            <span className="time-label">最後活動：</span>
            <span className="time-value">
              {/* 使用 toLocaleString 格式化時間為繁體中文格式 */}
              {new Date(stats.lastActiveAt).toLocaleString('zh-TW')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
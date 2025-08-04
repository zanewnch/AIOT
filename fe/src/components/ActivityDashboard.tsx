/**
 * @fileoverview 活動統計儀表板組件
 * 
 * 使用 Zustand + React Query 的現代化狀態管理方案：
 * - Zustand 管理本地狀態（輕量級替代 Redux）
 * - React Query 處理服務器狀態和數據獲取
 * - 自動追蹤功能的開關控制
 * - 實時會話分析顯示
 * - 頁面訪問記錄功能
 * - 強大的錯誤處理和載入狀態管理
 * - 樂觀更新和背景數據同步
 * 
 * @author AI-IOT Development Team
 * @version 2.0.0
 */

import React, { useEffect } from 'react';
import { useActivityStore } from '../stores/activityStore';

/**
 * 活動統計儀表板組件
 * 
 * 使用 Zustand + React Query 的現代化狀態管理方案。
 * Zustand 提供輕量級的本地狀態管理，React Query 處理服務器狀態。
 * 
 * @component
 * @returns {JSX.Element} 活動儀表板組件
 * 
 * @example
 * ```tsx
 * import { ActivityDashboard } from './ActivityDashboard';
 * import { QueryProvider } from '../configs/queryConfig';
 * 
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <ActivityDashboard />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export const ActivityDashboard: React.FC = () => {
  // 使用綜合的活動追蹤 Hook，整合 Zustand 和 React Query
  const {
    activity,              // 用戶活動數據
    stats,                 // 活動統計數據
    autoTrackingEnabled,   // 自動追蹤開關
    error,                 // 錯誤信息
    loading,               // 載入狀態
    isError,               // 錯誤狀態
    toggleAutoTracking,    // 切換自動追蹤
    trackPageVisit,        // 追蹤頁面訪問
    recordPageVisit,       // 手動記錄頁面訪問
    updateSessionDuration, // 更新會話持續時間
    syncData,              // 同步數據
    clearError,            // 清除錯誤
  } = {}; // Removed useActivityQuery

  // 從 activityStore 獲取會話信息
  const { currentPage, sessionStartTime, pageStartTime } = useActivityStore();

  // 組件掛載時開始會話時間更新
  useEffect(() => {
    const interval = setInterval(() => {
      updateSessionDuration();
    }, 1000); // 每秒更新一次會話時間

    return () => clearInterval(interval);
  }, [updateSessionDuration]);

  /**
   * 處理頁面訪問測試
   * 模擬不同頁面的訪問，用於測試追蹤功能
   */
  const handlePageTest = (page: string) => {
    // 使用 React Query mutation 記錄頁面訪問
    trackPageVisit(page);
  };

  /**
   * 手動記錄頁面訪問（忽略自動追蹤設置）
   */
  const handleManualRecord = (page: string) => {
    recordPageVisit(page);
  };

  // 載入狀態處理
  if (loading && !stats && !activity) {
    return (
      <div className="activity-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>載入活動數據中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態處理
  if (error && isError) {
    return (
      <div className="activity-dashboard error">
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>數據載入失敗</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={clearError} className="clear-button">
              清除錯誤
            </button>
            <button onClick={() => syncData()} className="retry-button">
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 主要的 JSX 渲染邏輯
  return (
    <div className="activity-dashboard">
      {/* 儀表板標題和控制按鈕區域 */}
      <div className="dashboard-header">
        <h2>活動統計</h2>
        <div className="header-actions">
          {/* 自動追蹤開關按鈕 */}
          <button 
            onClick={() => toggleAutoTracking()}
            className={`toggle-button ${autoTrackingEnabled ? 'active' : ''}`}
            disabled={loading}
          >
            {autoTrackingEnabled ? '🟢 停用' : '🔴 啟用'}自動追蹤
          </button>
          {/* 刷新按鈕 */}
          <button 
            onClick={() => syncData()} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? '同步中...' : '🔄 刷新數據'}
          </button>
        </div>
      </div>

      {/* 當前會話信息 */}
      <div className="session-info-card">
        <h3>🕒 當前會話</h3>
        <div className="session-grid">
          <div className="session-item">
            <span className="session-label">當前頁面：</span>
            <span className="session-value">{currentPage}</span>
          </div>
          <div className="session-item">
            <span className="session-label">會話時長：</span>
            <span className="session-value">
              {Math.round((Date.now() - sessionStartTime) / 1000 / 60)}分鐘
            </span>
          </div>
          <div className="session-item">
            <span className="session-label">當前頁面停留：</span>
            <span className="session-value">
              {Math.round((Date.now() - pageStartTime) / 1000)}秒
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
          <h3>📊 熱門頁面</h3>
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

      {/* 測試功能區域 */}
      <div className="test-actions">
        <h3>🧪 測試功能</h3>
        <div className="test-section">
          <h4>自動追蹤測試</h4>
          <div className="test-buttons">
            <button 
              onClick={() => handlePageTest('/dashboard')} 
              className="test-button"
              disabled={loading}
            >
              📊 訪問 Dashboard
            </button>
            <button 
              onClick={() => handlePageTest('/profile')} 
              className="test-button"
              disabled={loading}
            >
              👤 訪問 Profile
            </button>
            <button 
              onClick={() => handlePageTest('/settings')} 
              className="test-button"
              disabled={loading}
            >
              ⚙️ 訪問 Settings
            </button>
          </div>
        </div>
        
        <div className="test-section">
          <h4>手動記錄測試</h4>
          <div className="test-buttons">
            <button 
              onClick={() => handleManualRecord('/api-docs')} 
              className="test-button manual"
              disabled={loading}
            >
              📚 記錄 API 文檔訪問
            </button>
            <button 
              onClick={() => handleManualRecord('/help')} 
              className="test-button manual"
              disabled={loading}
            >
              ❓ 記錄幫助頁面訪問
            </button>
          </div>
        </div>
      </div>

      {/* 開發者信息面板 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-info">
          <h3>🛠️ 開發者信息</h3>
          <div className="dev-data">
            <div className="dev-section">
              <h4>狀態管理</h4>
              <div className="dev-item">
                <span className="label">狀態管理：</span>
                <span className="value">Zustand + React Query</span>
              </div>
              <div className="dev-item">
                <span className="label">自動追蹤：</span>
                <span className={`value ${autoTrackingEnabled ? 'active' : 'inactive'}`}>
                  {autoTrackingEnabled ? '✅ 啟用' : '❌ 停用'}
                </span>
              </div>
              <div className="dev-item">
                <span className="label">載入狀態：</span>
                <span className="value">{loading ? '🔄 載入中' : '✅ 已完成'}</span>
              </div>
            </div>
            
            <div className="dev-section">
              <h4>數據狀態</h4>
              <div className="dev-item">
                <span className="label">用戶活動：</span>
                <span className="value">{activity ? '✅ 已載入' : '❌ 未載入'}</span>
              </div>
              <div className="dev-item">
                <span className="label">統計數據：</span>
                <span className="value">{stats ? '✅ 已載入' : '❌ 未載入'}</span>
              </div>
              <div className="dev-item">
                <span className="label">錯誤狀態：</span>
                <span className="value">{error ? '❌ 有錯誤' : '✅ 正常'}</span>
              </div>
            </div>
            
            <div className="dev-section">
              <h4>React Query 狀態</h4>
              <div className="dev-item">
                <span className="label">查詢緩存：</span>
                <span className="value">✅ 啟用</span>
              </div>
              <div className="dev-item">
                <span className="label">背景更新：</span>
                <span className="value">✅ 啟用</span>
              </div>
              <div className="dev-item">
                <span className="label">樂觀更新：</span>
                <span className="value">✅ 啟用</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 簡化版儀表板組件
 * 
 * 這是一個輕量級的活動統計組件，專注於展示核心的統計數據。
 * 使用相同的 Zustand + React Query Hook 來獲取統計信息，
 * 適合用於概覽頁面或需要快速查看活動概況的場景。
 * 
 * @component
 * @returns {JSX.Element} 簡化版活動儀表板組件
 * 
 * @example
 * ```tsx
 * import { SimpleActivityDashboard } from './ActivityDashboard';
 * 
 * function Dashboard() {
 *   return (
 *     <div className="dashboard">
 *       <SimpleActivityDashboard />
 *     </div>
 *   );
 * }
 * ```
 */
export const SimpleActivityDashboard: React.FC = () => {
  // 使用活動追蹤 Hook 獲取數據
  const { stats, loading, error } = { stats: null, loading: false, error: null }; // Removed useActivityQuery

  // 早期返回處理各種狀態
  if (loading) return <div className="simple-loading">載入中...</div>;
  if (error) return <div className="simple-error">錯誤: {error}</div>;
  if (!stats) return <div className="simple-empty">暫無數據</div>;

  // 主要渲染邏輯
  return (
    <div className="simple-activity-dashboard">
      <h2>📊 活動概覽</h2>
      <div className="simple-stats-grid">
        {/* 登入次數統計 */}
        <div className="simple-stat">
          <div className="simple-stat-icon">🔑</div>
          <div className="simple-stat-number">{stats.loginCount}</div>
          <div className="simple-stat-label">登入次數</div>
        </div>
        {/* 頁面瀏覽統計 */}
        <div className="simple-stat">
          <div className="simple-stat-icon">📄</div>
          <div className="simple-stat-number">{stats.totalPageVisits}</div>
          <div className="simple-stat-label">頁面瀏覽</div>
        </div>
        {/* 不重複頁面統計 */}
        <div className="simple-stat">
          <div className="simple-stat-icon">🌐</div>
          <div className="simple-stat-number">{stats.uniquePagesVisited}</div>
          <div className="simple-stat-label">不重複頁面</div>
        </div>
        {/* 平均會話時間統計 */}
        <div className="simple-stat">
          <div className="simple-stat-icon">⏱️</div>
          <div className="simple-stat-number">
            {/* 將毫秒轉換為分鐘並四捨五入 */}
            {Math.round(stats.averageSessionDuration / 1000 / 60)}
          </div>
          <div className="simple-stat-label">平均會話(分鐘)</div>
        </div>
      </div>
    </div>
  );
};
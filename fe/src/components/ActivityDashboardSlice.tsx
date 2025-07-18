/**
 * @fileoverview 基於 Redux Slice 的活動儀表板組件
 * 
 * 此組件展示了如何使用 Redux Slice 模式來管理活動統計數據，包括：
 * - 使用自定義 Hook 封裝 Redux Slice 邏輯
 * - 實時會話信息顯示
 * - 頁面追蹤功能
 * - 測試功能按鈕
 * - 開發者信息面板
 * - 錯誤處理和狀態管理
 * 
 * 組件展示了 Redux Slice 的現代化使用方式，
 * 通過自定義 Hook 提供了更好的代碼組織和重用性。
 * 
 * @author AI-IOT Development Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react'; // React 核心庫和 useEffect Hook
import { 
  useActivitySlice,  // 活動 Slice 的主要 Hook
  useActivityStats,  // 活動統計數據 Hook
  usePageTracking    // 頁面追蹤 Hook
} from '../hooks/useActivitySlice';

/**
 * 使用 Redux Slice 的活動儀表板組件
 * 
 * 此組件展示了如何使用 Redux Slice 進行現代化的狀態管理。
 * 通過自定義 Hook 封裝了複雜的 Redux 邏輯，提供了更簡潔的組件代碼。
 * 
 * @component
 * @returns {JSX.Element} Redux Slice 活動儀表板組件
 * 
 * @example
 * ```tsx
 * import { ActivityDashboardSlice } from './ActivityDashboardSlice';
 * 
 * function App() {
 *   return (
 *     <div className="app">
 *       <ActivityDashboardSlice />
 *     </div>
 *   );
 * }
 * ```
 */
export const ActivityDashboardSlice: React.FC = () => {
  // 使用自定義 Hook 獲取活動 Slice 的狀態和方法
  const { 
    activity,              // 活動原始數據
    stats,                 // 統計數據
    sessionInfo,           // 會話信息
    loading,               // 載入狀態
    error,                 // 錯誤信息
    autoTrackingEnabled,   // 自動追蹤開關狀態
    syncData,              // 同步數據方法
    toggleTracking,        // 切換追蹤方法
    clearError             // 清除錯誤方法
  } = useActivitySlice();

  // 使用頁面追蹤 Hook
  const { trackCurrentPage } = usePageTracking();

  /**
   * 處理刷新功能
   * 
   * 重新同步所有活動數據
   */
  const handleRefresh = () => {
    syncData(); // 調用同步數據方法
  };

  /**
   * 處理錯誤清除功能
   * 
   * 清除當前的錯誤狀態
   */
  const handleClearError = () => {
    clearError(); // 調用清除錯誤方法
  };

  /**
   * 處理自動追蹤功能的切換
   * 
   * 開啟或關閉自動追蹤模式
   */
  const handleToggleTracking = () => {
    toggleTracking(); // 調用切換追蹤方法
  };

  /**
   * 模擬頁面切換功能
   * 
   * 用於測試頁面追蹤功能，模擬用戶導航到不同頁面
   * 
   * @param page - 要切換到的頁面路徑
   */
  const handlePageChange = (page: string) => {
    window.history.pushState({}, '', page); // 更新瀏覽器歷史記錄
    trackCurrentPage();                      // 追蹤當前頁面
  };

  // 載入狀態處理
  if (loading && !stats && !activity) {
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
          <p>發生錯誤：{error}</p>
          <div className="error-actions">
            {/* 清除錯誤按鈕 */}
            <button onClick={handleClearError} className="clear-button">
              清除錯誤
            </button>
            {/* 重試按鈕 */}
            <button onClick={handleRefresh} className="retry-button">
              重試
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
        <h2>活動統計 (Redux Slice)</h2>
        <div className="header-actions">
          {/* 自動追蹤開關按鈕 */}
          <button 
            onClick={handleToggleTracking}
            className={`toggle-button ${autoTrackingEnabled ? 'active' : ''}`}
          >
            {autoTrackingEnabled ? '停用' : '啟用'}自動追蹤
          </button>
          {/* 刷新按鈕 */}
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
 * 簡化版儀表板組件
 * 
 * 這是一個輕量級的活動統計組件，專注於展示核心的統計數據。
 * 使用 useActivityStats Hook 來獲取統計信息，
 * 適合用於概覽頁面或需要快速查看活動概況的場景。
 * 
 * @component
 * @returns {JSX.Element} 簡化版活動儀表板組件
 * 
 * @example
 * ```tsx
 * import { SimpleActivityDashboard } from './ActivityDashboardSlice';
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
  // 使用活動統計 Hook 獲取數據
  const { stats, loading, error } = useActivityStats();

  // 早期返回處理各種狀態
  if (loading) return <div className="simple-loading">載入中...</div>;  // 載入狀態
  if (error) return <div className="simple-error">錯誤: {error}</div>;   // 錯誤狀態
  if (!stats) return <div className="simple-empty">暫無數據</div>;       // 空數據狀態

  // 主要渲染邏輯
  return (
    <div className="simple-activity-dashboard">
      <h2>活動概覽</h2>
      <div className="simple-stats-grid">
        {/* 登入次數統計 */}
        <div className="simple-stat">
          <div className="simple-stat-number">{stats.loginCount}</div>
          <div className="simple-stat-label">登入次數</div>
        </div>
        {/* 頁面瀏覽統計 */}
        <div className="simple-stat">
          <div className="simple-stat-number">{stats.totalPageVisits}</div>
          <div className="simple-stat-label">頁面瀏覽</div>
        </div>
        {/* 不重複頁面統計 */}
        <div className="simple-stat">
          <div className="simple-stat-number">{stats.uniquePagesVisited}</div>
          <div className="simple-stat-label">不重複頁面</div>
        </div>
        {/* 平均會話時間統計 */}
        <div className="simple-stat">
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
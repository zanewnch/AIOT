/**
 * @fileoverview 現代化活動追蹤示例
 * 
 * 展示如何使用 Zustand + React Query 替代 Redux 的完整示例。
 * 包含完整的使用指南、對比說明和實際演示。
 * 
 * @author AIOT Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { QueryProvider } from '../configs/queryConfig';
import { useActivityStore } from '../stores/activityStore';

/**
 * 現代化活動追蹤示例的內容組件
 */
const ModernActivityContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'full' | 'simple' | 'store' | 'guide'>('full');
  
  // 直接使用 Zustand store
  const {
    autoTrackingEnabled,
    sessionInfo,
    toggleAutoTracking,
    setCurrentPage,
  } = useActivityStore();

  // 使用綜合 Hook
  // const activityQuery = useActivityQuery(); // Removed
  const {
    stats,
    loading,
    error,
    trackPageVisit,
    syncData,
  } = activityQuery.tracking();

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(`/example/${tab}`);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'toggle-tracking':
        toggleAutoTracking();
        break;
      case 'sync-data':
        syncData();
        break;
      case 'visit-page':
        trackPageVisit('/test-page');
        break;
    }
  };

  return (
    <div className="modern-activity-example">
      {/* 標題和狀態欄 */}
      <div className="example-header">
        <h1>🚀 現代化活動追蹤</h1>
        <p>使用 Zustand + React Query 的輕量級狀態管理方案</p>
        
        <div className="status-bar">
          <div className="status-item">
            <span className="status-label">狀態管理：</span>
            <span className="status-value tech">Zustand + React Query</span>
          </div>
          <div className="status-item">
            <span className="status-label">自動追蹤：</span>
            <span className={`status-value ${autoTrackingEnabled ? 'active' : 'inactive'}`}>
              {autoTrackingEnabled ? '✅' : '❌'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">當前頁面：</span>
            <span className="status-value">{sessionInfo.currentPage}</span>
          </div>
          <div className="status-item">
            <span className="status-label">載入狀態：</span>
            <span className="status-value">{loading ? '🔄' : '✅'}</span>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="quick-actions">
        <h3>⚡ 快速操作</h3>
        <div className="action-buttons">
          <button 
            onClick={() => handleQuickAction('toggle-tracking')}
            className={`action-button ${autoTrackingEnabled ? 'active' : ''}`}
          >
            {autoTrackingEnabled ? '停用追蹤' : '啟用追蹤'}
          </button>
          <button 
            onClick={() => handleQuickAction('sync-data')}
            className="action-button"
            disabled={loading}
          >
            {loading ? '同步中...' : '同步數據'}
          </button>
          <button 
            onClick={() => handleQuickAction('visit-page')}
            className="action-button"
          >
            模擬頁面訪問
          </button>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* 標籤頁 */}
      <div className="tab-container">
        <div className="tab-buttons">
          <button 
            onClick={() => handleTabChange('full')}
            className={`tab-button ${activeTab === 'full' ? 'active' : ''}`}
          >
            📊 完整儀表板
          </button>
          <button 
            onClick={() => handleTabChange('simple')}
            className={`tab-button ${activeTab === 'simple' ? 'active' : ''}`}
          >
            📈 簡化版本
          </button>
          <button 
            onClick={() => handleTabChange('store')}
            className={`tab-button ${activeTab === 'store' ? 'active' : ''}`}
          >
            🏪 Store 直接使用
          </button>
          <button 
            onClick={() => handleTabChange('guide')}
            className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
          >
            📚 使用指南
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'full' && (
            <div className="tab-panel">
              <h3>完整的活動儀表板</h3>
              <p>包含所有功能的完整儀表板，展示 Zustand + React Query 的完整功能。</p>
              {/* ActivityDashboard 組件已移除 */}
            </div>
          )}

          {activeTab === 'simple' && (
            <div className="tab-panel">
              <h3>簡化版活動統計</h3>
              <p>輕量級組件，只顯示核心統計數據。</p>
              {/* SimpleActivityDashboard 組件已移除 */}
            </div>
          )}

          {activeTab === 'store' && (
            <div className="tab-panel">
              <h3>直接使用 Zustand Store</h3>
              <p>展示如何直接使用 Zustand store 進行狀態管理。</p>
              <StoreDirectUsageExample />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="tab-panel">
              <h3>使用指南和最佳實踐</h3>
              <UsageGuideContent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 直接使用 Store 的示例組件
 */
const StoreDirectUsageExample: React.FC = () => {
  const store = useActivityStore();

  return (
    <div className="store-usage-example">
      <div className="store-state">
        <h4>🏪 當前 Store 狀態</h4>
        <div className="state-grid">
          <div className="state-item">
            <strong>自動追蹤：</strong>
            <span className={store.autoTrackingEnabled ? 'active' : 'inactive'}>
              {store.autoTrackingEnabled ? '啟用' : '停用'}
            </span>
          </div>
          <div className="state-item">
            <strong>當前頁面：</strong>
            <span>{store.sessionInfo.currentPage}</span>
          </div>
          <div className="state-item">
            <strong>會話時長：</strong>
            <span>{Math.round(store.sessionInfo.sessionDuration / 1000)}秒</span>
          </div>
          <div className="state-item">
            <strong>錯誤狀態：</strong>
            <span>{store.error || '無'}</span>
          </div>
        </div>
      </div>

      <div className="store-actions">
        <h4>🎮 Store 操作</h4>
        <div className="action-grid">
          <button 
            onClick={store.toggleAutoTracking}
            className="store-action-button"
          >
            切換自動追蹤
          </button>
          <button 
            onClick={() => store.setCurrentPage('/store-test')}
            className="store-action-button"
          >
            設置頁面為 /store-test
          </button>
          <button 
            onClick={() => store.updateLocalPageVisit('/store-visit')}
            className="store-action-button"
          >
            本地更新頁面訪問
          </button>
          <button 
            onClick={store.updateSessionDuration}
            className="store-action-button"
          >
            更新會話時間
          </button>
          <button 
            onClick={() => store.setError('測試錯誤訊息')}
            className="store-action-button"
          >
            設置測試錯誤
          </button>
          <button 
            onClick={store.clearError}
            className="store-action-button"
          >
            清除錯誤
          </button>
        </div>
      </div>

      <div className="code-example">
        <h4>💻 程式碼範例</h4>
        <pre>
{`// 直接使用 Zustand store
import { useActivityStore } from './stores/activityStore';

function MyComponent() {
  const {
    autoTrackingEnabled,
    sessionInfo,
    toggleAutoTracking,
    setCurrentPage,
    updateSessionDuration,
  } = useActivityStore();

  return (
    <div>
      <p>追蹤狀態: {autoTrackingEnabled ? '啟用' : '停用'}</p>
      <p>當前頁面: {sessionInfo.currentPage}</p>
      <button onClick={toggleAutoTracking}>
        切換追蹤
      </button>
    </div>
  );
}`}
        </pre>
      </div>
    </div>
  );
};

/**
 * 使用指南內容組件
 */
const UsageGuideContent: React.FC = () => {
  return (
    <div className="usage-guide-content">
      <div className="guide-section">
        <h4>🏗️ 架構設計</h4>
        <div className="architecture-diagram">
          <div className="architecture-layer">
            <span className="layer-name">UI 層</span>
            <span className="layer-tech">React Components</span>
          </div>
          <div className="architecture-arrow">↕️</div>
          <div className="architecture-layer">
            <span className="layer-name">狀態層</span>
            <span className="layer-tech">Zustand Store + React Query</span>
          </div>
          <div className="architecture-arrow">↕️</div>
          <div className="architecture-layer">
            <span className="layer-name">服務層</span>
            <span className="layer-tech">Activity Service API</span>
          </div>
        </div>
      </div>

      <div className="guide-section">
        <h4>✨ 主要優勢</h4>
        <div className="advantages-grid">
          <div className="advantage-card">
            <div className="advantage-icon">⚡</div>
            <h5>輕量級</h5>
            <p>Zustand 只有 2KB，比 Redux 小很多</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">🎯</div>
            <h5>簡潔</h5>
            <p>無需 actions、reducers 等 boilerplate</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">🔄</div>
            <h5>強大</h5>
            <p>React Query 提供完整的數據同步功能</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">🛡️</div>
            <h5>穩定</h5>
            <p>自動錯誤處理和重試機制</p>
          </div>
        </div>
      </div>

      <div className="guide-section">
        <h4>📖 使用步驟</h4>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h5>安裝依賴</h5>
              <code>npm install zustand @tanstack/react-query</code>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h5>創建 Store</h5>
              <code>{`const useStore = create((set) => ({...}))`}</code>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h5>設置 Provider</h5>
              <code>&lt;QueryProvider&gt;...&lt;/QueryProvider&gt;</code>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h5>使用 Hooks</h5>
              <code>const data = useActivityTracking()</code>
            </div>
          </div>
        </div>
      </div>

      <div className="guide-section">
        <h4>🔧 最佳實踐</h4>
        <div className="best-practices">
          <div className="practice">
            <span className="practice-icon">✅</span>
            <span>使用 devtools 中間件進行調試</span>
          </div>
          <div className="practice">
            <span className="practice-icon">✅</span>
            <span>合理設置 React Query 的 staleTime 和 gcTime</span>
          </div>
          <div className="practice">
            <span className="practice-icon">✅</span>
            <span>使用 TypeScript 獲得更好的類型安全</span>
          </div>
          <div className="practice">
            <span className="practice-icon">✅</span>
            <span>分離本地狀態（Zustand）和服務器狀態（React Query）</span>
          </div>
          <div className="practice">
            <span className="practice-icon">✅</span>
            <span>使用樂觀更新提升用戶體驗</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 主要的現代化活動追蹤示例組件
 * 包含 QueryProvider 包裝
 */
export const ModernActivityExample: React.FC = () => {
  return (
    <QueryProvider>
      <ModernActivityContent />
    </QueryProvider>
  );
};

/**
 * 對比展示組件 - 展示新舊方案的差異
 */
export const StateManagementComparison: React.FC = () => {
  return (
    <div className="comparison-container">
      <h1>📊 狀態管理方案對比</h1>
      
      <div className="comparison-grid">
        <div className="comparison-card redux">
          <h3>❌ 傳統 Redux</h3>
          <div className="comparison-content">
            <h4>缺點：</h4>
            <ul>
              <li>大量 boilerplate 代碼</li>
              <li>複雜的設置過程</li>
              <li>需要多個文件（actions, reducers, selectors）</li>
              <li>學習曲線陡峭</li>
              <li>包大小較大</li>
            </ul>
            
            <h4>程式碼量：</h4>
            <div className="code-metrics">
              <div className="metric">
                <span className="metric-label">文件數：</span>
                <span className="metric-value">5-8 個</span>
              </div>
              <div className="metric">
                <span className="metric-label">程式碼行數：</span>
                <span className="metric-value">200-300 行</span>
              </div>
              <div className="metric">
                <span className="metric-label">包大小：</span>
                <span className="metric-value">~40KB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-card modern">
          <h3>✅ Zustand + React Query</h3>
          <div className="comparison-content">
            <h4>優點：</h4>
            <ul>
              <li>最小化的 boilerplate</li>
              <li>簡單直觀的 API</li>
              <li>單一文件即可完成</li>
              <li>容易學習和使用</li>
              <li>包大小很小</li>
              <li>內建 TypeScript 支持</li>
              <li>強大的數據同步功能</li>
            </ul>
            
            <h4>程式碼量：</h4>
            <div className="code-metrics">
              <div className="metric">
                <span className="metric-label">文件數：</span>
                <span className="metric-value">2-3 個</span>
              </div>
              <div className="metric">
                <span className="metric-label">程式碼行數：</span>
                <span className="metric-value">100-150 行</span>
              </div>
              <div className="metric">
                <span className="metric-label">包大小：</span>
                <span className="metric-value">~15KB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="migration-guide">
        <h3>🚀 遷移建議</h3>
        <div className="migration-steps">
          <div className="migration-step">
            <span className="step-number">1</span>
            <span className="step-text">逐步替換：先替換簡單的狀態管理</span>
          </div>
          <div className="migration-step">
            <span className="step-number">2</span>
            <span className="step-text">保持兼容：新舊系統可以並存</span>
          </div>
          <div className="migration-step">
            <span className="step-number">3</span>
            <span className="step-text">團隊培訓：學習新的狀態管理模式</span>
          </div>
          <div className="migration-step">
            <span className="step-number">4</span>
            <span className="step-text">完全遷移：移除舊的 Redux 代碼</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernActivityExample;
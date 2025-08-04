/**
 * @fileoverview 無人機監控頁面
 *
 * 此文件提供完整的無人機監控功能，包括：
 * - 指令歷史與狀態追蹤系統
 * - 進階遙測儀表板
 * - 無人機規格管理介面
 * - 智能指令佇列系統
 * - 資料視覺化儀表板
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useState, useRef } from "react";
import { useSimulateFlyLogic } from "../hooks/useSimulateFlyLogic";
import CommandHistoryPanel from "../components/DroneMonitoring/CommandHistoryPanel";
import TelemetryDashboard from "../components/DroneMonitoring/TelemetryDashboard";
import DroneSpecPanel from "../components/DroneMonitoring/DroneSpecPanel";
import CommandQueuePanel from "../components/DroneMonitoring/CommandQueuePanel";
import DataVisualizationPanel from "../components/DroneMonitoring/DataVisualizationPanel";

/**
 * DroneMonitoringPage 組件的屬性介面
 */
interface DroneMonitoringPageProps {
  className?: string;
}

/**
 * 無人機監控頁面組件
 *
 * 提供完整的無人機監控和管理功能，包括即時狀態監控、
 * 指令管理、資料分析等專業功能。
 *
 * @param props - 組件屬性
 * @returns 無人機監控頁面的 JSX 元素
 */
const DroneMonitoringPage: React.FC<DroneMonitoringPageProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const simulateFlyLogic = useSimulateFlyLogic(mapRef);
  
  // 頁面狀態管理
  const [activeTab, setActiveTab] = useState<'overview' | 'commands' | 'telemetry' | 'specs' | 'queue' | 'analytics'>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tab 配置
  const tabs = [
    { id: 'overview', name: '總覽', icon: '📊', description: '系統總覽與地圖' },
    { id: 'commands', name: '指令歷史', icon: '📋', description: '指令追蹤與狀態' },
    { id: 'telemetry', name: '遙測數據', icon: '📡', description: '即時遙測儀表板' },
    { id: 'specs', name: '機隊管理', icon: '🚁', description: '無人機規格管理' },
    { id: 'queue', name: '指令佇列', icon: '⚡', description: '智能指令系統' },
    { id: 'analytics', name: '數據分析', icon: '📈', description: '資料視覺化' },
  ] as const;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6">
        {/* 頁面標題 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              無人機監控中心
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              專業級無人機監控、分析與管理平台
            </p>
          </div>

          {/* 工具列 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">連線狀態:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                simulateFlyLogic.isApiLoaded
                  ? "bg-green-900/30 text-green-300 border border-green-700"
                  : "bg-yellow-900/30 text-yellow-300 border border-yellow-700"
              }`}>
                {simulateFlyLogic.isApiLoaded ? "已連線" : "連線中"}
              </span>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={isFullscreen ? "退出全螢幕" : "全螢幕模式"}
            >
              <span className="text-gray-300">
                {isFullscreen ? "⤓" : "⤢"}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 導航 */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute mt-12 text-xs text-gray-500">
                      {tab.description}
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-6' : ''}`}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 系統總覽 + 地圖 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 地圖區域 */}
                <div className="col-span-1 lg:col-span-2 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-100">即時飛行地圖</h2>
                  </div>
                  <div className="relative" style={{ height: "500px" }}>
                    <div
                      ref={mapRef}
                      className="w-full h-full"
                    />
                    
                    {/* 載入覆蓋層 */}
                    {simulateFlyLogic.isLoading && (
                      <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-gray-300">
                          <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full mx-auto mb-4"></div>
                          <p className="text-lg font-semibold">地圖載入中...</p>
                        </div>
                      </div>
                    )}

                    {/* 錯誤覆蓋層 */}
                    {simulateFlyLogic.error && (
                      <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-red-300 bg-gray-800 p-6 rounded-xl shadow-lg max-w-md mx-4 border border-red-700">
                          <span className="text-2xl mb-4 block">⚠</span>
                          <p className="text-lg font-semibold mb-2">載入失敗</p>
                          <p className="text-sm text-gray-400">{simulateFlyLogic.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 快速狀態面板 */}
                <div className="space-y-4">
                  {/* 無人機狀態卡片 */}
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-100 mb-3">無人機狀態</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">飛行狀態</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          simulateFlyLogic.droneStats.status === 'grounded' ? 'bg-gray-700 text-gray-300' :
                          simulateFlyLogic.droneStats.status === 'flying' ? 'bg-blue-700 text-blue-300' :
                          simulateFlyLogic.droneStats.status === 'hovering' ? 'bg-green-700 text-green-300' :
                          'bg-yellow-700 text-yellow-300'
                        }`}>
                          {simulateFlyLogic.droneStats.status === 'grounded' && '🛬 待機中'}
                          {simulateFlyLogic.droneStats.status === 'flying' && '✈️ 飛行中'}
                          {simulateFlyLogic.droneStats.status === 'hovering' && '⏸️ 懸停中'}
                          {simulateFlyLogic.droneStats.status === 'taking_off' && '🚁 起飛中'}
                          {simulateFlyLogic.droneStats.status === 'landing' && '🛬 降落中'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">飛行高度</span>
                        <span className="text-sm font-semibold text-gray-100">
                          {simulateFlyLogic.droneStats.altitude}m
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">電量</span>
                        <span className={`text-sm font-semibold ${
                          simulateFlyLogic.droneStats.battery > 50 ? 'text-green-300' :
                          simulateFlyLogic.droneStats.battery > 20 ? 'text-yellow-300' : 'text-red-300'
                        }`}>
                          {simulateFlyLogic.droneStats.battery}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">航向</span>
                        <span className="text-sm font-semibold text-gray-100">
                          {simulateFlyLogic.droneStats.heading}°
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 快速控制面板 */}
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-100 mb-3">快速控制</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                        onClick={simulateFlyLogic.takeoff}
                        disabled={simulateFlyLogic.droneStats.status !== 'grounded'}
                      >
                        🚁 起飛
                      </button>
                      <button
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                        onClick={simulateFlyLogic.land}
                        disabled={simulateFlyLogic.droneStats.status === 'grounded'}
                      >
                        🛬 降落
                      </button>
                      <button
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                        onClick={simulateFlyLogic.hover}
                        disabled={simulateFlyLogic.droneStats.status === 'grounded'}
                      >
                        ⏸️ 懸停
                      </button>
                      <button
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        onClick={simulateFlyLogic.emergencyStop}
                      >
                        🚨 緊急
                      </button>
                    </div>
                  </div>

                  {/* 系統資訊 */}
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-100 mb-3">系統資訊</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">API 狀態</span>
                        <span className={simulateFlyLogic.isApiLoaded ? 'text-green-300' : 'text-yellow-300'}>
                          {simulateFlyLogic.isApiLoaded ? '已載入' : '載入中'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">運行模式</span>
                        <span className="text-orange-300">模擬模式</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">無人機數量</span>
                        <span className="text-gray-300">{simulateFlyLogic.droneCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <CommandHistoryPanel droneLogic={simulateFlyLogic} />
          )}

          {activeTab === 'telemetry' && (
            <TelemetryDashboard droneLogic={simulateFlyLogic} />
          )}

          {activeTab === 'specs' && (
            <DroneSpecPanel droneLogic={simulateFlyLogic} />
          )}

          {activeTab === 'queue' && (
            <CommandQueuePanel droneLogic={simulateFlyLogic} />
          )}

          {activeTab === 'analytics' && (
            <DataVisualizationPanel droneLogic={simulateFlyLogic} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DroneMonitoringPage;
/**
 * @fileoverview 地圖頁面組件
 *
 * 此文件提供地圖顯示和互動功能的頁面。
 * 支援地圖瀏覽、標記和基本的地理資訊展示。
 * 整合 Google Maps JavaScript API 以提供完整的地圖功能。
 * 支援真實模式和模擬模式的切換。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useRef, useState } from "react"; // 引入 React 核心庫和 Hooks
import { useRealMapLogic } from "../hooks/useRealMapLogic";
import { useSimulateMapLogic } from "../hooks/useSimulateMapLogic";
// 移除重複的地圖載入器 import，ConditionalMapContainer 已經處理了載入邏輯
import { DronePositionQuery } from "../hooks/useDronePositionQuery";
import { DroneStatusQuery } from "../hooks/useDroneStatusQuery";

// 檢查是否啟用模擬模式
const ENABLE_SIMULATE_MODE =
  import.meta.env.VITE_ENABLE_SIMULATE_MODE === "true";

/**
 * MapPage 組件的屬性介面
 *
 * 定義了 MapPage 組件接受的屬性類型
 */
interface MapPageProps {
  /**
   * 可選的 CSS 類名，用於自定義組件樣式
   */
  className?: string;
}

/**
 * 地圖頁面組件
 *
 * 此組件提供了一個完整的 Google Maps 介面，包括：
 * - Google Maps JavaScript API 整合
 * - 地圖顯示和互動功能
 * - 基本的地圖控制選項
 * - 標記添加和管理功能
 * - 響應式設計和用戶友好的介面
 *
 * @param props - 組件屬性
 * @param props.className - 可選的 CSS 類名
 *
 * @returns 地圖頁面的 JSX 元素
 *
 * @example
 * ```tsx
 * // 基本使用
 * <MapPage />
 *
 * // 使用自定義樣式
 * <MapPage className="custom-map-page" />
 * ```
 */
const MapPage: React.FC<MapPageProps> = ({ className }) => {
  // 地圖容器的引用
  const mapRef = useRef<HTMLDivElement>(null);

  // 模式狀態：true = 模擬模式, false = 真實模式
  const [isSimulateMode, setIsSimulateMode] = useState(false);

  // API Query hooks 用於獲取真實數據
  const dronePositionQuery = new DronePositionQuery();
  const droneStatusQuery = new DroneStatusQuery();

  // 獲取真實無人機數據
  const { data: dronePositions = [], isLoading: positionsLoading } = dronePositionQuery.useLatest();
  const { data: droneStatuses = [], isLoading: statusesLoading } = droneStatusQuery.useAll();

  // 根據模式選擇對應的 Hook
  const realMapLogic = useRealMapLogic(mapRef);
  const simulateMapLogic = useSimulateMapLogic(mapRef);

  // 選擇當前使用的邏輯
  const currentLogic = isSimulateMode ? simulateMapLogic : realMapLogic;
  
  // 🚀 地圖載入邏輯已移至 ConditionalMapContainer 組件中處理，避免重複初始化

  /**
   * 切換模式處理函數
   */
  const handleModeToggle = () => {
    setIsSimulateMode(!isSimulateMode);
  };

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6">
        {/* 頁面標題和模式切換 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              地圖頁面
            </h1>
            <p className="text-sm text-gray-400 mt-1">探索和管理地理位置資訊</p>
          </div>

          {/* 模式切換按鈕 */}
          {ENABLE_SIMULATE_MODE && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-300">
                  目前模式:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isSimulateMode
                      ? "bg-orange-900/30 text-orange-300 border border-orange-700"
                      : "bg-blue-900/30 text-blue-300 border border-blue-700"
                  }`}
                >
                  {isSimulateMode ? "模擬模式" : "真實模式"}
                </span>
              </div>
              <button
                onClick={handleModeToggle}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
                  isSimulateMode
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                }`}
                disabled={currentLogic.isLoading}
              >
                <span className="flex items-center gap-2">
                  <span>{isSimulateMode ? "↻" : "✈"}</span>
                  <span className="hidden sm:inline">
                    {isSimulateMode ? "切換至真實模式" : "切換至模擬模式"}
                  </span>
                  <span className="sm:hidden">
                    {isSimulateMode ? "真實" : "模擬"}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 智能載入邏輯已移除，地圖將直接載入 */}

        {/* 主要內容區域 */}
        <div className="space-y-6">
          {/* 地圖容器 - 提升視覺層次 */}
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full h-64 sm:h-96 lg:h-[500px]"
                style={{ minHeight: "300px" }}
              />

              {/* 載入覆蓋層 - 改善動畫 */}
              {currentLogic.isLoading && (
                <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-gray-300">
                    <div className="relative mb-4">
                      <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full mx-auto"></div>
                      <div className="absolute inset-0 animate-pulse">
                        <div className="w-8 h-8 bg-blue-400/20 rounded-full mx-auto mt-2"></div>
                      </div>
                    </div>
                    <p className="text-lg font-semibold">
                      {isSimulateMode
                        ? "模擬地圖載入中..."
                        : "Google Maps 載入中..."}
                    </p>
                    <p className="text-sm mt-2 text-gray-400">請稍候片刻</p>
                  </div>
                </div>
              )}

              {/* 錯誤覆蓋層 - 改善設計 */}
              {currentLogic.error && (
                <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-red-300 bg-gray-800 p-6 rounded-xl shadow-lg max-w-md mx-4 border border-red-700">
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-700">
                      <span className="text-2xl">⚠</span>
                    </div>
                    <p className="text-lg font-semibold mb-2">載入失敗</p>
                    <p className="text-sm text-gray-400">
                      {currentLogic.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 控制面板 - 卡片式設計 */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
            {/* 控制按鈕區域 */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">
                {isSimulateMode ? "模擬控制" : "地圖控制"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {isSimulateMode ? (
                  // 模擬模式控制按鈕 - 改善設計
                  <>
                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={simulateMapLogic.startSimulation}
                      disabled={
                        currentLogic.isLoading ||
                        !!currentLogic.error ||
                        simulateMapLogic.isSimulating
                      }
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">▶</span>
                        <span className="text-sm sm:text-base">開始模擬</span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>

                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={simulateMapLogic.stopSimulation}
                      disabled={
                        currentLogic.isLoading ||
                        !!currentLogic.error ||
                        !simulateMapLogic.isSimulating
                      }
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">⏹</span>
                        <span className="text-sm sm:text-base">停止模擬</span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>

                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={simulateMapLogic.resetSimulation}
                      disabled={currentLogic.isLoading || !!currentLogic.error}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">↻</span>
                        <span className="text-sm sm:text-base">重置模擬</span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>

                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={simulateMapLogic.fitToDrones}
                      disabled={
                        currentLogic.isLoading ||
                        !!currentLogic.error ||
                        simulateMapLogic.dronesCount === 0
                      }
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm sm:text-base">
                          縮放至無人機
                        </span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>
                  </>
                ) : (
                  // 真實模式控制按鈕 - 改善設計
                  <>
                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={realMapLogic.fitToMarkers}
                      disabled={
                        currentLogic.isLoading ||
                        !!currentLogic.error ||
                        realMapLogic.markersCount === 0
                      }
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm sm:text-base">
                          縮放至適合大小
                        </span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>

                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={realMapLogic.addMarker}
                      disabled={currentLogic.isLoading || !!currentLogic.error}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">📍</span>
                        <span className="text-sm sm:text-base">新增標記</span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>

                    <button
                      className="group relative px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={realMapLogic.clearMarkers}
                      disabled={
                        currentLogic.isLoading ||
                        !!currentLogic.error ||
                        realMapLogic.markersCount === 0
                      }
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-lg">🗑</span>
                        <span className="text-sm sm:text-base">清除標記</span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 統計資訊區域 - 卡片式設計 */}
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                {isSimulateMode ? "模擬統計資訊" : "地圖資訊"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 基本資訊卡片 */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-4 rounded-xl border border-blue-700">
                  <div className="text-xs font-medium text-blue-300 mb-1">
                    座標系統
                  </div>
                  <div className="text-sm font-semibold text-gray-100">
                    WGS84
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-4 rounded-xl border border-purple-700">
                  <div className="text-xs font-medium text-purple-300 mb-1">
                    地圖提供商
                  </div>
                  <div className="text-sm font-semibold text-gray-100">
                    Google Maps
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-4 rounded-xl border border-green-700">
                  <div className="text-xs font-medium text-green-300 mb-1">
                    預設中心
                  </div>
                  <div className="text-sm font-semibold text-gray-100">
                    台北101
                  </div>
                </div>

                {isSimulateMode ? (
                  // 模擬模式專用資訊卡片
                  <>
                    <div className="bg-gradient-to-br from-orange-900 to-red-900 p-4 rounded-xl border border-orange-700">
                      <div className="text-xs font-medium text-orange-300 mb-1">
                        總無人機數
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.dronesCount}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900 to-teal-900 p-4 rounded-xl border border-green-700">
                      <div className="text-xs font-medium text-green-300 mb-1">
                        活動中
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.activeDrones}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-4 rounded-xl border border-blue-700">
                      <div className="text-xs font-medium text-blue-300 mb-1">
                        已完成
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.completedDrones}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-4 rounded-xl border border-purple-700">
                      <div className="text-xs font-medium text-purple-300 mb-1">
                        飛行進度
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.currentStep}/{simulateMapLogic.simulationStats.totalSteps}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900 to-amber-900 p-4 rounded-xl border border-yellow-700">
                      <div className="text-xs font-medium text-yellow-300 mb-1">
                        平均電量
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.averageBattery}%
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-900 to-blue-900 p-4 rounded-xl border border-cyan-700">
                      <div className="text-xs font-medium text-cyan-300 mb-1">
                        覆蓋半徑
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.coverageRadius} km
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-violet-900 p-4 rounded-xl border border-indigo-700">
                      <div className="text-xs font-medium text-indigo-300 mb-1">
                        運行時間
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.elapsedTime}s
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-900 to-red-900 p-4 rounded-xl border border-rose-700">
                      <div className="text-xs font-medium text-rose-300 mb-1">
                        預計完成
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {simulateMapLogic.simulationStats.estimatedCompletion}s
                      </div>
                    </div>
                  </>
                ) : (
                  // 真實模式專用資訊卡片
                  <>
                    <div className="bg-gradient-to-br from-red-900 to-pink-900 p-4 rounded-xl border border-red-700">
                      <div className="text-xs font-medium text-red-300 mb-1">
                        標記數量
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {realMapLogic.markersCount}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-4 rounded-xl border border-blue-700">
                      <div className="text-xs font-medium text-blue-300 mb-1">
                        已連接無人機
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {positionsLoading ? '載入中...' : dronePositions.length}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-4 rounded-xl border border-green-700">
                      <div className="text-xs font-medium text-green-300 mb-1">
                        飛行中
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {statusesLoading ? '載入中...' : droneStatuses.filter(drone => drone.status === 'flying').length}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900 to-amber-900 p-4 rounded-xl border border-orange-700">
                      <div className="text-xs font-medium text-orange-300 mb-1">
                        待機中
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {statusesLoading ? '載入中...' : droneStatuses.filter(drone => drone.status === 'idle').length}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900 to-amber-900 p-4 rounded-xl border border-yellow-700">
                      <div className="text-xs font-medium text-yellow-300 mb-1">
                        充電中
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {statusesLoading ? '載入中...' : droneStatuses.filter(drone => drone.status === 'charging').length}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-slate-900 p-4 rounded-xl border border-gray-700">
                      <div className="text-xs font-medium text-gray-300 mb-1">
                        離線
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {statusesLoading ? '載入中...' : droneStatuses.filter(drone => drone.status === 'offline').length}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-4 rounded-xl border border-purple-700">
                      <div className="text-xs font-medium text-purple-300 mb-1">
                        平均電量
                      </div>
                      <div className="text-lg font-bold text-gray-100">
                        {statusesLoading ? '載入中...' : droneStatuses.length > 0 ? Math.round(droneStatuses.reduce((sum, drone) => sum + (drone.batteryLevel || 0), 0) / droneStatuses.length) : 0}%
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-gradient-to-br from-teal-900 to-cyan-900 p-4 rounded-xl border border-teal-700">
                  <div className="text-xs font-medium text-teal-300 mb-1">
                    API 狀態
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      currentLogic.isApiLoaded
                        ? "bg-green-900/50 text-green-300 border border-green-700"
                        : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                    }`}
                  >
                    {currentLogic.isApiLoaded ? "已載入" : "載入中"}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-gray-900 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs font-medium text-slate-300 mb-1">
                    運行模式
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isSimulateMode
                        ? "bg-orange-900/50 text-orange-300 border border-orange-700"
                        : "bg-blue-900/50 text-blue-300 border border-blue-700"
                    }`}
                  >
                    {isSimulateMode ? "模擬模式" : "真實模式"}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-violet-900 to-purple-900 p-4 rounded-xl border border-violet-700">
                  <div className="text-xs font-medium text-violet-300 mb-1">
                    最後更新
                  </div>
                  <div className="text-sm font-semibold text-gray-100">
                    {new Date().toLocaleDateString("zh-TW")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;

/**
 * @fileoverview 飛行頁面組件
 *
 * 此文件提供飛行控制和監控功能的頁面。
 * 支援無人機飛行狀態監控、路徑規劃和飛行控制操作。
 * 整合 Google Maps JavaScript API 以提供完整的地圖功能。
 * 支援真實模式和模擬模式的切換。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useRef, useState } from "react"; // 引入 React 核心庫和 Hooks
import { useRealFlyLogic } from "../hooks/useRealFlyLogic";
import { useSimulateFlyLogic } from "../hooks/useSimulateFlyLogic";

// 檢查是否啟用模擬模式
const ENABLE_SIMULATE_MODE =
  import.meta.env.VITE_ENABLE_SIMULATE_MODE === "true";

/**
 * FlyingPage 組件的屬性介面
 *
 * 定義了 FlyingPage 組件接受的屬性類型
 */
interface FlyingPageProps {
  /**
   * 可選的 CSS 類名，用於自定義組件樣式
   */
  className?: string;
}

/**
 * 飛行頁面組件
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
 * @returns 飛行頁面的 JSX 元素
 *
 * @example
 * ```tsx
 * // 基本使用
 * <FlyingPage />
 *
 * // 使用自定義樣式
 * <FlyingPage className="custom-flying-page" />
 * ```
 */
const FlyingPage: React.FC<FlyingPageProps> = ({ className }) => {
  // 地圖容器的引用
  const mapRef = useRef<HTMLDivElement>(null);

  // 模式狀態：true = 模擬模式, false = 真實模式
  const [isSimulateMode, setIsSimulateMode] = useState(false);

  // 根據模式選擇對應的 Hook
  const realFlyLogic = useRealFlyLogic(mapRef);
  const simulateFlyLogic = useSimulateFlyLogic(mapRef);

  // 選擇當前使用的邏輯
  const currentLogic = isSimulateMode ? simulateFlyLogic : realFlyLogic;

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
              飛行頁面
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              無人機飛行控制與監控中心
            </p>
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

        {/* 主要內容區域 */}
        <div className="space-y-6">
          {/* 第一行：地圖 + 無人機狀態 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* 地圖容器 - 占3/5寬度 */}
            <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
              <div className="relative flex-1">
                <div
                  ref={mapRef}
                  className="w-full h-full"
                  style={{ minHeight: "400px" }}
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
                      <div
                        className="w-16 h-16 bg-red-900/30 rounded-full flex items-center jus
                       tify-center mx-auto mb-4 border border-red-700"
                      >
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

            {/* 無人機狀態面板 - 占2/5寬度 */}
            <div className="col-span-1 lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="p-3">
                <h3 className="text-base font-semibold text-gray-100 mb-3">
                  {isSimulateMode ? "無人機狀態監控" : "飛行資訊"}
                </h3>

                {isSimulateMode ? (
                  /* 模擬模式 - 緊湊型無人機狀態監控 */
                  <div className="space-y-3">
                    {/* 飛行器狀態 - 2x2 網格 */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-300 mb-2">
                        飛行器狀態
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-2 rounded border border-blue-700">
                          <div className="text-xs text-blue-300 mb-1">
                            飛行狀態
                          </div>
                          <div className="text-xs font-bold text-gray-100 flex items-center gap-1">
                            <span>
                              {simulateFlyLogic.droneStats.status ===
                                "grounded" && "🛬"}
                              {simulateFlyLogic.droneStats.status ===
                                "taking_off" && "🚁"}
                              {simulateFlyLogic.droneStats.status ===
                                "hovering" && "⏸️"}
                              {simulateFlyLogic.droneStats.status ===
                                "flying" && "✈️"}
                              {simulateFlyLogic.droneStats.status ===
                                "landing" && "🛬"}
                              {simulateFlyLogic.droneStats.status ===
                                "emergency" && "🚨"}
                            </span>
                            <span className="text-xs">
                              {simulateFlyLogic.droneStats.status ===
                                "grounded" && "待機中"}
                              {simulateFlyLogic.droneStats.status ===
                                "taking_off" && "起飛中"}
                              {simulateFlyLogic.droneStats.status ===
                                "hovering" && "懸停中"}
                              {simulateFlyLogic.droneStats.status ===
                                "flying" && "飛行中"}
                              {simulateFlyLogic.droneStats.status ===
                                "landing" && "降落中"}
                              {simulateFlyLogic.droneStats.status ===
                                "emergency" && "緊急狀態"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-2 rounded border border-green-700">
                          <div className="text-xs text-green-300 mb-1">
                            飛行高度
                          </div>
                          <div className="text-sm font-bold text-gray-100">
                            {simulateFlyLogic.droneStats.altitude}m
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-900 to-amber-900 p-2 rounded border border-yellow-700">
                          <div className="text-xs text-yellow-300 mb-1">
                            電量剩餘
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              simulateFlyLogic.droneStats.battery > 50
                                ? "text-green-300"
                                : simulateFlyLogic.droneStats.battery > 20
                                ? "text-yellow-300"
                                : "text-red-300"
                            }`}
                          >
                            {simulateFlyLogic.droneStats.battery}%
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-2 rounded border border-purple-700">
                          <div className="text-xs text-purple-300 mb-1">
                            航向角度
                          </div>
                          <div className="text-sm font-bold text-gray-100">
                            {simulateFlyLogic.droneStats.heading}°
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 位置資訊 */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-300 mb-2">
                        位置資訊
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-gradient-to-br from-cyan-900 to-blue-900 p-2 rounded border border-cyan-700">
                          <div className="text-xs text-cyan-300 mb-1">
                            GPS 座標
                          </div>
                          <div className="text-xs font-mono text-gray-100">
                            {simulateFlyLogic.droneStats.position.lat.toFixed(
                              4
                            )}
                            ,{" "}
                            {simulateFlyLogic.droneStats.position.lng.toFixed(
                              4
                            )}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900 to-violet-900 p-2 rounded border border-indigo-700">
                          <div className="text-xs text-indigo-300 mb-1">
                            目前命令
                          </div>
                          <div className="text-xs font-semibold text-gray-100">
                            {simulateFlyLogic.droneStats.currentCommand
                              ? `執行中: ${simulateFlyLogic.droneStats.currentCommand}`
                              : "無"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 系統資訊 */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-300 mb-2">
                        系統資訊
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-gradient-to-br from-teal-900 to-cyan-900 p-2 rounded border border-teal-700">
                          <div className="text-xs text-teal-300 mb-1">
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

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gradient-to-br from-slate-900 to-gray-900 p-2 rounded border border-slate-700">
                            <div className="text-xs text-slate-300 mb-1">
                              運行模式
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-700">
                              模擬模式
                            </span>
                          </div>

                          <div className="bg-gradient-to-br from-violet-900 to-purple-900 p-2 rounded border border-violet-700">
                            <div className="text-xs text-violet-300 mb-1">
                              座標系統
                            </div>
                            <div className="text-xs font-semibold text-gray-100">
                              WGS84
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 真實模式 - 緊湊設計 */
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-2 rounded border border-blue-700">
                      <div className="text-xs text-blue-300 mb-1">座標系統</div>
                      <div className="text-xs font-semibold text-gray-100">
                        WGS84
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-2 rounded border border-purple-700">
                      <div className="text-xs text-purple-300 mb-1">
                        地圖提供商
                      </div>
                      <div className="text-xs font-semibold text-gray-100">
                        Google Maps
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-2 rounded border border-green-700">
                      <div className="text-xs text-green-300 mb-1">
                        預設中心
                      </div>
                      <div className="text-xs font-semibold text-gray-100">
                        台北101
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-900 to-pink-900 p-2 rounded border border-red-700">
                      <div className="text-xs text-red-300 mb-1">
                        飛行點數量
                      </div>
                      <div className="text-sm font-bold text-gray-100">
                        {realFlyLogic.markersCount}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-900 to-cyan-900 p-2 rounded border border-teal-700">
                      <div className="text-xs text-teal-300 mb-1">API 狀態</div>
                      <span
                        className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                          currentLogic.isApiLoaded
                            ? "bg-green-900/50 text-green-300 border border-green-700"
                            : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                        }`}
                      >
                        {currentLogic.isApiLoaded ? "已載入" : "載入中"}
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-gray-900 p-2 rounded border border-slate-700">
                      <div className="text-xs text-slate-300 mb-1">
                        運行模式
                      </div>
                      <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                        真實模式
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 控制面板 - 命令式控制設計 */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
            {/* 控制按鈕區域 */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">
                {isSimulateMode ? "飛行命令控制" : "飛行控制"}
              </h2>

              {isSimulateMode ? (
                /* 模擬模式 - 命令式控制 */
                <div className="space-y-4">
                  {/* 基礎飛行命令 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      基礎飛行命令
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.takeoff}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status !== "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🚁</span>
                          <span>起飛</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.hover}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>⏸️</span>
                          <span>懸停</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.land}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🛬</span>
                          <span>降落</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.emergencyStop}
                        disabled={
                          currentLogic.isLoading || !!currentLogic.error
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🚨</span>
                          <span>緊急停止</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 方向控制命令 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      方向控制
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.moveForward}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>⬆️</span>
                          <span>前進</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.moveBackward}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>⬇️</span>
                          <span>後退</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.moveLeft}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>⬅️</span>
                          <span>左移</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.moveRight}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>➡️</span>
                          <span>右移</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 旋轉控制 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      旋轉控制
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.rotateLeft}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>↪️</span>
                          <span>左轉</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.rotateRight}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>↩️</span>
                          <span>右轉</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.returnToHome}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          simulateFlyLogic.droneStats.status === "grounded"
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🏠</span>
                          <span>返航</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.fitToDrone}
                        disabled={
                          currentLogic.isLoading || !!currentLogic.error
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🎯</span>
                          <span>定位</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 系統控制 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      系統控制
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={simulateFlyLogic.resetDrone}
                        disabled={
                          currentLogic.isLoading || !!currentLogic.error
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🔄</span>
                          <span>重置無人機</span>
                        </span>
                      </button>

                      <div className="flex items-center justify-center text-xs text-gray-400 bg-gray-700 rounded-lg px-3 py-2">
                        <span>💡 點擊地圖可直接飛行到該位置</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // 真實模式控制按鈕 - 改為小按鈕設計
                <div className="space-y-4">
                  {/* 地圖控制 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      地圖控制
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={realFlyLogic.fitToMarkers}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          realFlyLogic.markersCount === 0
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🎯</span>
                          <span>縮放至適合大小</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={realFlyLogic.addMarker}
                        disabled={
                          currentLogic.isLoading || !!currentLogic.error
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>📍</span>
                          <span>新增飛行點</span>
                        </span>
                      </button>

                      <button
                        className="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        onClick={realFlyLogic.clearMarkers}
                        disabled={
                          currentLogic.isLoading ||
                          !!currentLogic.error ||
                          realFlyLogic.markersCount === 0
                        }
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>🗑</span>
                          <span>清除飛行點</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlyingPage;
